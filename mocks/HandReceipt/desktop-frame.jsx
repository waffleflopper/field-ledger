// Desktop frame — collapsible left sidebar + content area

function DesktopFrame({ T, navActive = "dashboard", onNav, collapsed, onToggle, children, width = 1200, height = 760 }) {
  const sbW = collapsed ? 64 : 220;
  return (
    <div className="hr-root" style={{
      width, height,
      background: T.bg, color: T.ink,
      border: `1px solid ${T.rule}`,
      borderRadius: 10,
      boxShadow: `0 1px 0 rgba(255,255,255,.6) inset, 0 30px 60px -30px rgba(0,0,0,.3)`,
      overflow: "hidden",
      display: "flex",
    }}>
      {/* Sidebar */}
      <div style={{
        width: sbW, flex: "0 0 auto",
        borderRight: `1px solid ${T.rule}`,
        background: T.surface,
        display: "flex", flexDirection: "column",
        transition: "width .2s",
      }}>
        <div style={{
          height: 56, padding: collapsed ? "0" : "0 18px",
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
          borderBottom: `1px solid ${T.rule}`,
        }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 4,
                background: T.accent, color: T.accentInk,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, letterSpacing: "-0.02em",
              }}>HR</div>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>HandReceipt</span>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: 28, height: 28, borderRadius: 4,
              background: T.accent, color: T.accentInk,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, letterSpacing: "-0.02em",
            }}>HR</div>
          )}
          {!collapsed && (
            <button onClick={onToggle} style={{
              width: 26, height: 26, padding: 0,
              background: "transparent", border: "none", color: T.ink3, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4,
            }}>{Icon.menu(16)}</button>
          )}
        </div>

        <div style={{ padding: collapsed ? "10px 8px" : "10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: Icon.grid(16) },
            { id: "items",     label: "Items",     icon: Icon.search(16) },
            { id: "receipts",  label: "Hand receipts", icon: Icon.doc(16) },
            { id: "contacts",  label: "Contacts",  icon: Icon.user(16) },
            { id: "uploads",   label: "2062 archive", icon: Icon.upload(16) },
            { id: "history",   label: "History",   icon: Icon.history(16) },
          ].map((n) => {
            const active = n.id === navActive;
            return (
              <button key={n.id} onClick={() => onNav && onNav(n.id)}
                title={collapsed ? n.label : undefined}
                className="hr-btn-press"
                style={{
                  height: 36, padding: collapsed ? 0 : "0 12px",
                  background: active ? T.surface2 : "transparent",
                  border: "none", borderRadius: 5, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
                  gap: 10, color: active ? T.ink : T.ink2,
                  fontFamily: HR_FONT_SANS, fontSize: 13, fontWeight: active ? 600 : 500,
                  letterSpacing: "-0.005em",
                  position: "relative",
                }}>
                {active && !collapsed && <span style={{
                  position: "absolute", left: 0, top: 8, bottom: 8, width: 2, background: T.accent, borderRadius: 1,
                }}/>}
                <span style={{ color: active ? T.accent : T.ink3, display: "inline-flex" }}>{n.icon}</span>
                {!collapsed && <span>{n.label}</span>}
              </button>
            );
          })}
        </div>

        {/* User chip */}
        <div style={{
          padding: collapsed ? 8 : 12,
          borderTop: `1px solid ${T.rule}`,
        }}>
          {!collapsed ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16,
                background: T.accent, color: T.accentInk,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
              }}>JM</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, letterSpacing: "-0.005em" }}>SGT MORALES, J.</div>
                <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }} className="hr-mono">DODID ··3148</div>
              </div>
            </div>
          ) : (
            <button onClick={onToggle} style={{
              width: "100%", height: 32,
              background: "transparent", border: "none", color: T.ink3, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4,
            }}>{Icon.menu(16)}</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { DesktopFrame });
