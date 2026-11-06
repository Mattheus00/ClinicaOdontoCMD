package com.dentic.api.performance;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Configuration(proxyBeanMethods = false)
public class StartupTelemetry {
    @Bean
    static BeanPostProcessor startupTiming() {
        return new BeanPostProcessor() {
            final ConcurrentHashMap<String, Long> starts = new ConcurrentHashMap<>();
            final AtomicBoolean firstConnection = new AtomicBoolean();
            public Object postProcessBeforeInitialization(Object bean, String name) {
                if (bean.getClass().getSimpleName().equals("FlywayMigrationInitializer")) starts.put(name, System.nanoTime());
                return bean;
            }
            public Object postProcessAfterInitialization(Object bean, String name) {
                Long start = starts.remove(name);
                if (start != null) LoggerFactory.getLogger(StartupTelemetry.class).info("startup_phase phase=flyway duration_ms={}", (System.nanoTime() - start) / 1_000_000);
                if (!(bean instanceof DataSource source) || bean instanceof TimedDataSource) return bean;
                return new TimedDataSource(source, firstConnection);
            }
        };
    }

    private static final class TimedDataSource extends DelegatingDataSource {
        private final AtomicBoolean first;
        TimedDataSource(DataSource source, AtomicBoolean first) { super(source); this.first = first; }
        @Override public Connection getConnection() throws SQLException { return timed(null, null); }
        @Override public Connection getConnection(String user, String password) throws SQLException { return timed(user, password); }
        private Connection timed(String user, String password) throws SQLException {
            long start = System.nanoTime();
            try {
                Connection connection = user == null ? super.getConnection() : super.getConnection(user, password);
                if (first.compareAndSet(false, true)) LoggerFactory.getLogger(StartupTelemetry.class).info(
                        "startup_phase phase=first_db_connection duration_ms={}", (System.nanoTime() - start) / 1_000_000);
                return connection;
            } finally {
                var request = RequestTiming.CURRENT.get();
                if (request != null) { request.connectionNanos += System.nanoTime() - start; request.connections++; }
            }
        }
    }
}
