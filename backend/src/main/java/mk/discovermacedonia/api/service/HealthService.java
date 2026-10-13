package mk.discovermacedonia.api.service;

import mk.discovermacedonia.api.client.LanguageModelClient;
import mk.discovermacedonia.api.dto.HealthResponse;
import org.springframework.stereotype.Service;

/** Business logic: which optional capabilities (e.g. the AI planner) are available right now. */
@Service
public class HealthService {

    private final LanguageModelClient model;
    private final PlannerService planner;

    public HealthService(LanguageModelClient model, PlannerService planner) {
        this.model = model;
        this.planner = planner;
    }

    public HealthResponse report() {
        if (!planner.isEnabled()) {
            return new HealthResponse("UP", new HealthResponse.Ai(false, false, false, model.name()));
        }
        var status = model.status();
        return new HealthResponse("UP", new HealthResponse.Ai(true, status.reachable(), status.modelInstalled(), model.name()));
    }
}
