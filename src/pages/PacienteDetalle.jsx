// RF-3 y RF-4: ficha del paciente, sus exámenes y documentos.
// Médico/admin pueden crear exámenes y subir documentos; el paciente solo consulta lo suyo (RB-1).
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, descargarDocumento } from '../api';
import { useAuth } from '../auth';
import { Alerta, Boton, Campo, Cargando, Tarjeta } from '../components/ui';

const TIPOS = ['Hemograma', 'Perfil lipídico', 'Glicemia', 'Orina completa', 'Perfil tiroideo', 'Otro'];
const ACEPTADOS = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png';

const fecha = (f) => new Date(f).toLocaleDateString('es-CL');
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function NuevoExamen({ pacienteId, onCreado }) {
  const inicial = { tipo_examen: '', fecha_examen: hoy(), resultado: '', estado: 'pendiente' };
  const [f, setF] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

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
      if (f.resultado.trim()) body.resultado = f.resultado.trim();
      const examen = await api(`/pacientes/${pacienteId}/examenes`, { method: 'POST', body });
      setF(inicial);
      onCreado(examen);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Nuevo examen">
      <div className="sm:col-span-2">
        <Alerta>{error}</Alerta>
      </div>
      <Campo as="select" id="tipo_examen" name="tipo_examen" label="Tipo de examen" required value={f.tipo_examen} onChange={cambiar} error={errores.tipo_examen}>
        <option value="">Seleccione…</option>
        {TIPOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Campo>
      <Campo id="fecha_examen" name="fecha_examen" type="date" label="Fecha del examen" required value={f.fecha_examen} onChange={cambiar} error={errores.fecha_examen} />
      <Campo as="select" id="estado" name="estado" label="Estado" value={f.estado} onChange={cambiar}>
        <option value="pendiente">Pendiente</option>
        <option value="disponible">Disponible</option>
      </Campo>
      <Campo as="textarea" id="resultado" name="resultado" label="Resultado (opcional)" rows={3} value={f.resultado} onChange={cambiar} className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar examen'}
        </Boton>
      </div>
    </form>
  );
}

function DocumentosExamen({ examenId, puedeSubir }) {
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
    const datos = new FormData();
    datos.append('archivo', archivo);
    try {
      await api(`/examenes/${examenId}/documentos`, { method: 'POST', form: datos });
      setOk('Documento subido correctamente.');
      setArchivo(null);
      formulario.reset();
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const bajar = async (d) => {
    setError('');
    try {
      await descargarDocumento(d.id, d.nombre_archivo);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg bg-slate-50 p-3">
      <Alerta>{error}</Alerta>
      <Alerta tipo="exito">{ok}</Alerta>
      {!docs && !error && <Cargando texto="Cargando documentos…" />}
      {docs && docs.length === 0 && <p className="text-base text-slate-700">Sin documentos.</p>}
      {docs && docs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-base">
                {d.nombre_archivo} <span className="text-slate-700">(v{d.version})</span>
              </span>
              <Boton variante="secundario" onClick={() => bajar(d)} aria-label={`Descargar ${d.nombre_archivo}`}>
                Descargar
              </Boton>
            </li>
          ))}
        </ul>
      )}
      {puedeSubir && (
        <form onSubmit={subir} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            id={`archivo-${examenId}`}
            type="file"
            label="Subir documento"
            ayuda="PDF, Word, PowerPoint, JPG o PNG. Máximo 10 MB."
            accept={ACEPTADOS}
            className="flex-1"
            onChange={(e) => setArchivo(e.target.files[0] ?? null)}
          />
          <Boton type="submit">Subir</Boton>
        </form>
      )}
    </div>
  );
}

function ItemExamen({ examen, puedeSubir }) {
  const [abierto, setAbierto] = useState(false);
  const panelId = `docs-${examen.id}`;
  return (
    <li className="rounded-lg border border-slate-300 p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{examen.tipo_examen}</h3>
          <p className="text-base text-slate-700">
            {fecha(examen.fecha_examen)} ·{' '}
            <span className={examen.estado === 'disponible' ? 'font-semibold text-green-800' : 'font-semibold text-amber-800'}>
              {examen.estado === 'disponible' ? 'Disponible' : 'Pendiente'}
            </span>
          </p>
          {examen.resultado && <p className="mt-1 text-base">{examen.resultado}</p>}
        </div>
        <Boton variante="secundario" aria-expanded={abierto} aria-controls={panelId} onClick={() => setAbierto(!abierto)}>
          {abierto ? 'Ocultar documentos' : 'Ver documentos'}
        </Boton>
      </div>
      {abierto && (
        <div id={panelId}>
          <DocumentosExamen examenId={examen.id} puedeSubir={puedeSubir} />
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
  const [mostrarForm, setMostrarForm] = useState(false);

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

  const examenCreado = (examen) => {
    setMostrarForm(false);
    setOk(`Examen "${examen.tipo_examen}" guardado correctamente.`);
    cargar();
  };

  if (error) return <Alerta>{error}</Alerta>;
  if (!paciente) return <Cargando />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">{paciente.nombre}</h1>

      <Tarjeta titulo="Datos del paciente">
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
            <dd>{fecha(paciente.fecha_nacimiento)}</dd>
          </div>
        </dl>
      </Tarjeta>

      <Tarjeta
        titulo="Gestión de Exámenes"
        acciones={
          puedeEditar && !mostrarForm && <Boton onClick={() => { setOk(''); setMostrarForm(true); }}>+ Nuevo examen</Boton>
        }
      >
        <div className="flex flex-col gap-4">
          <Alerta tipo="exito">{ok}</Alerta>
          {mostrarForm && (
            <div className="rounded-lg border border-blue-300 p-3">
              <NuevoExamen pacienteId={id} onCreado={examenCreado} />
              <Boton variante="secundario" className="mt-3" onClick={() => setMostrarForm(false)}>
                Cancelar
              </Boton>
            </div>
          )}
          {examenes.length === 0 ? (
            <p className="text-base text-slate-700">El paciente no tiene exámenes registrados.</p>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Listado de exámenes">
              {examenes.map((ex) => (
                <ItemExamen key={ex.id} examen={ex} puedeSubir={puedeEditar} />
              ))}
            </ul>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}