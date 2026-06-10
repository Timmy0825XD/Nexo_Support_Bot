export function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-tertiary/5 blur-[120px]" />
    </div>
  );
}
