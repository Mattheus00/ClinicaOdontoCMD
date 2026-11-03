package com.dentic.api.odontogram;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.odontogram.domain.ToothProcedure;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OdontogramRulesTest {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final ZoneOffset BRT = ZoneOffset.ofHours(-3);

    @Test
    void validatesFdiNumbers() {
        assertTrue(OdontogramRules.isValidTooth("11"));
        assertTrue(OdontogramRules.isValidTooth("48"));
        assertTrue(OdontogramRules.isValidTooth("55"));
        assertTrue(OdontogramRules.isValidTooth("85"));
        assertFalse(OdontogramRules.isValidTooth("19"));
        assertFalse(OdontogramRules.isValidTooth("56"));
        assertFalse(OdontogramRules.isValidTooth("91"));
        assertFalse(OdontogramRules.isValidTooth("1"));
        assertFalse(OdontogramRules.isValidTooth(null));
    }

    @Test
    void normalizesTeethFacesAndProcedure() {
        assertEquals(List.of("16", "26"), OdontogramRules.normalizeTeeth(List.of(" 16", "26", "16")));
        assertThrows(IllegalArgumentException.class, () -> OdontogramRules.normalizeTeeth(List.of()));
        assertThrows(IllegalArgumentException.class, () -> OdontogramRules.normalizeTeeth(List.of("99")));

        assertEquals("O,M,D", OdontogramRules.normalizeFaces(List.of("d", "O", "M")));
        assertNull(OdontogramRules.normalizeFaces(List.of()));
        assertThrows(IllegalArgumentException.class, () -> OdontogramRules.normalizeFaces(List.of("X")));

        assertEquals("ROOT_CANAL", OdontogramRules.normalizeProcedureType("root_canal"));
        assertThrows(IllegalArgumentException.class, () -> OdontogramRules.normalizeProcedureType(""));
    }

    @Test
    void defaultsStatusFromProcedure() {
        assertEquals("RESTORATION", OdontogramRules.normalizeStatus(null, "RESTORATION"));
        assertEquals("RESTORATION", OdontogramRules.normalizeStatus("", "CROWN"));
        assertEquals("IN_PROGRESS", OdontogramRules.normalizeStatus(null, "ROOT_CANAL"));
        assertEquals("TREATED", OdontogramRules.normalizeStatus(null, "CLEANING"));
        assertEquals("NEEDS_TREATMENT", OdontogramRules.normalizeStatus("needs_treatment", "OTHER"));
        assertThrows(IllegalArgumentException.class, () -> OdontogramRules.normalizeStatus("HEALTHY", "OTHER"));
    }

    @Test
    void latestNonCancelledProcedureDefinesToothState() {
        ToothProcedure oldCaries = procedure("16", "OTHER", "NEEDS_TREATMENT", at(2026, 1, 10, 9), null);
        ToothProcedure restoration = procedure("16", "RESTORATION", "RESTORATION", at(2026, 2, 10, 9), null);
        ToothProcedure cancelledExtraction = procedure("16", "EXTRACTION", "TREATED", at(2026, 3, 10, 9), null);
        cancelledExtraction.setCancelledAt(at(2026, 3, 10, 10));
        ToothProcedure canal = procedure("26", "ROOT_CANAL", "IN_PROGRESS", at(2026, 2, 1, 9), null);

        Map<String, ToothProcedure> state = OdontogramRules.latestByTooth(
                List.of(oldCaries, cancelledExtraction, canal, restoration),
                procedure -> true
        );

        assertEquals(2, state.size());
        assertSame(restoration, state.get("16"));
        assertSame(canal, state.get("26"));
    }

    @Test
    void asOfAppointmentShowsChartAsItWasOnThatVisit() {
        Appointment january = appointment(at(2026, 1, 10, 9));
        Appointment march = appointment(at(2026, 3, 5, 14));

        ToothProcedure duringJanuary = procedure("11", "OTHER", "NEEDS_TREATMENT", at(2026, 1, 10, 9), january);
        ToothProcedure unlinkedSameDay = procedure("21", "CLEANING", "TREATED", at(2026, 1, 10, 22), null);
        ToothProcedure unlinkedNextDay = procedure("22", "CLEANING", "TREATED", at(2026, 1, 11, 8), null);
        ToothProcedure duringMarch = procedure("11", "RESTORATION", "RESTORATION", at(2026, 3, 5, 14), march);

        Map<String, ToothProcedure> state = OdontogramRules.latestByTooth(
                List.of(duringJanuary, unlinkedSameDay, unlinkedNextDay, duringMarch),
                OdontogramRules.asOf(january, SAO_PAULO)
        );

        assertSame(duringJanuary, state.get("11"));
        assertSame(unlinkedSameDay, state.get("21"));
        assertFalse(state.containsKey("22"));
    }

    @Test
    void lateEntryOnPastAppointmentStillBelongsToThatVisit() {
        Appointment january = appointment(at(2026, 1, 10, 9));
        ToothProcedure registeredLater = procedure("36", "SEALANT", "RESTORATION", at(2026, 1, 20, 9), january);

        Map<String, ToothProcedure> state = OdontogramRules.latestByTooth(
                List.of(registeredLater),
                OdontogramRules.asOf(january, SAO_PAULO)
        );

        assertSame(registeredLater, state.get("36"));
    }

    private static OffsetDateTime at(int year, int month, int day, int hour) {
        return OffsetDateTime.of(year, month, day, hour, 0, 0, 0, BRT);
    }

    private static Appointment appointment(OffsetDateTime scheduledAt) {
        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID());
        appointment.setScheduledAt(scheduledAt);
        return appointment;
    }

    private static ToothProcedure procedure(String tooth, String type, String status, OffsetDateTime createdAt, Appointment appointment) {
        ToothProcedure procedure = new ToothProcedure();
        procedure.setId(UUID.randomUUID());
        procedure.setToothNumber(tooth);
        procedure.setProcedureType(type);
        procedure.setStatus(status);
        procedure.setCreatedAt(createdAt);
        procedure.setAppointment(appointment);
        return procedure;
    }
}
