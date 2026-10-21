import { useState } from 'react';
import { useEquipo } from '../hooks/useEquipos';
import { descargarHojaDeVidaPdf } from '../services/equiposApi';
import { Modal } from '../../../shared/components/Modal';
import { EstadoNovedadBadge } from '../../novedades/components/NovedadTable';

/**
 * "Ver" y "descargar" en un solo lugar: el modal muestra todo en
 * pantalla, y el botón de arriba genera el PDF con el mismo contenido
 * (misma fuente de datos: GET /equipos/{id}, ahora con mantenimientos
 * incluido junto a lo que ya traía show() desde la Fase 2).
 *
 * El historial de novedades llega ordenado desde el backend (la más
 * reciente primero), con quién la reportó, a quién se asignó y, si ya
 * se resolvió, quién, cuándo y con qué nota.
 */
export function HojaDeVidaModal({ equipoId, placaSena, onClose }) {
  const { data: equipo, isLoading, isError } = useEquipo(equipoId);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(null);

  async function handleDescargar() {
    setErrorDescarga(null);
    setDescargando(true);
    try {
      await descargarHojaDeVidaPdf(equipoId, placaSena);
    } catch {
      setErrorDescarga('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Modal title={`Hoja de vida — ${placaSena}`} onClose={onClose} maxWidth="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        {errorDescarga && <p className="text-sm text-danger">{errorDescarga}</p>}
        <button
          onClick={handleDescargar}
          disabled={descargando}
          className="ml-auto rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {descargando ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
      {isError && <p className="text-sm text-danger">No se pudo cargar la hoja de vida.</p>}

      {equipo && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Datos generales</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-slate-500">Serial</dt>
              <dd className="text-ink">{equipo.serial}</dd>
              <dt className="text-slate-500">MAC inalámbrica (WiFi)</dt>
              <dd className="text-ink">{equipo.mac ?? '—'}</dd>
              <dt className="text-slate-500">MAC cableada</dt>
              <dd className="text-ink">{equipo.mac_cableada ?? '—'}</dd>
              <dt className="text-slate-500">Hostname</dt>
              <dd className="text-ink">{equipo.hostname ?? '—'}</dd>
              <dt className="text-slate-500">Tipo</dt>
              <dd className="text-ink">{equipo.tipo_equipo?.nombre ?? '—'}</dd>
              <dt className="text-slate-500">Estado</dt>
              <dd className="text-ink">{equipo.estado_label ?? '—'}</dd>
              <dt className="text-slate-500">Cuentadante</dt>
              <dd className="text-ink">{equipo.responsable?.nombre ?? 'Sin asignar'}</dd>
              <dt className="text-slate-500">Ubicación</dt>
              <dd className="text-ink">
                {equipo.ubicacion_formacion?.nombre} / {equipo.ubicacion_formacion?.subsede?.nombre} /{' '}
                {equipo.ubicacion_formacion?.subsede?.sede?.nombre}
              </dd>
            </dl>
          </section>

          {equipo.caracteristicas_tecnicas && Object.keys(equipo.caracteristicas_tecnicas).length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">Características técnicas</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(equipo.caracteristicas_tecnicas).map(([clave, valor]) => (
                  <div key={clave} className="contents">
                    <dt className="text-slate-500">{clave}</dt>
                    <dd className="text-ink">{String(valor)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {equipo.licencia_office && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">Licencia de Office</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-slate-500">Correo</dt>
                <dd className="text-ink">{equipo.licencia_office.correo}</dd>
                <dt className="text-slate-500">Estado</dt>
                <dd className="text-ink">{equipo.licencia_office.estado_licencia_label}</dd>
              </dl>
            </section>
          )}

          <HistorialNovedades novedades={equipo.novedades} />

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Historial de mantenimientos</h3>
            {equipo.mantenimientos?.length > 0 ? (
              <ul className="space-y-2">
                {equipo.mantenimientos.map((mantenimiento) => (
                  <li key={mantenimiento.id} className="rounded border border-slate-200 p-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>{mantenimiento.fecha_programada}</span>
                      <span>{mantenimiento.estado_label}</span>
                    </div>
                    {mantenimiento.descripcion && (
                      <p className="mt-1 whitespace-pre-line text-ink">{mantenimiento.descripcion}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Sin mantenimientos registrados.</p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Historial de traslados</h3>
            {equipo.traslados?.length > 0 ? (
              <ul className="space-y-2">
                {equipo.traslados.map((traslado) => (
                  <li key={traslado.id} className="rounded border border-slate-200 p-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {traslado.ubicacion_origen?.nombre ?? '—'} → {traslado.ubicacion_destino?.nombre ?? '—'}
                      </span>
                      <span>{traslado.fecha_traslado}</span>
                    </div>
                    {traslado.motivo && <p className="mt-1 text-ink">{traslado.motivo}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Sin traslados registrados.</p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">Historial de observaciones</h3>
            {equipo.observaciones?.length > 0 ? (
              <ul className="space-y-2">
                {equipo.observaciones.map((observacion) => (
                  <li key={observacion.id} className="rounded border border-slate-200 p-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>{observacion.usuario?.nombre}</span>
                      <span>{new Date(observacion.registrada_en).toLocaleString('es-CO')}</span>
                    </div>
                    <p className="mt-1 text-ink">{observacion.descripcion}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Sin observaciones registradas.</p>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function HistorialNovedades({ novedades = [] }) {
  const abiertas = novedades.filter((novedad) => novedad.estado === 'abierta').length;

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        Historial de novedades
        {abiertas > 0 && (
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-ink">
            {abiertas} {abiertas === 1 ? 'abierta' : 'abiertas'}
          </span>
        )}
      </h3>

      {novedades.length > 0 ? (
        <ul className="space-y-2">
          {novedades.map((novedad) => (
            <li
              key={novedad.id}
              className={`rounded border p-2 text-sm ${
                novedad.estado === 'abierta' ? 'border-warning/40 bg-warning/5' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-slate-600">
                <span>{novedad.registrada_en}</span>
                <EstadoNovedadBadge estado={novedad.estado} label={novedad.estado_label} />
              </div>
              <p className="mt-1 whitespace-pre-line text-ink">{novedad.descripcion}</p>
              <p className="mt-1 text-xs text-slate-500">
                Reportada por {novedad.usuario?.nombre ?? '—'} · Asignada a{' '}
                {novedad.asignado?.nombre ?? 'nadie todavía'}
              </p>

              {novedad.estado === 'resuelta' && (
                <div className="mt-2 rounded bg-sena-soft px-2 py-1.5 text-xs text-sena-dark">
                  <p>
                    Resuelta el {novedad.resuelta_en ?? '—'}
                    {novedad.resuelta_por?.nombre && ` por ${novedad.resuelta_por.nombre}`}
                  </p>
                  {novedad.nota_resolucion && (
                    <p className="mt-0.5 whitespace-pre-line text-ink">{novedad.nota_resolucion}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">Sin novedades registradas.</p>
      )}
    </section>
  );
}