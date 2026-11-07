import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "../../components/AsyncState";
import { usePatients } from "../../features/patients/api";
import {
  useCreateAppointment,
  type AppointmentFilters,
} from "../../features/appointments/api";
import type { Professional, Procedure } from "../../api/types";
import {
  APPOINTMENT_DURATION_OPTIONS,
  DEFAULT_APPOINTMENT_DURATION,
} from "../../lib/appointment-duration";
import { clinicDate } from "../../lib/clinic-time";
import { isUxDemo } from "../../lib/experience";
import { money } from "../../lib/money";

const schema = z.object({
  patientId: z.string().min(1, "Selecione um paciente."),
  professionalId: z.string().min(1, "Selecione um dentista."),
  procedureId: z.string().min(1, "Selecione um procedimento."),
  startsAt: z.string().min(1, "Informe data e horário."),
  durationMinutes: z.coerce
    .number()
    .min(15, "Informe a duração.")
    .max(480, "A duração máxima é de 8 horas."),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

type Props = {
  filters: AppointmentFilters;
  dentistsList: Professional[];
  proceduresList: Procedure[];
  defaults: { startsAt?: string; professionalId?: string };
  onClose: () => void;
};
export default function AppointmentCreateForm({
  filters,
  dentistsList,
  proceduresList,
  defaults,
  onClose,
}: Props) {
  const patients = usePatients("", 0, true);
  const create = useCreateAppointment(filters);
  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: "",
      procedureId: "",
      startsAt: defaults.startsAt ?? "",
      professionalId: defaults.professionalId ?? "",
      durationMinutes: DEFAULT_APPOINTMENT_DURATION,
    },
  });
  const submit = form.handleSubmit(async (data) => {
    try {
      await create.mutateAsync(data);
      onClose();
    } catch {
      /* Mutation state displays the recoverable error and keeps the form values. */
    }
  });
  if (patients.isError)
    return (
      <ErrorState
        message="Não foi possível carregar pacientes."
        onRetry={() => patients.refetch()}
      />
    );
  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        Paciente
        <select
          {...form.register("patientId")}
          aria-invalid={Boolean(form.formState.errors.patientId)}
          aria-describedby="create-patientId-error"
          disabled={patients.isLoading}
        >
          <option value="">
            {patients.isLoading ? "Carregando pacientes..." : "Selecione"}
          </option>
          {patients.data?.content.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
        <small id="create-patientId-error">
          {form.formState.errors.patientId?.message}
        </small>
      </label>
      <label>
        Dentista
        <select
          {...form.register("professionalId")}
          aria-invalid={Boolean(form.formState.errors.professionalId)}
          aria-describedby="create-professionalId-error"
        >
          <option value="">Selecione</option>
          {dentistsList.map((dentist) => (
            <option key={dentist.id} value={dentist.id}>
              {dentist.name}
            </option>
          ))}
        </select>
        <small id="create-professionalId-error">
          {form.formState.errors.professionalId?.message}
        </small>
      </label>
      <label className="full-width">
        Data e horário
        <Controller
          name="startsAt"
          control={form.control}
          render={({ field }) => (
            <input
              type="datetime-local"
              value={field.value ?? ""}
              onChange={field.onChange}
              min={`${clinicDate()}T00:00`}
              aria-label="Data e horário de Brasília"
              aria-invalid={Boolean(form.formState.errors.startsAt)}
              aria-describedby="appointment-time-error"
            />
          )}
        />
        <small id="appointment-time-error">
          {form.formState.errors.startsAt?.message}
        </small>
      </label>
      <label>
        Duração
        <select {...form.register("durationMinutes", { valueAsNumber: true })}>
          {APPOINTMENT_DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <small id="create-durationMinutes-error">
          {form.formState.errors.durationMinutes?.message}
        </small>
      </label>
      <label className="full-width">
        Procedimento
        <select
          {...form.register("procedureId")}
          aria-invalid={Boolean(form.formState.errors.procedureId)}
          aria-describedby="create-procedureId-error"
        >
          <option value="">Selecione</option>
          {proceduresList.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.name}
              {!isUxDemo ? ` — ${money(procedure.price)}` : ""}
            </option>
          ))}
        </select>
        <small id="create-procedureId-error">
          {form.formState.errors.procedureId?.message}
        </small>
      </label>
      {create.isError && (
        <p className="form-error" role="alert">
          Não foi possível salvar o agendamento.
        </p>
      )}
      <div className="modal-actions full-width">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" disabled={create.isPending}>
          {create.isPending ? "Salvando..." : "Agendar consulta"}
        </button>
      </div>
    </form>
  );
}
