package com.dentic.api.notification.job;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReminderJob {

    // Roda a cada 15 minutos
    @Scheduled(fixedRate = 900000)
    public void sendReminders() {
        // Lógica:
        // 1. Buscar Appointments pendentes nas próximas 24h.
        // 2. Verificar se não há Notification gerada para ele.
        // 3. Disparar via provedor (Z-API/Twilio).
        // 4. Salvar Notification (status 'sent' ou 'failed').
        
        System.out.println("Running reminder job...");
    }
}
