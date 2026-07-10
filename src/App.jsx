import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import LayoutProtegido from './layouts/LayoutProtegido'
import { AuthProvider } from './context/AuthContext'

import Login from './paginas/Login'
import OlvidePassword from './paginas/OlvidePassword'
import RestablecerPassword from './paginas/RestablecerPassword'
import Cuentas365 from './paginas/Cuentas365'
import Dashboard from './paginas/Dashboard'
import Dispositivos from './paginas/Dispositivos'
import Credenciales from './paginas/Credenciales'
import Configuracion from './paginas/Configuracion'
import Vencimientos from './paginas/Vencimientos'
import Agenda from './paginas/Agenda'
import EspacioTrabajo from './paginas/EspacioTrabajo'
import Usuarios from './paginas/Usuarios'
import Licencias from './paginas/Licencias'
import Reportes from './paginas/Reportes'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* LOGIN */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Login />} />
            <Route path="recuperar-password" element={<OlvidePassword />} />
            <Route path="recuperar-password/:token" element={<RestablecerPassword />} />
          </Route>

          {/* APP */}
          <Route path="/dashboard" element={<LayoutProtegido />}>
            <Route index element={<Dashboard />} />
            <Route path="cuentas365" element={<Cuentas365 />} />
            <Route path="licencias" element={<Licencias />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="vencimientos" element={<Vencimientos />} />
            <Route path="dispositivos" element={<Dispositivos />} />
            <Route path='credenciales' element={<Credenciales/>}/>
            <Route path="mi-espacio" element={<EspacioTrabajo />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="configuracion" element={<Configuracion />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
