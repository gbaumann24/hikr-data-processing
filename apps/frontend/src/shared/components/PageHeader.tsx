type PageHeaderProps = {
  description?: string;
  title: string;
};

export function PageHeader({ description, title }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </header>
  );
}
