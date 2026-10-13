# syntax=docker/dockerfile:1.7
# Spring Boot API — built with the Gradle wrapper, runs as a non-root user.

FROM eclipse-temurin:25-jdk AS build
WORKDIR /src
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
# Warm the dependency cache in its own layer.
RUN --mount=type=cache,target=/root/.gradle sh ./gradlew --no-daemon -q dependencies > /dev/null
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle sh ./gradlew --no-daemon -q bootJar \
 && java -Djarmode=tools -jar build/libs/discover-macedonia-api-*.jar extract --layers --launcher --destination /out

FROM eclipse-temurin:25-jre
RUN groupadd --system app && useradd --system --gid app --uid 10001 app
WORKDIR /app
# Layered copy: dependencies change rarely, application code often.
COPY --from=build /out/dependencies/ ./
COPY --from=build /out/spring-boot-loader/ ./
COPY --from=build /out/snapshot-dependencies/ ./
COPY --from=build /out/application/ ./
USER app
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080 && printf "GET /actuator/health/liveness HTTP/1.0\r\n\r\n" >&3 && grep -q UP <&3'
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
