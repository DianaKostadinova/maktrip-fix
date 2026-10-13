package mk.discovermacedonia.api.repository;

import java.util.List;

/** All configured headline feeds. */
@FunctionalInterface
public interface NewsFeeds {
    List<NewsFeedRepository> all();
}
