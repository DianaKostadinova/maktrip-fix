package mk.discovermacedonia.api.service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import mk.discovermacedonia.api.model.KnowledgeBase.Attraction;
import mk.discovermacedonia.api.model.KnowledgeBase.City;
import mk.discovermacedonia.api.model.KnowledgeBase;
import mk.discovermacedonia.api.model.TripRequest;
import org.springframework.stereotype.Component;

/**
 * Builds a grounded planner prompt: only facts relevant to the trip (base
 * region first, then nearest day trips, saved places, food, transport, prices)
 * so a small local model stays accurate and fast.
 */
@Component
public class PromptBuilder {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH);
    private static final int MAX_LOCAL = 12;
    private static final int MAX_DAY_TRIPS = 8;

    public String build(TripRequest trip, KnowledgeBase kb) {
        City base = findCity(kb, trip.city()).orElse(null);
        String region = base != null ? base.region() : trip.city();

        // Saved places always get their own "must include" section.
        List<Attraction> saved = kb.attractions().stream()
                .filter(a -> trip.savedPlaces().stream().anyMatch(n -> n.equalsIgnoreCase(a.name())))
                .toList();

        List<Attraction> local = kb.attractions().stream()
                .filter(a -> !saved.contains(a))
                .filter(a -> a.region().equalsIgnoreCase(region) || a.location().equalsIgnoreCase(trip.city()))
                .limit(MAX_LOCAL)
                .toList();

        List<Attraction> dayTrips = base == null ? List.of() : kb.attractions().stream()
                .filter(a -> !local.contains(a) && !saved.contains(a))
                .sorted(Comparator.comparingDouble(a -> distanceKm(base.lat(), base.lng(), a.lat(), a.lng())))
                .limit(MAX_DAY_TRIPS)
                .toList();

        var monthsOfTrip = Stream.iterate(trip.startDate(), d -> !d.isAfter(trip.endDate()), d -> d.plusDays(1))
                .map(d -> d.getMonthValue() - 1)
                .collect(Collectors.toSet());

        StringBuilder p = new StringBuilder(4096);
        p.append("""
                You are a friendly, practical local travel guide for North Macedonia.
                Write a day-by-day itinerary using ONLY the places and facts listed below when naming specific places.
                Be concrete: times, bus numbers or taxi prices, entry costs in MKD (1 EUR = %s MKD).
                Group nearby sights to avoid backtracking. Put day trips on their own days. Suggest local food at meal times.
                Never invent opening hours, phone numbers or addresses. Keep it skimmable.

                """.formatted(fmt(kb.eurToMkd())));

        p.append("TRIP\n");
        p.append("- Base: ").append(trip.city()).append(base != null ? " (" + base.tagline() + ")" : "").append('\n');
        p.append("- Dates: ").append(DAY.format(trip.startDate())).append(" to ").append(DAY.format(trip.endDate()))
                .append(" (").append(trip.days()).append(" days)\n");
        p.append("- Travellers: ").append(trip.travelers()).append(", total budget €").append(trip.budgetEur())
                .append(" (≈ €").append(trip.budgetEur() / Math.max(1, trip.days()) / Math.max(1, trip.travelers())).append(" per person per day)\n");
        p.append("- Pace: ").append(trip.pace().name().toLowerCase(Locale.ROOT)).append(" — ").append(trip.pace().description()).append('\n');
        if (!trip.interests().isEmpty()) p.append("- Interests: ").append(String.join(", ", trip.interests())).append('\n');
        if (!trip.notes().isBlank()) p.append("- Notes from traveller: ").append(trip.notes()).append('\n');

        section(p, "SIGHTS IN/AROUND " + trip.city().toUpperCase(Locale.ROOT), local);
        section(p, "DAY TRIPS (nearest first)", dayTrips);
        if (!saved.isEmpty()) section(p, "PLACES THE TRAVELLER SAVED — include these", saved);

        if (base != null) {
            p.append("\nCITY HIGHLIGHTS: ").append(String.join("; ", base.highlights())).append('\n');
            p.append("GETTING THERE: ").append(base.gettingThere()).append('\n');
        }

        p.append("\nFOOD TO RECOMMEND\n");
        kb.dishes().stream().limit(12).forEach(d -> p.append("- ").append(d.name()).append(": ").append(d.description()).append(" (").append(d.price()).append(")\n"));
        if (isSkopje(trip.city())) {
            kb.eateries().forEach(e -> p.append("- Eat at ").append(e.name()).append(", ").append(e.location()).append(": ").append(e.specialties()).append(" (").append(e.price()).append(")\n"));
            kb.venues().stream().limit(8).forEach(v -> p.append("- ").append(v.type().equals("cafe") ? "Coffee" : "Drinks").append(" at ").append(v.name()).append(", ").append(v.location()).append('\n'));
        }

        var events = kb.festivals().stream().filter(f -> f.months().stream().anyMatch(monthsOfTrip::contains)).toList();
        if (!events.isEmpty()) {
            p.append("\nEVENTS DURING THE TRIP\n");
            events.forEach(f -> p.append("- ").append(f.name()).append(" (").append(f.when()).append(", ").append(f.where()).append("): ").append(f.text()).append('\n'));
        }

        p.append("\nTRANSPORT\n");
        kb.transport().forEach(t -> p.append("- ").append(t.title()).append(": ").append(t.body()).append('\n'));
        p.append("\nTYPICAL PRICES\n");
        kb.prices().forEach(pr -> p.append("- ").append(pr.item()).append(": ").append(pr.price()).append('\n'));

        p.append("""

                OUTPUT FORMAT (markdown, no preamble):
                **Day 1 — <date>: <theme>**
                - **Morning:** activity — how to get there — cost
                - **Lunch:** where/what — cost
                - **Afternoon:** activity — transport — cost
                - **Evening:** dinner or nightlife — cost
                *Tip:* one practical tip
                (repeat for every day; end with a short **Budget check** line comparing the estimate to the budget)
                """);
        return p.toString();
    }

    private static void section(StringBuilder p, String title, List<Attraction> list) {
        if (list.isEmpty()) return;
        p.append('\n').append(title).append('\n');
        for (Attraction a : list) {
            p.append("- ").append(a.name()).append(" [").append(a.category()).append(", ").append(a.location()).append("]: ")
                    .append(a.description());
            if (!a.cost().isBlank()) p.append(" Cost: ").append(a.cost()).append('.');
            if (!a.duration().isBlank()) p.append(" Time: ").append(a.duration()).append('.');
            p.append(" Access: ").append(a.howToGet()).append('\n');
        }
    }

    private static Optional<City> findCity(KnowledgeBase kb, String name) {
        return kb.cities().stream()
                .filter(c -> c.name().equalsIgnoreCase(name) || c.name().toLowerCase(Locale.ROOT).startsWith(name.toLowerCase(Locale.ROOT)) || c.id().equalsIgnoreCase(name))
                .findFirst();
    }

    private static boolean isSkopje(String city) {
        return city.equalsIgnoreCase("skopje");
    }

    private static String fmt(double d) {
        return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
    }

    static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371, dLat = Math.toRadians(lat2 - lat1), dLng = Math.toRadians(lng2 - lng1);
        double h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * r * Math.asin(Math.sqrt(h));
    }
}
