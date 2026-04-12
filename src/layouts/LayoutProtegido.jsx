import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const LayoutProtegido = () => {
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