package mk.discovermacedonia.api.dto;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import mk.discovermacedonia.api.model.TripRequest;

/** JSON body of POST /api/plans/stream. Validated before it reaches the use case. */
public record PlanRequest(
        @NotBlank @Size(max = 60) String city,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Min(0) @Max(100_000) int budgetEur,
        @Min(1) @Max(20) int travelers,
        String pace,
        @Size(max = 15) List<@Size(max = 40) String> interests,
        @Size(max = 40) List<@Size(max = 120) String> savedPlaces,
        @Size(max = 500) String notes) {

    @AssertTrue(message = "endDate must be on or after startDate, and the trip at most 14 days")
    boolean isDateRangeValid() {
        if (startDate == null || endDate == null) return true; // @NotNull reports these
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        return days >= 1 && days <= 14;
    }

    /** Maps the validated request onto the model the service layer works with. */
    public TripRequest toDomain() {
        TripRequest.Pace p;
        try {
            p = pace == null ? TripRequest.Pace.BALANCED : TripRequest.Pace.valueOf(pace.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            p = TripRequest.Pace.BALANCED;
        }
        return new TripRequest(city.strip(), startDate, endDate, budgetEur, travelers, p, interests, savedPlaces, notes);
    }
}
