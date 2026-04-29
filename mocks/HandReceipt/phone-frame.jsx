// Phone shell + bottom nav for mobile screens
// Pure CSS bezel — keeps it light, focuses on UI

function PhoneFrame({ T, title, sub, children, navActive = "dashboard", onNav, hideNav = false, headerExtra, headerBack, onBack, footer, statusBar = true }) {
  const W = 390, H = 800;
  return (
    <div className="hr-root" style={{
      width: W, height: H,
      background: T.bg, color: T.ink,
      borderRadius: 36,
      border: `1px solid ${T.rule}`,
      boxShadow: `0 1px 0 rgba(255,255,255,.6) inset, 0 30px 60px -30px rgba(0,0,0,.3)`,
      overflow: "hidden",
      position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      {/* Status bar */}
      {statusBar && (
        <div style={{
          height: 44, padding: "0 24px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          paddingBottom: 8, fontSize: 13, fontWeight: 600, color: T.ink,
          flex: "0 0 auto",
        }}>
          <span>9:41</span>
          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
            <span style={{ display: "inline-flex", gap: 1.5, alignItems: "flex-end" }}>
              <span style={{ width: 3, height: 4, background: T.ink, borderRadius: 0.5 }}/>
              <span style={{ width: 3, height: 6, background: T.ink, borderRadius: 0.5 }}/>
              <span style={{ width: 3, height: 8, background: T.ink, borderRadius: 0.5 }}/>
              <span style={{ width: 3, height: 10, background: T.ink, borderRadius: 0.5 }}/>
            </span>
            <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
              <path d="M1 3.5a8 8 0 0 1 11 0M3 5.5a5 5 0 0 1 7 0M5 7.5a2 2 0 0 1 3 0" stroke={T.ink} strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span style={{
              width: 22, height: 11, border: `1px solid ${T.ink}`, borderRadius: 2.5, position: "relative",
              padding: 1.5,
            }}>
              <span style={{ display: "block", height: "100%", width: "85%", background: T.ink, borderRadius: 1 }}/>
              <span style={{ position: "absolute", right: -3, top: 3.5, width: 1.5, height: 4, background: T.ink, borderRadius: 1 }}/>
            </span>
          </span>
        </div>
      )}

      {/* Top header */}
      {(title || headerBack) && (
        <div style={{
          padding: "8px 18px 14px",
          display: "flex", alignItems: "center", gap: 10,
          flex: "0 0 auto",
        }}>
          {headerBack && (
            <button onClick={onBack} className="hr-touch hr-btn-press" style={{
              width: 32, height: 32, marginLeft: -8,
              background: "transparent", border: "none", color: T.ink,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              borderRadius: 6,
            }}>
              {Icon.back(20)}
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {sub && <div style={{ fontSize: 11, fontWeight: 600, color: T.ink3, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>{sub}</div>}
            {title && <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{title}</div>}
          </div>
          {headerExtra}
        </div>
      )}

      {/* Body */}
      <div className="hr-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </div>

      {footer}

      {/* Bottom nav */}
      {!hideNav && (
        <div style={{
          flex: "0 0 auto",
          borderTop: `1px solid ${T.rule}`,
          background: T.surface,
          paddingBottom: 18,
          display: "flex",
        }}>
          {[
            { id: "dashboard",  label: "Dashboard", icon: Icon.grid(20) },
            { id: "items",      label: "Items",     icon: Icon.search(20) },
            { id: "receipts",   label: "Receipts",  icon: Icon.doc(20) },
            { id: "more",       label: "More",      icon: Icon.menu(20) },
          ].map((n) => {
            const active = n.id === navActive;
            return (
              <button key={n.id} onClick={() => onNav && onNav(n.id)}
                className="hr-touch hr-btn-press"
                style={{
                  flex: 1, height: 56,
                  background: "transparent", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 3, color: active ? T.ink : T.ink3,
                  fontFamily: HR_FONT_SANS, fontSize: 10.5, fontWeight: 600,
                  position: "relative",
                }}>
                {active && <span style={{ position: "absolute", top: 0, left: "50%", marginLeft: -16, width: 32, height: 2, background: T.accent }}/>}
                {n.icon}
                <span style={{ letterSpacing: "0.01em" }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PhoneFrame });
