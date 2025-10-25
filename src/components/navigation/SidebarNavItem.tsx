import type { SidebarNavItemProps } from "@/types";

/**
 * Pojedynczy element nawigacyjny w Sidebar
 * Wyświetla link z opcjonalną ikoną i etykietą
 */
export const SidebarNavItem = ({ label, href, icon, isActive }: SidebarNavItemProps) => {
  // Generate data-testid from href (e.g., "/app/generator" -> "nav-generator")
  const testId = `nav-${href.split("/").pop()}`;

  return (
    <li>
      <a
        data-testid={testId}
        href={href}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }
        `}
        aria-current={isActive ? "page" : undefined}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{label}</span>
      </a>
    </li>
  );
};
