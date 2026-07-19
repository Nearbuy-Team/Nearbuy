package com.nearbuy.api_gateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter implements GlobalFilter, Ordered {
    private static final long WINDOW_SECONDS = 600;
    private static final int MAX_TRACKED_CLIENTS = 20_000;
    private static final Set<String> SENSITIVE_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/verify-otp",
            "/api/auth/resend-verification",
            "/api/auth/request-password-reset",
            "/api/auth/reset-password"
    );

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (!SENSITIVE_PATHS.contains(path) || !"POST".equals(exchange.getRequest().getMethod().name())) {
            return chain.filter(exchange);
        }

        long now = Instant.now().getEpochSecond();
        if (windows.size() > MAX_TRACKED_CLIENTS) {
            windows.entrySet().removeIf(entry -> entry.getValue().expiresAt() <= now);
        }

        String key = clientAddress(exchange) + ':' + path;
        if (windows.size() >= MAX_TRACKED_CLIENTS && !windows.containsKey(key)) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().set("Retry-After", "60");
            return exchange.getResponse().setComplete();
        }
        int limit = path.equals("/api/auth/login") ? 15 : 20;
        Window current = windows.compute(key, (ignored, previous) -> {
            if (previous == null || previous.expiresAt() <= now) {
                return new Window(1, now + WINDOW_SECONDS);
            }
            return new Window(previous.count() + 1, previous.expiresAt());
        });

        if (current.count() > limit) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().set("Retry-After", String.valueOf(
                    Math.max(1, current.expiresAt() - now)
            ));
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange);
    }

    private String clientAddress(ServerWebExchange exchange) {
        String forwarded = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",", 2)[0].trim();
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote == null ? "unknown" : remote.getAddress().getHostAddress();
    }

    @Override
    public int getOrder() {
        return -2;
    }

    private record Window(int count, long expiresAt) {}
}
