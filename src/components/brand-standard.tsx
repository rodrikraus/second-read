// What this brand expects, shown next to the reply it is judged against.
export function BrandStandard({ name, voice, procedures }: { name: string; voice: string; procedures: string }) {
  const steps = procedures
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return (
    <section aria-labelledby="standard-heading" className="rounded-box border border-base-300 bg-base-100 px-5 py-4">
      <h2 id="standard-heading" className="text-sm font-semibold">
        The {name} standard
      </h2>
      <p className="mt-2 text-sm text-base-content/75">{voice}</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-base-content/75 marker:text-base-content/40">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
