export function ManagerAtmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute -top-48 -left-24 h-[500px] w-[500px] rounded-full bg-primary opacity-15 blur-[80px]" />
      <div
        className="absolute -right-20 bottom-10 h-[400px] w-[400px] rounded-full bg-secondary opacity-15 blur-[80px]"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="absolute top-1/3 left-1/3 h-[300px] w-[300px] rounded-full bg-tertiary opacity-10 blur-[80px]"
        style={{ animationDelay: '-10s' }}
      />
    </div>
  );
}
