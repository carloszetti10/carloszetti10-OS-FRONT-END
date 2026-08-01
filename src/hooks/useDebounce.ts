import { useEffect, useState } from "react";

/**
 * Devolve `valor`, mas só depois de ficar `atrasoMs` sem mudar.
 * Usado pra não disparar uma busca no servidor a cada tecla digitada
 * (ex.: campo de busca da listagem de OS) — espera a pessoa parar de
 * digitar por um instante antes de mandar a requisição.
 */
export function useDebounce<T>(valor: T, atrasoMs = 400): T {
  const [valorComAtraso, setValorComAtraso] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setValorComAtraso(valor), atrasoMs);
    return () => clearTimeout(timer);
  }, [valor, atrasoMs]);

  return valorComAtraso;
}
