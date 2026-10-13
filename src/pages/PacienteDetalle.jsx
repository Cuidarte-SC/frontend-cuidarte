// Ficha del paciente (RF-2.3, RF-2.4), sus exámenes (RF-3) y documentos (RF-4).
// NFR-USAB-4: primero se accede al paciente y luego a sus exámenes.
// Médico/admin editan y eliminan (con confirmación, RF-3.3); el paciente solo consulta lo suyo (RB-1).
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, descargarDocumento } from '../api';
import { useAuth } from '../auth';
import { Alerta, Boton, Campo, Cargando, Tarjeta, aFechaInput, formatoFecha } from '../components/ui';

const TIPOS = ['Hemograma', 'Perfil lipídico', 'Glicemia', 'Orina completa', 'Perfil tiroideo', 'Otro'];
const ACEPTADOS = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png';
const FORMATO_RUT = /^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/;

// RF-2.3: editar datos del paciente
function EditarPaciente({ paciente, onGuardado, onCancelar }) {
  const [f, setF] = useState({
    nombre: paciente.nombre,
    rut: paciente.rut,
    correo: paciente.correo,
    fecha_nacimiento: aFechaInput(paciente.fecha_nacimiento),
    consentimiento_datos: paciente.consentimiento_datos,
  });
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
    const v = {};
    if (!f.nombre.trim()) v.nombre = 'Ingrese el nombre completo.';
    if (!FORMATO_RUT.test(f.rut.trim().toUpperCase())) v.rut = 'Use el formato 12.345.678-9.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) v.correo = 'Ingrese un correo válido.';
    if (!f.fecha_nacimiento) v.fecha_nacimiento = 'Ingrese la fecha de nacimiento.';
    setErrores(v);
    if (Object.keys(v).length > 0) {
      setError('Revise los campos marcados.');
      return;
    }
    setEnviando(true);
    try {
      const actualizado = await api(`/pacientes/${paciente.id}`, {
        method: 'PUT',
        body: {
          nombre: f.nombre.trim(),
          rut: f.rut.trim().toUpperCase(),
          correo: f.correo.trim(),
          fecha_nacimiento: f.fecha_nacimiento,
          consentimiento_datos: f.consentimiento_datos,
        },
      });
      onGuardado(actualizado);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Editar paciente">
      <div className="sm:col-span-2">
        <Alerta>{error}</Alerta>
      </div>
      <Campo id="ed-nombre" name="nombre" label="Nombre completo" required value={f.nombre} onChange={cambiar} error={errores.nombre} />
      <Campo id="ed-rut" name="rut" label="RUT" required ayuda="Formato: 12.345.678-9" value={f.rut} onChange={cambiar} error={errores.rut} />
      <Campo id="ed-correo" name="correo" type="email" label="Correo" required value={f.correo} onChange={cambiar} error={errores.correo} />
      <Campo id="ed-fecha" name="fecha_nacimiento" type="date" label="Fecha de nacimiento" required value={f.fecha_nacimiento} onChange={cambiar} error={errores.fecha_nacimiento} />
      <label className="flex min-h-11 items-center gap-3 text-base sm:col-span-2">
        <input type="checkbox" name="consentimiento_datos" checked={f.consentimiento_datos} onChange={cambiar} className="h-6 w-6" />
        El paciente autoriza el tratamiento de sus datos (Ley 19.628)
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

// RF-3.1 / RF-3.2: crear o editar un examen
function FormularioExamen({ pacienteId, examen, onGuardado, onCancelar }) {
  const prefijo = examen ? `ex${examen.id}` : 'nuevo';
  const [f, setF] = useState({
    tipo_examen: examen?.tipo_examen ?? '',
    fecha_examen: aFechaInput(examen?.fecha_examen),
    resultado: examen?.resultado ?? '',
    estado: examen?.estado ?? 'pendiente',
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });
  const tipos = TIPOS.includes(f.tipo_examen) || !f.tipo_examen ? TIPOS : [f.tipo_examen, ...TIPOS];

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    const v = {};
    if (!f.tipo_examen) v.tipo_examen = 'Seleccione el tipo de examen.';
    if (!f.fecha_examen) v.fecha_examen = 'Ingrese la fecha del examen.';
    setErrores(v);
    if (Object.keys(v).length > 0) {
      setError('Revise los campos marcados.');
      return;
    }
    setEnviando(true);
    try {
      const body = { tipo_examen: f.tipo_examen, fecha_examen: f.fecha_examen, estado: f.estado };
      if (f.resultado.trim() || examen) body.resultado = f.resultado.trim();
      const guardado = examen
        ? await api(`/pacientes/${pacienteId}/examenes/${examen.id}`, { method: 'PUT', body })
        : await api(`/pacientes/${pacienteId}/examenes`, { method: 'POST', body });
      onGuardado(guardado);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2" aria-label={examen ? 'Editar examen' : 'Nuevo examen'}>
      <div className="sm:col-span-2">
        <Alerta>{error}</Alerta>
      </div>
      <Campo as="select" id={`${prefijo}-tipo`} name="tipo_examen" label="Tipo de examen" required value={f.tipo_examen} onChange={cambiar} error={errores.tipo_examen}>
        <option value="">Seleccione…</option>
        {tipos.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Campo>
      <Campo id={`${prefijo}-fecha`} name="fecha_examen" type="date" label="Fecha del examen" required value={f.fecha_examen} onChange={cambiar} error={errores.fecha_examen} />
      <Campo as="select" id={`${prefijo}-estado`} name="estado" label="Estado" value={f.estado} onChange={cambiar}>
        <option value="pendiente">Pendiente</option>
        <option value="disponible">Disponible</option>
      </Campo>
      <Campo as="textarea" id={`${prefijo}-resultado`} name="resultado" label="Resultado (opcional)" rows={3} value={f.resultado} onChange={cambiar} className="sm:col-span-2" />
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar examen'}
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}

// RF-4: documento del examen (uno activo; subir otro lo reemplaza, RF-4.3)
function DocumentoExamen({ examenId, puedeEditar }) {
  const [docs, setDocs] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const cargar = useCallback(async () => {
    try {
      setDocs((await api(`/examenes/${examenId}/documentos`)).datos);
    } catch (err) {
      setError(err.message);
    }
  }, [examenId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actual = docs?.[0];

  const subir = async (e) => {
    e.preventDefault();
    const formulario = e.currentTarget;
    setError('');
    setOk('');
    if (!archivo) {
      setError('Seleccione un archivo.');
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setError('El archivo supera 10 MB.');
      return;
    }
    if (actual && !window.confirm(`¿Reemplazar "${actual.nombre_archivo}" por "${archivo.name}"?`)) return;
    const datos = new FormData();
    datos.append('archivo', archivo);
    try {
      await api(`/examenes/${examenId}/documentos`, { method: 'POST', form: datos });
      setOk(actual ? 'Documento reemplazado correctamente.' : 'Documento subido correctamente.');
      setArchivo(null);
      formulario.reset();
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const bajar = async () => {
    setError('');
    try {
      await descargarDocumento(actual.id, actual.nombre_archivo);
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async () => {
    if (!window.confirm(`¿Eliminar el documento "${actual.nombre_archivo}"? Esta acción queda registrada en auditoría.`)) return;
    setError('');
    setOk('');
    try {
      await api(`/documentos/${actual.id}`, { method: 'DELETE' });
      setOk('Documento eliminado.');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg bg-slate-50 p-3">
      <Alerta>{error}</Alerta>
      <Alerta tipo="exito">{ok}</Alerta>
      {!docs && !error && <Cargando texto="Cargando documento…" />}
      {docs && !actual && <p className="text-base text-slate-700">Sin documento adjunto.</p>}
      {actual && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base">
            {actual.nombre_archivo} <span className="text-slate-700">(versión {actual.version})</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <Boton variante="secundario" onClick={bajar} aria-label={`Descargar ${actual.nombre_archivo}`}>
              Descargar
            </Boton>
            {puedeEditar && (
              <Boton variante="peligro" onClick={eliminar} aria-label={`Eliminar ${actual.nombre_archivo}`}>
                Eliminar
              </Boton>
            )}
          </div>
        </div>
      )}
      {puedeEditar && (
        <form onSubmit={subir} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            id={`archivo-${examenId}`}
            type="file"
            label={actual ? 'Reemplazar documento' : 'Subir documento'}
            ayuda="PDF, Word, PowerPoint, JPG o PNG. Máximo 10 MB. Un documento por examen."
            accept={ACEPTADOS}
            className="flex-1"
            onChange={(e) => setArchivo(e.target.files[0] ?? null)}
          />
          <Boton type="submit">{actual ? 'Reemplazar' : 'Subir'}</Boton>
        </form>
      )}
    </div>
  );
}

function ItemExamen({ examen, pacienteId, puedeEditar, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');
  const panelId = `docs-${examen.id}`;

  const eliminar = async () => {
    if (
      !window.confirm(
        `¿Eliminar el examen "${examen.tipo_examen}" del ${formatoFecha(examen.fecha_examen)}? También se dará de baja su documento. Esta acción queda registrada en auditoría.`,
      )
    ) {
      return;
    }
    setError('');
    try {
      await api(`/pacientes/${pacienteId}/examenes/${examen.id}`, { method: 'DELETE' });
      onCambio(`Examen "${examen.tipo_examen}" eliminado.`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (editando) {
    return (
      <li className="rounded-lg border border-blue-300 p-3">
        <FormularioExamen
          pacienteId={pacienteId}
          examen={examen}
          onCancelar={() => setEditando(false)}
          onGuardado={(ex) => {
            setEditando(false);
            onCambio(`Examen "${ex.tipo_examen}" actualizado.`);
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-slate-300 p-3">
      <Alerta>{error}</Alerta>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{examen.tipo_examen}</h3>
          <p className="text-base text-slate-700">
            {formatoFecha(examen.fecha_examen)} ·{' '}
            <span className={examen.estado === 'disponible' ? 'font-semibold text-green-800' : 'font-semibold text-amber-800'}>
              {examen.estado === 'disponible' ? 'Disponible' : 'Pendiente'}
            </span>
          </p>
          {examen.resultado && <p className="mt-1 text-base">{examen.resultado}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" aria-expanded={abierto} aria-controls={panelId} onClick={() => setAbierto(!abierto)}>
            {abierto ? 'Ocultar documento' : 'Ver documento'}
          </Boton>
          {puedeEditar && (
            <>
              <Boton variante="secundario" onClick={() => setEditando(true)} aria-label={`Editar examen ${examen.tipo_examen}`}>
                Editar
              </Boton>
              <Boton variante="peligro" onClick={eliminar} aria-label={`Eliminar examen ${examen.tipo_examen}`}>
                Eliminar
              </Boton>
            </>
          )}
        </div>
      </div>
      {abierto && (
        <div id={panelId}>
          <DocumentoExamen examenId={examen.id} puedeEditar={puedeEditar} />
        </div>
      )}
    </li>
  );
}

export default function PacienteDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const puedeEditar = usuario.rol === 'admin' || usuario.rol === 'medico';

  const [paciente, setPaciente] = useState(null);
  const [examenes, setExamenes] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [nuevoExamen, setNuevoExamen] = useState(false);
  const [editandoPaciente, setEditandoPaciente] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const [p, ex] = await Promise.all([api(`/pacientes/${id}`), api(`/pacientes/${id}/examenes`)]);
      setPaciente(p);
      setExamenes(ex.datos);
    } catch (err) {
      setError(err.status === 403 ? 'No tiene permiso para ver esta ficha.' : err.message);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambio = (mensaje) => {
    setOk(mensaje);
    cargar();
  };

  if (error) return <Alerta>{error}</Alerta>;
  if (!paciente) return <Cargando />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{paciente.nombre}</h1>
      <Alerta tipo="exito">{ok}</Alerta>

      <Tarjeta
        titulo="Datos del paciente"
        acciones={
          puedeEditar &&
          !editandoPaciente && (
            <Boton variante="secundario" onClick={() => { setOk(''); setEditandoPaciente(true); }}>
              Editar datos
            </Boton>
          )
        }
      >
        {editandoPaciente ? (
          <EditarPaciente
            paciente={paciente}
            onCancelar={() => setEditandoPaciente(false)}
            onGuardado={() => {
              setEditandoPaciente(false);
              cambio('Datos del paciente actualizados.');
            }}
          />
        ) : (
          <dl className="grid gap-3 text-base sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-700">RUT</dt>
              <dd>{paciente.rut}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Correo</dt>
              <dd className="break-all">{paciente.correo}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Fecha de nacimiento</dt>
              <dd>{formatoFecha(paciente.fecha_nacimiento)}</dd>
            </div>
          </dl>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Gestión de Exámenes"
        acciones={
          puedeEditar &&
          !nuevoExamen && (
            <Boton onClick={() => { setOk(''); setNuevoExamen(true); }}>+ Nuevo examen</Boton>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {nuevoExamen && (
            <div className="rounded-lg border border-blue-300 p-3">
              <FormularioExamen
                pacienteId={id}
                onCancelar={() => setNuevoExamen(false)}
                onGuardado={(ex) => {
                  setNuevoExamen(false);
                  cambio(`Examen "${ex.tipo_examen}" guardado correctamente.`);
                }}
              />
            </div>
          )}
          {examenes.length === 0 ? (
            <p className="text-base text-slate-700">El paciente no tiene exámenes registrados.</p>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Listado de exámenes">
              {examenes.map((ex) => (
                <ItemExamen key={ex.id} examen={ex} pacienteId={id} puedeEditar={puedeEditar} onCambio={cambio} />
              ))}
            </ul>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}