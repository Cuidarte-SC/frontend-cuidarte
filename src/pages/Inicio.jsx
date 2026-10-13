// Dashboard según rol (ERS 3.1.1): accesos directos a lo que cada rol puede hacer.
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { ROLES } from '../components/Layout';
import { Alerta } from '../components/ui';

export default function Inicio() {
  const { usuario } = useAuth();

  const accesos = [];
  if (usuario.rol === 'paciente') {
    if (usuario.paciente_id) {
      accesos.push({
        to: `/pacientes/${usuario.paciente_id}`,
        titulo: 'Mi ficha',
        texto: 'Vea sus exámenes médicos y descargue sus documentos.',
      });
    }
  } else {
    accesos.push({
      to: '/pacientes',
      titulo: 'Gestión de Pacientes',
      texto: 'Busque, registre y edite pacientes. Desde la ficha, gestione sus exámenes y documentos.',
    });
  }
  if (usuario.rol === 'admin') {
    accesos.push({
      to: '/usuarios',
      titulo: 'Gestión de Usuarios',
      texto: 'Revise las cuentas registradas, asigne roles y vincule pacientes con su ficha.',
    });
    accesos.push({
      to: '/auditoria',
      titulo: 'Auditoría',
      texto: 'Consulte el registro de acciones críticas del sistema.',
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Hola, {usuario.nombre}</h1>
        <p className="text-base text-slate-700">Ingresó como {ROLES[usuario.rol]}.</p>
      </div>

      {usuario.rol === 'paciente' && !usuario.paciente_id && (
        <Alerta tipo="info">
          Su cuenta aún no está vinculada a una ficha clínica. Cuando un médico o administrador la vincule, podrá
          ver aquí sus exámenes. Si ya tiene exámenes, cierre sesión y vuelva a ingresar más tarde.
        </Alerta>
      )}

      {accesos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {accesos.map((a) => (
            <li key={a.to}>
              <Link
                to={a.to}
                className="flex h-full min-h-11 flex-col gap-1 rounded-xl border border-slate-300 bg-white p-4 shadow-sm hover:border-blue-700 hover:bg-blue-50"
              >
                <span className="text-xl font-bold text-blue-800 underline">{a.titulo}</span>
                <span className="text-base text-slate-800">{a.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}