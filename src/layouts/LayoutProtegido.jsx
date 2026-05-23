import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const LayoutProtegido = () => {
  const { autenticado, cargandoAuth } = useAuth();

  if (cargandoAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Validando sesion...
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-[#f5f7fd] overflow-hidden">
      
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default LayoutProtegido;
