import { useEffect, useMemo, useState } from "react";
import { FiArchive, FiCheck, FiRefreshCw } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import ToastMensaje from "../components/ui/ToastMensaje";

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const InventarioEquipos = () => {
  const [periodo, setPeriodo] = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [detalle, setDetalle] = useState([]);
  const [comentario, setComentario] = useState("");
  const [cierres, setCierres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const resumen = useMemo(() => {
    const normalizado = detalle.map((item) => ({
      ...item,
      registrados: Number(item.registrados || 0),
      totalOperacion: Math.max(Number(item.totalOperacion || 0), Number(item.registrados || 0)),
    }));
    const totalRegistrados = normalizado.reduce((acc, item) => acc + item.registrados, 0);
    const totalOperacion = normalizado.reduce((acc, item) => acc + item.totalOperacion, 0);
    const faltantes = normalizado.reduce((acc, item) => acc + Math.max(item.totalOperacion - item.registrados, 0), 0);
    const porcentajeInventario = totalOperacion ? Number(((totalRegistrados / totalOperacion) * 100).toFixed(2)) : 0;

    return { totalRegistrados, totalOperacion, faltantes, porcentajeInventario };
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
          ? { ...item, totalOperacion: Math.max(Number(valor || 0), Number(item.registrados || 0)) }
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
                <p className="mt-2 text-sm text-slate-500">Compara equipos registrados en el sistema contra equipos reales en operacion.</p>
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

          <section className="grid gap-3 sm:grid-cols-4">
            {[["Registrados", resumen.totalRegistrados], ["En operacion", resumen.totalOperacion], ["Faltantes", resumen.faltantes], ["KPI", `${resumen.porcentajeInventario.toFixed(2)}%`]].map(([label, valor]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{valor}</p>
              </div>
            ))}
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[0.66fr_0.34fr]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <p className="text-base font-semibold text-slate-900">Inventario por categoria</p>
                <p className="mt-1 text-sm text-slate-500">Captura el total real de equipos en operacion detectados por categoria.</p>
              </div>
              <div className="p-5 sm:p-6">
                <div className="max-h-[520px] overflow-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                      <tr>
                        <th className="px-4 py-4 text-left">Categoria</th>
                        <th className="px-4 py-4 text-left">Registrados</th>
                        <th className="px-4 py-4 text-left">En operacion</th>
                        <th className="px-4 py-4 text-left">Faltantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Cargando inventario...</td></tr>
                      ) : detalle.length === 0 ? (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Sin categorias disponibles.</td></tr>
                      ) : detalle.map((item) => (
                        <tr key={item.id} className="transition hover:bg-slate-50/80">
                          <td className="px-4 py-4 font-semibold text-slate-900">{item.nombre}</td>
                          <td className="px-4 py-4 text-slate-700">{item.registrados}</td>
                          <td className="px-4 py-4">
                            <input type="number" min={item.registrados} value={item.totalOperacion} onChange={(e) => actualizarTotal(item.id, e.target.value)} className="w-32 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                          </td>
                          <td className="px-4 py-4 text-slate-700">{Math.max(Number(item.totalOperacion || 0) - Number(item.registrados || 0), 0)}</td>
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
      <ToastMensaje abierto={Boolean(mensaje.texto)} tipo={mensaje.tipo || "info"} texto={mensaje.texto} onClose={() => setMensaje({ tipo: "", texto: "" })} />
    </>
  );
};

export default InventarioEquipos;
