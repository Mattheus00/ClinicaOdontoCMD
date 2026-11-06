import { useId, useState } from 'react';
import type { Patient } from '../../api/types';
import { useCreatePatient, usePatients } from '../../features/patients/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import { maskPhone } from '../../lib/masks';
import { readApiError } from '../../lib/api-error';

export function PatientPicker({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string }) {
  const id = useId();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [createError, setCreateError] = useState('');
  const term = useDebouncedValue(search);
  const results = usePatients(term, page, !creating && !value);
  const create = useCreatePatient();
  const choose = (patient: Patient) => { setSelected(patient); onChange(patient.id); setCreating(false); };

  return <fieldset className="patient-picker">
    <legend>Paciente</legend>
    {value ? <div className="patient-picker-selected"><strong>{selected?.name ?? 'Paciente selecionado'}</strong><button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange('')}>Trocar paciente</button></div> : creating ? <div className="patient-picker-create">
      <label htmlFor={`${id}-name`}>Nome completo<input id={`${id}-name`} value={name} onChange={e => setName(e.target.value)} autoComplete="off" /></label>
      <label htmlFor={`${id}-phone`}>Telefone<input id={`${id}-phone`} value={phone} inputMode="tel" onChange={e => setPhone(maskPhone(e.target.value))} autoComplete="off" /></label>
      <p>Você pode completar os demais dados depois, na ficha do paciente.</p>
      {createError && <p role="alert" className="form-error">{createError}</p>}
      <div className="patient-picker-actions"><button type="button" className="btn btn-secondary" disabled={create.isPending} onClick={() => setCreating(false)}>Voltar à busca</button><button type="button" className="btn btn-primary" disabled={create.isPending} onClick={async () => {
        if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 10) { setCreateError('Informe o nome completo e um telefone válido.'); return; }
        setCreateError('');
        try { choose(await create.mutateAsync({ name: name.trim(), phone, phoneIsWhatsapp: true })); }
        catch (cause) { setCreateError(readApiError(cause, 'Não foi possível cadastrar. Tente novamente.')); }
      }}>{create.isPending ? 'Cadastrando…' : 'Cadastrar e selecionar'}</button></div>
    </div> : <>
      <label htmlFor={`${id}-search`}>Buscar por nome, telefone ou CPF<input id={`${id}-search`} type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} autoComplete="off" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} /></label>
      {results.isFetching || term !== search ? <p role="status">Buscando pacientes…</p> : results.isError ? <div role="alert"><p>Não foi possível buscar os pacientes.</p><button type="button" className="btn btn-secondary" onClick={() => results.refetch()}>Tentar novamente</button></div> : <>
        <ul className="patient-picker-results" aria-label="Pacientes encontrados">{results.data?.content.map(patient => <li key={patient.id}><button type="button" onClick={() => choose(patient)}><strong>{patient.name}</strong><span>{maskPhone(patient.phone)}</span></button></li>)}</ul>
        {!results.data?.content.length && <p role="status">Nenhum paciente encontrado. Revise a busca ou cadastre um paciente.</p>}
        {(results.data?.totalPages ?? 0) > 1 && <div className="patient-picker-actions"><button type="button" className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page + 1} de {results.data?.totalPages}</span><button type="button" className="btn btn-secondary btn-sm" disabled={page + 1 >= (results.data?.totalPages ?? 0)} onClick={() => setPage(p => p + 1)}>Próxima</button></div>}
      </>}
      <button type="button" className="btn btn-secondary" onClick={() => setCreating(true)}>Cadastrar paciente sem sair do agendamento</button>
    </>}
    {error && <p id={`${id}-error`} role="alert" className="form-error">{error}</p>}
  </fieldset>;
}
