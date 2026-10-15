import { Link } from 'react-router-dom';
import { ChevronRight, KeyRound, Monitor, UserCog, Users } from 'lucide-react';
import { EstadoBadge } from '../../../shared/components/EstadoBadge';

/**
 * Lista de resultados del buscador global, agrupada por módulo.
 *
 * - Equipos y licencias son clicables: abren la hoja de vida del equipo
 *   (la licencia vive dentro de la hoja de vida de su equipo).
 * - Responsables y usuarios no tienen una vista de detalle propia, así
 *   que solo se listan; el enlace "Ver en el módulo" lleva a su página.
 * - Un grupo en null no aplica con los filtros elegidos: se explica en
 *   vez de mostrar un "sin resultados" engañoso.
 */
export function ResultadosBusqueda({ data, enlaceEquipos, onVerEquipo }) {
  const grupos = [data.equipos, data.responsables, data.licencias, data.usuarios];
  const totalGeneral = grupos.reduce((suma, grupo) => suma + (grupo?.total ?? 0), 0);

  if (totalGeneral === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No se encontró nada con esa búsqueda. Prueba con otro término o quita algún filtro.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <GrupoResultados
        titulo="Equipos"
        icono={Monitor}
        grupo={data.equipos}
        irA={enlaceEquipos}
        renderItem={(equipo) => (
          <ItemClicable key={equipo.id} onClick={() => onVerEquipo(equipo)}>
            <div className="min-w-0">
              <p className="font-mono font-medium text-ink">{equipo.placa_sena}</p>
              <p className="truncate text-xs text-slate-500">
                {[equipo.tipo_equipo?.nombre, equipo.hostname, equipo.serial].filter(Boolean).join(' · ')}
              </p>
              <p className="truncate text-xs text-slate-400">
                {equipo.ubicacion_formacion
                  ? [
                      equipo.ubicacion_formacion.subsede?.sede?.nombre,
                      equipo.ubicacion_formacion.subsede?.nombre,
                      equipo.ubicacion_formacion.nombre,
                    ]
                      .filter(Boolean)
                      .join(' / ')
                  : 'Sin ubicación'}
                {' — '}
                {equipo.responsable?.nombre ?? 'Sin responsable'}
              </p>
            </div>
            <EstadoBadge estado={equipo.estado} label={equipo.estado_label} />
          </ItemClicable>
        )}
      />

      <GrupoResultados
        titulo="Responsables"
        icono={Users}
        grupo={data.responsables}
        irA="/responsables"
        renderItem={(responsable) => (
          <li key={responsable.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-ink">{responsable.nombre}</p>
              <p className="truncate text-xs text-slate-500">
                {[responsable.documento, responsable.cargo, responsable.correo].filter(Boolean).join(' · ')}
              </p>
            </div>
            {responsable.equipos_count !== undefined && (
              <span className="shrink-0 font-mono text-xs text-slate-500">
                {responsable.equipos_count} {responsable.equipos_count === 1 ? 'equipo' : 'equipos'}
              </span>
            )}
          </li>
        )}
      />

      <GrupoResultados
        titulo="Licencias de Office"
        icono={KeyRound}
        grupo={data.licencias}
        irA="/licencias-office"
        motivoNoAplica="No aplica con el filtro “Solo sin licencia”."
        renderItem={(licencia) => {
          const contenido = (
            <>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{licencia.correo}</p>
                <p className="text-xs text-slate-500">
                  Equipo: <span className="font-mono">{licencia.equipo?.placa_sena ?? 'eliminado'}</span>
                </p>
              </div>
              <EstadoBadge estado={licencia.estado_licencia} label={licencia.estado_licencia_label} />
            </>
          );

          // Si el equipo ya no existe no hay hoja de vida que abrir.
          return licencia.equipo ? (
            <ItemClicable key={licencia.id} onClick={() => onVerEquipo(licencia.equipo)}>
              {contenido}
            </ItemClicable>
          ) : (
            <li key={licencia.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              {contenido}
            </li>
          );
        }}
      />

      <GrupoResultados
        titulo="Usuarios del sistema"
        icono={UserCog}
        grupo={data.usuarios}
        irA="/usuarios"
        motivoNoAplica="Los usuarios no tienen sede ni equipos: se buscan solo por texto, sin filtros."
        renderItem={(usuario) => (
          <li key={usuario.id} className="px-3 py-2 text-sm">
            <p className="font-medium text-ink">{usuario.nombre}</p>
            <p className="truncate text-xs text-slate-500">{usuario.correo}</p>
          </li>
        )}
      />
    </div>
  );
}

function GrupoResultados({ titulo, icono: Icono, grupo, irA, renderItem, motivoNoAplica }) {
  return (
    <section className="flex flex-col rounded border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icono className="h-4 w-4 text-sena-dark" aria-hidden="true" />
          {titulo}
        </h3>
        {grupo && <span className="font-mono text-xs text-slate-500">{grupo.total}</span>}
      </header>

      {grupo === null || grupo === undefined ? (
        <p className="px-3 py-4 text-xs text-slate-400">{motivoNoAplica ?? 'No aplica con los filtros elegidos.'}</p>
      ) : grupo.total === 0 ? (
        <p className="px-3 py-4 text-xs text-slate-400">Sin coincidencias.</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-100">{grupo.resultados.map(renderItem)}</ul>
          <footer className="mt-auto flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs">
            <span className="text-slate-400">
              {grupo.total > grupo.resultados.length
                ? `Mostrando ${grupo.resultados.length} de ${grupo.total}`
                : `${grupo.total} ${grupo.total === 1 ? 'resultado' : 'resultados'}`}
            </span>
            <Link to={irA} className="font-medium text-sena-dark hover:underline">
              Ver en el módulo
            </Link>
          </footer>
        </>
      )}
    </section>
  );
}

function ItemClicable({ onClick, children }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-sena-soft focus:bg-sena-soft focus:outline-none"
      >
        {children}
        <ChevronRight
          className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-sena-dark"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}