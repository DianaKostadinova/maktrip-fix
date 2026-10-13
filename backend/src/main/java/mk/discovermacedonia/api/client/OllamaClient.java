package mk.discovermacedonia.api.client;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.function.Consumer;
import mk.discovermacedonia.api.config.OllamaProperties;
import mk.discovermacedonia.api.exception.ModelUnavailableException;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Client for a local <a href="https://ollama.com">Ollama</a> server.
 * Uses /api/generate in streaming mode (newline-delimited JSON).
 */
@Component
public class OllamaClient implements LanguageModelClient {

    private final OllamaProperties props;
    private final HttpClient http;
    private final JsonMapper json;

    public OllamaClient(OllamaProperties props, HttpClient http, JsonMapper json) {
        this.props = props;
        this.http = http;
        this.json = json;
    }

    @Override
    public String name() {
        return props.model();
    }

    @Override
    public Status status() {
        try {
            var req = HttpRequest.newBuilder(props.url().resolve("/api/tags")).timeout(Duration.ofSeconds(3)).GET().build();
            var res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return new Status(false, false);
            JsonNode models = json.readTree(res.body()).path("models");
            String wanted = normalise(props.model());
            boolean installed = false;
            for (JsonNode m : models) {
                if (normalise(m.path("name").asString()).equals(wanted)) {
                    installed = true;
                    break;
                }
            }
            return new Status(true, installed);
        } catch (Exception e) {
            return new Status(false, false);
        }
    }

    @Override
    public void stream(String prompt, Consumer<String> onChunk) {
        String body = json.writeValueAsString(Map.of(
                "model", props.model(),
                "prompt", prompt,
                "stream", true,
                "options", Map.of("temperature", props.temperature())));
        var req = HttpRequest.newBuilder(props.url().resolve("/api/generate"))
                .timeout(props.timeout())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            var res = http.send(req, HttpResponse.BodyHandlers.ofInputStream());
            if (res.statusCode() != 200) {
                try (var in = res.body()) {
                    throw new ModelUnavailableException("Ollama returned " + res.statusCode() + ": " + new String(in.readAllBytes(), StandardCharsets.UTF_8));
                }
            }
            try (var reader = new BufferedReader(new InputStreamReader(res.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isBlank()) continue;
                    JsonNode node = json.readTree(line);
                    if (node.has("error")) throw new ModelUnavailableException(node.path("error").asString());
                    String chunk = node.path("response").asString("");
                    if (!chunk.isEmpty()) onChunk.accept(chunk);
                    if (node.path("done").asBoolean(false)) break;
                }
            }
        } catch (ModelUnavailableException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ModelUnavailableException("Generation interrupted", e);
        } catch (Exception e) {
            throw new ModelUnavailableException("Couldn't reach Ollama at " + props.url(), e);
        }
    }

    /** "llama3.2" and "llama3.2:latest" are the same model. */
    private static String normalise(String name) {
        return name.contains(":") ? name : name + ":latest";
    }
}
