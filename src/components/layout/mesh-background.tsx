/**
 * Fondo con "orbes" de gradiente en movimiento lento — le da al panel de
 * cristal algo interesante que refractar (Skill 12: Glassmorphism).
 * Puramente decorativo: aria-hidden, no interactivo.
 */
export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-muted/40">
      <div
        className="absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black_10%,transparent_75%)]"
      />
      <div className="absolute -top-24 -left-24 size-96 rounded-full bg-teal-400/45 blur-3xl animate-orb-float sm:size-112" />
      <div className="absolute top-1/4 -right-24 size-88 rounded-full bg-indigo-400/35 blur-3xl animate-orb-float-delay sm:size-96" />
      <div className="absolute -bottom-28 left-1/4 size-88 rounded-full bg-sky-300/35 blur-3xl animate-orb-float-slow sm:size-112" />
      <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
    </div>
  );
}
