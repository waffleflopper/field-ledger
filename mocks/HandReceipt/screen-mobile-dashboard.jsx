// Mobile Dashboard
// Priority: 1) overdue/upcoming requirements, 2) quick actions, 3) signed-out

function MobileDashboard({ T, onOpenItem, onOpenHR, onOpenAdd, onOpenUpload, onNav }) {
  const overdue   = REQ_QUEUE.filter(r => r.overdue);
  const upcoming  = REQ_QUEUE.filter(r => !r.overdue).slice(0, 3);
  const signedOut = ITEMS.filter(i => i.status === "signed_out");

  const [doneIds, setDoneIds] = React.useState(new Set());
  const isDone = (id) => doneIds.has(id);
  const toggleDone = (id) => {
    const n = new Set(doneIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setDoneIds(n);
  };

  return (
    <PhoneFrame
      T={T}
      sub="Mon · 27 Apr 2026"
      title="Dashboard"
      navActive="dashboard"
      onNav={onNav}
      headerExtra={
        <button className="hr-touch hr-btn-press" style={{
          width: 38, height: 38, borderRadius: 19,
          border: `1px solid ${T.rule}`, background: T.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.ink, position: "relative", cursor: "pointer",
        }}>
          {Icon.bell(18)}
          <span style={{
            position: "absolute", top: 6, right: 7,
            width: 7, height: 7, borderRadius: "50%", background: T.danger,
            border: `1.5px solid ${T.surface}`,
          }}/>
        </button>
      }
    >
      <div style={{ padding: "0 18px 24px" }}>

        {/* Quick stats — 4-up, sober */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
          background: T.surface, border: `1px solid ${T.rule}`,
          borderRadius: 6, marginBottom: 18,
        }}>
          {[
            { v: ITEMS.length, l: "Items" },
            { v: HAND_RECEIPTS.length, l: "HRs" },
            { v: signedOut.length, l: "Out" },
            { v: overdue.length, l: "Due", danger: overdue.length > 0 },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "12px 8px", textAlign: "center",
              borderRight: i < 3 ? `1px solid ${T.rule2}` : "none",
            }}>
              <div className="hr-tnum" style={{
                fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em",
                color: s.danger ? T.danger : T.ink,
                lineHeight: 1,
              }}>{s.v}</div>
              <div style={{
                fontSize: 10, fontWeight: 600, color: T.ink3,
                letterSpacing: "0.06em", textTransform: "uppercase",
                marginTop: 5,
              }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Overdue section */}
        <SectionHeader T={T} label="Requirements" count={overdue.length + upcoming.length} action="View all" />
        <div style={{
          background: T.surface, border: `1px solid ${T.rule}`,
          borderTop: `2px solid ${overdue.length ? T.danger : T.rule}`,
          borderRadius: 6, marginBottom: 18, overflow: "hidden",
        }}>
          {overdue.length === 0 && upcoming.length === 0 && (
            <div style={{ padding: 16, color: T.ink3, fontSize: 13, textAlign: "center" }}>
              All caught up.
            </div>
          )}
          {overdue.map((r, idx) => (
            <ReqRow key={r.id} T={T} r={r} done={isDone(r.id)} onToggle={() => toggleDone(r.id)}
              onOpen={() => onOpenItem(r.item.id)}
              border={idx < overdue.length - 1 || upcoming.length > 0} />
          ))}
          {upcoming.map((r, idx) => (
            <ReqRow key={r.id} T={T} r={r} done={isDone(r.id)} onToggle={() => toggleDone(r.id)}
              onOpen={() => onOpenItem(r.item.id)}
              border={idx < upcoming.length - 1} />
          ))}
        </div>

        {/* Quick actions */}
        <SectionHeader T={T} label="Quick actions" />
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18,
        }}>
          <QuickAction T={T} icon={Icon.upload(18)} label="Upload 2062" onClick={onOpenUpload}/>
          <QuickAction T={T} icon={Icon.plus(18)}   label="Add item"     onClick={onOpenAdd}/>
          <QuickAction T={T} icon={Icon.qr(18)}     label="Scan ECN" />
          <QuickAction T={T} icon={Icon.search(18)} label="Global search" onClick={() => onNav && onNav("items")}/>
        </div>

        {/* Signed out */}
        <SectionHeader T={T} label="Signed out" count={signedOut.length} action="See all" />
        <div style={{
          background: T.surface, border: `1px solid ${T.rule}`,
          borderRadius: 6, overflow: "hidden",
        }}>
          {signedOut.map((it, idx) => {
            const c = CONTACTS.find(x => x.id === it.signedTo);
            const days = Math.abs(daysFromToday(it.signedDate));
            return (
              <button key={it.id} onClick={() => onOpenItem(it.id)}
                className="hr-touch hr-btn-press"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 12px", textAlign: "left",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: idx < signedOut.length - 1 ? `1px solid ${T.rule2}` : "none",
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: T.surface2, border: `1px solid ${T.rule}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: T.ink2,
                }}>{c?.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.nomenclature}
                  </div>
                  <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>
                    {c?.name} · {days}d ago
                  </div>
                </div>
                <span className="hr-mono" style={{ fontSize: 10.5, color: T.ink3 }}>{it.serial}</span>
                <span style={{ color: T.ink4 }}>{Icon.chev(14)}</span>
              </button>
            );
          })}
        </div>

      </div>
    </PhoneFrame>
  );
}

function SectionHeader({ T, label, count, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      marginBottom: 8, marginTop: 4,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.ink2,
          letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        {count != null && <span className="hr-mono hr-tnum" style={{ fontSize: 11, color: T.ink4 }}>{count}</span>}
      </div>
      {action && <span style={{ fontSize: 12, color: T.ink3, fontWeight: 500 }}>{action}</span>}
    </div>
  );
}

function ReqRow({ T, r, done, onToggle, onOpen, border }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px",
      borderBottom: border ? `1px solid ${T.rule2}` : "none",
      opacity: done ? 0.5 : 1,
    }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="hr-touch hr-btn-press"
        style={{
          width: 22, height: 22, flex: "0 0 auto",
          borderRadius: 4, border: `1.5px solid ${done ? T.accent : T.rule}`,
          background: done ? T.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.accentInk, cursor: "pointer", padding: 0,
        }}>
        {done && Icon.check(13)}
      </button>
      <button onClick={onOpen} style={{
        flex: 1, minWidth: 0, textAlign: "left",
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 1 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 14, fontSize: 9, fontWeight: 700,
            background: T.surface2, color: T.ink3,
            border: `1px solid ${T.rule}`, borderRadius: 2,
            letterSpacing: "0.04em",
          }}>{reqIcon(r.kind)}</span>
          <span style={{
            fontSize: 13, fontWeight: 600, color: T.ink,
            letterSpacing: "-0.01em",
            textDecoration: done ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1, minWidth: 0,
          }}>
            {r.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: T.ink3, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.item.nomenclature.split(",")[0]}
          </span>
          <span style={{ color: T.ink4 }}>·</span>
          <span className="hr-mono" style={{ fontSize: 10.5 }}>{r.item.serial}</span>
        </div>
      </button>
      <span style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em",
        color: r.overdue ? T.danger : T.ink3,
        textAlign: "right", whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}>
        {dueLabel(r.due)}
      </span>
    </div>
  );
}

function QuickAction({ T, icon, label, onClick }) {
  return (
    <button onClick={onClick} className="hr-touch hr-btn-press" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 14px",
      background: T.surface, border: `1px solid ${T.rule}`,
      color: T.ink, fontSize: 13, fontWeight: 600,
      fontFamily: HR_FONT_SANS, letterSpacing: "-0.005em",
      borderRadius: 6, cursor: "pointer", textAlign: "left",
    }}>
      <span style={{ color: T.accent, display: "inline-flex" }}>{icon}</span>
      {label}
    </button>
  );
}

Object.assign(window, { MobileDashboard });
