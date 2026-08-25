import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
}

export default function StatChip({ icon: Icon, label, value, accent = "text-brand" }: Props) {
  return (
    <div className="rounded-card bg-surface border border-border p-4 flex flex-col items-center gap-1.5 flex-1">
      <div className={`${accent}`}>
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <span className="text-text-muted text-xs">{label}</span>
      <span className="text-text-primary font-semibold">{value}</span>
    </div>
  );
}
