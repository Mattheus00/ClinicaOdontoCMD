package com.dentic.api.odontogram;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.odontogram.domain.ToothProcedure;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Predicate;

public final class OdontogramRules {

    public static final Set<String> PROCEDURE_TYPES = Set.of(
            "RESTORATION", "CLEANING", "EXTRACTION", "ROOT_CANAL", "SEALANT", "FLUORIDE",
            "WHITENING", "CROWN", "IMPLANT", "VENEER", "SCALING", "OTHER"
    );
    public static final Set<String> STATUSES = Set.of("TREATED", "RESTORATION", "IN_PROGRESS", "NEEDS_TREATMENT");
    public static final List<String> FACE_ORDER = List.of("O", "V", "L", "M", "D");
    public static final int MAX_NOTES = 2000;

    private OdontogramRules() {}

    /** FDI: permanent quadrants 1-4 (teeth 1-8), deciduous quadrants 5-8 (teeth 1-5). */
    public static boolean isValidTooth(String value) {
        if (value == null || value.length() != 2) return false;
        int quadrant = value.charAt(0) - '0';
        int position = value.charAt(1) - '0';
        if (quadrant >= 1 && quadrant <= 4) return position >= 1 && position <= 8;
        if (quadrant >= 5 && quadrant <= 8) return position >= 1 && position <= 5;
        return false;
    }

    public static List<String> normalizeTeeth(Collection<String> teeth) {
        if (teeth == null || teeth.isEmpty()) {
            throw new IllegalArgumentException("Selecione pelo menos um dente.");
        }
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        for (String raw : teeth) {
            String tooth = raw == null ? "" : raw.trim();
            if (!isValidTooth(tooth)) {
                throw new IllegalArgumentException("Dente inválido: " + tooth + ".");
            }
            unique.add(tooth);
        }
        return List.copyOf(unique);
    }

    public static String normalizeProcedureType(String value) {
        String type = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!PROCEDURE_TYPES.contains(type)) {
            throw new IllegalArgumentException("Selecione o procedimento realizado.");
        }
        return type;
    }

    public static String normalizeStatus(String value, String procedureType) {
        if (value == null || value.isBlank()) return defaultStatus(procedureType);
        String status = value.trim().toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("Situação do dente inválida.");
        }
        return status;
    }

    public static String defaultStatus(String procedureType) {
        return switch (procedureType) {
            case "RESTORATION", "CROWN", "VENEER", "IMPLANT", "SEALANT" -> "RESTORATION";
            case "ROOT_CANAL" -> "IN_PROGRESS";
            default -> "TREATED";
        };
    }

    /** Returns faces as "O,V,..." in canonical order, or null when none were chosen. */
    public static String normalizeFaces(Collection<String> faces) {
        if (faces == null || faces.isEmpty()) return null;
        Set<String> chosen = new HashSet<>();
        for (String raw : faces) {
            String face = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
            if (!FACE_ORDER.contains(face)) {
                throw new IllegalArgumentException("Face do dente inválida: " + face + ".");
            }
            chosen.add(face);
        }
        return String.join(",", FACE_ORDER.stream().filter(chosen::contains).toList());
    }

    public static List<String> splitFaces(String faces) {
        if (faces == null || faces.isBlank()) return List.of();
        return Arrays.stream(faces.split(",")).map(String::trim).filter(value -> !value.isEmpty()).toList();
    }

    public static String normalizeNotes(String notes) {
        if (notes == null) return null;
        String trimmed = notes.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.length() > MAX_NOTES) {
            throw new IllegalArgumentException("As observações podem ter até " + MAX_NOTES + " caracteres.");
        }
        return trimmed;
    }

    /** Current state of each tooth: its most recent non-cancelled procedure that passes {@code include}. */
    public static Map<String, ToothProcedure> latestByTooth(List<ToothProcedure> procedures, Predicate<ToothProcedure> include) {
        List<ToothProcedure> ordered = new ArrayList<>(procedures);
        ordered.sort(Comparator.comparing(ToothProcedure::getCreatedAt).reversed());
        Map<String, ToothProcedure> latest = new TreeMap<>();
        for (ToothProcedure procedure : ordered) {
            if (procedure.isCancelled() || !include.test(procedure)) continue;
            latest.putIfAbsent(procedure.getToothNumber(), procedure);
        }
        return latest;
    }

    /**
     * What the chart looked like at {@code target}: procedures from that visit or earlier visits,
     * plus unlinked procedures recorded up to the end of that visit's day.
     */
    public static Predicate<ToothProcedure> asOf(Appointment target, ZoneId zone) {
        OffsetDateTime targetAt = target.getScheduledAt();
        OffsetDateTime cutoff = targetAt.atZoneSameInstant(zone).toLocalDate().plusDays(1).atStartOfDay(zone).toOffsetDateTime();
        return procedure -> {
            Appointment linked = procedure.getAppointment();
            if (linked != null) {
                return linked.getId().equals(target.getId()) || !linked.getScheduledAt().isAfter(targetAt);
            }
            return procedure.getCreatedAt().isBefore(cutoff);
        };
    }

    public static String describe(ToothProcedure procedure) {
        return "dente=" + procedure.getToothNumber()
                + "; procedimento=" + procedure.getProcedureType()
                + "; faces=" + (procedure.getFaces() == null ? "" : procedure.getFaces())
                + "; situacao=" + procedure.getStatus()
                + "; observacoes=" + (procedure.getNotes() == null ? "" : procedure.getNotes());
    }
}
