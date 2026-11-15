// Catálogo compartido por la interfaz y el servidor. Los alias reconocen datos
// históricos al consultar, sin modificar los valores almacenados en producción.
export const tiposEquipo = [
  { valor: "Laptop", label: "Laptop", alias: ["notebook", "portatil", "computadora portatil"] },
  { valor: "Desktop", label: "PC de escritorio", alias: ["pc", "computadora", "escritorio", "pc de escritorio", "computadora de escritorio", "pc escritorio"] },
  { valor: "Mini PC", label: "Mini PC", alias: ["minipc", "mini computadora"] },
  { valor: "Monitor", label: "Monitor", alias: ["pantalla", "display"] },
  { valor: "Teclado", label: "Teclado", alias: ["keyboard"] },
  { valor: "Mouse", label: "Mouse", alias: ["raton"] },
  { valor: "Impresora", label: "Impresora", alias: ["printer"] },
  { valor: "Escaner", label: "Escáner", alias: ["scanner"] },
  { valor: "Switch", label: "Switch", alias: [] },
  { valor: "Router", label: "Router", alias: [] },
  { valor: "Access Point", label: "Access Point", alias: ["ap"] },
  { valor: "Servidor", label: "Servidor", alias: ["server", "nas"] },
  { valor: "Tablet", label: "Tablet", alias: [] },
  { valor: "Celular", label: "Celular", alias: ["telefono", "movil"] },
  { valor: "UPS", label: "UPS / No break", alias: ["no break", "nobreak", "ups / no break"] },
  { valor: "Otro", label: "Otro", alias: ["otros"] },
];

const normalizarTexto = (valor) => typeof valor === "string"
  ? valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-_\s]+/g, " ")
  : "";

export const normalizarTipoEquipo = (tipo) => {
  const texto = normalizarTexto(tipo);
  return tiposEquipo.find((opcion) => [opcion.valor, opcion.label, ...opcion.alias]
    .some((valor) => normalizarTexto(valor) === texto))?.valor || tipo || "Sin tipo";
};

export const etiquetaTipoEquipo = (tipo) =>
  tiposEquipo.find((opcion) => opcion.valor === normalizarTipoEquipo(tipo))?.label || tipo || "Sin tipo";

export const permiteLicencias = (tipo) =>
  ["Laptop", "Desktop", "Mini PC"].includes(normalizarTipoEquipo(tipo));

export const resumirEquipos = (equipos) => {
  const grupos = new Map();
  for (const equipo of equipos) {
    const tipo = normalizarTipoEquipo(equipo.tipoEquipo);
    const grupo = grupos.get(tipo) || { tipo, nombre: etiquetaTipoEquipo(tipo), total: 0, operacion: 0, resguardo: 0, mantenimiento: 0, baja: 0 };
    grupo.total++;
    const estado = equipo.estadoInventario || "operacion";
    if (["operacion", "resguardo", "mantenimiento", "baja"].includes(estado)) grupo[estado]++;
    grupos.set(tipo, grupo);
  }
  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
};
