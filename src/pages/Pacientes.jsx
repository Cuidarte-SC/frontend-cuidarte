// RF-2: listado, búsqueda y registro de pacientes (admin y médico).
// El RUT se valida en formato aquí; el dígito verificador lo valida el servidor.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '../components/ui';

const LIMITE = 20;
const VACIO = {
  nombre: '',
  rut: '',
  correo: '',
  fecha_nacimiento: '',
  consentimiento_datos: false,
  crearCuenta: false,
  nombre_usuario: '',
  password: '',
};
const FORMATO_RUT = /^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/;

function validar(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = 'Ingrese el nombre completo.';
  if (!FORMATO_RUT.test(f.rut.trim().toUpperCase())) e.rut = 'Use el formato 12.345.678-9.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) e.correo = 'Ingrese un correo válido.';
  if (!f.fecha_nacimiento) e.fecha_nacimiento = 'Ingrese la fecha de nacimiento.';
  if (f.crearCuenta) {
    if (!f.nombre_usuario.trim()) e.nombre_usuario = 'Ingrese un nombre de usuario.';
    if (f.password.length < 12) e.password = 'Mínimo 12 caracteres.';
  }
  return e;
}

function FormularioPaciente({ onCreado, onCancelar }) {
  const [f, setF] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    const { name, type, checked, value } = e.target;
    setF({ ...f, [name]: type === 'checkbox' ? checked : value });
  };

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
      const body = {
        nombre: f.nombre.trim(),
        rut: f.rut.trim().toUpperCase(),
        correo: f.correo.trim(),
        fecha_nacimiento: f.fecha_nacimiento,
        consentimiento_datos: f.consentimiento_datos,
      };
      if (f.crearCuenta) {
        body.credenciales = { nombre_usuario: f.nombre_usuario.trim(), password: f.password };
      }
      const creado = await api('/pacientes', { method: 'POST', body });
      onCreado(creado);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Registrar paciente">
      <div className="sm:col-span-2">
        <Alerta>{error}</Alerta>
      </div>
      <Campo id="nombre" name="nombre" label="Nombre completo" required value={f.nombre} onChange={cambiar} error={errores.nombre} />
      <Campo id="rut" name="rut" label="RUT" required ayuda="Formato: 12.345.678-9" value={f.rut} onChange={cambiar} error={errores.rut} />
      <Campo id="correo" name="correo" type="email" label="Correo" required autoComplete="off" value={f.correo} onChange={cambiar} error={errores.correo} />
      <Campo id="fecha_nacimiento" name="fecha_nacimiento" type="date" label="Fecha de nacimiento" required value={f.fecha_nacimiento} onChange={cambiar} error={errores.fecha_nacimiento} />

      <label className="flex min-h-11 items-center gap-3 text-base sm:col-span-2">
        <input type="checkbox" name="consentimiento_datos" checked={f.consentimiento_datos} onChange={cambiar} className="h-6 w-6" />
        El paciente autoriza el tratamiento de sus datos (Ley 19.628)
      </label>
      <label className="flex min-h-11 items-center gap-3 text-base sm:col-span-2">
        <input type="checkbox" name="crearCuenta" checked={f.crearCuenta} onChange={cambiar} className="h-6 w-6" />
        Crear cuenta de acceso para el paciente
      </label>

      {f.crearCuenta && (
        <>
          <Campo id="nombre_usuario" name="nombre_usuario" label="Nombre de usuario" required autoComplete="off" value={f.nombre_usuario} onChange={cambiar} error={errores.nombre_usuario} />
          <Campo
            id="password_nueva"
            name="password"
            type="password"
            label="Contraseña inicial"
            required
            autoComplete="new-password"
            ayuda="12+ caracteres con mayúscula, minúscula, número y símbolo"
            value={f.password}
            onChange={cambiar}
            error={errores.password}
          />
        </>
      )}

      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar paciente'}
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

export default function Pacientes() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      setRes(await api(`/pacientes?q=${encodeURIComponent(filtro)}&pagina=${pagina}&limite=${LIMITE}`));
    } catch (err) {
      setError(err.message);
    }
  }, [filtro, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const buscar = (e) => {
    e.preventDefault();
    setPagina(1);
    setFiltro(busqueda.trim());
  };

  const totalPaginas = res ? Math.max(1, Math.ceil(res.total / LIMITE)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>

      {mostrarForm ? (
        <Tarjeta titulo="Nuevo paciente">
          <FormularioPaciente onCreado={(p) => navigate(`/pacientes/${p.id}`)} onCancelar={() => setMostrarForm(false)} />
        </Tarjeta>
      ) : (
        <div>
          <Boton onClick={() => setMostrarForm(true)}>+ Nuevo paciente</Boton>
        </div>
      )}

      <Tarjeta titulo="Pacientes registrados">
        <form onSubmit={buscar} role="search" className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            id="buscar"
            label="Buscar por nombre o RUT"
            className="flex-1"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Boton type="submit" variante="secundario">
            Buscar
          </Boton>
        </form>

        <Alerta>{error}</Alerta>
        {!res && !error && <Cargando />}

        {res && (
          <>
            <p className="mb-2 text-base text-slate-700" aria-live="polite">
              {res.total} paciente(s) encontrado(s)
            </p>
            <ul className="divide-y divide-slate-200">
              {res.datos.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/pacientes/${p.id}`}
                    className="flex min-h-11 flex-col justify-center rounded-lg px-2 py-2 hover:bg-slate-100 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-base font-semibold text-blue-800 underline">{p.nombre}</span>
                    <span className="text-base text-slate-700">RUT {p.rut}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center gap-3">
              <Boton variante="secundario" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                Anterior
              </Boton>
              <span className="text-base">
                Página {pagina} de {totalPaginas}
              </span>
              <Boton variante="secundario" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
                Siguiente
              </Boton>
            </nav>
          </>
        )}
      </Tarjeta>
    </div>
  );
}