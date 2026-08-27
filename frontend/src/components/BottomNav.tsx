import { useEffect } from "react";

export type Tab = "home" | "earn" | "play" | "refer" | "account";

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const items: { id: Tab; label: string; bx: string }[] = [
  { id: "home", label: "Home", bx: "bx-home-alt" },
  { id: "earn", label: "Earn", bx: "bx-list-ul" },
  { id: "play", label: "Play", bx: "bx-joystick" },
  { id: "refer", label: "Refer", bx: "bx-gift" },
  { id: "account", label: "Account", bx: "bx-user" },
];

export default function BottomNav({ active, onChange }: Props) {
  useEffect(() => {
    const id = "boxicons-cdn";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      <style>{`
        @import url('https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css');
        .liquid-nav-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: end;
          padding: 0 12px 14px 12px;
          padding-bottom: max(14px, env(safe-area-inset-bottom));
          pointer-events: none;
          z-index: 50;
        }
        .liquid-navigation {
          --primary-bg: #262321;
          --body-bg: #1C1917;
          position: relative;
          width: 400px;
          max-width: 100%;
          height: 70px;
          background: var(--primary-bg);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 10px;
          box-shadow: 0 15px 25px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          pointer-events: auto;
        }
        .liquid-navigation ul {
          display: flex;
          width: 350px;
          max-width: 100%;
          position: relative;
        }
        .liquid-navigation ul li {
          position: relative;
          list-style: none;
          width: 70px;
          height: 70px;
          z-index: 1;
          flex: 1 1 0;
        }
        .liquid-navigation ul li a {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          width: 100%;
          height: 100%;
          text-align: center;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .liquid-navigation ul li a .icon {
          position: relative;
          display: block;
          line-height: 75px;
          font-size: 1.5em;
          text-align: center;
          transition: 0.5s;
          color: #fff;
        }
        .liquid-navigation ul li.active a .icon {
          transform: translateY(-28px);
          color: #fff;
        }
        .liquid-navigation ul li a .text {
          position: absolute;
          color: #fff;
          font-weight: 400;
          font-size: 0.75em;
          letter-spacing: 0.05em;
          transition: 0.5s;
          opacity: 0;
          transform: translateY(20px);
          white-space: nowrap;
          font-family: 'Poppins', sans-serif;
        }
        .liquid-navigation ul li.active a .text {
          opacity: 1;
          transform: translateY(10px);
        }
        .liquid-indicator {
          position: absolute;
          top: -50%;
          width: 56px;
          height: 56px;
          background: #EA580C;
          border-radius: 50%;
          border: 5px solid var(--body-bg);
          transition: 0.5s;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(234,88,12,0.4);
        }
        .liquid-indicator::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -22px;
          width: 20px;
          height: 20px;
          background: transparent;
          border-top-right-radius: 20px;
          box-shadow: 1px -10px 0 0 var(--body-bg);
        }
        .liquid-indicator::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -22px;
          width: 20px;
          height: 20px;
          background: transparent;
          border-top-left-radius: 20px;
          box-shadow: -1px -10px 0 0 var(--body-bg);
        }
        .liquid-navigation ul li:nth-child(1).active ~ .liquid-indicator { transform: translateX(calc(70px * 0)); }
        .liquid-navigation ul li:nth-child(2).active ~ .liquid-indicator { transform: translateX(calc(70px * 1)); }
        .liquid-navigation ul li:nth-child(3).active ~ .liquid-indicator { transform: translateX(calc(70px * 2)); }
        .liquid-navigation ul li:nth-child(4).active ~ .liquid-indicator { transform: translateX(calc(70px * 3)); }
        .liquid-navigation ul li:nth-child(5).active ~ .liquid-indicator { transform: translateX(calc(70px * 4)); }
        @media (max-width: 360px) {
          .liquid-navigation ul { width: 100%; }
          .liquid-navigation ul li { width: auto; }
          .liquid-indicator { width: 60px; height: 60px; }
          .liquid-navigation ul li:nth-child(1).active ~ .liquid-indicator { transform: translateX(calc(20% * 0)); }
          .liquid-navigation ul li:nth-child(2).active ~ .liquid-indicator { transform: translateX(calc(20% * 5)); }
        }
      `}</style>

      <div className="liquid-nav-wrap">
        <div className="liquid-navigation">
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className={`list ${active === item.id ? "active" : ""}`}
                onClick={() => onChange(item.id)}
              >
                <a onClick={(e) => e.preventDefault()}>
                  <span className="icon">
                    <i className={`bx ${item.bx}`} />
                  </span>
                  <span className="text">{item.label}</span>
                </a>
              </li>
            ))}
            <div className="liquid-indicator" />
          </ul>
        </div>
      </div>
    </>
  );
}
