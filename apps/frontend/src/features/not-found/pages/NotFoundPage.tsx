import { Link } from "react-router-dom";

import { routes } from "@/app/router/routes";
import { PageHeader } from "@/shared/components/PageHeader";

export function NotFoundPage() {
  return (
    <section className="page">
      <PageHeader description="The requested page does not exist." title="Page not found" />
      <Link className="text-link" to={routes.dashboard}>
        Back to dashboard
      </Link>
    </section>
  );
}
