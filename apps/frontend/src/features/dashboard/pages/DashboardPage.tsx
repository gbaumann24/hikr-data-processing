import { PageHeader } from "@/shared/components/PageHeader";

export function DashboardPage() {
  return (
    <section className="page">
      <PageHeader
        description="A neutral starting point for workflow status, recent runs, and data quality signals."
        title="Dashboard"
      />
    </section>
  );
}
