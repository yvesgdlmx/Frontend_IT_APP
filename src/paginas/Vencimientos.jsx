import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";

const MS_DIA = 1000 * 60 * 60 * 24;

const normalizarFecha = (fecha) => {
  if (!fecha) return null;
  const normalizada = new Date(`${fecha.slice(0, 10)}T00:00:00`);
  return Number.isNaN(normalizada.getTime()) ? null : normalizada;
};

const calcularDias = (fecha) => {
  const vencimiento = normalizarFecha(fecha);
  if (!vencimiento) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return Math.ceil((vencimiento - hoy) / MS_DIA);
};

const obtenerEstado = (dias) => {
  if (dias === null) {
    return {
      clave: "sin-fecha",
      label: "Sin fecha",
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      dot: "bg-slate-400",
    };
  }

  if (dias < 0) {
    return {
      clave: "vencidas",
      label: "Vencida",
      badge: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    };
  }

  if (dias <= 7) {
    return {
      clave: "criticas",
      label: "Critica",
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      dot: "bg-orange-500",
    };
  }

  if (dias <= 30) {
    return {
      clave: "proximas",
      label: "Proxima",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    clave: "vigentes",
    label: "Vigente",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  };
};

const formatearDias = (dias) => {
  if (dias === null) return "No definida";
  if (dias < 0) return `Hace ${Math.abs(dias)} dias`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Manana";
  return `${dias} dias`;
};

const transformarCuenta = (cuenta) => {
  const padre = {
    id: cuenta.id,
    correo: cuenta.correo,
    tipo: "Cuenta padre",
    familia: cuenta.correo,
    vencimiento: cuenta.fechaVencimiento?.slice(0, 10) || "",
    dispositivos: Array.isArray(cuenta.dispositivos) ? cuenta.dispositivos.length : 0,
  };

  const hijas = Array.isArray(cuenta.hijas)
    ? cuenta.hijas.map((hija) => ({
        id: hija.id,
        correo: hija.correo,
        tipo: "Cuenta hija",
        familia: cuenta.correo,
        vencimiento: hija.fechaVencimiento?.slice(0, 10) || "",
        dispositivos: Array.isArray(hija.dispositivos) ? hija.dispositivos.length : 0,
      }))
    : [];

  return [padre, ...hijas];
};

const filtros = [
  { clave: "todas", label: "Todas" },
  { clave: "vencidas", label: "Vencidas" },
  { clave: "criticas", label: "7 dias" },
  { clave: "proximas", label: "30 dias" },
  { clave: "vigentes", label: "Vigentes" },
];

const Vencimientos = () => {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const cargarCuentas = async () => {
    setCargando(true);
    setError("");

    try {
      const { data } = await clienteAxios.get("/cuentas/padre");
      const vencimientos = Array.isArray(data)
        ? data.flatMap(transformarCuenta).map((cuenta) => {
            const dias = calcularDias(cuenta.vencimiento);
            return {
              ...cuenta,
              dias,
              estado: obtenerEstado(dias),
            };
          })
        : [];

      setCuentas(
        vencimientos.sort((a, b) => {
          const diasA = a.dias ?? Number.MAX_SAFE_INTEGER;
          const diasB = b.dias ?? Number.MAX_SAFE_INTEGER;
          return diasA - diasB;
        })
      );
    } catch (error) {
      setError(error.response?.data?.error || "No fue posible cargar los vencimientos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const resumen = useMemo(
    () => ({
      total: cuentas.length,
      vencidas: cuentas.filter((cuenta) => cuenta.estado.clave === "vencidas").length,
      criticas: cuentas.filter((cuenta) => cuenta.estado.clave === "criticas").length,
      proximas: cuentas.filter((cuenta) => cuenta.estado.clave === "proximas").length,
      vigentes: cuentas.filter((cuenta) => cuenta.estado.clave === "vigentes").length,
    }),
    [cuentas]
  );

  const cuentasFiltradas = cuentas.filter((cuenta) => {
    const coincideFiltro = filtro === "todas" || cuenta.estado.clave === filtro;
    const termino = busqueda.trim().toLowerCase();

    if (!coincideFiltro) return false;
    if (!termino) return true;

    return (
      cuenta.correo.toLowerCase().includes(termino) ||
      cuenta.familia.toLowerCase().includes(termino) ||
      cuenta.tipo.toLowerCase().includes(termino)
    );
  });

  const siguiente = cuentas.find((cuenta) => cuenta.dias !== null && cuenta.dias >= 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Alertas operativas
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                Vencimientos
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Supervisa cuentas por vencer, vencidas y vigentes desde una vista priorizada.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Vencidas
                  </p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.vencidas}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    7 dias
                  </p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.criticas}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    30 dias
                  </p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.proximas}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Vigentes
                  </p>
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.vigentes}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.74fr_0.26fr]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6 xl:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">Calendario de cuentas</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ordenado por urgencia para resolver primero lo importante.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar cuenta o familia"
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 sm:w-80"
                    />
                  </div>

                  <button
                    onClick={cargarCuentas}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FiRefreshCw size={16} />
                    Actualizar
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {filtros.map((item) => (
                  <button
                    key={item.clave}
                    onClick={() => setFiltro(item.clave)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      filtro === item.clave
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6 xl:p-7">
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4 text-left">Cuenta</th>
                        <th className="px-4 py-4 text-left">Familia</th>
                        <th className="px-4 py-4 text-left">Vencimiento</th>
                        <th className="px-4 py-4 text-left">Restante</th>
                        <th className="px-4 py-4 text-left">Estado</th>
                        <th className="px-4 py-4 text-right">Accion</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                            Cargando vencimientos...
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-sm text-rose-600">
                            {error}
                          </td>
                        </tr>
                      ) : cuentasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">
                            No hay vencimientos con ese criterio.
                          </td>
                        </tr>
                      ) : (
                        cuentasFiltradas.map((cuenta) => (
                          <tr key={`${cuenta.tipo}-${cuenta.id}`} className="transition hover:bg-slate-50/80">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <span className={`h-2.5 w-2.5 rounded-full ${cuenta.estado.dot}`} />
                                <div>
                                  <p className="font-semibold text-slate-900">{cuenta.correo}</p>
                                  <p className="mt-1 text-xs text-slate-500">{cuenta.tipo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{cuenta.familia}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <FiCalendar size={15} className="text-slate-400" />
                                {cuenta.vencimiento || "Sin fecha"}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-800">
                              {formatearDias(cuenta.dias)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cuenta.estado.badge}`}>
                                {cuenta.estado.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <Link
                                to="/dashboard/cuentas365"
                                className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Gestionar
                              </Link>
                            </td>
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <FiClock size={20} />
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-900">Siguiente vencimiento</p>
              {siguiente ? (
                <>
                  <p className="mt-2 break-words text-sm text-slate-600">{siguiente.correo}</p>
                  <p className="mt-4 text-3xl font-semibold text-slate-900">
                    {formatearDias(siguiente.dias)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{siguiente.vencimiento}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No hay cuentas proximas registradas.</p>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="mt-0.5 text-amber-500" size={20} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Prioridad recomendada</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Atiende primero vencidas y criticas. Las cuentas dentro de 30 dias pueden
                    planificarse sin urgencia.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="mt-0.5 text-emerald-600" size={20} />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">Cobertura</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    {resumen.total} cuentas monitoreadas con estado de vencimiento.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Vencimientos;
