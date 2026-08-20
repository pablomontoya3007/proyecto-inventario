<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Auth::attempt verifica el email/password contra la tabla users
     * (comparando el hash, gracias al cast 'password' => 'hashed' del
     * modelo). Si coincide, se emite un token de Sanctum — el cliente
     * (React) lo guarda y lo manda como "Authorization: Bearer {token}"
     * en cada petición a las rutas protegidas del siguiente paso.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->validated())) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        /** @var User $usuario */
        $usuario = Auth::user();
        $token = $usuario->createToken('token-api')->plainTextToken;

        return response()->json([
            'usuario' => new UserResource($usuario),
            'token' => $token,
        ]);
    }

    /**
     * Revoca SOLO el token con el que se hizo esta petición, no todos los
     * tokens del usuario — así cerrar sesión en un dispositivo no cierra
     * sesión en los demás.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['mensaje' => 'Sesión cerrada correctamente.']);
    }

    public function usuarioActual(Request $request): JsonResponse
    {
        return response()->json([
            'usuario' => new UserResource($request->user()),
        ]);
    }
}
