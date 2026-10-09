import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/students", label: "Students & Subjects" },
  { to: "/mark", label: "Mark Attendance" },
  { to: "/reports", label: "Reports" },
  { to: "/about", label: "About" },
] as const;

function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="bg-shell text-shell-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link to="/" className="font-mono text-lg font-semibold">
          Attend<span className="text-accent">Ease</span>
        </Link>
        <span className="ml-auto text-xs text-shell-foreground/70">
          College Attendance Management · Mini Project
        </span>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={`whitespace-nowrap rounded-t-md px-4 py-2 text-sm ${
              pathname === n.to
                ? "bg-background text-foreground"
                : "text-shell-foreground/70 hover:text-shell-foreground"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function NotFoundComponent() {
  return (
    <div className="max-w-md text-center">
      <h1 className="text-7xl font-bold text-foreground">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="max-w-md text-center">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        This page didn't load
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
