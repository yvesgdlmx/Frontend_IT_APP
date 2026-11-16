const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";
const dias = [{ id: 1, nombre: "Lun" }, { id: 2, nombre: "Mar" }, { id: 3, nombre: "Mié" }, { id: 4, nombre: "Jue" }, { id: 5, nombre: "Vie" }, { id: 6, nombre: "Sáb" }, { id: 0, nombre: "Dom" }];

export default function RecurrenciaAgenda({ value, onChange, fecha }) {
  const cambiar = (cambios) => onChange({ ...value, ...cambios });
  const activa = value.frecuencia !== "ninguna";
  const nombres = dias.filter((dia) => value.diasSemana.includes(dia.id)).map((dia) => dia.nombre).join(", ");
  return (
    <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-700">Repetición</legend>
      <label className="block text-sm text-slate-600">
        Repetir actividad
        <select className={`${campo} mt-1`} value={value.frecuencia} onChange={(e) => cambiar({
          frecuencia: e.target.value,
          diasSemana: value.diasSemana.length ? value.diasSemana : [new Date(`${fecha}T12:00:00`).getDay()],
        })}>
          <option value="ninguna">No repetir</option>
          <option value="dias">Cada cierto número de días</option>
          <option value="semanas">Por semana (elige los días)</option>
          <option value="meses">Por mes</option>
        </select>
      </label>
      {activa && <>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Cada
          <input className={`${campo} max-w-24`} type="number" min="1" max="365" required value={value.intervalo} onChange={(e) => cambiar({ intervalo: e.target.value })} />
          {value.frecuencia === "dias" ? "día(s)" : value.frecuencia === "semanas" ? "semana(s)" : "mes(es)"}
        </label>
        {value.frecuencia === "semanas" && <div>
          <p className="mb-2 text-sm text-slate-600">Los días</p>
          <div className="flex flex-wrap gap-1.5">
            {dias.map((dia) => <label key={dia.id} className={`cursor-pointer rounded-lg border px-2 py-2 text-xs font-semibold ${value.diasSemana.includes(dia.id) ? "border-slate-600 bg-slate-600 text-white" : "border-slate-300 bg-white text-slate-600"}`}>
              <input type="checkbox" className="sr-only peer" checked={value.diasSemana.includes(dia.id)} onChange={(e) => cambiar({ diasSemana: e.target.checked ? [...value.diasSemana, dia.id] : value.diasSemana.filter((id) => id !== dia.id) })} />
              <span className="peer-focus-visible:outline peer-focus-visible:outline-2">{dia.nombre}</span>
            </label>)}
          </div>
          {!value.diasSemana.length && <p role="alert" className="mt-2 text-xs text-rose-600">Selecciona al menos un día.</p>}
          <p className="mt-2 text-xs text-slate-500">Cada 2 semanas mantiene el mismo día, con 14 días entre eventos.</p>
        </div>}
        <label className="block text-sm text-slate-600">
          Termina
          <select className={`${campo} mt-1`} value={value.fin} onChange={(e) => cambiar({ fin: e.target.value })}>
            <option value="cantidad">Después de un número de eventos</option>
            <option value="fecha">En una fecha</option>
          </select>
        </label>
        {value.fin === "cantidad" ? <label className="block text-sm text-slate-600">
          Número de eventos
          <input className={`${campo} mt-1`} type="number" min="1" max="500" required value={value.cantidad} onChange={(e) => cambiar({ cantidad: e.target.value })} />
        </label> : <label className="block text-sm text-slate-600">
          Fecha final (incluida)
          <input className={`${campo} mt-1`} type="date" min={fecha} required value={value.hasta} onChange={(e) => cambiar({ hasta: e.target.value })} />
        </label>}
        <p className="text-xs leading-5 text-slate-600">
          Desde {fecha || "la fecha de inicio"}, cada {value.intervalo || "…"} {value.frecuencia}
          {value.frecuencia === "semanas" ? ` (${nombres || "elige los días"})` : ""}.
          {value.fin === "cantidad" ? ` Se crearán ${value.cantidad || "…"} eventos.` : ` Hasta ${value.hasta || "la fecha final"}.`}
          {value.frecuencia === "meses" ? " Si el día no existe en un mes, se usará el último día de ese mes." : ""}
        </p>
        <p className="text-xs text-slate-500">Máximo 500 eventos. Se crean pendientes y se gestionan individualmente.</p>
      </>}
    </fieldset>
  );
}
