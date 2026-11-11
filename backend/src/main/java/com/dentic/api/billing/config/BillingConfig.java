package com.dentic.api.billing.config;

import com.dentic.api.billing.abacate.AbacatePayProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AbacatePayProperties.class)
public class BillingConfig {
}
