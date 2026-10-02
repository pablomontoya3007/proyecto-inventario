import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from '../hooks/useUsuarios';
import { UsuarioTable } from '../components/UsuarioTable';
import { UsuarioForm } from '../components/UsuarioForm';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Modal } from '../../../shared/components/Modal';

const CAMPO =
  'rounded border border-slate-300 px-3 py-2 text-sm focus:border-sena focus:outline-none focus:ring-1 focus:ring-sena';

export function UsuariosPage() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [nombreFiltro, setNombreFiltro] = useState('');
  const [correoFiltro, setCorreoFiltro] = useState('');
  const [fechaDesdeFiltro, setFechaDesdeFiltro] = useState('');
  const [fechaHastaFiltro, setFechaHastaFiltro] = useState('');

  const [editingUsuario, setEditingUsuario] = useState(null);
  const [deletingUsuario, setDeletingUsuario] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const filtros = {
    ...(nombreFiltro ? { nombre: nombreFiltro } : {}),
    ...(correoFiltro ? { correo: correoFiltro } : {}),
    ...(fechaDesdeFiltro ? { fecha_desde: fechaDesdeFiltro } : {}),
    ...(fechaHastaFiltro ? { fecha_hasta: fechaHastaFiltro } : {}),
  };
  const hayFiltrosActivos = Object.keys(filtros).length > 0;

  const { data, isLoading, isError } = useUsuarios({ page, filtros });
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();

  const serverErrors = createUsuario.error?.response?.data?.errors ?? updateUsuario.error?.response?.data?.errors;

  // reset(): que los errores de un intento anterior no aparezcan al
  // abrir el formulario de nuevo (o el de otro usuario).
  function abrirFormulario(usuario) {
    createUsuario.reset();
    updateUsuario.reset();
    setEditingUsuario(usuario);
  }

  function handleLimpiarFiltros() {
    setNombreFiltro('');
    setCorreoFiltro('');
    setFechaDesdeFiltro('');
    setFechaHastaFiltro('');
    setPage(1);
  }

  function handleSubmit(payload) {
    if (editingUsuario?.id) {
      updateUsuario.mutate({ id: editingUsuario.id, payload }, { onSuccess: () => setEditingUsuario(null) });
    } else {
      createUsuario.mutate(payload, { onSuccess: () => setEditingUsuario(null) });
    }
  }

  function handleConfirmDelete() {
    if (!deletingUsuario) return;

    setDeleteError(null);
    deleteUsuario.mutate(deletingUsuario.id, {
      onSuccess: () => setDeletingUsuario(null),
      onError: (error) => {
        // 403 trae el motivo exacto desde UserPolicy (Response::deny).
        setDeleteError(
          error.response?.status === 403
            ? (error.response.data?.message ?? 'No se puede eliminar este usuario.')
            : 'No se pudo eliminar el usuario. Intenta de nuevo.'
        );
      },
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Usuarios</h1>
        <button
          onClick={() => abrirFormulario({})}
          className="rounded bg-sena px-4 py-2 text-sm font-medium text-white hover:bg-sena-dark"
        >
          Agregar usuario
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="filtro_usuario_nombre" className="block text-xs text-slate-500">
            Nombre
          </label>
          <input
            id="filtro_usuario_nombre"
            type="text"
            placeholder="Buscar por nombre..."
            value={nombreFiltro}
            onChange={(event) => {
              setNombreFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_usuario_correo" className="block text-xs text-slate-500">
            Correo
          </label>
          <input
            id="filtro_usuario_correo"
            type="text"
            placeholder="Buscar por correo..."
            value={correoFiltro}
            onChange={(event) => {
              setCorreoFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_usuario_desde" className="block text-xs text-slate-500">
            Registrado desde
          </label>
          <input
            id="filtro_usuario_desde"
            type="date"
            value={fechaDesdeFiltro}
            max={fechaHastaFiltro || undefined}
            onChange={(event) => {
              setFechaDesdeFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        <div>
          <label htmlFor="filtro_usuario_hasta" className="block text-xs text-slate-500">
            Registrado hasta
          </label>
          <input
            id="filtro_usuario_hasta"
            type="date"
            value={fechaHastaFiltro}
            min={fechaDesdeFiltro || undefined}
            onChange={(event) => {
              setFechaHastaFiltro(event.target.value);
              setPage(1);
            }}
            className={CAMPO}
          />
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="pb-2 text-sm text-slate-500 underline hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando usuarios...</p>}
      {isError && <p className="text-sm text-danger">No se pudieron cargar los usuarios.</p>}

      {data && (
        <>
          <div className="rounded border border-slate-200 bg-white p-4">
            <UsuarioTable
              usuarios={data.data}
              usuarioActualId={user?.id}
              onEdit={abrirFormulario}
              onDelete={(usuario) => {
                setDeleteError(null);
                setDeletingUsuario(usuario);
              }}
            />
          </div>

          {data.meta && data.meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
                Anterior
              </button>
              <span>
                Página {data.meta.current_page} de {data.meta.last_page}
              </span>
              <button
                disabled={page >= data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {editingUsuario !== null && (
        <Modal
          title={editingUsuario.id ? 'Editar usuario' : 'Agregar usuario'}
          onClose={() => setEditingUsuario(null)}
        >
          <UsuarioForm
            initialValues={editingUsuario.id ? editingUsuario : null}
            onSubmit={handleSubmit}
            onCancel={() => setEditingUsuario(null)}
            isSubmitting={createUsuario.isPending || updateUsuario.isPending}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deletingUsuario}
        title="¿Eliminar este usuario?"
        description={
          deleteError ??
          `Esta acción no se puede deshacer${
            deletingUsuario ? `: "${deletingUsuario.nombre}"` : ''
          }. La persona ya no podrá iniciar sesión.`
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUsuario(null)}
        isLoading={deleteUsuario.isPending}
      />
    </div>
  );
}