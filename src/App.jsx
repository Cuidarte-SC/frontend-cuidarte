// Rutas de la SPA. Las rutas protegidas exigen sesión y, cuando aplica, un rol.
// El control real de acceso lo hace la API (NFR-SEG-4); esto solo ordena la navegación.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login, { rutaInicio } from './pages/Login';
import Pacientes from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Auditoria from './pages/Auditoria';

function RequiereSesion({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

function RequiereRol({ roles, children }) {
  const { usuario } = useAuth();
  return roles.includes(usuario.rol) ? children : <Navigate to={rutaInicio(usuario)} replace />;
}

function Inicio() {
  const { usuario } = useAuth();
  return <Navigate to={rutaInicio(usuario)} replace />;
}

function NoEncontrado() {
  return <h1 className="text-2xl font-bold">Página no encontrada</h1>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequiereSesion>
                <Layout />
              </RequiereSesion>
            }
          >
            <Route index element={<Inicio />} />
            <Route
              path="pacientes"
              element={
                <RequiereRol roles={['admin', 'medico']}>
                  <Pacientes />
                </RequiereRol>
              }
            />
            <Route path="pacientes/:id" element={<PacienteDetalle />} />
            <Route
              path="auditoria"
              element={
                <RequiereRol roles={['admin']}>
                  <Auditoria />
                </RequiereRol>
              }
            />
            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}