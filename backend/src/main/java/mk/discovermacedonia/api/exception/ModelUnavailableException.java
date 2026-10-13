package mk.discovermacedonia.api.exception;

/** The language model can't serve requests right now (server down or model missing). */
public class ModelUnavailableException extends RuntimeException {
    public ModelUnavailableException(String message) {
        super(message);
    }

    public ModelUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
