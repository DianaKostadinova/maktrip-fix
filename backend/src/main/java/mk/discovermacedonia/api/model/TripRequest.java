package mk.discovermacedonia.api.model;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/** What the traveller asked for — validated at the web layer, trusted here. */
public record TripRequest(
        String city,
        LocalDate startDate,
        LocalDate endDate,
        int budgetEur,
        int travelers,
        Pace pace,
        List<String> interests,
        List<String> savedPlaces,
        String notes) {

    public TripRequest {
        interests = interests == null ? List.of() : List.copyOf(interests);
        savedPlaces = savedPlaces == null ? List.of() : List.copyOf(savedPlaces);
        notes = notes == null ? "" : notes.strip();
        pace = pace == null ? Pace.BALANCED : pace;
    }

    public long days() {
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    public enum Pace {
        RELAXED("2 main activities a day with long breaks"),
        BALANCED("3 activities a day"),
        PACKED("4+ activities a day, early starts");

        private final String description;

        Pace(String description) {
            this.description = description;
        }

        public String description() {
            return description;
        }
    }
}
