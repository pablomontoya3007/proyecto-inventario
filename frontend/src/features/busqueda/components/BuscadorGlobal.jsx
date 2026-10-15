import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useBusquedaGlobal } from '../hooks/useBusquedaGlobal';
import { useTiposEquipo } from '../../tipos-equipo/hooks/useTiposEquipo';
import { useSedes } from '../../sedes/hooks/useSedes';
import { useSubsedes } from '../../subsedes/hooks/useSubsedes';
import { useUbicaciones } from '../../ubicaciones/hooks/useUbicaciones';
import { HojaDeVidaModal } from '../../equipos/components/HojaDeVidaModal';
import { useValorDiferido } from '../../../shared/hooks/useValorDiferido';
import { ResultadosBusqueda } from './ResultadosBusqueda';

// Mismos valores que app/Enums/EstadoEquipo.php y que EquiposPage.
const ESTADOS_EQUIPO = [
  { value: 'activo', label: 'Activo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'de_baja', label: 'De baja' },
  { value: 'extraviado', label: 'Extraviado' },
];

const MIN_CARACTERES = 2;
const ESPERA_MS = 350;

const CAMPO =
  'rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena disabled:bg-surface';

const FILTROS_VACIOS = {
  tipoEquipoId: '',
  estado: '',
  sedeId: '',
  subsedeId: '',
  ubicacionId: '',
  sinLicencia: false,
};

/**
 * Buscador global del Inicio: un cuadro de texto que busca a la vez en
 * equipos, responsables, licencias de Office y usuarios, más filtros de
 * equipo. En equipos la búsqueda es "profunda": además de placa, serial,
 * MAC, hostname y responsable, entra en las características técnicas,
 * observaciones, novedades, mantenimientos y traslados, y cada
 * resultado dice dónde coincidió.
 *
 * La búsqueda se lanza sola mientras se escribe (con retraso, para no
 * consultar en cada tecla) cuando hay al menos 2 caracteres o algún
 * filtro activo. Sin nada de eso, no se muestra ningún resultado y el
 * Inicio se ve igual que antes.
 */
export function BuscadorGlobal() {
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [equipoAbierto, setEquipoAbierto] = useState(null);

  const termino = useValorDiferido(texto.trim(), ESPERA_MS);

  const { data: tiposData } = useTiposEquipo();
  const { data: sedesData } = useSedes(1);
  const { data: subsedesData } = useSubsedes({ page: 1, sedeId: filtros.sedeId || undefined });
  const { data: ubicacionesData } = useUbicaciones({ page: 1, subsedeId: filtros.subsedeId || undefined });

  const hayFiltros = Object.values(filtros).some(Boolean);
  const textoSuficiente = termino.length >= MIN_CARACTERES;
  const buscando = textoSuficiente || hayFiltros;

  // Solo se envían las claves con valor, y la ubicación más específica
  // (igual que en EquiposPage): ubicación > subsede > sede.
  const parametros = {
    ...(textoSuficiente ? { q: termino } : {}),
    ...(filtros.tipoEquipoId ? { tipo_equipo_id: filtros.tipoEquipoId } : {}),
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.sinLicencia ? { sin_licencia: 1 } : {}),
    ...(filtros.ubicacionId
      ? { ubicacion_formacion_id: filtros.ubicacionId }
      : filtros.subsedeId
        ? { subsede_id: filtros.subsedeId }
        : filtros.sedeId
          ? { sede_id: filtros.sedeId }
          : {}),
  };

  const { data, isFetching, isError } = useBusquedaGlobal(parametros, { enabled: buscando });

  // EquiposPage ya sabe leer ?estado= y ?sin_licencia=1 de la URL.
  const consultaEquipos = new URLSearchParams({
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    ...(filtros.sinLicencia ? { sin_licencia: '1' } : {}),
  }).toString();
  const enlaceEquipos = consultaEquipos ? `/equipos?${consultaEquipos}` : '/equipos';

  function cambiarFiltro(campo, valor) {
    setFiltros((actuales) => {
      const nuevos = { ...actuales, [campo]: valor };
      // Cascada: cambiar un nivel limpia los que dependen de él.
      if (campo === 'sedeId') {
        nuevos.subsedeId = '';
        nuevos.ubicacionId = '';
      }
      if (campo === 'subsedeId') nuevos.ubicacionId = '';
      return nuevos;
    });
  }

  function limpiarTodo() {
    setTexto('');
    setFiltros(FILTROS_VACIOS);
  }

  return (
    <section aria-label="Buscador global" className="space-y-4">
      <div className="rounded border border-slate-200 bg-white p-4">
        <div className="relative">
          <label htmlFor="buscador-global" className="sr-only">
            Buscar en todo el sistema
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="buscador-global"
            type="search"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setTexto('');
            }}
            placeholder="Buscar placa, serial, MAC, característica (ej. ruby), observación, novedad, responsable, licencia o usuario..."
            maxLength={100}
            autoComplete="off"
            className="w-full rounded border border-slate-300 py-2.5 pl-10 pr-10 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena [&::-webkit-search-cancel-button]:hidden"
          />
          {texto && (
            <button
              type="button"
              onClick={() => setTexto('')}
              aria-label="Borrar texto de búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-surface hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            aria-label="Filtrar por tipo de equipo"
            value={filtros.tipoEquipoId}
            onChange={(event) => cambiarFiltro('tipoEquipoId', event.target.value)}
            className={CAMPO}
          >
            <option value="">Todos los tipos</option>
            {tiposData?.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por estado del equipo"
            value={filtros.estado}
            onChange={(event) => cambiarFiltro('estado', event.target.value)}
            className={CAMPO}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_EQUIPO.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por sede"
            value={filtros.sedeId}
            onChange={(event) => cambiarFiltro('sedeId', event.target.value)}
            className={CAMPO}
          >
            <option value="">Todas las sedes</option>
            {sedesData?.data.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por subsede"
            value={filtros.subsedeId}
            disabled={!filtros.sedeId}
            onChange={(event) => cambiarFiltro('subsedeId', event.target.value)}
            className={CAMPO}
          >
            <option value="">Todas las subsedes</option>
            {subsedesData?.data.map((subsede) => (
              <option key={subsede.id} value={subsede.id}>
                {subsede.nombre}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por ubicación de formación"
            value={filtros.ubicacionId}
            disabled={!filtros.subsedeId}
            onChange={(event) => cambiarFiltro('ubicacionId', event.target.value)}
            className={CAMPO}
          >
            <option value="">Todas las ubicaciones</option>
            {ubicacionesData?.data.map((ubicacion) => (
              <option key={ubicacion.id} value={ubicacion.id}>
                {ubicacion.nombre}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={filtros.sinLicencia}
              onChange={(event) => cambiarFiltro('sinLicencia', event.target.checked)}
              className="h-4 w-4 accent-sena"
            />
            Solo sin licencia
          </label>

          {(texto || hayFiltros) && (
            <button type="button" onClick={limpiarTodo} className="text-sm text-slate-500 underline hover:text-ink">
              Limpiar búsqueda
            </button>
          )}
        </div>

        {texto.trim().length > 0 && !textoSuficiente && !hayFiltros && (
          <p className="mt-2 text-xs text-slate-400">Escribe al menos {MIN_CARACTERES} caracteres para buscar.</p>
        )}
      </div>

      {/* aria-live: los lectores de pantalla anuncian cuando cambian los resultados. */}
      <div aria-live="polite" aria-busy={isFetching}>
        {buscando && isError && (
          <p className="text-sm text-danger">No se pudo realizar la búsqueda. Intenta de nuevo.</p>
        )}
        {buscando && !data && !isError && <p className="text-sm text-slate-500">Buscando...</p>}
        {buscando && data && (
          <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <ResultadosBusqueda
              data={data}
              termino={textoSuficiente ? termino : ''}
              enlaceEquipos={enlaceEquipos}
              onVerEquipo={setEquipoAbierto}
            />
          </div>
        )}
      </div>

      {equipoAbierto && (
        <HojaDeVidaModal
          equipoId={equipoAbierto.id}
          placaSena={equipoAbierto.placa_sena}
          onClose={() => setEquipoAbierto(null)}
        />
      )}
    </section>
  );
}