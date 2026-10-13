// RF-2.5 a RF-2.7: gestión de usuarios (solo administrador).
// Permite asignar roles, activar/desactivar, vincular un paciente con su ficha y eliminar (con confirmación).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { ROLES } from '../components/Layout';
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '../components/ui';

function EditarUsuario({ usuario, esPropio, onGuardado, onCancelar }) {
  const [f, setF] = useState({
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo,
    paciente_id: usuario.paciente_id ?? '',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const p = `u${usuario.id}`;

  const cambiar = (e) => {
    const { name, type, checked, value } = e.target;
    setF({ ...f, [name]: type === 'checkbox' ? checked : value });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.nombre.trim()) {
      setError('Ingrese el nombre.');
      return;
    }
    const body = { nombre: f.nombre.trim(), correo: f.correo.trim(), rol: f.rol, activo: f.activo };
    if (f.rol === 'paciente') body.paciente_id = f.paciente_id === '' ? null : Number(f.paciente_id);
    setEnviando(true);
    try {
      onGuardado(await api(`/usuarios/${usuario.id}`, { method: 'PUT', body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2" aria-label={`Editar usuario ${usuario.nombre_usuario}`}>
      <div className="sm:col-span-2">
        <Alerta>{error}</Alerta>
      </div>
      <Campo id={`${p}-nombre`} name="nombre" label="Nombre" required value={f.nombre} onChange={cambiar} />
      <Campo id={`${p}-correo`} name="correo" type="email" label="Correo" required value={f.correo} onChange={cambiar} />
      <Campo
        as="select"
        id={`${p}-rol`}
        name="rol"
        label="Rol"
        value={f.rol}
        onChange={cambiar}
        disabled={esPropio}
        ayuda={esPropio ? 'No puede cambiar su propio rol.' : undefined}
      >
        {Object.entries(ROLES).map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </Campo>
      {f.rol === 'paciente' && (
        <Campo
          id={`${p}-ficha`}
          name="paciente_id"
          type="number"
          min="1"
          label="ID de ficha de paciente"
          ayuda="Vincula la cuenta con su ficha clínica. Déjelo vacío si aún no tiene."
          value={f.paciente_id}
          onChange={cambiar}
        />
      )}
      <label className="flex min-h-11 items-center gap-3 text-base sm:col-span-2">
        <input type="checkbox" name="activo" checked={f.activo} onChange={cambiar} disabled={esPropio} className="h-6 w-6" />
        Cuenta activa (puede iniciar sesión)
      </label>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [busqueda, setBusqueda] = useState({ q: '', rol: '' });
  const [aplicada, setAplicada] = useState({ q: '', rol: '' });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    setError('');
    const q = new URLSearchParams();
    if (aplicada.q) q.set('q', aplicada.q);
    if (aplicada.rol) q.set('rol', aplicada.rol);
    try {
      setDatos((await api(`/usuarios?${q}`)).datos);
    } catch (err) {
      setError(err.message);
    }
  }, [aplicada]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const buscar = (e) => {
    e.preventDefault();
    setAplicada({ q: busqueda.q.trim(), rol: busqueda.rol });
  };

  const eliminar = async (u) => {
    if (!window.confirm(`¿Eliminar al usuario "${u.nombre_usuario}"? Ya no podrá iniciar sesión. La acción queda registrada en auditoría.`)) {
      return;
    }
    setError('');
    setOk('');
    try {
      await api(`/usuarios/${u.id}`, { method: 'DELETE' });
      setOk(`Usuario "${u.nombre_usuario}" eliminado.`);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>

      <Tarjeta titulo="Usuarios registrados">
        <form onSubmit={buscar} role="search" className="mb-4 grid gap-3 sm:grid-cols-3 sm:items-end">
          <Campo
            id="buscar-usuario"
            label="Buscar por usuario, nombre o correo"
            value={busqueda.q}
            onChange={(e) => setBusqueda({ ...busqueda, q: e.target.value })}
          />
          <Campo
            as="select"
            id="filtro-rol"
            label="Rol"
            value={busqueda.rol}
            onChange={(e) => setBusqueda({ ...busqueda, rol: e.target.value })}
          >
            <option value="">Todos</option>
            {Object.entries(ROLES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Campo>
          <Boton type="submit" variante="secundario">
            Buscar
          </Boton>
        </form>

        <div className="mb-3 flex flex-col gap-3">
          <Alerta>{error}</Alerta>
          <Alerta tipo="exito">{ok}</Alerta>
        </div>
        {!datos && !error && <Cargando />}

        {datos && (
          <>
            <p className="mb-2 text-base text-slate-700" aria-live="polite">
              {datos.length} usuario(s)
            </p>
            <ul className="flex flex-col gap-3">
              {datos.map((u) => (
                <li key={u.id} className="rounded-lg border border-slate-300 p-3">
                  {editando === u.id ? (
                    <EditarUsuario
                      usuario={u}
                      esPropio={u.id === yo.id}
                      onCancelar={() => setEditando(null)}
                      onGuardado={(g) => {
                        setEditando(null);
                        setOk(`Usuario "${g.nombre_usuario}" actualizado.`);
                        cargar();
                      }}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold">
                          {u.nombre_usuario}
                          {u.id === yo.id && <span className="text-base font-normal text-slate-700"> (usted)</span>}
                        </p>
                        <p className="text-base text-slate-800">
                          {u.nombre} · <span className="break-all">{u.correo}</span>
                        </p>
                        <p className="text-base">
                          <span className="font-semibold">{ROLES[u.rol]}</span>
                          {u.rol === 'paciente' && (
                            <span className="text-slate-700"> · {u.paciente_id ? `Ficha #${u.paciente_id}` : 'Sin ficha vinculada'}</span>
                          )}
                          {' · '}
                          <span className={u.activo ? 'text-green-800' : 'font-semibold text-red-800'}>
                            {u.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Boton
                          variante="secundario"
                          onClick={() => {
                            setOk('');
                            setEditando(u.id);
                          }}
                          aria-label={`Editar usuario ${u.nombre_usuario}`}
                        >
                          Editar
                        </Boton>
                        {u.id !== yo.id && (
                          <Boton variante="peligro" onClick={() => eliminar(u)} aria-label={`Eliminar usuario ${u.nombre_usuario}`}>
                            Eliminar
                          </Boton>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Tarjeta>
    </div>
  );
}