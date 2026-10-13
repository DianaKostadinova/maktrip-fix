package mk.discovermacedonia.api.controller;

import java.time.Duration;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import mk.discovermacedonia.api.dto.NewsResponse;
import mk.discovermacedonia.api.service.NewsService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService news;

    public NewsController(NewsService news) {
        this.news = news;
    }

    @GetMapping
    public ResponseEntity<NewsResponse> latest(@RequestParam(defaultValue = "8") @Min(1) @Max(30) int limit) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(new NewsResponse(news.latest(limit)));
    }
}
