// Componentes base accesibles (NFR-USAB-1/2/4, WCAG 2.1 AA):
// tamaño táctil mínimo 44x44 px, etiquetas asociadas, errores anunciados a lectores de pantalla,
// contraste mínimo 4.5:1.

const ESTILOS_BOTON = {
  primario: 'bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-400',
  secundario: 'bg-white text-slate-900 border border-slate-400 hover:bg-slate-100',
  peligro: 'bg-red-700 text-white hover:bg-red-800',
};

export function Boton({ variante = 'primario', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`min-h-11 min-w-11 rounded-lg px-4 py-2 text-base font-semibold ${ESTILOS_BOTON[variante]} ${className}`}
      {...props}
    />
  );
}

export function Campo({ id, label, error, ayuda, as = 'input', className = '', ...props }) {
  const Control = as;
  const descripciones = [ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-base font-medium text-slate-800">
        {label}
        {props.required && (
          <span className="text-red-700" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      <Control
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descripciones || undefined}
        className={`min-h-11 w-full rounded-lg border px-3 py-2 text-base ${
          error ? 'border-red-700' : 'border-slate-500'
        }`}
        {...props}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-slate-700">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

const ESTILOS_ALERTA = {
  error: 'border-red-700 bg-red-50 text-red-900',
  exito: 'border-green-700 bg-green-50 text-green-900',
  info: 'border-blue-700 bg-blue-50 text-blue-900',
};

export function Alerta({ tipo = 'error', children }) {
  if (!children) return null;
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border-l-4 p-3 text-base ${ESTILOS_ALERTA[tipo]}`}
    >
      {children}
    </div>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <p role="status" className="py-4 text-base text-slate-700">
      {texto}
    </p>
  );
}

export function Tarjeta({ titulo, children, acciones }) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      {(titulo || acciones) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {titulo && <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>}
          {acciones}
        </div>
      )}
      {children}
    </section>
  );
}

// Fecha ISO -> 'AAAA-MM-DD' en hora local (para inputs type="date")
export const aFechaInput = (valor) => {
  const d = valor ? new Date(valor) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatoFecha = (valor) => new Date(valor).toLocaleDateString('es-CL');