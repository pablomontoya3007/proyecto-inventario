<?php

namespace App\Http\Controllers;

use App\Http\Requests\UsuarioRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Gestión de usuarios DENTRO del sistema. No existe registro público:
 * solo alguien con sesión iniciada puede crear cuentas nuevas.
 */
class UsuarioController extends Controller
{
    /**
     * Filtros (opcionales y combinables): nombre, correo, fecha_desde y
     * fecha_hasta (sobre la fecha de registro), y buscar — un solo
     * término que coincide con nombre O correo (lo usa el selector de
     * destinatarios de Correos). observaciones_count viaja siempre: el
     * frontend lo usa para deshabilitar "Eliminar".
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $usuarios = User::query()
            ->withCount('observaciones')
            ->when($request->filled('nombre'), fn ($q) => $q->where('name', 'like', '%' . $request->input('nombre') . '%'))
            ->when($request->filled('correo'), fn ($q) => $q->where('email', 'like', '%' . $request->input('correo') . '%'))
            // Agrupado en where(fn...): sin el paréntesis, el orWhere se
            // escaparía de los demás filtros.
            ->when($request->filled('buscar'), function ($q) use ($request) {
                $termino = '%' . $request->input('buscar') . '%';

                $q->where(fn ($sub) => $sub->where('name', 'like', $termino)->orWhere('email', 'like', $termino));
            })
            ->when($request->filled('fecha_desde'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('fecha_desde')))
            ->when($request->filled('fecha_hasta'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('fecha_hasta')))
            ->orderBy('name')
            ->paginate(15);

        return UserResource::collection($usuarios);
    }

    public function store(UsuarioRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $datos = $request->validated();

        // El cast 'hashed' del modelo cifra la contraseña al asignarla.
        $usuario = User::create([
            'name' => $datos['nombre'],
            'email' => $datos['correo'],
            'password' => $datos['password'],
        ]);

        return (new UserResource($usuario->loadCount('observaciones')))->response()->setStatusCode(201);
    }

    public function update(UsuarioRequest $request, User $usuario): UserResource
    {
        $this->authorize('update', $usuario);

        $datos = $request->validated();
        $cambiaPassword = !empty($datos['password']);

        $usuario->fill([
            'name' => $datos['nombre'],
            'email' => $datos['correo'],
        ]);

        if ($cambiaPassword) {
            $usuario->password = $datos['password'];
        }

        $usuario->save();

        if ($cambiaPassword) {
            $this->cerrarSesiones($usuario, $request);
        }

        return new UserResource($usuario->loadCount('observaciones'));
    }

    /**
     * Los tokens de Sanctum no tienen llave foránea hacia users, así que
     * hay que borrarlos a mano: si no, quedarían huérfanos en la BD.
     */
    public function destroy(User $usuario): JsonResponse
    {
        $this->authorize('delete', $usuario);

        DB::transaction(function () use ($usuario) {
            $usuario->tokens()->delete();
            $usuario->delete();
        });

        return response()->json(['mensaje' => 'Usuario eliminado correctamente.']);
    }

    /**
     * Tras un cambio de contraseña, la anterior debe dejar de servir de
     * inmediato: se revocan los tokens del usuario. Si alguien cambia su
     * PROPIA contraseña, se conserva el token de esta petición para no
     * sacarlo de la sesión que está usando.
     */
    private function cerrarSesiones(User $usuario, Request $request): void
    {
        $tokenActual = $request->user()->currentAccessToken();
        $esElMismo = $usuario->is($request->user());

        $usuario->tokens()
            ->when(
                $esElMismo && $tokenActual instanceof PersonalAccessToken,
                fn ($q) => $q->whereKeyNot($tokenActual->id)
            )
            ->delete();
    }
}