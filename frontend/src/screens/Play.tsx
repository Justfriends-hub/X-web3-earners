import { Gamepad2 } from "lucide-react";

export default function Play() {
  return (
    <div className="px-4 pt-4 pb-28">
      <h1 className="text-text-primary font-display text-2xl font-bold mb-4">Play Games</h1>

      <div className="rounded-card bg-surface border border-border p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
          <Gamepad2 size={24} className="text-white" />
        </div>
        <h2 className="text-text-primary font-semibold">Games are coming soon</h2>
        <p className="text-text-muted text-sm max-w-xs">
          This is where bonus mini-games will live as a second way to earn SHIB.
          Keep completing tasks in the meantime.
        </p>
      </div>
    </div>
  );
}
