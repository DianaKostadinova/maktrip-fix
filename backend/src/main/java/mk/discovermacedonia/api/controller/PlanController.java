package mk.discovermacedonia.api.controller;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import jakarta.validation.Valid;
import mk.discovermacedonia.api.dto.PlanRequest;
import mk.discovermacedonia.api.service.PlannerService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlannerService planner;

    public PlanController(PlannerService planner) {
        this.planner = planner;
    }

    /**
     * Streams the itinerary as plain UTF-8 text while it's generated, so the UI
     * can render it progressively. Availability is checked first so failures
     * become a proper problem+json 503 instead of a half-written stream.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<StreamingResponseBody> stream(@Valid @RequestBody PlanRequest request) {
        planner.ensureAvailable();
        var trip = request.toDomain();
        StreamingResponseBody body = out -> planner.plan(trip, chunk -> {
            try {
                out.write(chunk.getBytes(StandardCharsets.UTF_8));
                out.flush();
            } catch (IOException e) {
                throw new UncheckedIOException(e); // client went away — stop generating
            }
        });
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.UTF_8))
                .cacheControl(CacheControl.noStore())
                .header("X-Accel-Buffering", "no") // tell nginx not to buffer the stream
                .body(body);
    }
}
