export function StatTile({
  label,
  value,
  detail,
  warning,
}: {
  label: string;
  value: string;
  detail?: React.ReactNode;
  warning?: string;
}) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 px-5 py-4">
      <p className="text-sm text-base-content/70">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-sm text-base-content/70">{detail}</p>}
      {warning && (
        <p className="mt-2 flex gap-2 rounded-field bg-warning/15 px-2.5 py-1.5 text-xs text-warning-content">
          <span aria-hidden="true">!</span>
          {warning}
        </p>
      )}
    </div>
  );
}
