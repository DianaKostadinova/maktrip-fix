package mk.discovermacedonia.api.repository;

import java.io.InputStream;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import mk.discovermacedonia.api.config.NewsProperties;
import mk.discovermacedonia.api.model.NewsItem;
import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;

/** Reads an RSS 2.0 feed with the JDK's StAX parser (no extra dependencies, XXE disabled). */
public class RssNewsFeedRepository implements NewsFeedRepository {

    private static final int MAX_ITEMS = 20;
    private static final int MAX_SUMMARY = 280;

    private final NewsProperties.Feed feed;
    private final HttpClient http;

    public RssNewsFeedRepository(NewsProperties.Feed feed, HttpClient http) {
        this.feed = feed;
        this.http = http;
    }

    @Override
    public String name() {
        return feed.name();
    }

    @Override
    public List<NewsItem> fetch() throws Exception {
        var req = HttpRequest.newBuilder(feed.url())
                .timeout(Duration.ofSeconds(8))
                .header("User-Agent", "DiscoverMacedonia/2.0 (+news widget)")
                .header("Accept", "application/rss+xml, application/xml;q=0.9, */*;q=0.5")
                .GET()
                .build();
        var res = http.send(req, HttpResponse.BodyHandlers.ofInputStream());
        if (res.statusCode() != 200) throw new IllegalStateException("HTTP " + res.statusCode());
        try (InputStream in = res.body()) {
            return parse(in);
        }
    }

    List<NewsItem> parse(InputStream in) throws Exception {
        XMLInputFactory factory = XMLInputFactory.newFactory();
        factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
        factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
        XMLStreamReader r = factory.createXMLStreamReader(in);

        List<NewsItem> items = new ArrayList<>();
        String title = null, link = null, date = null, desc = null, source = null, field = null;
        boolean inItem = false;
        StringBuilder text = new StringBuilder();

        while (r.hasNext() && items.size() < MAX_ITEMS) {
            int ev = r.next();
            if (ev == XMLStreamConstants.START_ELEMENT) {
                String n = r.getLocalName();
                if (n.equals("item")) {
                    inItem = true;
                    title = link = date = desc = source = null;
                } else if (inItem) {
                    field = n;
                    text.setLength(0);
                }
            } else if (inItem && (ev == XMLStreamConstants.CHARACTERS || ev == XMLStreamConstants.CDATA)) {
                text.append(r.getText());
            } else if (ev == XMLStreamConstants.END_ELEMENT) {
                String n = r.getLocalName();
                if (n.equals("item")) {
                    inItem = false;
                    if (title != null && link != null) items.add(toItem(title, link, date, desc, source));
                } else if (inItem && n.equals(field)) {
                    String v = text.toString().strip();
                    switch (n) {
                        case "title" -> title = v;
                        case "link" -> link = v;
                        case "pubDate" -> date = v;
                        case "description" -> desc = v;
                        case "source" -> source = v;
                        default -> { }
                    }
                    field = null;
                }
            }
        }
        r.close();
        return items;
    }

    private NewsItem toItem(String title, String link, String date, String desc, String itemSource) {
        String source = itemSource != null && !itemSource.isBlank() ? itemSource : feed.name();
        if (feed.stripSourceSuffix()) {
            int dash = title.lastIndexOf(" - ");
            if (dash > 0) {
                if (itemSource == null) source = title.substring(dash + 3).strip();
                title = title.substring(0, dash).strip();
            }
        }
        String summary = summary(desc);
        // Aggregators often repeat the headline as the description — drop it.
        if (summary != null && summary.startsWith(title)) summary = null;
        return new NewsItem(title, link, source, parseDate(date), summary);
    }

    private static String summary(String html) {
        if (html == null) return null;
        String text = html.replaceAll("<[^>]+>", " ").replaceAll("&nbsp;", " ").replaceAll("&amp;", "&").replaceAll("\\s+", " ").strip();
        if (text.isEmpty()) return null;
        return text.length() > MAX_SUMMARY ? text.substring(0, MAX_SUMMARY).replaceAll("\\s+\\S*$", "") + "…" : text;
    }

    private static Instant parseDate(String s) {
        if (s == null) return null;
        try {
            return ZonedDateTime.parse(s.strip(), DateTimeFormatter.RFC_1123_DATE_TIME).toInstant();
        } catch (Exception e) {
            return null;
        }
    }
}
