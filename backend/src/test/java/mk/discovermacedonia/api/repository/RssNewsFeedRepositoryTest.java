package mk.discovermacedonia.api.repository;

import mk.discovermacedonia.api.config.NewsProperties;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class RssNewsFeedRepositoryTest {

    private static final String RSS = """
            <?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0"><channel><title>Feed</title>
              <item>
                <title>Ohrid named top lake destination - Balkan Times</title>
                <link>https://example.com/a</link>
                <pubDate>Mon, 12 Oct 2026 08:30:00 GMT</pubDate>
                <description><![CDATA[<p>Lake <b>Ohrid</b> &amp; more</p>]]></description>
              </item>
              <item>
                <title>No link item</title>
              </item>
            </channel></rss>
            """;

    @Test
    void parsesItemsAndSplitsAggregatorSource() throws Exception {
        var src = new RssNewsFeedRepository(new NewsProperties.Feed("Google News", URI.create("https://example.com"), true), HttpClient.newHttpClient());

        var items = src.parse(new ByteArrayInputStream(RSS.getBytes(StandardCharsets.UTF_8)));

        assertThat(items).hasSize(1);
        var item = items.getFirst();
        assertThat(item.title()).isEqualTo("Ohrid named top lake destination");
        assertThat(item.source()).isEqualTo("Balkan Times");
        assertThat(item.link()).isEqualTo("https://example.com/a");
        assertThat(item.publishedAt()).isEqualTo(Instant.parse("2026-10-12T08:30:00Z"));
        assertThat(item.summary()).isEqualTo("Lake Ohrid & more");
    }

    @Test
    void keepsFeedNameWhenNotAggregator() throws Exception {
        var src = new RssNewsFeedRepository(new NewsProperties.Feed("Balkan Insight", URI.create("https://example.com"), false), HttpClient.newHttpClient());

        var item = src.parse(new ByteArrayInputStream(RSS.getBytes(StandardCharsets.UTF_8))).getFirst();

        assertThat(item.source()).isEqualTo("Balkan Insight");
        assertThat(item.title()).endsWith("- Balkan Times");
    }
}
