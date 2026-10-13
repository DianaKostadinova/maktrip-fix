package mk.discovermacedonia.api.dto;

/** Response of GET /api/health — which optional features the UI can offer. */
public record HealthResponse(String status, Ai ai) {

    /** {@code enabled} is the PLANNER_ENABLED feature flag; the rest describe the model server. */
    public record Ai(boolean enabled, boolean reachable, boolean modelInstalled, String model) {}
}
