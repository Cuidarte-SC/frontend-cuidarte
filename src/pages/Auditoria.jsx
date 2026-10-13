// RF-5: consulta del registro de auditoría (solo administrador).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '../components/ui';

const ACCIONES = ['', 'LOGIN', 'LOGIN_FALLIDO', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'DESCARGA', 'ACCESO_DENEGADO'];

export default function Auditoria() {
  const [filtros, setFiltros] = useState({ paciente_id: '', accion: '' });
  const [aplicados, setAplicados] = useState({ paciente_id: '', accion: '' });
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    const q = new URLSearchParams({ limite: '100' });
    if (aplicados.paciente_id) q.set('paciente_id', aplicados.paciente_id);
    if (aplicados.accion) q.set('accion', aplicados.accion);
    try {
      setDatos((await api(`/auditoria?${q}`)).datos);
    } catch (err) {
      setError(err.message);
    }
  }, [aplicados]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const filtrar = (e) => {
    e.preventDefault();
    setAplicados(filtros);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Auditoría</h1>
      <Tarjeta titulo="Registro de acciones">
        <form onSubmit={filtrar} className="mb-4 grid gap-3 sm:grid-cols-3 sm:items-end" aria-label="Filtros de auditoría">
          <Campo id="paciente_id" name="paciente_id" type="number" min="1" label="ID de paciente" value={filtros.paciente_id} onChange={cambiar} />
          <Campo as="select" id="accion" name="accion" label="Acción" value={filtros.accion} onChange={cambiar}>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>
                {a || 'Todas'}
              </option>
            ))}
          </Campo>
          <Boton type="submit" variante="secundario">
            Filtrar
          </Boton>
        </form>

        <Alerta>{error}</Alerta>
        {!datos && !error && <Cargando />}
        {datos && (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de auditoría, desplazable">
            <table className="w-full min-w-[640px] text-left text-base">
              <caption className="sr-only">Últimos registros de auditoría</caption>
              <thead className="border-b-2 border-slate-400">
                <tr>
                  <th scope="col" className="p-2">Fecha</th>
                  <th scope="col" className="p-2">Usuario</th>
                  <th scope="col" className="p-2">Acción</th>
                  <th scope="col" className="p-2">Tabla</th>
                  <th scope="col" className="p-2">Paciente</th>
                  <th scope="col" className="p-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((a) => (
                  <tr key={a.id} className="border-b border-slate-200">
                    <td className="p-2 whitespace-nowrap">{new Date(a.creado_en).toLocaleString('es-CL')}</td>
                    <td className="p-2">{a.nombre_usuario ?? 'anónimo'}</td>
                    <td className="p-2 font-semibold">{a.accion}</td>
                    <td className="p-2">{a.tabla_afectada ?? '—'}</td>
                    <td className="p-2">{a.paciente_id ?? '—'}</td>
                    <td className="p-2">{a.descripcion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}