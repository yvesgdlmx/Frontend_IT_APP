import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  KeyRound,
  Users,
  Laptop,
  Boxes,
  Shield,
  CalendarClock,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";

const menu = [
  {
    section: "General",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", exact: true }
    ]
  },
  {
    section: "Licencias",
    items: [
      { name: "Cuentas 365", icon: Users, path: "/dashboard/cuentas365" },
      { name: "Licencias", icon: KeyRound, path: "/licencias" },
      { name: "Vencimientos", icon: CalendarClock, path: "/vencimientos" }
    ]
  },
  {
    section: "Infraestructura",
    items: [
      { name: "Dispositivos", icon: Laptop, path: "/dashboard/dispositivos" },
      { name: "Activos", icon: Boxes, path: "/activos" }
    ]
  },
  {
    section: "Seguridad",
    items: [
      { name: "Credenciales", icon: Shield, path: "/credenciales" }
    ]
  },
  {
    section: "Sistema",
    items: [
      { name: "Reportes", icon: BarChart3, path: "/reportes" },
      { name: "Configuración", icon: Settings, path: "/configuracion" }
    ]
  }
];

const Sidebar = () => {
  return (
    <aside className="w-20 sm:w-56 lg:w-64 h-screen flex flex-col bg-slate-800 border-r border-slate-700">

  {/* LOGO */}
  <div className="h-16 flex items-center justify-center sm:justify-start px-2 sm:px-6 border-b border-slate-700">
    <div className="w-10 sm:w-28 h-7 bg-slate-600 rounded-md" />
  </div>

  {/* MENU */}
  <nav className="flex-1 px-2 sm:px-4 py-4 space-y-4 overflow-hidden">

    {menu.map((section, i) => (
      <div key={i}>
        <p className="text-xs text-slate-400 mb-2 px-2 uppercase tracking-wide hidden sm:block">
          {section.section}
        </p>

        <div className="space-y-0.5">
          {section.items.map((item, index) => {
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
    ))}

  </nav>

  {/* LOGOUT */}
  <div className="px-2 sm:px-6 py-3 border-t border-slate-700">
    <button className="flex items-center justify-center sm:justify-start gap-3 text-slate-400 hover:text-red-400 text-sm transition w-full">
      <LogOut size={18} />
      <span className="hidden sm:inline">Logout</span>
    </button>
  </div>

</aside>
  );
};

export default Sidebar;
