package mk.discovermacedonia.api.dto;

import java.util.List;
import mk.discovermacedonia.api.model.NewsItem;

/** Response of GET /api/news. */
public record NewsResponse(List<NewsItem> items) {}
