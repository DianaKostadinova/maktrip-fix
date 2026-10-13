package mk.discovermacedonia.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import mk.discovermacedonia.api.model.KnowledgeBase;
import mk.discovermacedonia.api.model.KnowledgeBase.Attraction;
import mk.discovermacedonia.api.model.KnowledgeBase.City;
import mk.discovermacedonia.api.model.KnowledgeBase.Festival;
import mk.discovermacedonia.api.model.TripRequest;
import org.junit.jupiter.api.Test;

class PromptBuilderTest {

    private final PromptBuilder factory = new PromptBuilder();

    private final KnowledgeBase kb = new KnowledgeBase(
            61.5,
            List.of(new City("ohrid", "Ohrid", "Ohrid & Prespa", "3 days", "Lake town", List.of("Kaneo"), "Bus from Skopje", 41.11, 20.80)),
            List.of(
                    attraction("kaneo", "Kaneo", "Ohrid", "Ohrid & Prespa", 41.10, 20.78),
                    attraction("galicica", "Galičica", "Ohrid–Prespa", "Ohrid & Prespa", 40.95, 20.83),
                    attraction("kokino", "Kokino", "Kumanovo", "East", 42.26, 21.95),
                    attraction("matka", "Matka Canyon", "Skopje", "Skopje", 41.94, 21.29)),
            List.of(),
            List.of(new KnowledgeBase.Dish("burek", "Burek", "Flaky pastry", "Bakeries", "80 MKD")),
            List.of(),
            List.of(new Festival("Ohrid Summer Festival", List.of(6, 7), "Jul–Aug", "Ohrid", "Music"),
                    new Festival("Skopje Jazz Festival", List.of(9), "October", "Skopje", "Jazz")),
            List.of(new KnowledgeBase.Transport("Taxis", "Cheap and metered")),
            List.of(new KnowledgeBase.Price("Food", "Burek", "80 MKD")));

    @Test
    void groundsPromptInBaseRegionAndSavedPlaces() {
        var trip = new TripRequest("Ohrid", LocalDate.of(2026, 7, 10), LocalDate.of(2026, 7, 12), 600, 2,
                TripRequest.Pace.RELAXED, List.of("History"), List.of("Kokino"), "vegetarian");

        String prompt = factory.build(trip, kb);

        assertThat(prompt)
                .contains("SIGHTS IN/AROUND OHRID")
                .contains("Kaneo").contains("Galičica")
                .contains("PLACES THE TRAVELLER SAVED").contains("Kokino")
                .contains("(3 days)")
                .contains("relaxed")
                .contains("Notes from traveller: vegetarian")
                .contains("1 EUR = 61.5 MKD");
    }

    @Test
    void includesOnlyFestivalsDuringTheTrip() {
        var trip = new TripRequest("Ohrid", LocalDate.of(2026, 7, 10), LocalDate.of(2026, 7, 11), 300, 1,
                null, null, null, null);

        String prompt = factory.build(trip, kb);

        assertThat(prompt).contains("Ohrid Summer Festival").doesNotContain("Skopje Jazz Festival");
    }

    @Test
    void ordersDayTripsByDistanceFromBase() {
        var trip = new TripRequest("Ohrid", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 2), 300, 1, null, null, null, null);

        String prompt = factory.build(trip, kb);
        String dayTrips = prompt.substring(prompt.indexOf("DAY TRIPS"));

        assertThat(dayTrips.indexOf("Matka Canyon")).isLessThan(dayTrips.indexOf("Kokino"));
    }

    private static Attraction attraction(String id, String name, String location, String region, double lat, double lng) {
        return new Attraction(id, name, location, region, "Nature", name + " description", "Walk", "Free", "1 h", "easy", lat, lng);
    }
}
