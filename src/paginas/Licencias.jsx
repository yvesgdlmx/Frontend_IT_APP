import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiDollarSign,
  FiEdit2,
  FiKey,
  FiPlus,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ToastMensaje from "../components/ui/ToastMensaje";

const estadoInicial = {
  nombre: "",
  proveedor: "",
  categoria: "software",
  plan: "",
  cantidadTotal: 1,
  cantidadUsada: 0,
  costo: "",
  moneda: "MXN",
  fechaCompra: "",
  fechaVencimiento: "",
  renovacion: "anual",
  responsable: "",
  estado: "activa",
  notas: "",
};

const estadoClase = {
  activa: "border-emerald-200 bg-emerald-50 text-emerald-700",
  por_vencer: "border-amber-200 bg-amber-50 text-amber-700",
  vencida: "border-rose-200 bg-rose-50 text-rose-700",
  inactiva: "border-slate-200 bg-slate-100 text-slate-700",
};

const estadoLabel = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  inactiva: "Inactiva",
};

const calcularDias = (fecha) => {
  if (!fecha) return null;
  const vencimiento = new Date(`${fecha}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
};

const formatoDinero = (valor, moneda) => {
  if (valor === null || valor === undefined || valor === "") return "Sin costo";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda || "MXN",
  }).format(Number(valor));
};

const Licencias = () => {
  const [licencias, setLicencias] = useState([]);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [licenciaEditar, setLicenciaEditar] = useState(null);
  const [licenciaEliminar, setLicenciaEliminar] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const cargarLicencias = async () => {
    setCargando(true);

    try {
      const { data } = await clienteAxios.get("/licencias");
      setLicencias(Array.isArray(data) ? data : []);
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible cargar las licencias.",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLicencias();
  }, []);

  const resumen = useMemo(
    () => ({
      total: licencias.length,
      activas: licencias.filter((item) => item.estado === "activa").length,
      porVencer: licencias.filter((item) => item.estado === "por_vencer").length,
      asientos: licencias.reduce((acc, item) => acc + Number(item.cantidadTotal || 0), 0),
    }),
    [licencias]
  );

  const licenciasFiltradas = licencias.filter((item) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;

    return [
      item.nombre,
      item.proveedor,
      item.categoria,
      item.plan,
      item.responsable,
      estadoLabel[item.estado],
    ]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(termino));
  });

  const handleChange = (e) => {
    setFormulario((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const limpiarFormulario = () => {
    setFormulario(estadoInicial);
    setLicenciaEditar(null);
  };

  const guardarLicencia = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (licenciaEditar) {
        const { data } = await clienteAxios.put(`/licencias/${licenciaEditar.id}`, formulario);
        setLicencias((prev) => prev.map((item) => (item.id === data.id ? data : item)));
        setMensaje({ tipo: "success", texto: "Licencia actualizada correctamente." });
      } else {
        const { data } = await clienteAxios.post("/licencias", formulario);
        setLicencias((prev) => [data, ...prev]);
        setMensaje({ tipo: "success", texto: "Licencia registrada correctamente." });
      }

      limpiarFormulario();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible guardar la licencia.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (licencia) => {
    setLicenciaEditar(licencia);
    setFormulario({
      nombre: licencia.nombre || "",
      proveedor: licencia.proveedor || "",
      categoria: licencia.categoria || "software",
      plan: licencia.plan || "",
      cantidadTotal: licencia.cantidadTotal || 1,
      cantidadUsada: licencia.cantidadUsada || 0,
      costo: licencia.costo || "",
      moneda: licencia.moneda || "MXN",
      fechaCompra: licencia.fechaCompra || "",
      fechaVencimiento: licencia.fechaVencimiento || "",
      renovacion: licencia.renovacion || "anual",
      responsable: licencia.responsable || "",
      estado: licencia.estado || "activa",
      notas: licencia.notas || "",
    });
  };

  const confirmarEliminar = async () => {
    if (!licenciaEliminar) return;

    setEliminando(true);

    try {
      await clienteAxios.delete(`/licencias/${licenciaEliminar.id}`);
      setLicencias((prev) => prev.filter((item) => item.id !== licenciaEliminar.id));
      setLicenciaEliminar(null);
      setMensaje({ tipo: "success", texto: "Licencia eliminada correctamente." });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.error || "No fue posible eliminar la licencia.",
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Inventario de software
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  Licencias
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Administra licencias, suscripciones, renovaciones y capacidad contratada.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Activas</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.activas}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Por vencer</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.porVencer}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Asientos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{resumen.asientos}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.36fr_0.64fr]">
            <form onSubmit={guardarLicencia} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <FiKey />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {licenciaEditar ? "Editar licencia" : "Nueva licencia"}
                  </p>
                  <p className="text-sm text-slate-500">Registra software, servicios o suscripciones.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Nombre</span>
                    <input name="nombre" value={formulario.nombre} onChange={handleChange} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="Adobe, antivirus..." />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Proveedor</span>
                    <input name="proveedor" value={formulario.proveedor} onChange={handleChange} required className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="Microsoft, Google..." />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Categoria</span>
                    <input name="categoria" value={formulario.categoria} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="software" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Plan</span>
                    <input name="plan" value={formulario.plan} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" placeholder="Business, Pro..." />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total</span>
                    <input type="number" min="1" name="cantidadTotal" value={formulario.cantidadTotal} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Usadas</span>
                    <input type="number" min="0" name="cantidadUsada" value={formulario.cantidadUsada} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Costo</span>
                    <input type="number" step="0.01" name="costo" value={formulario.costo} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Moneda</span>
                    <input name="moneda" value={formulario.moneda} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vencimiento</span>
                    <input type="date" name="fechaVencimiento" value={formulario.fechaVencimiento} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Renovacion</span>
                    <select name="renovacion" value={formulario.renovacion} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="mensual">Mensual</option>
                      <option value="anual">Anual</option>
                      <option value="unica">Unica</option>
                      <option value="otro">Otro</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Estado</span>
                    <select name="estado" value={formulario.estado} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200">
                      <option value="activa">Activa</option>
                      <option value="por_vencer">Por vencer</option>
                      <option value="vencida">Vencida</option>
                      <option value="inactiva">Inactiva</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Responsable</span>
                    <input name="responsable" value={formulario.responsable} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notas</span>
                  <textarea name="notas" value={formulario.notas} onChange={handleChange} rows={3} className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200" />
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button disabled={guardando} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:opacity-70">
                    <FiPlus />
                    {guardando ? "Guardando..." : licenciaEditar ? "Guardar cambios" : "Crear licencia"}
                  </button>
                  {licenciaEditar ? (
                    <button type="button" onClick={limpiarFormulario} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Licencias registradas</p>
                    <p className="mt-1 text-sm text-slate-500">Consulta uso, costos y renovaciones.</p>
                  </div>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar licencia" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200 sm:w-80" />
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="px-4 py-4 text-left">Licencia</th>
                          <th className="px-4 py-4 text-left">Uso</th>
                          <th className="px-4 py-4 text-left">Costo</th>
                          <th className="px-4 py-4 text-left">Vencimiento</th>
                          <th className="px-4 py-4 text-left">Estado</th>
                          <th className="px-4 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {cargando ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Cargando licencias...</td>
                          </tr>
                        ) : licenciasFiltradas.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No encontramos licencias.</td>
                          </tr>
                        ) : (
                          licenciasFiltradas.map((item) => {
                            const porcentaje = (Number(item.cantidadUsada || 0) / Number(item.cantidadTotal || 1)) * 100;
                            const dias = calcularDias(item.fechaVencimiento);

                            return (
                              <tr key={item.id} className="transition hover:bg-slate-50/80">
                                <td className="px-4 py-4">
                                  <p className="font-semibold text-slate-900">{item.nombre}</p>
                                  <p className="mt-1 text-xs text-slate-500">{item.proveedor} · {item.plan || item.categoria}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex min-w-[160px] items-center gap-3">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                      <div className="h-full rounded-full bg-[linear-gradient(90deg,_#0ea5e9,_#2563eb)]" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                                    </div>
                                    <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                                      {item.cantidadUsada}/{item.cantidadTotal}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <FiDollarSign className="text-slate-400" />
                                    {formatoDinero(item.costo, item.moneda)}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <FiCalendar className="text-slate-400" />
                                    <span>{item.fechaVencimiento || "Sin fecha"}</span>
                                  </div>
                                  {dias !== null ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {dias < 0 ? `Vencio hace ${Math.abs(dias)} dias` : `${dias} dias restantes`}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoClase[item.estado] || estadoClase.activa}`}>
                                    {estadoLabel[item.estado] || "Activa"}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => abrirEditar(item)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50" title="Editar">
                                      <FiEdit2 size={15} />
                                    </button>
                                    <button onClick={() => setLicenciaEliminar(item)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" title="Eliminar">
                                      <FiTrash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        abierto={Boolean(licenciaEliminar)}
        titulo="Eliminar licencia"
        descripcion={licenciaEliminar ? `Se eliminara ${licenciaEliminar.nombre}. Esta accion no se puede deshacer.` : ""}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => {
          if (eliminando) return;
          setLicenciaEliminar(null);
        }}
      />

      <ToastMensaje
        abierto={Boolean(mensaje.texto)}
        tipo={mensaje.tipo || "info"}
        texto={mensaje.texto}
        onClose={() => setMensaje({ tipo: "", texto: "" })}
      />
    </>
  );
};

export default Licencias;
