package mk.discovermacedonia.api.controller;

import mk.discovermacedonia.api.dto.HealthResponse;
import mk.discovermacedonia.api.service.HealthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Feature availability for the UI (is the planner usable?). Container liveness
 * is served separately by Actuator at /actuator/health.
 */
@RestController
public class HealthController {

    private final HealthService health;

    public HealthController(HealthService health) {
        this.health = health;
    }

    @GetMapping("/api/health")
    public HealthResponse health() {
        return health.report();
    }
}
