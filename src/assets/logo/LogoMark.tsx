interface LogoMarkProps {
  className?: string;
}

/**
 * Ícone da marca NorteSys — uma prancheta com checklist, nas cores da
 * identidade visual (verde, mesma paleta do tailwind.config `brand`).
 *
 * É autocontido: já traz fundo em gradiente e cantos arredondados, então
 * basta controlar o tamanho via className (ex.: "h-8 w-8", "h-11 w-11").
 * Substitui o antigo bloco `bg-brand-600` + ícone da lucide-react usado em
 * telas como Sidebar, Login, RegistrarFotos e AssinaturaPublica.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NorteSys">
      <defs>
        <linearGradient id="nortesys-mark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22b06b" />
          <stop offset="100%" stopColor="#126e46" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#nortesys-mark-gradient)" />
      <rect x="27" y="16" width="46" height="68" rx="6" fill="#FFFFFF" />
      <rect x="38" y="10" width="24" height="10" rx="4" fill="#0f4831" />
      <line x1="35" y1="40" x2="65" y2="40" stroke="#22b06b" strokeWidth="5" strokeLinecap="round" />
      <line x1="35" y1="52" x2="58" y2="52" stroke="#b8f5d3" strokeWidth="5" strokeLinecap="round" />
      <line x1="35" y1="64" x2="65" y2="64" stroke="#b8f5d3" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 78 L69 62 L64 78 L78 73 Z" fill="#126e46" />
      <circle cx="64" cy="73" r="2" fill="#FFFFFF" />
    </svg>
  );
}
