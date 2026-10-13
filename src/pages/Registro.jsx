// RF-2.1: registro rápido con usuario, contraseña y correo. La cuenta queda con rol paciente.
// NFR-USAB-2/3: flujo corto, ayudas en cada campo y mensajes de error comprensibles.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Alerta, Boton, Campo } from '../components/ui';

const VACIO = { nombre: '', nombre_usuario: '', correo: '', password: '', confirmar: '' };

function validar(f) {
  const e = {};
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(f.nombre_usuario.trim())) {
    e.nombre_usuario = 'Use entre 3 y 50 letras, números, punto o guion, sin espacios.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) e.correo = 'Ingrese un correo válido.';
  const p = f.password;
  if (p.length < 12 || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/\d/.test(p) || !/[^A-Za-z0-9]/.test(p)) {
    e.password = 'Debe tener 12 o más caracteres, con mayúscula, minúscula, número y símbolo.';
  }
  if (f.confirmar !== p) e.confirmar = 'Las contraseñas no coinciden.';
  return e;
}

export default function Registro() {
  const { usuario, registrarse } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    const v = validar(f);
    setErrores(v);
    if (Object.keys(v).length > 0) {
      setError('Revise los campos marcados.');
      return;
    }
    setEnviando(true);
    try {
      await registrarse({
        nombre: f.nombre.trim() || undefined,
        nombre_usuario: f.nombre_usuario.trim(),
        correo: f.correo.trim(),
        password: f.password,
      });
      navigate('/login', {
        replace: true,
        state: { mensaje: 'Cuenta creada correctamente. Ya puede iniciar sesión.' },
      });
    } catch (err) {
      setError(err.status === 429 ? err.message : err.message || 'No fue posible crear la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-3xl font-bold text-blue-800">Crear cuenta</h1>
        <p className="mb-6 text-base text-slate-700">
          Regístrese para ver sus exámenes. Un médico vinculará su cuenta con su ficha clínica.
        </p>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-4" aria-label="Registro de usuario">
          <Alerta>{error}</Alerta>
          <Campo id="reg-nombre" name="nombre" label="Nombre completo (opcional)" autoComplete="name" value={f.nombre} onChange={cambiar} />
          <Campo
            id="reg-usuario"
            name="nombre_usuario"
            label="Nombre de usuario"
            required
            autoComplete="username"
            ayuda="Ejemplo: juan.perez"
            value={f.nombre_usuario}
            onChange={cambiar}
            error={errores.nombre_usuario}
          />
          <Campo
            id="reg-correo"
            name="correo"
            type="email"
            label="Correo electrónico"
            required
            autoComplete="email"
            value={f.correo}
            onChange={cambiar}
            error={errores.correo}
          />
          <Campo
            id="reg-password"
            name="password"
            type="password"
            label="Contraseña"
            required
            autoComplete="new-password"
            ayuda="12 o más caracteres, con mayúscula, minúscula, número y símbolo."
            value={f.password}
            onChange={cambiar}
            error={errores.password}
          />
          <Campo
            id="reg-confirmar"
            name="confirmar"
            type="password"
            label="Repita la contraseña"
            required
            autoComplete="new-password"
            value={f.confirmar}
            onChange={cambiar}
            error={errores.confirmar}
          />
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </Boton>
        </form>

        <p className="mt-6 text-base">
          ¿Ya tiene cuenta?{' '}
          <Link to="/login" className="font-semibold text-blue-800 underline">
            Inicie sesión
          </Link>
        </p>
      </div>
    </main>
  );
}