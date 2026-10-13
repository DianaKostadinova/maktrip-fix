package mk.discovermacedonia.api.service;

import java.util.function.Consumer;
import mk.discovermacedonia.api.client.LanguageModelClient;
import mk.discovermacedonia.api.exception.ModelUnavailableException;
import mk.discovermacedonia.api.model.KnowledgeBase;
import mk.discovermacedonia.api.model.TripRequest;
import mk.discovermacedonia.api.repository.KnowledgeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Business logic: draft an itinerary for a trip, streaming text as it is generated. */
@Service
public class PlannerService {

    private static final Logger log = LoggerFactory.getLogger(PlannerService.class);

    private final LanguageModelClient model;
    private final PromptBuilder prompts;
    private final KnowledgeBase knowledge;
    private final boolean enabled;

    public PlannerService(LanguageModelClient model, PromptBuilder prompts, KnowledgeRepository knowledgeRepository,
                          @Value("${app.planner.enabled:false}") boolean enabled) {
        this.model = model;
        this.prompts = prompts;
        this.knowledge = knowledgeRepository.load();
        this.enabled = enabled;
    }

    /** Feature flag (PLANNER_ENABLED). While off, the model server is never contacted. */
    public boolean isEnabled() {
        return enabled;
    }

    /** Fails fast (before any bytes are written) if the model can't serve the request. */
    public void ensureAvailable() {
        if (!enabled) throw new ModelUnavailableException("The trip planner is coming soon.");
        var status = model.status();
        if (!status.reachable()) throw new ModelUnavailableException("The planner model server isn't reachable. Start Ollama and try again.");
        if (!status.modelInstalled()) throw new ModelUnavailableException("Model '%s' isn't installed. Run: ollama pull %s".formatted(model.name(), model.name()));
    }

    public void plan(TripRequest trip, Consumer<String> onChunk) {
        String prompt = prompts.build(trip, knowledge);
        log.info("Planning {} days in {} ({} chars of context)", trip.days(), trip.city(), prompt.length());
        model.stream(prompt, onChunk);
    }
}
