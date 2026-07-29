import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiCheck, FiInfo, FiRefreshCw } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import ToastMensaje from "../components/ui/ToastMensaje";

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const tarjetasResumen = [
  ["Registrados", "totalRegistrados"],
  ["En operacion", "totalEnOperacion"],
  ["Resguardo", "totalResguardo"],
  ["Mantenimiento", "totalMantenimiento"],
  ["Baja", "totalBaja"],
  ["Real operacion", "totalOperacion"],
  ["Faltantes", "faltantes"],
  ["KPI", "porcentajeInventario"],
];

const InventarioEquipos = () => {
  const [periodo, setPeriodo] = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [detalle, setDetalle] = useState([]);
  const [comentario, setComentario] = useState("");
  const [cierres, setCierres] = useState([]);
  const [vistaDetalle, setVistaDetalle] = useState("kpi");
  const [formulaAbierta, setFormulaAbierta] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const resumen = useMemo(() => {
    const normalizado = detalle.map((item) => ({
      ...item,
      registrados: Number(item.registrados || 0),
      operacion: Number(item.operacion || 0),
      resguardo: Number(item.resguardo || 0),
      mantenimiento: Number(item.mantenimiento || 0),
      baja: Number(item.baja || 0),
      totalOperacion: Math.max(Number(item.totalOperacion || 0), Number(item.operacion || 0)),
    }));
    const totalRegistrados = normalizado.reduce((acc, item) => acc + item.registrados, 0);
    const totalEnOperacion = normalizado.reduce((acc, item) => acc + item.operacion, 0);
    const totalResguardo = normalizado.reduce((acc, item) => acc + item.resguardo, 0);
    const totalMantenimiento = normalizado.reduce((acc, item) => acc + item.mantenimiento, 0);
    const totalBaja = normalizado.reduce((acc, item) => acc + item.baja, 0);
    const totalOperacion = normalizado.reduce((acc, item) => acc + item.totalOperacion, 0);
    const faltantes = normalizado.reduce((acc, item) => acc + Math.max(item.totalOperacion - item.operacion, 0), 0);
    const porcentajeInventario = totalOperacion ? Number(((totalRegistrados / totalOperacion) * 100).toFixed(2)) : 0;

    return {
      totalRegistrados,
      totalEnOperacion,
      totalResguardo,
      totalMantenimiento,
      totalBaja,
      totalOperacion,
      faltantes,
      porcentajeInventario,
    };
  }, [detalle]);

  const cargarPreview = async () => {
    setCargando(true);
    try {
      const { data } = await clienteAxios.get(`/inventario-equipos/preview?anio=${periodo.anio}&mes=${periodo.mes}`);
      setDetalle(Array.isArray(data.detalle) ? data.detalle : []);
      setComentario(data.comentario || "");
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.response?.data?.error || "No fue posible cargar el inventario." });
    } finally {
      setCargando(false);
    }
  };

  const cargarCierres = async () => {
    try {
      const { data } = await clienteAxios.get(`/inventario-equipos/cierres?anio=${periodo.anio}`);
      setCierres(Array.isArray(data) ? data : []);
    } catch (error) {
      setCierres([]);
    }
  };

  useEffect(() => {
    cargarPreview();
    cargarCierres();
  }, [periodo]);

  const cambiarPeriodo = (campo, valor) => {
    setPeriodo((prev) => ({ ...prev, [campo]: Number(valor) }));
  };

  const actualizarTotal = (id, valor) => {
    setDetalle((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, totalOperacion: Math.max(Number(valor || 0), Number(item.operacion || 0)) }
          : item
      )
    );
  };

  const guardarCierre = async () => {
    setGuardando(true);
    try {
      const { data } = await clienteAxios.post("/inventario-equipos/cierres", {
        ...periodo,
        detalle,
        comentario,
      });
      setCierres((prev) => {
        const sinActual = prev.filter((item) => !(item.anio === data.anio && item.mes === data.mes));
        return [...sinActual, data].sort((a, b) => a.mes - b.mes);
      });
      setMensaje({ tipo: "success", texto: "Cierre mensual de inventario guardado correctamente." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.response?.data?.error || "No fue posible guardar el cierre." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">KPI inventario</div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">Equipos tecnologicos inventariados</h1>
                <p className="mt-2 text-sm text-slate-500">Consulta equipos registrados por estado y compara los activos en operacion contra los equipos reales detectados.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[110px_160px_auto]">
                <input type="number" min="2000" max="2100" value={periodo.anio} onChange={(e) => cambiarPeriodo("anio", e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                <select value={periodo.mes} onChange={(e) => cambiarPeriodo("mes", e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                  {meses.map((mes, index) => <option key={mes} value={index + 1}>{mes}</option>)}
                </select>
                <button type="button" onClick={cargarPreview} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><FiRefreshCw size={16} />Actualizar</button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tarjetasResumen.map(([label, campo]) => {
              const valor = campo === "porcentajeInventario"
                ? `${resumen.porcentajeInventario.toFixed(2)}%`
                : resumen[campo];

              return (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  {campo === "porcentajeInventario" ? (
                    <button
                      type="button"
                      onClick={() => setFormulaAbierta(true)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-slate-900 hover:text-white"
                      title="Ver formula KPI"
                      aria-label="Ver formula KPI"
                    >
                      <FiInfo size={15} />
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{valor}</p>
              </div>
              );
            })}
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[0.66fr_0.34fr]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Inventario por categoria</p>
                    <p className="mt-1 text-sm text-slate-500">Revisa los equipos registrados por estado y captura el total real de equipos en operacion detectados por categoria.</p>
                  </div>
                  <div className="inline-flex rounded-[22px] border border-slate-200 bg-white p-1 shadow-sm shadow-slate-200/80 ring-1 ring-slate-100">
                    {[
                      ["kpi", "KPI operativo"],
                      ["estados", "Estados"],
                    ].map(([valor, label]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() => setVistaDetalle(valor)}
                        className={`relative rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          vistaDetalle === valor
                            ? "bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] text-white shadow-lg shadow-slate-900/20"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="max-h-[520px] overflow-y-auto rounded-3xl border border-slate-200 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                      <tr>
                        <th className="px-4 py-4 text-left">Categoria</th>
                        <th className="px-4 py-4 text-left">Registrados</th>
                        {vistaDetalle === "kpi" ? (
                          <>
                            <th className="px-4 py-4 text-left">Operacion sistema</th>
                            <th className="px-4 py-4 text-left">Real operacion</th>
                            <th className="px-4 py-4 text-left">Faltantes</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-4 text-left">Operacion</th>
                            <th className="px-4 py-4 text-left">Resguardo</th>
                            <th className="px-4 py-4 text-left">Mantenimiento</th>
                            <th className="px-4 py-4 text-left">Baja</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr><td colSpan={vistaDetalle === "kpi" ? 5 : 6} className="px-6 py-12 text-center text-slate-500">Cargando inventario...</td></tr>
                      ) : detalle.length === 0 ? (
                        <tr><td colSpan={vistaDetalle === "kpi" ? 5 : 6} className="px-6 py-12 text-center text-slate-500">Sin categorias disponibles.</td></tr>
                      ) : detalle.map((item) => (
                        <tr key={item.id} className="transition hover:bg-slate-50/80">
                          <td className="px-4 py-4 font-semibold text-slate-900">{item.nombre}</td>
                          <td className="px-4 py-4 text-slate-700">{item.registrados}</td>
                          {vistaDetalle === "kpi" ? (
                            <>
                              <td className="px-4 py-4 text-slate-700">{item.operacion || 0}</td>
                              <td className="px-4 py-4">
                                <input type="number" min={item.operacion || 0} value={item.totalOperacion} onChange={(e) => actualizarTotal(item.id, e.target.value)} className="w-32 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                              </td>
                              <td className="px-4 py-4 text-slate-700">{Math.max(Number(item.totalOperacion || 0) - Number(item.operacion || 0), 0)}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 text-slate-700">{item.operacion || 0}</td>
                              <td className="px-4 py-4 text-slate-700">{item.resguardo || 0}</td>
                              <td className="px-4 py-4 text-slate-700">{item.mantenimiento || 0}</td>
                              <td className="px-4 py-4 text-slate-700">{item.baja || 0}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white"><FiArchive /></div>
                  <div>
                    <p className="font-semibold text-slate-900">Cierre mensual</p>
                    <p className="text-sm text-slate-500">Guarda el porcentaje del mes.</p>
                  </div>
                </div>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={4} placeholder="Comentario opcional" className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                <button type="button" onClick={guardarCierre} disabled={guardando} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  <FiCheck size={16} />{guardando ? "Guardando..." : "Guardar cierre"}
                </button>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">Historial del anio</p>
                <div className="mt-4 max-h-64 overflow-auto">
                  {cierres.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Sin cierres guardados.</p> : cierres.map((cierre) => (
                    <div key={cierre.id} className="border-b border-slate-100 py-3 last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{meses[cierre.mes - 1]} {cierre.anio}</p>
                        <p className="text-sm font-semibold text-slate-900">{Number(cierre.porcentajeInventario || 0).toFixed(2)}%</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{cierre.totalRegistrados}/{cierre.totalOperacion} registrados</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
      {formulaAbierta ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => setFormulaAbierta(false)} />

          <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
            <button
              type="button"
              onClick={() => setFormulaAbierta(false)}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-500 shadow-sm shadow-slate-200/80 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-rose-100"
              aria-label="Cerrar formula KPI"
            >
              ×
            </button>

            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_#f8fafc,_#ffffff)] px-6 py-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FiInfo size={18} />
              </div>
              <h2 className="mt-4 pr-12 text-2xl font-semibold text-slate-900">Formula del KPI</h2>
              <p className="mt-2 text-sm text-slate-500">
                Este indicador compara el inventario registrado contra los equipos que realmente estan en operacion.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formula usada</p>
                <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold text-slate-800 shadow-inner shadow-slate-200/60 sm:text-base">
                  Equipos registrados en inventario / Total de equipos en operacion × 100
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Registrados</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.totalRegistrados}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Real operacion</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.totalOperacion}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Resultado</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.porcentajeInventario.toFixed(2)}%</p>
                </div>
              </div>

              <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Interpretacion: 100% significa equilibrio entre inventario y operacion. Arriba de 100% indica que hay mas equipos registrados que equipos actualmente operando. Debajo de 100% puede indicar faltantes o equipos operando sin registro completo.
              </p>

            </div>
          </div>
        </div>
      ) : null}
      <ToastMensaje abierto={Boolean(mensaje.texto)} tipo={mensaje.tipo || "info"} texto={mensaje.texto} onClose={() => setMensaje({ tipo: "", texto: "" })} />
    </>
  );
};

export default InventarioEquipos;
