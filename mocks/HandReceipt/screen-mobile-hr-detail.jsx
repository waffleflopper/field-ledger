// Mobile Hand Receipt detail / item list

function MobileHRDetail({ T, hrId, onBack, onOpenItem, onOpenUpload, onNav }) {
  const hr = HAND_RECEIPTS.find(h => h.id === hrId) || HAND_RECEIPTS[0];
  const items = ITEMS.filter(i => i.hr === hr.id);
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");

  const filtered = items.filter((it) => {
    if (filter === "out"     && it.status !== "signed_out") return false;
    if (filter === "storage" && it.status !== "in_storage") return false;
    if (filter === "due"     && !(it.requirements || []).some(r => r.overdue)) return false;
    if (q && !(it.nomenclature.toLowerCase() + " " + it.serial.toLowerCase() + " " + (it.ecn||"").toLowerCase()).includes(q.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: items.length,
    out: items.filter(i => i.status === "signed_out").length,
    storage: items.filter(i => i.status === "in_storage").length,
    due: items.filter(i => (i.requirements || []).some(r => r.overdue)).length,
  };

  return (
    <PhoneFrame
      T={T}
      headerBack onBack={onBack}
      sub={`HR · ${hr.code}`}
      title={hr.name}
      navActive="receipts"
      onNav={onNav}
      headerExtra={
        <button className="hr-touch hr-btn-press" style={{
          width: 36, height: 36, borderRadius: 6,
          border: `1px solid ${T.rule}`, background: T.surface, color: T.ink,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>{Icon.more(18)}</button>
      }
    >
      <div style={{ padding: "0 18px 16px" }}>

        {/* Receipt meta */}
        <div style={{
          background: T.surface, border: `1px solid ${T.rule}`,
          borderRadius: 6, padding: "12px 14px", marginBottom: 14,
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Items</div>
            <div className="hr-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{items.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Value</div>
            <div className="hr-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{fmtUSD(hr.valueUsd)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Updated</div>
            <div className="hr-tnum" style={{ fontSize: 14, fontWeight: 600 }}>{hr.lastUpdated.slice(5)}</div>
          </div>
          <div style={{ gridColumn: "1 / -1", paddingTop: 10, borderTop: `1px solid ${T.rule2}`,
            display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.ink3 }}>
            <span style={{ color: T.ink2, fontWeight: 600 }}>{hr.holder}</span>
            <span style={{ color: T.ink4 }}>·</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hr.parent}</span>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: T.surface, border: `1px solid ${T.rule}`,
          borderRadius: 6, padding: "0 12px", height: 38, marginBottom: 10,
        }}>
          <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.search(15)}</span>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search this receipt"
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: HR_FONT_SANS, fontSize: 13, color: T.ink, letterSpacing: "-0.005em",
            }}/>
        </div>

        {/* Filter chips */}
        <div className="hr-scroll" style={{
          display: "flex", gap: 6, overflowX: "auto", marginBottom: 10,
          marginLeft: -18, paddingLeft: 18, paddingRight: 18,
        }}>
          {[
            { id: "all", label: "All" },
            { id: "out", label: "Signed out" },
            { id: "storage", label: "In storage" },
            { id: "due", label: "Due / Overdue" },
          ].map((f) => {
            const active = f.id === filter;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} className="hr-touch hr-btn-press" style={{
                height: 28, padding: "0 10px",
                background: active ? T.ink : "transparent",
                color: active ? T.bg : T.ink2,
                border: `1px solid ${active ? T.ink : T.rule}`,
                borderRadius: 14,
                fontFamily: HR_FONT_SANS,
                fontSize: 12, fontWeight: 600, letterSpacing: "-0.005em",
                whiteSpace: "nowrap", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                {f.label}
                <span className="hr-mono" style={{
                  fontSize: 10, fontWeight: 700,
                  color: active ? T.bg : T.ink3,
                  opacity: 0.85,
                }}>{counts[f.id]}</span>
              </button>
            );
          })}
        </div>

        {/* Item list */}
        <div style={{
          background: T.surface, border: `1px solid ${T.rule}`,
          borderRadius: 6, overflow: "hidden",
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: 20, color: T.ink3, fontSize: 13, textAlign: "center" }}>No items match.</div>
          )}
          {filtered.map((it, idx) => {
            const sm = statusMeta(it.status, T);
            const c = it.signedTo ? CONTACTS.find(x => x.id === it.signedTo) : null;
            const overdueReq = (it.requirements || []).find(r => r.overdue);
            return (
              <button key={it.id} onClick={() => onOpenItem(it.id)}
                className="hr-touch hr-btn-press"
                style={{
                  display: "flex", flexDirection: "column", gap: 4,
                  width: "100%", padding: "11px 12px", textAlign: "left",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${T.rule2}` : "none",
                }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, width: "100%" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink,
                    letterSpacing: "-0.01em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    flex: 1, minWidth: 0,
                  }}>{it.nomenclature}</span>
                  <StatusDot color={sm.dot}/>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.ink3 }}>
                  <span className="hr-mono">{it.serial}</span>
                  {it.ecn && <><span style={{ color: T.ink4 }}>·</span><span className="hr-mono">{it.ecn}</span></>}
                  <span style={{ color: T.ink4 }}>·</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c ? `→ ${c.name}` : it.location}
                  </span>
                </div>
                {overdueReq && (
                  <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 13, fontSize: 9, fontWeight: 700,
                      background: T.danger, color: T.accentInk,
                      borderRadius: 2, letterSpacing: "0.04em",
                    }}>{reqIcon(overdueReq.kind)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.danger,
                      textTransform: "uppercase", letterSpacing: "0.02em" }}>
                      {dueLabel(overdueReq.due)} · {overdueReq.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAB cluster */}
      <div style={{
        flex: "0 0 auto",
        padding: "10px 14px 12px",
        borderTop: `1px solid ${T.rule}`,
        background: T.surface,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
      }}>
        <Btn T={T} icon={Icon.upload(15)} onClick={onOpenUpload}>Upload 2062</Btn>
        <Btn T={T} kind="primary" icon={Icon.plus(15)}>Add item</Btn>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { MobileHRDetail });
