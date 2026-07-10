import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  KeyRound,
  Users,
  Laptop,
  Shield,
  CalendarClock,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  NotebookTabs,
  UserPlus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const menu = [
  {
    section: "General",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", exact: true },
      { name: "Mi espacio", icon: NotebookTabs, path: "/dashboard/mi-espacio" },
      { name: "Agenda TI", icon: CalendarDays, path: "/dashboard/agenda" }
    ]
  },
  {
    section: "Licencias",
    items: [
      { name: "Cuentas 365", icon: Users, path: "/dashboard/cuentas365" },
      { name: "Licencias", icon: KeyRound, path: "/dashboard/licencias" },
      { name: "Vencimientos", icon: CalendarClock, path: "/dashboard/vencimientos" }
    ]
  },
  {
    section: "Infraestructura",
    items: [
      { name: "Dispositivos", icon: Laptop, path: "/dashboard/dispositivos" }
    ]
  },
  {
    section: "Seguridad",
    items: [
      { name: "Credenciales", icon: Shield, path: "/dashboard/credenciales" }
    ]
  },
  {
    section: "Sistema",
    items: [
      { name: "Reportes", icon: BarChart3, path: "/dashboard/reportes" },
      { name: "Usuarios", icon: UserPlus, path: "/dashboard/usuarios", adminOnly: true },
      { name: "Configuracion", icon: Settings, path: "/dashboard/configuracion" }
    ]
  }
];

const Sidebar = () => {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();
  const inicial = usuario?.nombre?.trim()?.charAt(0)?.toUpperCase() || "A";

  const cerrarSesion = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <aside className="w-20 sm:w-56 lg:w-64 h-screen flex flex-col bg-slate-800 border-r border-slate-700">

  {/* LOGO */}
  <div className="h-16 flex items-center justify-center sm:justify-start px-2 sm:px-6 border-b border-slate-700">
    <div className="hidden min-w-0 sm:block">
      <p className="text-sm font-semibold tracking-normal text-white">
        TI CONTROL
      </p>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
        Control interno
      </p>
    </div>
  </div>

  {/* MENU */}
  <nav className="flex-1 px-2 sm:px-4 py-4 space-y-4 overflow-hidden">

    {menu.map((section, i) => {
      const items = section.items.filter((item) => !item.adminOnly || usuario?.rol === "admin");

      if (items.length === 0) return null;

      return (
      <div key={i}>
        <p className="text-xs text-slate-400 mb-2 px-2 uppercase tracking-wide hidden sm:block">
          {section.section}
        </p>

        <div className="space-y-0.5">
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={index}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `group flex items-center sm:justify-between justify-center px-2 sm:px-3 py-2 rounded-md text-sm transition-all
                  ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-200 hover:bg-slate-700 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={`transition-all ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-white"
                        }`}
                      />

                      <span className="font-medium hidden sm:inline">
                        {item.name}
                      </span>
                    </div>

                    <ChevronRight
                      size={16}
                      className={`transition-all hidden sm:block ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-white"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    )})}

  </nav>

  {/* USER */}
  <div className="border-t border-slate-700/80 p-2 sm:p-4">
    <div className="flex items-center justify-center sm:justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/45 p-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sm font-semibold text-sky-200 ring-1 ring-sky-400/20">
          {inicial}
        </div>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-white">
            {usuario?.nombre || "Administrador"}
          </p>
          <p className="truncate text-xs capitalize text-slate-400">
            {usuario?.rol || "admin"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={cerrarSesion}
        title="Cerrar sesion"
        aria-label="Cerrar sesion"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut size={18} />
      </button>
    </div>
  </div>

</aside>
  );
};

export default Sidebar;
