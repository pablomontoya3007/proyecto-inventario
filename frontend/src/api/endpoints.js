// Rutas de la API, reflejando exactamente routes/api.php del backend.
// Centralizarlas aquí evita tener strings de URL repetidos por todo el
// código: si algún día cambia una ruta, se corrige en un solo lugar.

export const ENDPOINTS = {
  auth: {
    login: '/login',
    logout: '/logout',
    me: '/me', // AuthController::usuarioActual
  },

  // Fase 1
  sedes: '/sedes',
  subsedes: '/subsedes',
  ubicacionesFormacion: '/ubicaciones-formacion', // parámetro de ruta: ubicacion_formacion

  // Fase 2
  tiposEquipo: '/tipos-equipo', // parámetro de ruta: tipo_equipo
  responsables: '/responsables',
  equipos: '/equipos',

  // Fase 3
  licenciasOffice: '/licencias-office', // parámetro de ruta: licencia_office

  // Fase 4 — solo index, store, show: son inmutables, sin update ni destroy
  observaciones: '/observaciones',

  // Fase 5
  reportes: {
    equipos: '/reportes/equipos',
    equiposExcel: '/reportes/equipos/excel',
    equiposPdf: '/reportes/equipos/pdf',
  },
};