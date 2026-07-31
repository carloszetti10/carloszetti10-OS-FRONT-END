interface LogoMarkProps {
  className?: string;
}

/**
 * Ícone da marca NorteSys — as "asas"/chifres em "V" da identidade visual
 * oficial (nova logomarca), em branco sobre o verde da marca (#195746).
 *
 * É autocontido: já traz fundo e cantos arredondados, então basta
 * controlar o tamanho via className (ex.: "h-8 w-8", "h-11 w-11").
 * Usado em telas como Sidebar, Login, RegistrarFotos e AssinaturaPublica.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NorteSys">
      <rect width="100" height="100" rx="22" fill="#195746" />
      <path
        d="M18 26
           C 31 32, 41 46, 48 63
           C 49 67, 50 70.5, 50 75
           C 50 70.5, 51 67, 52 63
           C 59 46, 69 32, 82 26
           C 71 39, 61 54, 54 68
           C 52.3 71.5, 51 73.5, 50 75
           C 49 73.5, 47.7 71.5, 46 68
           C 39 54, 29 39, 18 26 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
