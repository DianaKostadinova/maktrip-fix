package mk.discovermacedonia.api.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import mk.discovermacedonia.api.model.NewsItem;
import mk.discovermacedonia.api.repository.NewsFeedRepository;
import mk.discovermacedonia.api.repository.NewsFeeds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Business logic: latest headlines about North Macedonia, merged from all configured
 * feeds, de-duplicated and cached so the feeds are hit at most once per TTL.
 * A failing feed is skipped; stale results are served if every feed fails.
 */
@Service
public class NewsService {

    private static final Logger log = LoggerFactory.getLogger(NewsService.class);

    private final List<NewsFeedRepository> sources;
    private final Duration ttl;
    private final Clock clock;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
    private final AtomicReference<Snapshot> cache = new AtomicReference<>();

    public NewsService(NewsFeeds sources, @Value("${app.news.ttl:PT20M}") Duration ttl, Clock clock) {
        this.sources = sources.all();
        this.ttl = ttl;
        this.clock = clock;
    }

    public List<NewsItem> latest(int limit) {
        Snapshot snap = cache.get();
        if (snap == null || snap.fetchedAt.plus(ttl).isBefore(clock.instant())) {
            snap = refresh(snap);
        }
        return snap.items.stream().limit(limit).toList();
    }

    private synchronized Snapshot refresh(Snapshot previous) {
        Snapshot current = cache.get();
        if (current != previous) return current; // another thread refreshed meanwhile

        var futures = sources.stream()
                .map(src -> CompletableFuture.supplyAsync(() -> {
                    try {
                        var items = src.fetch();
                        log.info("News feed '{}' returned {} items", src.name(), items.size());
                        return items;
                    } catch (Exception e) {
                        log.warn("News feed '{}' failed: {}", src.name(), e.getMessage());
                        return List.<NewsItem>of();
                    }
                }, executor))
                .toList();

        List<NewsItem> all = new ArrayList<>();
        futures.forEach(f -> all.addAll(f.join()));

        if (all.isEmpty() && previous != null) {
            Snapshot stale = new Snapshot(clock.instant().minus(ttl).plus(Duration.ofMinutes(2)), previous.items);
            cache.set(stale); // retry in ~2 minutes, keep serving old headlines
            return stale;
        }

        // De-duplicate syndicated stories by normalised title, newest first.
        var unique = new LinkedHashMap<String, NewsItem>();
        all.stream()
                .sorted(Comparator.comparing(NewsItem::publishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(n -> unique.putIfAbsent(n.title().toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", ""), n));

        Snapshot fresh = new Snapshot(clock.instant(), List.copyOf(unique.values()));
        cache.set(fresh);
        return fresh;
    }

    private record Snapshot(Instant fetchedAt, List<NewsItem> items) {}
}
