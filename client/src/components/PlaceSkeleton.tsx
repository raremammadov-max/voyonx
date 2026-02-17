export default function PlaceSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 w-full rounded-xl bg-muted" />
      <div className="h-8 w-2/3 bg-muted rounded" />
      <div className="h-4 w-1/2 bg-muted rounded" />
      <div className="h-24 w-full bg-muted rounded" />
      <div className="h-12 w-40 bg-muted rounded-xl" />
    </div>
  );
}
