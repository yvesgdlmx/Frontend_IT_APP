import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiKey,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";

const MS_DIA = 1000 * 60 * 60 * 24;

const diasParaVencer = (fecha) => {
  if (!fecha) return null;
  const vencimiento = new Date(`${fecha.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(vencimiento.getTime())) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((vencimiento - hoy) / MS_DIA);
};

const cuentasLineales = (cuentas = []) =>
  cuentas.flatMap((cuenta) => [
    {
      correo: cuenta.correo,
      tipo: "Padre",
      familia: cuenta.correo,
      vencimiento: cuenta.fechaVencimiento?.slice(0, 10) || "",
      dispositivos: Array.isArray(cuenta.dispositivos) ? cuenta.dispositivos.length : 0,
    },
    ...(Array.isArray(cuenta.hijas)
      ? cuenta.hijas.map((hija) => ({
          correo: hija.correo,
          tipo: "Hija",
          familia: cuenta.correo,
          vencimiento: hija.fechaVencimiento?.slice(0, 10) || "",
          dispositivos: Array.isArray(hija.dispositivos) ? hija.dispositivos.length : 0,
        }))
      : []),
  ]);

const escapeCsv = (valor) => {
  const texto = String(valor ?? "");
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
};

const textoPdf = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const truncarPdf = (valor, max = 26) => {
  const texto = String(valor ?? "");
  return texto.length > max ? `${texto.slice(0, max - 1)}...` : texto;
};

const crearPdf = (titulo, filas) => {
  const ancho = 842;
  const alto = 595;
  const margen = 42;
  const headers = Object.keys(filas[0] || {});
  const columnas = headers.slice(0, 6);
  const anchoTabla = ancho - margen * 2;
  const anchoColumna = anchoTabla / Math.max(columnas.length, 1);
  const filasPorPagina = 18;
  const paginas = [];

  for (let i = 0; i < filas.length; i += filasPorPagina) {
    paginas.push(filas.slice(i, i + filasPorPagina));
  }

  const objetos = [];
  const paginasIds = [];
  const fontRegularId = 3;
  const fontBoldId = 4;

  objetos[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objetos[2] = "";
  objetos[fontRegularId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objetos[fontBoldId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  paginas.forEach((paginaFilas, pageIndex) => {
    const pageId = 5 + pageIndex * 2;
    const contentId = pageId + 1;
    paginasIds.push(pageId);

    const comandos = [];

    comandos.push("0.96 0.98 1 rg 0 0 842 595 re f");
    comandos.push("0.06 0.09 0.16 rg 0 520 842 75 re f");
    comandos.push("0.22 0.74 0.97 rg 42 548 34 26 re f");
    comandos.push("1 1 1 rg");
    comandos.push("BT /F2 13 Tf 51 556 Td (TI) Tj ET");
    comandos.push(`BT /F2 18 Tf 92 558 Td (${textoPdf(titulo)}) Tj ET`);
    comandos.push("BT /F1 9 Tf 92 540 Td (TI CONTROL  |  Control interno) Tj ET");
    comandos.push(`BT /F1 9 Tf 650 558 Td (Generado: ${textoPdf(new Date().toLocaleDateString("es-MX"))}) Tj ET`);
    comandos.push(`BT /F1 9 Tf 650 540 Td (Pagina ${pageIndex + 1} de ${paginas.length}) Tj ET`);

    comandos.push("1 1 1 rg 42 462 758 38 re f");
    comandos.push("0.88 0.91 0.95 RG 42 462 758 38 re S");
    comandos.push("0.10 0.13 0.20 rg");
    comandos.push(`BT /F2 11 Tf 58 484 Td (${filas.length} registros exportados) Tj ET`);
    comandos.push("0.39 0.45 0.55 rg");
    comandos.push(`BT /F1 9 Tf 58 469 Td (Reporte generado desde la seccion de Reportes de TI CONTROL.) Tj ET`);

    const tablaY = 420;
    comandos.push("0.09 0.12 0.18 rg 42 420 758 28 re f");
    comandos.push("1 1 1 rg");
    columnas.forEach((columna, index) => {
      const x = margen + index * anchoColumna + 8;
      comandos.push(`BT /F2 8 Tf ${x.toFixed(2)} 430 Td (${textoPdf(columna.replace(/_/g, " ").toUpperCase()).slice(0, 18)}) Tj ET`);
    });

    paginaFilas.forEach((fila, rowIndex) => {
      const y = tablaY - 26 - rowIndex * 20;
      if (rowIndex % 2 === 0) {
        comandos.push("1 1 1 rg");
      } else {
        comandos.push("0.97 0.98 1 rg");
      }
      comandos.push(`42 ${y} 758 20 re f`);
      comandos.push("0.88 0.91 0.95 RG");
      comandos.push(`42 ${y} 758 20 re S`);
      comandos.push("0.10 0.13 0.20 rg");

      columnas.forEach((columna, index) => {
        const x = margen + index * anchoColumna + 8;
        const texto = textoPdf(truncarPdf(fila[columna], 24));
        comandos.push(`BT /F1 8 Tf ${x.toFixed(2)} ${(y + 7).toFixed(2)} Td (${texto}) Tj ET`);
      });
    });

    comandos.push("0.39 0.45 0.55 rg");
    comandos.push("BT /F1 8 Tf 42 28 Td (Documento generado automaticamente. Revise la informacion antes de compartirla.) Tj ET");

    const contenido = comandos.join("\n");

    objetos[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ancho} ${alto}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objetos[contentId] = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`;
  });

  objetos[2] = `<< /Type /Pages /Kids [${paginasIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${paginasIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objetos.forEach((objeto, index) => {
    if (!objeto) return;
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objeto}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;

  for (let i = 1; i < objetos.length; i += 1) {
    pdf += `${String(offsets[i] || 0).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

const descargarCsv = (nombre, filas) => {
  if (!filas.length) return;

  const headers = Object.keys(filas[0]);
  const contenido = [
    headers.join(","),
    ...filas.map((fila) => headers.map((header) => escapeCsv(fila[header])).join(",")),
  ].join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombre}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const descargarPdf = (nombre, titulo, filas) => {
  if (!filas.length) return;

  const pdf = crearPdf(titulo, filas);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombre}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

const Reportes = () => {
  const [datos, setDatos] = useState({
    cuentas: [],
    dispositivos: [],
    credenciales: [],
    licencias: [],
    trabajo: [],
  });
  const [cargando, setCargando] = useState(true);
  const [paginaAreas, setPaginaAreas] = useState(1);

  const cargarReportes = async () => {
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

    setDatos({ cuentas, dispositivos, credenciales, licencias, trabajo });
    setCargando(false);
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const reportes = useMemo(() => {
    const cuentas = cuentasLineales(datos.cuentas);
    const vencimientos = cuentas
      .map((cuenta) => ({
        ...cuenta,
        dias: diasParaVencer(cuenta.vencimiento),
      }))
      .sort((a, b) => (a.dias ?? Number.MAX_SAFE_INTEGER) - (b.dias ?? Number.MAX_SAFE_INTEGER));

    const cuentasVencidas = vencimientos.filter((item) => item.dias !== null && item.dias < 0);
    const cuentasPorVencer = vencimientos.filter((item) => item.dias !== null && item.dias >= 0 && item.dias <= 30);
    const licenciasPorVencer = datos.licencias.filter((item) => {
      const dias = diasParaVencer(item.fechaVencimiento);
      return dias !== null && dias >= 0 && dias <= 30;
    });
    const actividadesPendientes = datos.trabajo.filter(
      (item) => item.tipo === "actividad" && item.estado !== "completada"
    );

    return {
      cuentas,
      vencimientos,
      cuentasVencidas,
      cuentasPorVencer,
      licenciasPorVencer,
      actividadesPendientes,
      dispositivosPorArea: datos.dispositivos.reduce((acc, item) => {
        const area = item.area || "Sin area";
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {}),
      credencialesPorCategoria: datos.credenciales.reduce((acc, item) => {
        const categoria = item.categoria || "Otros";
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [datos]);

  const areasPorPagina = 5;
  const areasDispositivos = Object.entries(reportes.dispositivosPorArea);
  const totalPaginasAreas = Math.max(Math.ceil(areasDispositivos.length / areasPorPagina), 1);
  const areasVisibles = areasDispositivos.slice(
    (paginaAreas - 1) * areasPorPagina,
    paginaAreas * areasPorPagina
  );

  useEffect(() => {
    setPaginaAreas(1);
  }, [areasDispositivos.length]);

  const tarjetas = [
    { label: "Cuentas", valor: reportes.cuentas.length, icon: FiUsers },
    { label: "Dispositivos", valor: datos.dispositivos.length, icon: FiMonitor },
    { label: "Licencias", valor: datos.licencias.length, icon: FiKey },
    { label: "Credenciales", valor: datos.credenciales.length, icon: FiShield },
  ];

  const exportaciones = [
    {
      titulo: "Cuentas y vencimientos",
      descripcion: "Correos, tipo de cuenta, familia, vencimiento y dispositivos.",
      icon: FiCalendar,
      filas: reportes.vencimientos.map((item) => ({
        correo: item.correo,
        tipo: item.tipo,
        familia: item.familia,
        vencimiento: item.vencimiento,
        dias_restantes: item.dias ?? "",
        dispositivos: item.dispositivos,
      })),
      archivo: "reporte-cuentas-vencimientos",
    },
    {
      titulo: "Dispositivos",
      descripcion: "Equipo, marca, area, usuario y cuenta asignada.",
      icon: FiMonitor,
      filas: datos.dispositivos.map((item) => ({
        equipo: item.nombreSistema,
        marca: item.marca,
        tipo: item.tipoEquipo,
        area: item.area || "",
        usuario: item.usuarioActual,
        cuenta_padre: item.cuentaPadre?.correo || "",
        cuenta_hija: item.cuentaHija?.correo || "",
      })),
      archivo: "reporte-dispositivos",
    },
    {
      titulo: "Licencias",
      descripcion: "Proveedor, plan, uso, costo, renovacion y estado.",
      icon: FiKey,
      filas: datos.licencias.map((item) => ({
        nombre: item.nombre,
        proveedor: item.proveedor,
        categoria: item.categoria,
        plan: item.plan || "",
        total: item.cantidadTotal,
        usadas: item.cantidadUsada,
        costo: item.costo || "",
        moneda: item.moneda,
        vencimiento: item.fechaVencimiento || "",
        renovacion: item.renovacion,
        estado: item.estado,
      })),
      archivo: "reporte-licencias",
    },
    {
      titulo: "Credenciales",
      descripcion: "Inventario de accesos por categoria y responsable.",
      icon: FiShield,
      filas: datos.credenciales.map((item) => ({
        categoria: item.categoria,
        nombre: item.nombre,
        usuario: item.usuario,
        portal: item.portal || "",
        estado: item.estado,
        responsable: item.responsable || "",
        mfa: item.mfa || "",
      })),
      archivo: "reporte-credenciales",
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Analisis
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                Reportes
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Consulta informacion clave y exporta datos del control interno.
              </p>
            </div>

            <button
              onClick={cargarReportes}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiRefreshCw size={16} />
              {cargando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tarjetas.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <Icon className="text-slate-400" size={18} />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{item.valor}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.62fr_0.38fr]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
              <p className="text-base font-semibold text-slate-900">Exportaciones disponibles</p>
              <p className="mt-1 text-sm text-slate-500">
                Descarga archivos CSV para analisis, respaldo o seguimiento.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
              {exportaciones.map((reporte) => {
                const Icon = reporte.icon;

                return (
                  <div key={reporte.titulo} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <Icon />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{reporte.titulo}</p>
                          <p className="mt-1 text-sm text-slate-500">{reporte.descripcion}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            {reporte.filas.length} registros
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          disabled={reporte.filas.length === 0}
                          onClick={() => descargarCsv(reporte.archivo, reporte.filas)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiDownload size={16} />
                          CSV
                        </button>
                        <button
                          disabled={reporte.filas.length === 0}
                          onClick={() => descargarPdf(reporte.archivo, reporte.titulo, reporte.filas)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiDownload size={16} />
                          PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="mt-0.5 text-amber-500" size={20} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Resumen ejecutivo</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {reportes.cuentasVencidas.length} cuentas vencidas, {reportes.cuentasPorVencer.length} cuentas por vencer y {reportes.licenciasPorVencer.length} licencias proximas.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Dispositivos por area</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {areasDispositivos.length} areas registradas
                  </p>
                </div>
                {areasDispositivos.length > areasPorPagina ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                    {paginaAreas}/{totalPaginasAreas}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 space-y-3">
                {areasDispositivos.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin dispositivos registrados.</p>
                ) : (
                  areasVisibles.map(([area, total]) => (
                    <div key={area}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{area}</span>
                        <span className="font-semibold text-slate-900">{total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a,_#334155)]"
                          style={{ width: `${Math.max((total / Math.max(datos.dispositivos.length, 1)) * 100, 8)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {areasDispositivos.length > areasPorPagina ? (
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setPaginaAreas((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaAreas === 1}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <p className="text-xs font-medium text-slate-500">
                    Mostrando {areasVisibles.length} de {areasDispositivos.length}
                  </p>
                  <button
                    onClick={() => setPaginaAreas((prev) => Math.min(prev + 1, totalPaginasAreas))}
                    disabled={paginaAreas === totalPaginasAreas}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-base font-semibold text-slate-900">Credenciales por categoria</p>
              <div className="mt-5 space-y-3">
                {Object.entries(reportes.credencialesPorCategoria).length === 0 ? (
                  <p className="text-sm text-slate-500">Sin credenciales registradas.</p>
                ) : (
                  Object.entries(reportes.credencialesPorCategoria).map(([categoria, total]) => (
                    <div key={categoria} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-sm font-medium capitalize text-slate-700">{categoria}</span>
                      <span className="text-sm font-semibold text-slate-900">{total}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <FiFileText className="mt-0.5 text-slate-500" size={20} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Actividades pendientes</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {reportes.actividadesPendientes.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Tareas personales abiertas en Mi espacio.
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

export default Reportes;
