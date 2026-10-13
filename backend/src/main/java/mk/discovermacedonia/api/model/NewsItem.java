package mk.discovermacedonia.api.model;

import java.time.Instant;

public record NewsItem(String title, String link, String source, Instant publishedAt, String summary) {}
