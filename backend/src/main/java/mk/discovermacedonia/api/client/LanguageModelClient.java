package mk.discovermacedonia.api.client;

import java.util.function.Consumer;

/** Client for a text-generation model server. Implemented by {@link OllamaClient}. */
public interface LanguageModelClient {

    /** Model name as reported to clients. */
    String name();

    /** Whether the model server is reachable and the model is installed. */
    Status status();

    /** Generates text for the prompt, handing each chunk to {@code onChunk} as it arrives. */
    void stream(String prompt, Consumer<String> onChunk);

    record Status(boolean reachable, boolean modelInstalled) {}
}
