type BadgeType = "HOT" | "SPECIAL" | "LIMITED";

const styles: Record<BadgeType, string> = {
  HOT: "bg-brand text-white",
  // Violet reserved deliberately for this one badge — see design spec.
  SPECIAL: "bg-special text-white",
  LIMITED: "bg-gold text-background",
};

export default function Badge({ type }: { type: BadgeType }) {
  return (
    <span
      className={`absolute -top-2 right-3 px-2 py-0.5 rounded-pill text-[10px] font-bold tracking-wide ${styles[type]}`}
    >
      {type}
    </span>
  );
}
