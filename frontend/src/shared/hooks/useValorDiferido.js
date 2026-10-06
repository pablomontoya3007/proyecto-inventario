import { useEffect, useState } from 'react';

/**
 * Devuelve `valor` con retraso: solo se actualiza cuando deja de cambiar
 * durante `espera` ms. Sirve para no consultar al servidor en cada tecla.
 */
export function useValorDiferido(valor, espera = 400) {
    const [diferido, setDiferido] = useState(valor);

    useEffect(() => {
        const temporizador = setTimeout(() => setDiferido(valor), espera);
        return () => clearTimeout(temporizador);
    }, [valor, espera]);

    return diferido;
}