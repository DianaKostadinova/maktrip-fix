package mk.discovermacedonia.api.repository;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import mk.discovermacedonia.api.model.KnowledgeBase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Reads the knowledge base generated from the frontend's data
 * ({@code npm run knowledge} → src/main/resources/knowledge.json).
 */
@Repository
public class JsonKnowledgeRepository implements KnowledgeRepository {

    private final KnowledgeBase knowledge;

    public JsonKnowledgeRepository(@Value("${app.knowledge:classpath:knowledge.json}") Resource resource, JsonMapper json) {
        try (InputStream in = resource.getInputStream()) {
            this.knowledge = json.readValue(in, KnowledgeBase.class);
        } catch (IOException e) {
            throw new UncheckedIOException("Can't read knowledge base " + resource, e);
        }
    }

    @Override
    public KnowledgeBase load() {
        return knowledge;
    }
}
