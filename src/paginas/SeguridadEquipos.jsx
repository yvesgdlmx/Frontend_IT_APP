import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiHelpCircle, FiRefreshCw, FiShield, FiX } from "react-icons/fi";
import Modal from "react-modal";
import clienteAxios from "../config/clienteAxios.jsx";
import ToastMensaje from "../components/ui/ToastMensaje";

Modal.setAppElement("#root");

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const estadoClase = {
  vigente: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  no_revisado: "border-slate-200 bg-slate-50 text-slate-700",
  no_aplica: "border-sky-200 bg-sky-50 text-sky-700",
};

const etiqueta = (valor) => String(valor || "").replace(/_/g, " ");

const SeguridadEquipos = () => {
  const [periodo, setPeriodo] = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [revision, setRevision] = useState(null);
  const [cierres, setCierres] = useState([]);
  const [comentario, setComentario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const cargarRevision = async () => {
    setCargando(true);
    try {
      const { data } = await clienteAxios.get(`/seguridad-equipos/revision?anio=${periodo.anio}&mes=${periodo.mes}`);
      setRevision(data);
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.response?.data?.error || "No fue posible cargar la revision." });
    } finally {
      setCargando(false);
    }
  };

  const cargarCierres = async () => {
    try {
      const { data } = await clienteAxios.get(`/seguridad-equipos/cierres?anio=${periodo.anio}`);
      setCierres(Array.isArray(data) ? data : []);
    } catch (error) {
      setCierres([]);
    }
  };

  useEffect(() => {
    cargarRevision();
    cargarCierres();
  }, [periodo]);

  const resumen = useMemo(
    () => ({
      total: revision?.totalEquipos || 0,
      vigentes: revision?.vigentes || 0,
      pendientes: revision?.pendientes || 0,
      noRevisados: revision?.noRevisados || 0,
      noAplica: revision?.noAplica || 0,
      kpi: Number(revision?.porcentajeVigencia || 0),
    }),
    [revision]
  );

  const cambiarPeriodo = (campo, valor) => {
    setPeriodo((prev) => ({ ...prev, [campo]: Number(valor) }));
    setComentario("");
  };

  const actualizarRevision = async (item, cambios) => {
    try {
      const { data } = await clienteAxios.patch(`/seguridad-equipos/revision/${item.id}`, {
        estado: cambios.estado ?? item.estado,
        observacion: cambios.observacion ?? item.observacion,
      });

      setRevision((prev) => {
        const revisiones = prev.revisiones.map((revisionItem) =>
          revisionItem.id === data.id
            ? { ...revisionItem, estado: data.estado, observacion: data.observacion || "" }
            : revisionItem
        );
        const totalEquipos = revisiones.length;
        const vigentes = revisiones.filter((rev) => rev.estado === "vigente").length;
        const pendientes = revisiones.filter((rev) => rev.estado === "pendiente").length;
        const noRevisados = revisiones.filter((rev) => rev.estado === "no_revisado").length;
        const noAplica = revisiones.filter((rev) => rev.estado === "no_aplica").length;
        const porcentajeVigencia = totalEquipos ? Number(((vigentes / totalEquipos) * 100).toFixed(2)) : 0;

        return { ...prev, revisiones, totalEquipos, vigentes, pendientes, noRevisados, noAplica, porcentajeVigencia };
      });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.response?.data?.error || "No fue posible actualizar el equipo." });
    }
  };

  const guardarCierre = async () => {
    setGuardando(true);
    try {
      const { data } = await clienteAxios.post("/seguridad-equipos/cierres", { ...periodo, comentario });
      setCierres((prev) => {
        const sinActual = prev.filter((item) => !(item.anio === data.anio && item.mes === data.mes));
        return [...sinActual, data].sort((a, b) => a.mes - b.mes);
      });
      setMensaje({ tipo: "success", texto: "Cierre mensual de seguridad guardado correctamente." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.response?.data?.error || "No fue posible guardar el cierre." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">KPI seguridad</div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">Seguridad de equipos</h1>
                <p className="mt-2 text-sm text-slate-500">Revisa mensualmente equipos con actualizaciones de seguridad vigentes.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[110px_160px_auto_auto]">
                <input type="number" min="2000" max="2100" value={periodo.anio} onChange={(e) => cambiarPeriodo("anio", e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                <select value={periodo.mes} onChange={(e) => cambiarPeriodo("mes", e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                  {meses.map((mes, index) => <option key={mes} value={index + 1}>{mes}</option>)}
                </select>
                <button type="button" onClick={cargarRevision} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><FiRefreshCw size={16} />Actualizar</button>
                <button type="button" onClick={() => setAyudaAbierta(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><FiHelpCircle size={16} />Ayuda</button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-6">
            {[["Total", resumen.total], ["Vigentes", resumen.vigentes], ["Pendientes", resumen.pendientes], ["No revisados", resumen.noRevisados], ["No aplica", resumen.noAplica], ["KPI", `${resumen.kpi.toFixed(2)}%`]].map(([label, valor]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{valor}</p>
              </div>
            ))}
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[0.68fr_0.32fr]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <p className="text-base font-semibold text-slate-900">Revision por equipo</p>
                <p className="mt-1 text-sm text-slate-500">{meses[periodo.mes - 1]} {periodo.anio}</p>
              </div>
              <div className="p-5 sm:p-6">
                <div className="max-h-[520px] overflow-auto rounded-3xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                      <tr>
                        <th className="px-4 py-4 text-left">Equipo</th>
                        <th className="px-4 py-4 text-left">Estado</th>
                        <th className="px-4 py-4 text-left">Observacion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cargando ? (
                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-500">Cargando revision...</td></tr>
                      ) : (revision?.revisiones || []).length === 0 ? (
                        <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-500">Sin equipos registrados.</td></tr>
                      ) : (
                        revision.revisiones.map((item) => (
                          <tr key={item.id} className="transition hover:bg-slate-50/80">
                            <td className="px-4 py-4">
                              <p className="font-semibold text-slate-900">{item.dispositivo?.nombreSistema || "Equipo"}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.dispositivo?.marca || "-"} · {item.dispositivo?.usuarioActual || "Sin usuario"}</p>
                            </td>
                            <td className="px-4 py-4">
                              <select value={item.estado} onChange={(e) => actualizarRevision(item, { estado: e.target.value })} className={`rounded-2xl border px-3 py-2 text-xs font-semibold capitalize outline-none ${estadoClase[item.estado] || estadoClase.no_revisado}`}>
                                <option value="vigente">Vigente</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="no_revisado">No revisado</option>
                                <option value="no_aplica">No aplica</option>
                              </select>
                            </td>
                            <td className="px-4 py-4">
                              <input defaultValue={item.observacion || ""} onBlur={(e) => actualizarRevision(item, { observacion: e.target.value })} placeholder="Opcional" className="w-full min-w-60 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white"><FiShield /></div>
                  <div>
                    <p className="font-semibold text-slate-900">Cierre mensual</p>
                    <p className="text-sm text-slate-500">Guarda el resultado del mes.</p>
                  </div>
                </div>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={4} placeholder="Comentario opcional" className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                <button type="button" onClick={guardarCierre} disabled={guardando} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  <FiCheck size={16} />{guardando ? "Guardando..." : "Guardar cierre"}
                </button>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">Historial del año</p>
                <div className="mt-4 max-h-64 overflow-auto">
                  {cierres.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Sin cierres guardados.</p> : cierres.map((cierre) => (
                    <div key={cierre.id} className="border-b border-slate-100 py-3 last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{meses[cierre.mes - 1]} {cierre.anio}</p>
                        <p className="text-sm font-semibold text-slate-900">{Number(cierre.porcentajeVigencia || 0).toFixed(2)}%</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{cierre.vigentes}/{cierre.totalEquipos} vigentes</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>

      <Modal isOpen={ayudaAbierta} onRequestClose={() => setAyudaAbierta(false)} overlayClassName="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white outline-none shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FiShield size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Guia de revision de seguridad</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Usa estos criterios para decidir si un equipo cuenta como vigente en el KPI mensual.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setAyudaAbierta(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900" title="Cerrar" aria-label="Cerrar ayuda">
              <FiX />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-104px)] overflow-auto p-5 sm:p-6">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Un equipo debe marcarse como vigente cuando:</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Sistema operativo con parches de seguridad instalados.",
                "Antivirus o EDR activo, actualizado y sin alertas criticas.",
                "Definiciones de seguridad recientes.",
                "Navegador principal actualizado.",
                "Sin reinicio pendiente por actualizaciones criticas.",
                "Sin alertas visibles que requieran accion inmediata.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <FiCheck size={14} />
                  </span>
                  <p className="text-sm leading-5 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Vigente", "Usalo cuando el equipo ya fue revisado y no tiene pendientes criticos.", "border-emerald-200 bg-emerald-50 text-emerald-700"],
              ["Pendiente", "Usalo si hay parches, reinicio, antivirus o alertas por resolver.", "border-amber-200 bg-amber-50 text-amber-700"],
              ["No revisado", "Usalo cuando aun no pudiste validar el estado real del equipo.", "border-slate-200 bg-slate-50 text-slate-700"],
              ["No aplica", "Usalo solo si el equipo no debe entrar en la revision del mes.", "border-sky-200 bg-sky-50 text-sky-700"],
            ].map(([titulo, descripcion, clase]) => (
              <div key={titulo} className="rounded-3xl border border-slate-200 bg-white p-4">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${clase}`}>
                  {titulo}
                </span>
                <p className="mt-3 text-sm leading-6 text-slate-600">{descripcion}</p>
              </div>
            ))}
          </section>

          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Recomendacion para el cierre</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Antes de guardar el cierre mensual, procura que la mayoria de equipos esten en Vigente, Pendiente o No aplica.
              Si quedan muchos equipos como No revisado, el KPI puede verse bajo porque el asesor podria interpretarlo como falta de control.
            </p>
          </section>
        </div>
      </Modal>

      <ToastMensaje abierto={Boolean(mensaje.texto)} tipo={mensaje.tipo || "info"} texto={mensaje.texto} onClose={() => setMensaje({ tipo: "", texto: "" })} />
    </>
  );
};

export default SeguridadEquipos;
