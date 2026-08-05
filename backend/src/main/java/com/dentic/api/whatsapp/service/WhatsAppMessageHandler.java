package com.dentic.api.whatsapp.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class WhatsAppMessageHandler {

    @Async
    public void processMessageAsync(Map<String, Object> payload) {
        // Lógica da Máquina de Estados:
        // 1. Extrair número do paciente e ID da clínica.
        // 2. Buscar WhatsappConversation ativa (ou criar em estado 'inicio').
        // 3. Avaliar current_step:
        //    - 'inicio' -> Enviar saudação e mudar para 'menu_principal'
        //    - 'menu_principal' -> Se 1 (Agendar), vai para 'agendar_escolhendo_profissional'
        //    - 'agendar_confirmando' -> Valida e salva o Appointment, vai para 'inicio'
        //    - 'transferido_atendente' -> Ignora automação, notifica painel (Polling)
        
        System.out.println("Processing WhatsApp message asynchronously...");
    }
}
