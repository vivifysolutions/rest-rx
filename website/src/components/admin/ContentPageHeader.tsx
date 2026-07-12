export function ContentPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="admin-page-header">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
