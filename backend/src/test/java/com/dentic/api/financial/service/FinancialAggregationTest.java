package com.dentic.api.financial.service;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.patient.domain.*;
import com.dentic.api.patient.repository.*;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class FinancialAggregationTest {
    @Autowired EntityManager em;
    @Autowired FinancialDashboardService optimized;
    @Autowired PatientRepository patients;
    @Autowired PatientPaymentRepository payments;
    @Autowired TreatmentPlanRepository plans;
    @Autowired AppointmentRepository appointments;
    @Autowired ProfessionalRepository professionals;

    @Test void sqlIsEquivalentToPreviousRulesAndIsolatesClinics() throws Exception {
        Clinic clinic = clinic(); Clinic foreign = clinic();
        Professional a = professional(clinic,"A"); Professional b = professional(clinic,"B");
        professional(clinic,"Empty");
        Professional other = professional(foreign,"Other");
        for (int i=0;i<12;i++) {
            Patient patient = patient(clinic, i%3==0 ? a : null);
            if (i%4!=0) {
                appointment(patient,a,OffsetDateTime.now().minusDays(20),"COMPLETED");
                appointment(patient,b,OffsetDateTime.now().plusDays(20),"CANCELLED");
            }
            if (i==0) continue; // Unfunded patient must still count.
            for (String status : List.of("DRAFT","PENDING","APPROVED","CANCELLED")) {
                TreatmentPlan plan = new TreatmentPlan(); plan.setPatient(patient); plan.setTitle("Synthetic");
                plan.setStatus(status); plan.setTotalAmount(new BigDecimal("100.50"));
                plan.setDueDate(i%2==0 ? LocalDate.now().minusDays(1) : LocalDate.now()); em.persist(plan);
            }
            for (int j=0;j<3;j++) {
                PatientPayment pay = new PatientPayment(); pay.setPatient(patient);
                pay.setAmount(new BigDecimal(i%2==0 ? "550.25" : "40.10"));
                pay.setStatus(j==2 ? "PENDING" : "PAID");
                pay.setPaidAt(j==0 ? LocalDate.now().minusDays(30) : LocalDate.now());
                if (j==1) pay.setAppointment(appointment(patient,a,OffsetDateTime.now().minusDays(1),"COMPLETED"));
                em.persist(pay);
            }
        }
        Patient outsider=patient(foreign,other);
        PatientPayment pay=new PatientPayment();pay.setPatient(outsider);pay.setAmount(new BigDecimal("999999"));em.persist(pay);
        em.flush();
        // Legacy rows without paid_at use UTC created_at, including a local-date boundary.
        em.createNativeQuery("UPDATE patient_payments SET paid_at=NULL,created_at=:created WHERE patient_id IN (SELECT id FROM patients WHERE clinic_id=:clinic) AND status='PENDING'")
          .setParameter("created",OffsetDateTime.parse("2026-11-01T23:30:00-03:00")).setParameter("clinic",clinic.getId()).executeUpdate();
        em.clear();
        var oracle = new LegacyFinancialDashboardOracle(patients,plans,payments,appointments,professionals);
        for (UUID scope : Arrays.asList(null,a.getId(),b.getId())) {
            for (LocalDate from : Arrays.asList(null, LocalDate.now().minusDays(3), LocalDate.now().plusDays(3))) {
                var expected=oracle.dashboard(clinic.getId(),from,null,scope);
                var actual=optimized.dashboard(clinic.getId(),from,null,scope);
                equivalent(expected.totals(),actual.totals());
                assertEquals(expected.byProfessional().size(),actual.byProfessional().size());
                for(int n=0;n<expected.byProfessional().size();n++) equivalent(expected.byProfessional().get(n),actual.byProfessional().get(n));
            }
        }
        assertEquals(0,optimized.dashboard(UUID.randomUUID(),null,null,null).totals().patientCount());
    }
    private void equivalent(Object expected,Object actual) throws Exception {
        for(var component:expected.getClass().getRecordComponents()) {
            Object a=component.getAccessor().invoke(expected), b=actual.getClass().getMethod(component.getName()).invoke(actual);
            if(a instanceof BigDecimal decimal) assertEquals(0,decimal.compareTo((BigDecimal)b),component.getName());
            else assertEquals(a,b,component.getName());
        }
    }
    private Clinic clinic() { Clinic c=new Clinic();c.setName("Synthetic");c.setPhone("00000000000");c.setEmail(UUID.randomUUID()+"@example.invalid");em.persist(c);return c; }
    private Professional professional(Clinic c,String name) { Professional p=new Professional();p.setClinic(c);p.setName(name);em.persist(p);return p; }
    private Patient patient(Clinic c,Professional pro) { Patient p=new Patient();p.setClinic(c);p.setName("Synthetic");p.setPhone("00000000000");p.setPreferredProfessional(pro);em.persist(p);return p; }
    private Appointment appointment(Patient p,Professional pro,OffsetDateTime date,String status) { Appointment a=new Appointment();a.setClinic(p.getClinic());a.setPatient(p);a.setProfessional(pro);a.setScheduledAt(date);a.setStatus(status);em.persist(a);return a; }
}
