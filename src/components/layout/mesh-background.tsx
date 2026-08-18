/**
 * Fondo con "orbes" de gradiente en movimiento lento — le da al panel de
 * cristal algo interesante que refractar (Skill 12: Glassmorphism).
 * Puramente decorativo: aria-hidden, no interactivo.
 */
export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-muted/40">
      <div className="absolute -top-24 -left-24 size-80 rounded-full bg-teal-400/40 blur-3xl animate-orb-float sm:size-96" />
      <div className="absolute top-1/3 -right-20 size-72 rounded-full bg-indigo-400/30 blur-3xl animate-orb-float-delay sm:size-80" />
      <div className="absolute -bottom-24 left-1/4 size-72 rounded-full bg-sky-300/30 blur-3xl animate-orb-float-slow sm:size-96" />
    </div>
  );
}
