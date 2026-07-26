import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ itens }: { itens: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
      {itens.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
