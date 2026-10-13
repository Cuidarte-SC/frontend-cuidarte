// Estructura común: enlace "saltar al contenido", cabecera, menú según rol y contenido principal.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Boton } from './ui';

export const ROLES = { admin: 'Administrador', medico: 'Médico', paciente: 'Paciente' };

const claseEnlace = ({ isActive }) =>
  `inline-flex min-h-11 items-center rounded-lg px-3 text-base font-medium ${
    isActive ? 'bg-blue-700 text-white' : 'text-slate-900 hover:bg-slate-200'
  }`;

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await logout();
    navigate('/login');
  };

  const enlaces = [{ to: '/', texto: 'Inicio', end: true }];
  if (usuario.rol === 'paciente') {
    if (usuario.paciente_id) enlaces.push({ to: `/pacientes/${usuario.paciente_id}`, texto: 'Mi ficha' });
  } else {
    enlaces.push({ to: '/pacientes', texto: 'Gestión de Pacientes' });
  }
  if (usuario.rol === 'admin') {
    enlaces.push({ to: '/usuarios', texto: 'Gestión de Usuarios' });
    enlaces.push({ to: '/auditoria', texto: 'Auditoría' });
  }

  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-2xl font-bold text-blue-800">Cuidarte+</p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base text-slate-800">
              {usuario.nombre} · <span className="font-semibold">{ROLES[usuario.rol]}</span>
            </p>
            <Boton variante="secundario" onClick={salir}>
              Cerrar sesión
            </Boton>
          </div>
        </div>
        <nav aria-label="Menú principal" className="mx-auto max-w-5xl px-4 pb-3">
          <ul className="flex flex-wrap gap-2">
            {enlaces.map((e) => (
              <li key={e.to}>
                <NavLink to={e.to} end={e.end} className={claseEnlace}>
                  {e.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}