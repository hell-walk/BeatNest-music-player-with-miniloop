/** Decorative animated night sky (three tiled, drifting layers). */
export default function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfield__layer starfield__stars" />
      <div className="starfield__layer starfield__twinkling" />
      <div className="starfield__layer starfield__clouds" />
    </div>
  );
}
