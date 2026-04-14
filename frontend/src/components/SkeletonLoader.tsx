export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-skeleton">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-cream-200 rounded-md" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 animate-skeleton space-y-3">
      <div className="h-40 bg-cream-200 rounded-lg" />
      <div className="h-5 bg-cream-200 rounded w-3/4" />
      <div className="h-4 bg-cream-200 rounded w-1/2" />
      <div className="h-8 bg-cream-200 rounded-lg" />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="card p-5 animate-skeleton space-y-3">
      <div className="h-4 bg-cream-200 rounded w-1/2" />
      <div className="h-8 bg-cream-200 rounded w-2/3" />
      <div className="h-3 bg-cream-200 rounded w-1/3" />
    </div>
  );
}
