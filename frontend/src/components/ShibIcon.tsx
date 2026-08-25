interface Props {
  size?: number;
  className?: string;
}

/**
 * The app's currency glyph — a consistent mark used everywhere a SHIB
 * amount appears (balance card, task rewards, leaderboard), same role the
 * reference app's diamond icon played.
 */
export default function ShibIcon({ size = 20, className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-light to-brand text-white font-display font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      S
    </div>
  );
}
