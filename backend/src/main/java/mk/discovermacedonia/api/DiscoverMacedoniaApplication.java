package mk.discovermacedonia.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Discover Macedonia API.
 *
 * <p>Classic layered Spring application — each layer only calls the one below:
 * <pre>
 *   controller  →  service  →  repository / client
 *       ↑              ↑              ↑
 *      dto           model          config
 * </pre>
 * <ul>
 *   <li>{@code controller} — REST endpoints: HTTP in/out, validation, status codes. No business logic.</li>
 *   <li>{@code service} — business logic: planning prompts, news aggregation, health checks.</li>
 *   <li>{@code repository} — data access: the JSON knowledge base and RSS news feeds.</li>
 *   <li>{@code client} — calls to external services (the Ollama language-model server).</li>
 *   <li>{@code dto} — request/response shapes of the HTTP API.</li>
 *   <li>{@code model} — plain data the services work with.</li>
 *   <li>{@code config} — Spring beans, properties and CORS.</li>
 *   <li>{@code exception} — custom exceptions and the global error handler (RFC 9457 problem+json).</li>
 * </ul>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class DiscoverMacedoniaApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiscoverMacedoniaApplication.class, args);
    }
}
