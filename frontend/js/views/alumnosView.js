import { getAlumnos } from "../api.js";
import { fillTable } from "../ui.js";

export async function initAlumnos() {
  const alumnos = await getAlumnos();
  const rows = alumnos
    .map(
      (alumno) => `
    <tr>
      <td>${alumno.nombre}</td>
      <td>${alumno.matricula}</td>
      <td>${alumno.correo}</td>
      <td>${alumno.curso ?? "-"}</td>
    </tr>
  `,
    )
    .join("");
  fillTable("alumnos-table", rows);
}
