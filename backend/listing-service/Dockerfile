FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S nearbuy && adduser -S nearbuy -G nearbuy \
    && mkdir -p /data/nearbuy-uploads \
    && chown -R nearbuy:nearbuy /data/nearbuy-uploads
COPY --from=build --chown=nearbuy:nearbuy /app/target/*.jar app.jar
USER nearbuy
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
