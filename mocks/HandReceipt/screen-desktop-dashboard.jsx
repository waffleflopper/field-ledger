// Desktop Dashboard

function DesktopDashboard({ T, collapsed, onToggle, onNav, onOpenItem, onOpenHR }) {
  const overdue   = REQ_QUEUE.filter(r => r.overdue);
  const upcoming  = REQ_QUEUE.filter(r => !r.overdue).slice(0, 5);
  const signedOut = ITEMS.filter(i => i.status === "signed_out");

  return (
    <DesktopFrame T={T} navActive="dashboard" collapsed={collapsed} onToggle={onToggle} onNav={onNav}>
      {/* Top bar */}
      <div style={{
        height: 56, padding: "0 24px",
        borderBottom: `1px solid ${T.rule}`,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10,
          background: T.surface2, border: `1px solid ${T.rule}`,
          borderRadius: 6, height: 34, padding: "0 12px", maxWidth: 480,
        }}>
          <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.search(15)}</span>
          <input placeholder="Search items, NSN, ECN, serial across all hand receipts…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: HR_FONT_SANS, fontSize: 13, color: T.ink }}/>
          <span className="hr-mono" style={{ fontSize: 10.5, color: T.ink3,
            border: `1px solid ${T.rule}`, padding: "1px 5px", borderRadius: 3 }}>⌘K</span>
        </div>
        <Btn T={T} kind="default" size="sm" icon={Icon.upload(14)}>Upload 2062</Btn>
        <Btn T={T} kind="primary" size="sm" icon={Icon.plus(14)}>Add item</Btn>
      </div>

      <div className="hr-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 32px" }}>
        {/* Page header */}
        <div style={{ marginBottom: 18, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Mon · 27 Apr 2026</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em" }}>Good morning, Jose.</div>
          </div>
          <div style={{ fontSize: 12, color: T.ink3, display: "flex", gap: 14 }}>
            <span><span style={{ color: T.ink, fontWeight: 600 }} className="hr-tnum">{ITEMS.length}</span> items</span>
            <span><span style={{ color: T.ink, fontWeight: 600 }} className="hr-tnum">{HAND_RECEIPTS.length}</span> hand receipts</span>
            <span><span style={{ color: T.ink, fontWeight: 600 }} className="hr-tnum">{fmtUSD(HAND_RECEIPTS.reduce((s,h)=>s+h.valueUsd,0))}</span> on the books</span>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          background: T.surface, border: `1px solid ${T.rule}`, borderRadius: 6,
          marginBottom: 18,
        }}>
          {[
            { v: overdue.length, l: "Overdue requirements", danger: overdue.length > 0, sub: "across 3 items" },
            { v: upcoming.length, l: "Due this week", sub: "scheduled" },
            { v: signedOut.length, l: "Signed out", sub: "to 5 holders" },
            { v: "1", l: "Unfiled 2062s", sub: "needs review" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "14px 18px",
              borderRight: i < 3 ? `1px solid ${T.rule2}` : "none",
            }}>
              <div className="hr-tnum" style={{
                fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em",
                color: s.danger ? T.danger : T.ink, lineHeight: 1,
              }}>{s.v}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.ink2, marginTop: 8 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Two column */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>

          {/* Requirements */}
          <div style={{
            background: T.surface, border: `1px solid ${T.rule}`,
            borderTop: `2px solid ${overdue.length ? T.danger : T.rule}`,
            borderRadius: 6, overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: `1px solid ${T.rule2}`,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, letterSpacing: "0.06em", textTransform: "uppercase" }}>Requirements</span>
                <span className="hr-mono" style={{ fontSize: 11, color: T.ink3 }}>{overdue.length + upcoming.length}</span>
              </div>
              <span style={{ fontSize: 12, color: T.ink3, fontWeight: 500, cursor: "pointer" }}>View all →</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: HR_FONT_SANS }}>
              <thead>
                <tr style={{ background: T.surface2 }}>
                  <th style={thStyle(T)}>Type</th>
                  <th style={thStyle(T)}>Requirement</th>
                  <th style={thStyle(T)}>Item</th>
                  <th style={thStyle(T, "right")}>Due</th>
                </tr>
              </thead>
              <tbody>
                {[...overdue, ...upcoming].map((r, idx, arr) => (
                  <tr key={r.id} onClick={() => onOpenItem(r.item.id)}
                    style={{
                      cursor: "pointer",
                      borderTop: idx > 0 ? `1px solid ${T.rule2}` : "none",
                    }}>
                    <td style={tdStyle(T, { width: 56 })}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 26, height: 16, fontSize: 9.5, fontWeight: 700,
                        background: r.overdue ? T.danger : T.surface2,
                        color: r.overdue ? T.accentInk : T.ink3,
                        border: `1px solid ${r.overdue ? T.danger : T.rule}`,
                        borderRadius: 2, letterSpacing: "0.04em",
                      }}>{reqIcon(r.kind)}</span>
                    </td>
                    <td style={tdStyle(T)}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{r.label}</div>
                      <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>every {r.every}</div>
                    </td>
                    <td style={tdStyle(T)}>
                      <div style={{ fontSize: 12.5, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>
                        {r.item.nomenclature.split(",")[0]}
                      </div>
                      <div className="hr-mono" style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{r.item.serial}</div>
                    </td>
                    <td style={{ ...tdStyle(T, { width: 100 }), textAlign: "right" }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em",
                        color: r.overdue ? T.danger : T.ink2,
                        textTransform: "uppercase",
                      }}>{dueLabel(r.due)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Hand receipts */}
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${T.rule2}`,
                fontSize: 12, fontWeight: 700, color: T.ink,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Hand receipts</div>
              {HAND_RECEIPTS.map((h, idx) => (
                <button key={h.id} onClick={() => onOpenHR(h.id)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 14px", textAlign: "left",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderTop: idx > 0 ? `1px solid ${T.rule2}` : "none",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, letterSpacing: "-0.005em" }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }} className="hr-mono">{h.code}</div>
                  </div>
                  <div className="hr-tnum" style={{ fontSize: 12.5, fontWeight: 600, color: T.ink2 }}>{h.itemCount}</div>
                  <span style={{ color: T.ink4 }}>{Icon.chev(13)}</span>
                </button>
              ))}
            </div>

            {/* Signed out preview */}
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, overflow: "hidden",
            }}>
              <div style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${T.rule2}`,
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, letterSpacing: "0.06em", textTransform: "uppercase" }}>Signed out</span>
                <span className="hr-mono" style={{ fontSize: 11, color: T.ink3 }}>{signedOut.length}</span>
              </div>
              {signedOut.slice(0, 4).map((it, idx) => {
                const c = CONTACTS.find(x => x.id === it.signedTo);
                return (
                  <button key={it.id} onClick={() => onOpenItem(it.id)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 14px", textAlign: "left",
                    background: "transparent", border: "none", cursor: "pointer",
                    borderTop: idx > 0 ? `1px solid ${T.rule2}` : "none",
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 13,
                      background: T.surface2, border: `1px solid ${T.rule}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9.5, fontWeight: 700, color: T.ink2,
                    }}>{c?.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, letterSpacing: "-0.005em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nomenclature.split(",")[0]}</div>
                      <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{c?.name}</div>
                    </div>
                    <span className="hr-mono" style={{ fontSize: 10, color: T.ink3 }}>{Math.abs(daysFromToday(it.signedDate))}d</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

function thStyle(T, align) {
  return {
    padding: "8px 14px",
    fontSize: 10, fontWeight: 700, color: T.ink3,
    letterSpacing: "0.06em", textTransform: "uppercase",
    textAlign: align || "left",
    borderBottom: `1px solid ${T.rule2}`,
  };
}
function tdStyle(T, extra) {
  return {
    padding: "10px 14px",
    fontSize: 12.5, color: T.ink,
    verticalAlign: "middle",
    ...extra,
  };
}

Object.assign(window, { DesktopDashboard, thStyle, tdStyle });
