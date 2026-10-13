package mk.discovermacedonia.api.config;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.Executors;
import mk.discovermacedonia.api.repository.NewsFeedRepository;
import mk.discovermacedonia.api.repository.NewsFeeds;
import mk.discovermacedonia.api.repository.RssNewsFeedRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class AppConfig {

    @Bean
    HttpClient httpClient() {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .executor(Executors.newVirtualThreadPerTaskExecutor())
                .build();
    }

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    /** One {@link NewsFeedRepository} per configured feed. */
    @Bean
    NewsFeeds newsSources(NewsProperties props, HttpClient http) {
        var sources = props.feeds().stream().<NewsFeedRepository>map(f -> new RssNewsFeedRepository(f, http)).toList();
        return () -> sources;
    }
}
