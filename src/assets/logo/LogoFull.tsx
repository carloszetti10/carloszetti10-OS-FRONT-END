import { LogoMark } from "./LogoMark";

interface LogoFullProps {
  className?: string;
  /** Mostra a linha "GESTÃO DE ORDENS DE SERVIÇO" abaixo do nome. Padrão: true. */
  comSubtitulo?: boolean;
}

/**
 * Lockup completo da marca (ícone + "NorteSys") para telas com mais espaço,
 * como a de login. Para espaços pequenos (sidebar recolhida, favicon, etc.)
 * use só o `LogoMark`.
 */
export function LogoFull({ className, comSubtitulo = true }: LogoFullProps) {
  return (
    <div className={className ? `flex items-center gap-3 ${className}` : "flex items-center gap-3"}>
      <LogoMark className="h-12 w-12 shrink-0" />
      <div className="text-left">
        <span className="block font-display text-2xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-white">
          NorteSys
        </span>
        {comSubtitulo && (
          <span className="block text-[11px] font-semibold tracking-[0.2em] text-brand-600">
            GESTÃO DE ORDENS DE SERVIÇO
          </span>
        )}
      </div>
    </div>
  );
}
