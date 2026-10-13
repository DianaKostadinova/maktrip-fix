package mk.discovermacedonia.api.repository;

import java.util.List;
import mk.discovermacedonia.api.model.NewsItem;

/** A single feed of headlines (e.g. one RSS URL). */
public interface NewsFeedRepository {
    String name();

    List<NewsItem> fetch() throws Exception;
}
