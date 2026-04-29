// Mobile Item Detail

function MobileItemDetail({ T, itemId, onBack, onNav }) {
  const it = ITEMS.find(i => i.id === itemId) || ITEMS[0];
  const hr = HAND_RECEIPTS.find(h => h.id === it.hr);
  const c = it.signedTo ? CONTACTS.find(x => x.id === it.signedTo) : null;
  const sm = statusMeta(it.status, T);

  return (
    <PhoneFrame
      T={T}
      headerBack onBack={onBack}
      sub={hr?.code}
      title={it.nomenclature.split(",")[0]}
      navActive="items"
      onNav={onNav}
      headerExtra={
        <button className="hr-touch hr-btn-press" style={{
          width: 36, height: 36, borderRadius: 6,
          border: `1px solid ${T.rule}`, background: T.surface, color: T.ink,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>{Icon.more(18)}</button>
      }
    >
      <div style={{ padding: "0 18px 24px" }}>

        {/* Identity strip */}
        <div style={{
          background: T.surface, border: `1px solid ${T.rule}`,
          borderRadius: 6, padding: "14px 14px 12px", marginBottom: 14,
        }}>
          <div style={{ fontSize: 13, color: T.ink2, marginBottom: 10, letterSpacing: "-0.005em", lineHeight: 1.35 }}>
            {it.nomenclature}
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 10, columnGap: 12,
            paddingTop: 10, borderTop: `1px solid ${T.rule2}`,
          }}>
            <Field T={T} label="NSN" value={it.nsn} mono />
            <Field T={T} label="Serial" value={it.serial} mono />
            <Field T={T} label="ECN" value={it.ecn || "—"} mono />
            <Field T={T} label="App ID" value={it.appId} mono />
            <Field T={T} label="Value" value={fmtUSD(it.valueUsd)} />
            <Field T={T} label="Last seen" value={it.lastSeen.slice(5)} />
          </div>
        </div>

        {/* Status & sign-out */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14,
        }}>
          <div style={{
            background: T.surface, border: `1px solid ${T.rule}`,
            borderRadius: 6, padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color={sm.dot}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{sm.label}</span>
            </div>
          </div>
          <div style={{
            background: T.surface, border: `1px solid ${T.rule}`,
            borderRadius: 6, padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Location</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.loc(13)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.location}</span>
            </div>
          </div>
        </div>

        {/* Signed to */}
        {c && (
          <div style={{
            background: T.surface, border: `1px solid ${T.rule}`,
            borderRadius: 6, padding: "12px 14px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 19,
              background: T.accent, color: T.accentInk,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700,
            }}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 1 }}>Signed to</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>{c.name}</div>
              <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>
                {c.role} · since {it.signedDate.slice(5)} · {Math.abs(daysFromToday(it.signedDate))}d
              </div>
            </div>
          </div>
        )}

        {/* Requirements */}
        {it.requirements && it.requirements.length > 0 && (
          <>
            <SectionHeader T={T} label="Recurring requirements" count={it.requirements.length}/>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, marginBottom: 14, overflow: "hidden",
            }}>
              {it.requirements.map((r, idx) => (
                <div key={idx} style={{
                  padding: "10px 12px",
                  borderBottom: idx < it.requirements.length - 1 ? `1px solid ${T.rule2}` : "none",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 16, fontSize: 9.5, fontWeight: 700,
                    background: r.overdue ? T.danger : T.surface2,
                    color: r.overdue ? T.accentInk : T.ink3,
                    border: `1px solid ${r.overdue ? T.danger : T.rule}`,
                    borderRadius: 2, letterSpacing: "0.04em",
                  }}>{reqIcon(r.kind)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: "-0.005em" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>Every {r.every}</div>
                  </div>
                  <div style={{
                    fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em",
                    color: r.overdue ? T.danger : T.ink3,
                    textTransform: "uppercase",
                  }}>{dueLabel(r.due)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* History */}
        {it.history && it.history.length > 0 && (
          <>
            <SectionHeader T={T} label="History" />
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, marginBottom: 14, overflow: "hidden",
            }}>
              {it.history.map((h, idx) => (
                <div key={idx} style={{
                  padding: "9px 12px",
                  borderBottom: idx < it.history.length - 1 ? `1px solid ${T.rule2}` : "none",
                  display: "flex", alignItems: "baseline", gap: 10,
                }}>
                  <span className="hr-mono hr-tnum" style={{ fontSize: 11, color: T.ink3, width: 40, flex: "0 0 auto" }}>
                    {h.date.slice(5)}
                  </span>
                  <span style={{ fontSize: 13, color: T.ink, flex: 1 }}>{h.action}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky footer actions */}
      <div style={{
        flex: "0 0 auto",
        padding: "10px 14px 12px",
        borderTop: `1px solid ${T.rule}`,
        background: T.surface,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
      }}>
        <Btn T={T} kind="default" size="md" icon={Icon.upload(15)}>Upload 2062</Btn>
        <Btn T={T} kind="primary" size="md" icon={Icon.check(15)}>
          {it.status === "signed_out" ? "Sign in" : "Sign out"}
        </Btn>
      </div>
    </PhoneFrame>
  );
}

function Field({ T, label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div className={mono ? "hr-mono hr-tnum" : "hr-tnum"} style={{
        fontSize: mono ? 12.5 : 13, fontWeight: 600, color: T.ink,
        letterSpacing: mono ? "-0.005em" : "-0.005em",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{value}</div>
    </div>
  );
}

Object.assign(window, { MobileItemDetail });
