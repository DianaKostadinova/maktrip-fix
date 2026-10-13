package mk.discovermacedonia.api.config;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties("app.ollama")
public record OllamaProperties(
        @DefaultValue("http://localhost:11434") URI url,
        @DefaultValue("llama3.2:3b") String model,
        @DefaultValue("0.4") double temperature,
        @DefaultValue("PT3M") Duration timeout) {}
