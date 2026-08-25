import { Home, ListChecks, Gamepad2, Gift, User } from "lucide-react";

export type Tab = "home" | "earn" | "play" | "refer" | "account";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const items: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "earn", label: "Earn", icon: ListChecks },
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "refer", label: "Refer", icon: Gift },
  { id: "account", label: "Account", icon: User },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-bottom bg-surface border-t border-border">
      <div className="max-w-md mx-auto flex items-end justify-between px-4 pt-2 pb-2 relative">
        {items.map((item) => {
          const isActive = active === item.id;
          const isCenter = item.id === "play";
          const Icon = item.icon;

          if (isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="flex flex-col items-center gap-1 -mt-6 active:scale-95 transition-transform"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                    isActive
                      ? "bg-gradient-to-br from-brand-light to-brand"
                      : "bg-gradient-to-br from-brand to-brand-light"
                  }`}
                >
                  <Icon size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] text-text-muted">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-1 py-1 px-2 active:scale-95 transition-transform"
            >
              <Icon
                size={22}
                strokeWidth={1.75}
                className={isActive ? "text-brand" : "text-text-muted"}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "text-brand font-medium" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
