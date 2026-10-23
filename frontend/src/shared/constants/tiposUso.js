/**
 * Tipos de uso de un equipo. Confirmado contra app/Enums/TipoUso.php:
 * los "value" deben coincidir exactamente con los del enum del backend.
 * Vive aquí porque lo usan Equipos (formulario, filtro y tabla) y
 * Reportes. "corto" es para columnas angostas (tabla de Equipos).
 */
export const TIPOS_USO = [
    { value: 'formacion', label: 'Uso de formación', corto: 'Formación' },
    { value: 'administrativo', label: 'Uso administrativo', corto: 'Administrativo' },
    { value: 'no_aplica', label: 'No aplica', corto: 'No aplica' },
];