package com.nearbuy.api_gateway.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${nearbuy.internal-api-key:}")
    private String internalApiKey;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        boolean publicListingImage = path.startsWith("/api/listings/images/")
                && exchange.getRequest().getMethod().name().equals("GET");
        boolean paystackWebhook = path.equals("/api/payments/paystack/webhook")
                && exchange.getRequest().getMethod().name().equals("POST");
        boolean paystackCallback = path.equals("/api/payments/paystack/callback")
                && exchange.getRequest().getMethod().name().equals("GET");
        if (path.startsWith("/api/auth/") || publicListingImage || paystackWebhook || paystackCallback
                || exchange.getRequest().getMethod().name().equals("OPTIONS")) {
            return chain.filter(withTrustedHeaders(exchange, null));
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        Long userId = jwtUtil.extractUserId(token);

        return chain.filter(withTrustedHeaders(exchange, userId));
    }

    private ServerWebExchange withTrustedHeaders(ServerWebExchange exchange, Long userId) {
        ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-Internal-Api-Key");
                    if (userId != null) {
                        headers.set("X-User-Id", String.valueOf(userId));
                    }
                    if (internalApiKey != null && !internalApiKey.isBlank()) {
                        headers.set("X-Internal-Api-Key", internalApiKey);
                    }
                })
                .build();
        return exchange.mutate().request(modifiedRequest).build();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
