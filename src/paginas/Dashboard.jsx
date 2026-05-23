import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiKey,
  FiMonitor,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import { useAuth } from "../context/AuthContext";

const MS_DIA = 1000 * 60 * 60 * 24;

const diasParaVencer = (fecha) => {
  if (!fecha) return null;

  const vencimiento = new Date(`${fecha.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(vencimiento.getTime())) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return Math.ceil((vencimiento - hoy) / MS_DIA);
};

const formatearDias = (dias) => {
  if (dias === null) return "Sin fecha";
  if (dias < 0) return `Hace ${Math.abs(dias)} dias`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Manana";
  return `${dias} dias`;
};

const obtenerCuentasLineales = (cuentas = []) =>
  cuentas.flatMap((cuenta) => [
    {
      id: cuenta.id,
      correo: cuenta.correo,
      tipo: "Padre",
      familia: cuenta.correo,
      fechaVencimiento: cuenta.fechaVencimiento,
      dispositivos: Array.isArray(cuenta.dispositivos) ? cuenta.dispositivos.length : 0,
    },
    ...(Array.isArray(cuenta.hijas)
      ? cuenta.hijas.map((hija) => ({
          id: hija.id,
          correo: hija.correo,
          tipo: "Hija",
          familia: cuenta.correo,
          fechaVencimiento: hija.fechaVencimiento,
          dispositivos: Array.isArray(hija.dispositivos) ? hija.dispositivos.length : 0,
        }))
      : []),
  ]);

const estadoVencimiento = (dias) => {
  if (dias === null) return "sin_fecha";
  if (dias < 0) return "vencida";
  if (dias <= 7) return "critica";
  if (dias <= 30) return "proxima";
  return "vigente";
};

const Dashboard = () => {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState({
    cuentas: [],
    dispositivos: [],
    credenciales: [],
    licencias: [],
    trabajo: [],
  });
  const [cargando, setCargando] = useState(true);

  const cargarDashboard = async () => {
    setCargando(true);

    const solicitudes = await Promise.allSettled([
      clienteAxios.get("/cuentas/padre"),
      clienteAxios.get("/dispositivos"),
      clienteAxios.get("/credenciales"),
      clienteAxios.get("/licencias"),
      clienteAxios.get("/trabajo"),
    ]);

    const [cuentas, dispositivos, credenciales, licencias, trabajo] = solicitudes.map((resultado) =>
      resultado.status === "fulfilled" && Array.isArray(resultado.value.data)
        ? resultado.value.data
        : []
    );

    setDatos({
      cuentas,
      dispositivos,
      credenciales,
      licencias,
      trabajo,
    });
    setCargando(false);
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const metricas = useMemo(() => {
    const cuentasLineales = obtenerCuentasLineales(datos.cuentas);
    const vencimientos = cuentasLineales
      .map((cuenta) => {
        const dias = diasParaVencer(cuenta.fechaVencimiento);
        return {
          ...cuenta,
          dias,
          estado: estadoVencimiento(dias),
        };
      })
      .sort((a, b) => (a.dias ?? Number.MAX_SAFE_INTEGER) - (b.dias ?? Number.MAX_SAFE_INTEGER));

    const actividadesPendientes = datos.trabajo.filter(
      (item) => item.tipo === "actividad" && item.estado !== "completada"
    );

    const licenciasPorVencer = datos.licencias.filter((licencia) => {
      const dias = diasParaVencer(licencia.fechaVencimiento);
      return dias !== null && dias >= 0 && dias <= 30;
    });

    return {
      cuentasLineales,
      vencimientos,
      vencidas: vencimientos.filter((item) => item.estado === "vencida").length,
      criticas: vencimientos.filter((item) => item.estado === "critica").length,
      proximas: vencimientos.filter((item) => item.estado === "proxima").length,
      actividadesPendientes,
      licenciasPorVencer,
      dispositivosRecientes: [...datos.dispositivos]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
      credencialesPorCategoria: datos.credenciales.reduce((acc, item) => {
        const categoria = item.categoria || "otros";
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [datos]);

  const resumen = [
    {
      label: "Cuentas",
      valor: metricas.cuentasLineales.length,
      icon: FiUsers,
      to: "/dashboard/cuentas365",
    },
    {
      label: "Dispositivos",
      valor: datos.dispositivos.length,
      icon: FiMonitor,
      to: "/dashboard/dispositivos",
    },
    {
      label: "Licencias",
      valor: datos.licencias.length,
      icon: FiKey,
      to: "/dashboard/licencias",
    },
    {
      label: "Credenciales",
      valor: datos.credenciales.length,
      icon: FiShield,
      to: "/dashboard/credenciales",
    },
  ];

  const maxResumen = Math.max(...resumen.map((item) => item.valor), 1);

  const alertas = [
    {
      titulo: "Cuentas vencidas",
      valor: metricas.vencidas,
      detalle: "Requieren atencion inmediata",
      color: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    {
      titulo: "Criticas a 7 dias",
      valor: metricas.criticas,
      detalle: "Renovar o revisar pronto",
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      titulo: "Licencias a 30 dias",
      valor: metricas.licenciasPorVencer.length,
      detalle: "Suscripciones proximas",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Centro de control
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                Dashboard operativo
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Hola {usuario?.nombre || "Administrador"}, aqui tienes el estado general de TI CONTROL.
              </p>
            </div>

            <button
              onClick={cargarDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiClock size={16} />
              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {resumen.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={item.to}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <Icon className="text-slate-400" size={18} />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{item.valor}</p>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.68fr_0.32fr]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Alertas principales</p>
                  <p className="mt-1 text-sm text-slate-500">Prioridades que conviene revisar hoy.</p>
                </div>
                <Link
                  to="/dashboard/vencimientos"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver vencimientos
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.titulo}
                    className={`rounded-2xl border ${alerta.border} ${alerta.bg} px-4 py-4`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${alerta.color}`}>{alerta.titulo}</p>
                      <FiAlertTriangle className={alerta.color} />
                    </div>
                    <p className={`mt-3 text-3xl font-semibold ${alerta.color}`}>{alerta.valor}</p>
                    <p className="mt-1 text-xs text-slate-500">{alerta.detalle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Proximos vencimientos</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Cuentas ordenadas por urgencia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4 text-left">Cuenta</th>
                        <th className="px-4 py-4 text-left">Familia</th>
                        <th className="px-4 py-4 text-left">Restante</th>
                        <th className="px-4 py-4 text-left">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {metricas.vencimientos.slice(0, 6).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                            No hay vencimientos registrados.
                          </td>
                        </tr>
                      ) : (
                        metricas.vencimientos.slice(0, 6).map((item) => (
                          <tr key={`${item.tipo}-${item.id}`} className="transition hover:bg-slate-50/80">
                            <td className="px-4 py-4 font-semibold text-slate-900">{item.correo}</td>
                            <td className="px-4 py-4 text-slate-600">{item.familia}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                  item.estado === "vencida"
                                    ? "border-rose-200 bg-rose-50 text-rose-700"
                                    : item.estado === "critica"
                                      ? "border-orange-200 bg-orange-50 text-orange-700"
                                      : item.estado === "proxima"
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {formatearDias(item.dias)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{item.tipo}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Mi trabajo pendiente</p>
                  <p className="mt-1 text-sm text-slate-500">Actividades personales abiertas.</p>
                </div>
                <Link
                  to="/dashboard/mi-espacio"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Abrir
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {metricas.actividadesPendientes.slice(0, 5).length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                    No tienes actividades pendientes.
                  </div>
                ) : (
                  metricas.actividadesPendientes.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.titulo}</p>
                      {item.fechaLimite ? (
                        <p className="mt-1 text-xs text-slate-500">{item.fechaLimite}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-base font-semibold text-slate-900">Dispositivos recientes</p>
              <p className="mt-1 text-sm text-slate-500">Ultimos equipos registrados.</p>

              <div className="mt-5 space-y-3">
                {metricas.dispositivosRecientes.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay dispositivos registrados.</p>
                ) : (
                  metricas.dispositivosRecientes.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600">
                        <FiMonitor />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.nombreSistema}</p>
                        <p className="truncate text-xs text-slate-500">{item.usuarioActual}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Distribucion del inventario</p>
                  <p className="mt-1 text-sm text-slate-500">Volumen registrado por modulo.</p>
                </div>
                <FiCalendar className="text-slate-400" size={20} />
              </div>

              <div className="mt-5 space-y-3">
                {resumen.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.valor}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a,_#334155)]"
                        style={{ width: `${Math.max((item.valor / maxResumen) * 100, item.valor > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
                </div>
              </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
