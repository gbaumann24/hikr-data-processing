import { NavLink, Outlet } from "react-router-dom";

import { routes } from "@/app/router/routes";
import type { NavigationItem } from "@/shared/types/navigation";

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", to: routes.dashboard },
  { label: "Workflows", to: routes.workflows },
  { label: "Runs", to: routes.runs },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <a className="app-shell__brand" href={routes.landing}>
          CLMR
        </a>
        <nav className="app-shell__nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? "app-shell__link app-shell__link--active" : "app-shell__link"
              }
              end={item.to === routes.dashboard}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
