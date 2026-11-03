import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DentalChartWorkspace } from '../../components/dental-chart/DentalChartWorkspace';
import '../../components/dental-chart/DentalChart.css';
import { useOdontogramState } from '../../features/tooth-procedures/api';

function ageFrom(birthDate: string | null) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export default function OdontogramPage() {
  const { patientId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { role } = useAuth();
  const odontogram = useOdontogramState(patientId, null);
  const patient = odontogram.data?.patient;
  const age = ageFrom(patient?.birthDate ?? null);
  const backTo = role === 'DENTIST' ? '/agenda' : `/patients/${patientId}`;

  return (
    <div className="odontogram-page">
      <div className="page-header">
        <div>
          <Link to={backTo} className="odg-back-link">
            <ArrowLeft size={16} /> {role === 'DENTIST' ? 'Voltar para a agenda' : 'Voltar para o prontuário'}
          </Link>
          <h1 className="page-title">Odontograma</h1>
          <p className="page-subtitle">
            {patient ? `${patient.name}${age !== null ? ` · ${age} anos` : ''}` : 'Carregando paciente…'}
          </p>
        </div>
      </div>
      <DentalChartWorkspace key={patientId} patientId={patientId} initialAppointmentId={searchParams.get('consulta')} />
    </div>
  );
}
