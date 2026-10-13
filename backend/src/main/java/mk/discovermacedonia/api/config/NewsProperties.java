package mk.discovermacedonia.api.config;

import java.net.URI;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.news")
public record NewsProperties(List<Feed> feeds) {

    public NewsProperties {
        feeds = feeds == null ? List.of() : List.copyOf(feeds);
    }

    /** {@code stripSourceSuffix}: aggregator titles end in " - Publisher"; split it off into the source. */
    public record Feed(String name, URI url, boolean stripSourceSuffix) {}
}
