import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/features/landing/pages/LandingPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { NotFoundPage } from "@/features/not-found/pages/NotFoundPage";
import { RunsPage } from "@/features/runs/pages/RunsPage";
import { WorkflowsPage } from "@/features/workflows/pages/WorkflowsPage";

import { routes } from "./routes";

export const router = createBrowserRouter([
  {
    path: routes.landing,
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/app",
    element: <AppShell />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "workflows",
        element: <WorkflowsPage />,
      },
      {
        path: "runs",
        element: <RunsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
