package com.dentic.api.billing.config;

import com.dentic.api.billing.domain.Plan;
import com.dentic.api.billing.repository.PlanRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PlanSeedRunner implements ApplicationRunner {
    private final PlanRepository plans;

    public PlanSeedRunner(PlanRepository plans) {
        this.plans = plans;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seed(
                "solo",
                "Solo",
                "Consultórios individuais",
                6900,
                8900,
                1,
                2,
                false,
                "[\"Agenda de consultas\",\"Agendamento online\",\"Gestão de pacientes\",\"Prontuário odontológico\",\"Odontograma\",\"Cadastro de procedimentos\",\"Controle financeiro básico\"]",
                false,
                true,
                1
        );
        seed(
                "clinica",
                "Clínica",
                "Clínicas em crescimento",
                12900,
                16900,
                5,
                10,
                false,
                "[\"Tudo do Solo\",\"Financeiro por dentista\",\"Gestão de estoque\",\"Relatórios financeiros completos\",\"Gestão de permissões\",\"Até 5 dentistas\"]",
                true,
                true,
                2
        );
        seed(
                "performance",
                "Performance",
                "Operações avançadas",
                27900,
                27900,
                15,
                30,
                true,
                "[\"Tudo do Clínica\",\"Lembretes automáticos\",\"Integração WhatsApp\",\"Múltiplas unidades\",\"Dashboard avançado\",\"Até 15 dentistas\"]",
                false,
                false,
                3
        );
    }

    private void seed(
            String slug,
            String name,
            String description,
            int priceCents,
            int listPriceCents,
            int maxProfessionals,
            int maxTeamUsers,
            boolean includesWhatsapp,
            String featuresJson,
            boolean highlighted,
            boolean checkoutEnabled,
            int sortOrder
    ) {
        Plan plan = plans.findBySlug(slug).orElseGet(Plan::new);
        plan.setSlug(slug);
        plan.setName(name);
        plan.setDescription(description);
        plan.setPriceCents(priceCents);
        plan.setListPriceCents(listPriceCents);
        plan.setMaxProfessionals(maxProfessionals);
        plan.setMaxTeamUsers(maxTeamUsers);
        plan.setIncludesWhatsapp(includesWhatsapp);
        plan.setFeaturesJson(featuresJson);
        plan.setHighlighted(highlighted);
        plan.setCheckoutEnabled(checkoutEnabled);
        plan.setActive(true);
        plan.setSortOrder(sortOrder);
        plans.save(plan);
    }
}
