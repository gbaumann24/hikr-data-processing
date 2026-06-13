import { Link } from "react-router-dom";

import { routes } from "@/app/router/routes";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Discover", to: "#" },
  { label: "Trails", to: "#" },
  { label: "Routes", to: "#" },
  { label: "Community", to: "#" },
  { label: "About", to: "#" },
];

interface TopNavProps {
  className?: string;
}

export function TopNav({ className }: TopNavProps) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 border-b border-zinc-200/80 bg-white/90 text-zinc-900 backdrop-blur-sm",
        className,
      )}
    >
      <div className="relative flex h-14 w-full items-center justify-between px-6 sm:px-10 lg:px-14">
        <Link
          to={routes.landing}
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[0.22em] uppercase text-zinc-900 transition-opacity hover:opacity-70"
        >
          <img
            src="/clmr-logo.png"
            alt=""
            aria-hidden="true"
            className="h-5 w-auto"
          />
          clmr
        </Link>

        <nav
          aria-label="Main navigation"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 sm:flex"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.to}
              className="text-[13px] font-medium text-zinc-600 transition-colors duration-150 hover:text-zinc-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          to={routes.dashboard}
          className="shrink-0 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-1.5 text-[13px] font-medium text-zinc-800 transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-100"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
