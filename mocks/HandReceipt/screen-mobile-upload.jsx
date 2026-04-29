// Mobile 2062 Upload flow — multi-step
// Steps: 1) source HR / single item, 2) upload file, 3) link items, 4) confirm

function MobileUpload2062({ T, originItemId, onBack, onNav }) {
  const originItem = originItemId ? ITEMS.find(i => i.id === originItemId) : null;
  const flow = originItem ? "single" : "multi";

  const [step, setStep] = React.useState(1);
  const [hrId, setHrId] = React.useState(originItem ? originItem.hr : "hr-arms");
  const [file, setFile] = React.useState(null);
  const [contact, setContact] = React.useState("c1");
  const [selected, setSelected] = React.useState(originItem ? new Set([originItem.id]) : new Set());

  const hr = HAND_RECEIPTS.find(h => h.id === hrId);
  const hrItems = ITEMS.filter(i => i.hr === hrId);
  const c = CONTACTS.find(x => x.id === contact);

  const next = () => setStep(s => Math.min(4, s + 1));
  const prev = () => step === 1 ? onBack() : setStep(s => s - 1);

  const toggle = (id) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const stepLabels = ["Source", "Upload", "Link items", "Confirm"];

  return (
    <PhoneFrame
      T={T}
      headerBack onBack={prev}
      sub={flow === "single" ? "Quick assign" : "Multi-item assign"}
      title="Upload DA 2062"
      hideNav
      footer={
        <div style={{
          flex: "0 0 auto",
          padding: "10px 14px 16px",
          borderTop: `1px solid ${T.rule}`,
          background: T.surface,
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 8,
        }}>
          <Btn T={T} kind="ghost" onClick={prev}>{step === 1 ? "Cancel" : "Back"}</Btn>
          <Btn T={T} kind="primary" onClick={step === 4 ? onBack : next}
            icon={step === 4 ? Icon.check(15) : null}>
            {step === 4 ? "File 2062" : "Continue"}
          </Btn>
        </div>
      }
    >
      <div style={{ padding: "0 18px 24px" }}>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {stepLabels.map((l, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  height: 3, borderRadius: 2,
                  background: done ? T.accent : active ? T.ink : T.rule,
                  marginBottom: 5,
                }}/>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                  color: active ? T.ink : T.ink3,
                  textTransform: "uppercase",
                }}>{idx}. {l}</div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Source */}
        {step === 1 && (
          <>
            {flow === "single" && originItem && (
              <div style={{
                background: T.surface, border: `1px solid ${T.rule}`,
                borderRadius: 6, padding: "12px 14px", marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Item</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>{originItem.nomenclature}</div>
                <div style={{ fontSize: 11, color: T.ink3, marginTop: 3 }} className="hr-mono">{originItem.serial} · {originItem.ecn || "—"}</div>
              </div>
            )}

            <SectionHeader T={T} label={flow === "single" ? "From hand receipt" : "Source hand receipt"}/>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, marginBottom: 16, overflow: "hidden",
            }}>
              {HAND_RECEIPTS.map((h, idx) => {
                const sel = h.id === hrId;
                return (
                  <button key={h.id} onClick={() => setHrId(h.id)}
                    className="hr-touch hr-btn-press"
                    disabled={flow === "single"}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "12px 14px", textAlign: "left",
                      background: sel ? T.surface2 : "transparent",
                      border: "none", cursor: flow === "single" ? "not-allowed" : "pointer",
                      borderBottom: idx < HAND_RECEIPTS.length - 1 ? `1px solid ${T.rule2}` : "none",
                      opacity: flow === "single" && !sel ? 0.4 : 1,
                    }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 9,
                      border: `2px solid ${sel ? T.accent : T.rule}`,
                      background: sel ? T.accent : "transparent",
                      flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sel && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.accentInk }}/>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, letterSpacing: "-0.005em" }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }} className="hr-mono">{h.code} · {h.itemCount} items</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <SectionHeader T={T} label="Sign to"/>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, padding: "10px 12px", marginBottom: 8,
            }}>
              <select value={contact} onChange={(e) => setContact(e.target.value)} style={{
                width: "100%", padding: "6px 0", border: "none", outline: "none",
                background: "transparent", fontFamily: HR_FONT_SANS, fontSize: 14,
                fontWeight: 600, color: T.ink, letterSpacing: "-0.005em",
              }}>
                {CONTACTS.map(c => <option key={c.id} value={c.id}>{c.name} — {c.role}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 11, color: T.ink3, padding: "0 4px" }}>
              The recipient will be recorded as the signed-to contact for these items until signed back in.
            </div>
          </>
        )}

        {/* STEP 2: Upload */}
        {step === 2 && (
          <>
            <button onClick={() => setFile(file ? null : { name: "DA2062_signout_alvarez.pdf", size: "412 KB", pages: 2 })}
              className="hr-touch hr-btn-press"
              style={{
                width: "100%", marginBottom: 14,
                background: T.surface, border: `1.5px dashed ${file ? T.accent : T.rule}`,
                borderRadius: 6, padding: "32px 18px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                cursor: "pointer", color: T.ink2,
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                background: file ? T.accent : T.surface2,
                color: file ? T.accentInk : T.ink2,
                border: `1px solid ${file ? T.accent : T.rule}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{file ? Icon.check(20) : Icon.upload(20)}</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, letterSpacing: "-0.01em" }}>
                  {file ? file.name : "Tap to upload PDF or photo"}
                </div>
                <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 3 }}>
                  {file ? `${file.size} · ${file.pages} pages · scanned` : "DA Form 2062 · max 8 MB"}
                </div>
              </div>
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <SourceTile T={T} icon={Icon.camera(18)} label="Photo" sub="Camera"/>
              <SourceTile T={T} icon={Icon.doc(18)} label="From files" sub="PDF / image"/>
            </div>

            <SectionHeader T={T} label="Recent uploads"/>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, overflow: "hidden",
            }}>
              {RECENT_2062.map((f, idx) => (
                <div key={f.id} style={{
                  padding: "10px 12px",
                  borderBottom: idx < RECENT_2062.length - 1 ? `1px solid ${T.rule2}` : "none",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.doc(15)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="hr-mono" style={{ fontSize: 11.5, color: T.ink, fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.filename}</div>
                    <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{f.items} items · {f.signedTo}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 3: Link items */}
        {step === 3 && (
          <>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, padding: "10px 12px", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.doc(15)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hr-mono" style={{ fontSize: 11, color: T.ink, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file?.name || "DA2062_signout_alvarez.pdf"}
                </div>
                <div style={{ fontSize: 10.5, color: T.ink3 }}>{hr?.name}</div>
              </div>
              <Tag T={T} tone="olive">{selected.size} linked</Tag>
            </div>

            <div style={{ fontSize: 12, color: T.ink3, marginBottom: 10, padding: "0 4px" }}>
              Select the items covered by this 2062. Selected items will be marked signed-out to <span style={{ color: T.ink2, fontWeight: 600 }}>{c?.name}</span>.
            </div>

            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, overflow: "hidden",
            }}>
              {hrItems.map((it, idx) => {
                const sel = selected.has(it.id);
                const sm = statusMeta(it.status, T);
                return (
                  <button key={it.id} onClick={() => toggle(it.id)}
                    className="hr-touch hr-btn-press"
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "10px 12px", textAlign: "left",
                      background: sel ? T.surface2 : "transparent",
                      border: "none", cursor: "pointer",
                      borderBottom: idx < hrItems.length - 1 ? `1px solid ${T.rule2}` : "none",
                    }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 4,
                      border: `1.5px solid ${sel ? T.accent : T.rule}`,
                      background: sel ? T.accent : "transparent",
                      flex: "0 0 auto",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: T.accentInk,
                    }}>
                      {sel && Icon.check(13)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink,
                        letterSpacing: "-0.005em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nomenclature}</div>
                      <div style={{ fontSize: 10.5, color: T.ink3, display: "flex", gap: 5, marginTop: 1 }}>
                        <span className="hr-mono">{it.serial}</span>
                        <span style={{ color: T.ink4 }}>·</span>
                        <StatusDot color={sm.dot} size={5}/>
                        <span>{sm.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 4: Confirm */}
        {step === 4 && (
          <>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, padding: "16px 14px", marginBottom: 14,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>You are about to file</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
                {selected.size} item{selected.size !== 1 ? "s" : ""} signed to {c?.name}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 8, columnGap: 14, fontSize: 12 }}>
                <span style={{ color: T.ink3 }}>Form</span>
                <span className="hr-mono" style={{ color: T.ink, fontWeight: 600 }}>{file?.name || "DA2062_signout_alvarez.pdf"}</span>
                <span style={{ color: T.ink3 }}>HR</span>
                <span style={{ color: T.ink, fontWeight: 600 }}>{hr?.name} <span className="hr-mono" style={{ color: T.ink3 }}>({hr?.code})</span></span>
                <span style={{ color: T.ink3 }}>Recipient</span>
                <span style={{ color: T.ink, fontWeight: 600 }}>{c?.name}</span>
                <span style={{ color: T.ink3 }}>Date</span>
                <span className="hr-mono" style={{ color: T.ink, fontWeight: 600 }}>2026-04-27</span>
              </div>
            </div>

            <SectionHeader T={T} label="Items in this 2062" count={selected.size}/>
            <div style={{
              background: T.surface, border: `1px solid ${T.rule}`,
              borderRadius: 6, overflow: "hidden",
            }}>
              {[...selected].slice(0, 6).map((id, idx, arr) => {
                const it = ITEMS.find(i => i.id === id);
                if (!it) return null;
                return (
                  <div key={id} style={{
                    padding: "9px 12px",
                    borderBottom: idx < arr.length - 1 ? `1px solid ${T.rule2}` : "none",
                    display: "flex", alignItems: "baseline", gap: 8,
                  }}>
                    <span className="hr-mono hr-tnum" style={{ fontSize: 10.5, color: T.ink3, width: 22 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span style={{ flex: 1, fontSize: 12.5, color: T.ink, fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.nomenclature}
                    </span>
                    <span className="hr-mono" style={{ fontSize: 10.5, color: T.ink3 }}>{it.serial}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </PhoneFrame>
  );
}

function SourceTile({ T, icon, label, sub }) {
  return (
    <button className="hr-touch hr-btn-press" style={{
      padding: "12px 12px",
      background: T.surface, border: `1px solid ${T.rule}`,
      borderRadius: 6, cursor: "pointer", textAlign: "left",
      display: "flex", alignItems: "center", gap: 10, color: T.ink,
    }}>
      <span style={{ color: T.accent, display: "inline-flex" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>{label}</div>
        <div style={{ fontSize: 11, color: T.ink3, marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

Object.assign(window, { MobileUpload2062 });
