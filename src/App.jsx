import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import LayoutProtegido from './layouts/LayoutProtegido'

import Login from './paginas/Login'
import Cuentas365 from './paginas/Cuentas365'
import Dashboard from './paginas/Dashboard'
import Dispositivos from './paginas/Dispositivos'

function App() {
  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Login />} />
        </Route>

        {/* APP */}
        <Route path="/dashboard" element={<LayoutProtegido />}>
          <Route index element={<Dashboard />} />
          <Route path="cuentas365" element={<Cuentas365 />} />
          <Route path="dispositivos" element={<Dispositivos />} />
        </Route>

      </Routes>
    </Router>
  )
}

export default App
