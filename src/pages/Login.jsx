// RF-1: inicio de sesión. Mensaje genérico ante credenciales inválidas.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Alerta, Boton, Campo } from '../components/ui';

export const rutaInicio = (u) => (u.rol === 'paciente' ? `/pacientes/${u.paciente_id}` : '/pacientes');

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={rutaInicio(usuario)} replace />;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.usuario.trim() || !form.password) {
      setError('Ingrese su usuario y contraseña.');
      return;
    }
    setEnviando(true);
    try {
      const u = await login(form.usuario.trim(), form.password);
      navigate(rutaInicio(u), { replace: true });
    } catch (err) {
      if (err.status === 401) setError('Usuario o contraseña incorrectos.');
      else if (err.status === 429) setError(err.message);
      else setError('No fue posible conectar con el servidor. Intente nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-3xl font-bold text-blue-800">Cuidarte+</h1>
        <p className="mb-6 text-base text-slate-700">Sistema de exámenes médicos</p>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-4" aria-label="Inicio de sesión">
          <Alerta>{error}</Alerta>
          <Campo
            id="usuario"
            name="usuario"
            label="Usuario"
            autoComplete="username"
            required
            value={form.usuario}
            onChange={cambiar}
          />
          <Campo
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={cambiar}
          />
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Boton>
        </form>
      </div>
    </main>
  );
}