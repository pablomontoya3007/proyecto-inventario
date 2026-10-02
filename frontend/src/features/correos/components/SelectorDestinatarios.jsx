import { useEffect, useId, useRef, useState } from 'react';
import { useBuscarUsuarios } from '../../usuarios/hooks/useUsuarios';

const ESPERA_MS = 300;
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEPARADORES = /[,;\s]+/;

function useValorDiferido(valor, espera) {
  const [diferido, setDiferido] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDiferido(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);

  return diferido;
}

/**
 * Campo de destinatarios estilo "chips":
 * - Al escribir, busca usuarios del sistema por nombre o correo.
 * - Si lo escrito es un correo válido, ofrece agregarlo tal cual.
 * - Enter / coma / punto y coma agregan; Backspace con el campo vacío
 *   quita el último; se pueden pegar varios correos de una vez.
 * - Al salir del campo con un correo válido escrito, se agrega solo
 *   (para que no se pierda si la persona da clic en "Enviar" sin Enter).
 *
 * value: [{ correo, nombre?, usuarioId? }] — el correo (en minúsculas)
 * es la clave: un mismo correo nunca se agrega dos veces.
 */
export function SelectorDestinatarios({ id, value, onChange, maximo = 100 }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const inputRef = useRef(null);
  const listaId = useId();

  const termino = useValorDiferido(texto.trim(), ESPERA_MS);
  const { data, isFetching } = useBuscarUsuarios(termino, { enabled: abierto });

  const correosAgregados = new Set(value.map((destinatario) => destinatario.correo));
  const textoLimpio = texto.trim().toLowerCase();
  const puedeAgregarTexto = FORMATO_CORREO.test(textoLimpio) && !correosAgregados.has(textoLimpio);
  const lleno = value.length >= maximo;

  const usuariosDisponibles = (data?.data ?? []).filter(
    (usuario) => !correosAgregados.has(usuario.correo.toLowerCase())
  );
  const opciones = [
    ...(puedeAgregarTexto ? [{ tipo: 'correo', correo: textoLimpio }] : []),
    ...usuariosDisponibles.map((usuario) => ({ tipo: 'usuario', usuario })),
  ];

  function agregar(nuevos) {
    const vistos = new Set(correosAgregados);
    const aAgregar = [];

    for (const destinatario of nuevos) {
      if (!vistos.has(destinatario.correo) && value.length + aAgregar.length < maximo) {
        vistos.add(destinatario.correo);
        aAgregar.push(destinatario);
      }
    }

    if (aAgregar.length > 0) onChange([...value, ...aAgregar]);
  }

  function elegir(opcion) {
    agregar([
      opcion.tipo === 'usuario'
        ? { correo: opcion.usuario.correo.toLowerCase(), nombre: opcion.usuario.nombre, usuarioId: opcion.usuario.id }
        : { correo: opcion.correo },
    ]);
    setTexto('');
    setIndiceActivo(-1);
  }

  function quitar(correo) {
    onChange(value.filter((destinatario) => destinatario.correo !== correo));
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAbierto(true);
      setIndiceActivo((i) => Math.min(i + 1, opciones.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      // Enter en este campo nunca envía el formulario: solo agrega.
      event.preventDefault();
      const opcion = indiceActivo >= 0 ? opciones[indiceActivo] : puedeAgregarTexto ? opciones[0] : null;
      if (opcion) elegir(opcion);
    } else if ((event.key === ',' || event.key === ';') && puedeAgregarTexto) {
      event.preventDefault();
      elegir({ tipo: 'correo', correo: textoLimpio });
    } else if (event.key === 'Backspace' && texto === '' && value.length > 0) {
      quitar(value[value.length - 1].correo);
    } else if (event.key === 'Escape' && abierto) {
      // stopPropagation: que Esc cierre solo la lista, no el modal.
      event.preventDefault();
      event.stopPropagation();
      setAbierto(false);
    }
  }

  // Pegar "a@x.com, b@y.com; c@z.com": agrega los válidos y deja en el
  // campo los que no lo son, para que la persona los corrija.
  function handlePaste(event) {
    const partes = event.clipboardData
      .getData('text')
      .split(SEPARADORES)
      .map((parte) => parte.trim().toLowerCase())
      .filter(Boolean);

    if (partes.length < 2) return;

    event.preventDefault();
    agregar(partes.filter((parte) => FORMATO_CORREO.test(parte)).map((correo) => ({ correo })));
    setTexto(partes.filter((parte) => !FORMATO_CORREO.test(parte)).join(', '));
  }

  function handleBlur() {
    setAbierto(false);
    setIndiceActivo(-1);
    if (puedeAgregarTexto) elegir({ tipo: 'correo', correo: textoLimpio });
  }

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-[42px] cursor-text flex-wrap items-center gap-1 rounded border border-slate-300 px-2 py-1 focus-within:border-sena"
      >
        {value.map((destinatario) => (
          <span
            key={destinatario.correo}
            title={destinatario.correo}
            className="flex items-center gap-1 rounded bg-sena-soft px-2 py-0.5 text-sm text-sena-dark"
          >
            {destinatario.nombre ?? destinatario.correo}
            <button
              type="button"
              aria-label={`Quitar ${destinatario.correo}`}
              onClick={(event) => {
                event.stopPropagation();
                quitar(destinatario.correo);
              }}
              className="leading-none text-sena-dark/60 hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={listaId}
          aria-activedescendant={abierto && indiceActivo >= 0 ? `${listaId}-${indiceActivo}` : undefined}
          disabled={lleno}
          placeholder={value.length === 0 ? 'Nombre de un usuario o un correo...' : ''}
          value={texto}
          onFocus={() => setAbierto(true)}
          onBlur={handleBlur}
          onChange={(event) => {
            setTexto(event.target.value);
            setIndiceActivo(-1);
            setAbierto(true);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="min-w-40 flex-1 border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
        />
      </div>

      {abierto && !lleno && (opciones.length > 0 || termino) && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded border border-slate-200 bg-white text-sm shadow-lg"
        >
          {opciones.length === 0 && (
            <li className="px-3 py-2 text-slate-500">
              {isFetching ? 'Buscando...' : 'Ningún usuario coincide. Escribe un correo completo para agregarlo.'}
            </li>
          )}

          {opciones.map((opcion, indice) => (
            <li
              key={opcion.tipo === 'usuario' ? `u-${opcion.usuario.id}` : `c-${opcion.correo}`}
              id={`${listaId}-${indice}`}
              role="option"
              aria-selected={indice === indiceActivo}
              // preventDefault en mousedown: evita el blur del input antes
              // del click (que cerraría la lista).
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => elegir(opcion)}
              onMouseEnter={() => setIndiceActivo(indice)}
              className={`cursor-pointer px-3 py-2 ${indice === indiceActivo ? 'bg-sena-soft' : ''}`}
            >
              {opcion.tipo === 'usuario' ? (
                <>
                  <span className="block text-ink">{opcion.usuario.nombre}</span>
                  <span className="block text-xs text-slate-500">{opcion.usuario.correo}</span>
                </>
              ) : (
                <span className="text-ink">
                  Agregar <span className="font-medium">{opcion.correo}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1 text-xs text-slate-500">
        {value.length} destinatario(s){lleno && ` — llegaste al máximo de ${maximo}`}. Con varios destinatarios se
        envía en copia oculta: nadie ve los correos de los demás.
      </p>
    </div>
  );
}