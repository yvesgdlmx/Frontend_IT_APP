import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import clienteAxios from "../config/clienteAxios.jsx";

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const textoPdf = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const truncarPdf = (valor, max = 28) => {
  const texto = String(valor ?? "");
  return texto.length > max ? `${texto.slice(0, max - 1)}...` : texto;
};

const escapeXml = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const crcTabla = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTabla[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const numeroColumnaExcel = (index) => {
  let numero = index + 1;
  let columna = "";

  while (numero > 0) {
    const residuo = (numero - 1) % 26;
    columna = String.fromCharCode(65 + residuo) + columna;
    numero = Math.floor((numero - residuo - 1) / 26);
  }

  return columna;
};

const escribirUint16 = (buffer, offset, valor) => {
  buffer[offset] = valor & 0xff;
  buffer[offset + 1] = (valor >>> 8) & 0xff;
};

const escribirUint32 = (buffer, offset, valor) => {
  buffer[offset] = valor & 0xff;
  buffer[offset + 1] = (valor >>> 8) & 0xff;
  buffer[offset + 2] = (valor >>> 16) & 0xff;
  buffer[offset + 3] = (valor >>> 24) & 0xff;
};

const concatenarBytes = (partes) => {
  const total = partes.reduce((acc, parte) => acc + parte.length, 0);
  const salida = new Uint8Array(total);
  let offset = 0;

  partes.forEach((parte) => {
    salida.set(parte, offset);
    offset += parte.length;
  });

  return salida;
};

const crearZipSinCompresion = (archivos) => {
  const encoder = new TextEncoder();
  const locales = [];
  const centrales = [];
  let offset = 0;

  archivos.forEach(({ nombre, contenido }) => {
    const nombreBytes = encoder.encode(nombre);
    const contenidoBytes = encoder.encode(contenido);
    const crc = crc32(contenidoBytes);

    const local = new Uint8Array(30 + nombreBytes.length + contenidoBytes.length);
    escribirUint32(local, 0, 0x04034b50);
    escribirUint16(local, 4, 20);
    escribirUint16(local, 6, 0);
    escribirUint16(local, 8, 0);
    escribirUint16(local, 10, 0);
    escribirUint16(local, 12, 0);
    escribirUint32(local, 14, crc);
    escribirUint32(local, 18, contenidoBytes.length);
    escribirUint32(local, 22, contenidoBytes.length);
    escribirUint16(local, 26, nombreBytes.length);
    escribirUint16(local, 28, 0);
    local.set(nombreBytes, 30);
    local.set(contenidoBytes, 30 + nombreBytes.length);
    locales.push(local);

    const central = new Uint8Array(46 + nombreBytes.length);
    escribirUint32(central, 0, 0x02014b50);
    escribirUint16(central, 4, 20);
    escribirUint16(central, 6, 20);
    escribirUint16(central, 8, 0);
    escribirUint16(central, 10, 0);
    escribirUint16(central, 12, 0);
    escribirUint16(central, 14, 0);
    escribirUint32(central, 16, crc);
    escribirUint32(central, 20, contenidoBytes.length);
    escribirUint32(central, 24, contenidoBytes.length);
    escribirUint16(central, 28, nombreBytes.length);
    escribirUint16(central, 30, 0);
    escribirUint16(central, 32, 0);
    escribirUint16(central, 34, 0);
    escribirUint16(central, 36, 0);
    escribirUint32(central, 38, 0);
    escribirUint32(central, 42, offset);
    central.set(nombreBytes, 46);
    centrales.push(central);

    offset += local.length;
  });

  const centralInicio = offset;
  const centralBytes = concatenarBytes(centrales);
  const fin = new Uint8Array(22);
  escribirUint32(fin, 0, 0x06054b50);
  escribirUint16(fin, 8, archivos.length);
  escribirUint16(fin, 10, archivos.length);
  escribirUint32(fin, 12, centralBytes.length);
  escribirUint32(fin, 16, centralInicio);
  escribirUint16(fin, 20, 0);

  return concatenarBytes([...locales, centralBytes, fin]);
};

const crearXlsx = (filas) => {
  const headers = Object.keys(filas[0] || {});
  const nombres = {
    mes: "Mes",
    contratadas: "Contratadas",
    utilizadas: "Utilizadas",
    disponibles: "Disponibles",
    kpi: "KPI",
    comentario: "Comentario",
  };

  const crearCelda = (valor, fila, columna) =>
    `<c r="${numeroColumnaExcel(columna)}${fila}" t="inlineStr"><is><t>${escapeXml(valor)}</t></is></c>`;

  const filasXml = [
    `<row r="1">${headers.map((header, index) => crearCelda(nombres[header] || header, 1, index)).join("")}</row>`,
    ...filas.map(
      (fila, rowIndex) =>
        `<row r="${rowIndex + 2}">${headers
          .map((header, colIndex) => crearCelda(fila[header], rowIndex + 2, colIndex))
          .join("")}</row>`
    ),
  ].join("");

  const ultimaColumna = numeroColumnaExcel(Math.max(headers.length - 1, 0));
  const ultimaFila = Math.max(filas.length + 1, 1);

  return crearZipSinCompresion([
    {
      nombre: "[Content_Types].xml",
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      nombre: "_rels/.rels",
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      nombre: "xl/workbook.xml",
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Cierres" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      nombre: "xl/_rels/workbook.xml.rels",
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      nombre: "xl/worksheets/sheet1.xml",
      contenido: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${ultimaColumna}${ultimaFila}"/>
  <cols>
    <col min="1" max="1" width="20" customWidth="1"/>
    <col min="2" max="5" width="15" customWidth="1"/>
    <col min="6" max="6" width="42" customWidth="1"/>
  </cols>
  <sheetData>${filasXml}</sheetData>
</worksheet>`,
    },
  ]);
};

const crearPdf = (titulo, filas) => {
  const ancho = 842;
  const alto = 595;
  const margen = 42;
  const columnas = ["mes", "contratadas", "utilizadas", "disponibles", "kpi", "comentario"];
  const anchos = [110, 95, 95, 95, 70, 292];
  const filasPorPagina = 16;
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

  (paginas.length ? paginas : [[]]).forEach((paginaFilas, pageIndex) => {
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
    comandos.push("BT /F1 9 Tf 92 540 Td (TI CONTROL | Reportes) Tj ET");
    comandos.push(`BT /F1 9 Tf 650 558 Td (Generado: ${textoPdf(new Date().toLocaleDateString("es-MX"))}) Tj ET`);
    comandos.push(`BT /F1 9 Tf 650 540 Td (Pagina ${pageIndex + 1} de ${Math.max(paginas.length, 1)}) Tj ET`);

    comandos.push("1 1 1 rg 42 462 758 38 re f");
    comandos.push("0.88 0.91 0.95 RG 42 462 758 38 re S");
    comandos.push("0.10 0.13 0.20 rg");
    comandos.push(`BT /F2 11 Tf 58 484 Td (${filas.length} cierres mensuales exportados) Tj ET`);
    comandos.push("0.39 0.45 0.55 rg");
    comandos.push("BT /F1 9 Tf 58 469 Td (KPI: licencias utilizadas / licencias contratadas x 100.) Tj ET");

    const tablaY = 420;
    comandos.push("0.09 0.12 0.18 rg 42 420 758 28 re f");
    comandos.push("1 1 1 rg");

    let xActual = margen;
    columnas.forEach((columna, index) => {
      comandos.push(`BT /F2 8 Tf ${(xActual + 8).toFixed(2)} 430 Td (${textoPdf(columna.toUpperCase())}) Tj ET`);
      xActual += anchos[index];
    });

    paginaFilas.forEach((fila, rowIndex) => {
      const y = tablaY - 26 - rowIndex * 22;
      comandos.push(rowIndex % 2 === 0 ? "1 1 1 rg" : "0.97 0.98 1 rg");
      comandos.push(`42 ${y} 758 22 re f`);
      comandos.push("0.88 0.91 0.95 RG");
      comandos.push(`42 ${y} 758 22 re S`);
      comandos.push("0.10 0.13 0.20 rg");

      let x = margen;
      columnas.forEach((columna, index) => {
        const texto = textoPdf(truncarPdf(fila[columna], columna === "comentario" ? 42 : 18));
        comandos.push(`BT /F1 8 Tf ${(x + 8).toFixed(2)} ${(y + 8).toFixed(2)} Td (${texto}) Tj ET`);
        x += anchos[index];
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

const descargarExcel = (nombre, filas) => {
  if (!filas.length) return;

  const archivo = crearXlsx(filas);
  const blob = new Blob([archivo], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombre}.xlsx`;
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
  const [cierres, setCierres] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [cargando, setCargando] = useState(true);

  const cargarCierres = async () => {
    setCargando(true);

    try {
      const { data } = await clienteAxios.get(`/licencias/cierres?anio=${anio}`);
      setCierres(Array.isArray(data) ? data : []);
    } catch (error) {
      setCierres([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCierres();
  }, [anio]);

  const filas = useMemo(
    () =>
      cierres.map((cierre) => ({
        mes: `${meses[cierre.mes - 1]} ${cierre.anio}`,
        contratadas: cierre.totalContratadas,
        utilizadas: cierre.totalUtilizadas,
        disponibles: cierre.totalDisponibles,
        kpi: `${Number(cierre.porcentajeUso || 0).toFixed(2)}%`,
        comentario: cierre.comentario || "",
      })),
    [cierres]
  );

  const resumen = useMemo(() => {
    const ultimo = [...cierres].sort((a, b) => b.mes - a.mes)[0];
    const promedio = cierres.length
      ? cierres.reduce((acc, cierre) => acc + Number(cierre.porcentajeUso || 0), 0) / cierres.length
      : 0;

    return {
      cierres: cierres.length,
      promedio,
      ultimo,
    };
  }, [cierres]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fafc_32%,_#ffffff_100%)] px-4 py-4 sm:px-6 sm:py-6 2xl:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                KPI licencias
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                Reportes
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Exporta el historial mensual de licencias utilizadas contra licencias contratadas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[120px_auto]">
              <input
                type="number"
                min="2000"
                max="2100"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value) || new Date().getFullYear())}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
              />
              <button
                onClick={cargarCierres}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FiRefreshCw size={16} />
                {cargando ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cierres</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{resumen.cierres}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Promedio KPI</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{resumen.promedio.toFixed(2)}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ultimo cierre</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {resumen.ultimo ? `${Number(resumen.ultimo.porcentajeUso || 0).toFixed(2)}%` : "-"}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">Cierres mensuales de licencias</p>
                <p className="mt-1 text-sm text-slate-500">
                  KPI: licencias utilizadas / licencias contratadas x 100.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  disabled={filas.length === 0}
                  onClick={() => descargarExcel(`cierres-licencias-${anio}`, filas)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiDownload size={16} />
                  Excel
                </button>
                <button
                  disabled={filas.length === 0}
                  onClick={() => descargarPdf(`cierres-licencias-${anio}`, `Cierres de licencias ${anio}`, filas)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0f172a,_#1e293b,_#334155)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiDownload size={16} />
                  PDF
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-4 text-left">Mes</th>
                      <th className="px-4 py-4 text-left">Contratadas</th>
                      <th className="px-4 py-4 text-left">Utilizadas</th>
                      <th className="px-4 py-4 text-left">Disponibles</th>
                      <th className="px-4 py-4 text-left">KPI</th>
                      <th className="px-4 py-4 text-left">Comentario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {cargando ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          Cargando cierres...
                        </td>
                      </tr>
                    ) : filas.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          No hay cierres mensuales guardados para este anio.
                        </td>
                      </tr>
                    ) : (
                      filas.map((fila) => (
                        <tr key={fila.mes} className="transition hover:bg-slate-50/80">
                          <td className="px-4 py-4 font-semibold text-slate-900">{fila.mes}</td>
                          <td className="px-4 py-4 text-slate-700">{fila.contratadas}</td>
                          <td className="px-4 py-4 text-slate-700">{fila.utilizadas}</td>
                          <td className="px-4 py-4 text-slate-700">{fila.disponibles}</td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{fila.kpi}</td>
                          <td className="px-4 py-4 text-slate-600">{fila.comentario || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              <FiFileText className="mt-0.5 shrink-0 text-slate-400" size={18} />
              <p>
                Primero genera y guarda cierres desde Licencias. Esta pantalla solo exporta los cierres ya guardados.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Reportes;
