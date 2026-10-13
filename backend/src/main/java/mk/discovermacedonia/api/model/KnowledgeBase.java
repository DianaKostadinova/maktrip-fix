package mk.discovermacedonia.api.model;

import java.util.List;

/** Local travel knowledge the planner grounds its itineraries in. */
public record KnowledgeBase(
        double eurToMkd,
        List<City> cities,
        List<Attraction> attractions,
        List<Venue> venues,
        List<Dish> dishes,
        List<Eatery> eateries,
        List<Festival> festivals,
        List<Transport> transport,
        List<Price> prices) {

    public record City(String id, String name, String region, String days, String tagline, List<String> highlights, String gettingThere, double lat, double lng) {}

    public record Attraction(String id, String name, String location, String region, String category, String description, String howToGet, String cost, String duration, String access, double lat, double lng) {}

    public record Venue(String id, String name, String type, String category, String description, String location) {}

    public record Dish(String id, String name, String description, String where, String price) {}

    public record Eatery(String id, String name, String description, String specialties, String price, String location) {}

    public record Festival(String name, List<Integer> months, String when, String where, String text) {}

    public record Transport(String title, String body) {}

    public record Price(String group, String item, String price) {}
}
