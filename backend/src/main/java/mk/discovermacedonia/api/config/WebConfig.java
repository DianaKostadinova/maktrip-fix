package mk.discovermacedonia.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * In Docker the API sits behind nginx on the same origin, so CORS is only
 * needed when the frontend runs elsewhere. Origins are configurable.
 */
@Configuration(proxyBeanMethods = false)
class WebConfig implements WebMvcConfigurer {

    private final String[] origins;

    WebConfig(@Value("${app.cors.allowed-origins:http://localhost:3000}") String[] origins) {
        this.origins = origins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origins).allowedMethods("GET", "POST");
    }
}
