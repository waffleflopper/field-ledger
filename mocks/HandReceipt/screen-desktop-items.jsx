// Desktop Item Management / Search

function DesktopItems({ T, collapsed, onToggle, onNav, onOpenItem }) {
  const [q, setQ] = React.useState("");
  const [hrFilter, setHrFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState(ITEMS[2].id);

  const filtered = ITEMS.filter((it) => {
    if (hrFilter !== "all" && it.hr !== hrFilter) return false;
    if (statusFilter !== "all" && it.status !== statusFilter) return false;
    if (q) {
      const blob = `${it.nomenclature} ${it.serial} ${it.nsn} ${it.ecn || ""} ${it.appId} ${it.location}`.toLowerCase();
      if (!blob.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const sel = ITEMS.find(i => i.id === selectedId) || filtered[0];
  const selHr = sel ? HAND_RECEIPTS.find(h => h.id === sel.hr) : null;
  const selContact = sel?.signedTo ? CONTACTS.find(c => c.id === sel.signedTo) : null;
  const selSm = sel ? statusMeta(sel.status, T) : null;

  return (
    <DesktopFrame T={T} navActive="items" collapsed={collapsed} onToggle={onToggle} onNav={onNav}>
      <div style={{
        height: 56, padding: "0 24px",
        borderBottom: `1px solid ${T.rule}`,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10,
          background: T.surface2, border: `1px solid ${T.rule}`,
          borderRadius: 6, height: 34, padding: "0 12px", maxWidth: 520,
        }}>
          <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.search(15)}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search across all hand receipts — nomenclature, serial, NSN, ECN, location"
            autoFocus
            style={{ flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: HR_FONT_SANS, fontSize: 13, color: T.ink }}/>
          {q && <button onClick={() => setQ("")} style={{
            background: "transparent", border: "none", color: T.ink3, cursor: "pointer", padding: 2,
          }}>{Icon.x(13)}</button>}
        </div>
        <Btn T={T} kind="default" size="sm" icon={Icon.upload(14)}>Upload 2062</Btn>
        <Btn T={T} kind="primary" size="sm" icon={Icon.plus(14)}>Add item</Btn>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* Filters rail */}
        <div style={{
          width: 200, flex: "0 0 auto",
          borderRight: `1px solid ${T.rule}`,
          padding: "16px 14px",
          overflowY: "auto",
        }}>
          <FilterGroup T={T} label="Hand receipt"
            options={[{ id: "all", label: "All", count: ITEMS.length },
              ...HAND_RECEIPTS.map(h => ({ id: h.id, label: h.name, count: ITEMS.filter(i => i.hr === h.id).length }))]}
            value={hrFilter} onChange={setHrFilter}/>
          <FilterGroup T={T} label="Status"
            options={[
              { id: "all", label: "Any", count: ITEMS.length },
              { id: "in_storage", label: "In storage", count: ITEMS.filter(i => i.status==="in_storage").length },
              { id: "signed_out", label: "Signed out", count: ITEMS.filter(i => i.status==="signed_out").length },
              { id: "in_use", label: "In use", count: ITEMS.filter(i => i.status==="in_use").length },
              { id: "maintenance", label: "Maintenance", count: ITEMS.filter(i => i.status==="maintenance").length },
            ]}
            value={statusFilter} onChange={setStatusFilter}/>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 18, marginBottom: 8 }}>Quick filters</div>
          {[
            { label: "Has overdue requirement" },
            { label: "Sensitive items only" },
            { label: "Missing serial" },
            { label: "No ECN assigned" },
          ].map(f => (
            <label key={f.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 0", fontSize: 12, color: T.ink2, cursor: "pointer",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${T.rule}`, background: T.surface,
                flex: "0 0 auto",
              }}/>
              {f.label}
            </label>
          ))}
        </div>

        {/* Result table */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: "10px 18px",
            borderBottom: `1px solid ${T.rule}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 12, color: T.ink3,
          }}>
            <span><span className="hr-tnum" style={{ color: T.ink, fontWeight: 600 }}>{filtered.length}</span> {filtered.length === 1 ? "result" : "results"}{q && <> for <span className="hr-mono" style={{ color: T.ink2 }}>"{q}"</span></>}</span>
            <span style={{ display: "flex", gap: 12 }}>
              <span style={{ cursor: "pointer" }}>Export CSV</span>
              <span style={{ cursor: "pointer" }}>Bulk sign-out</span>
            </span>
          </div>
          <div className="hr-scroll" style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: HR_FONT_SANS }}>
              <thead style={{ position: "sticky", top: 0, background: T.bg, zIndex: 1 }}>
                <tr>
                  <th style={thStyle(T, "left")}>Nomenclature</th>
                  <th style={thStyle(T, "left")}>Serial / ECN</th>
                  <th style={thStyle(T, "left")}>HR</th>
                  <th style={thStyle(T, "left")}>Status / Holder</th>
                  <th style={thStyle(T, "left")}>Location</th>
                  <th style={thStyle(T, "right")}>Value</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const sm = statusMeta(it.status, T);
                  const c = it.signedTo ? CONTACTS.find(x => x.id === it.signedTo) : null;
                  const hr = HAND_RECEIPTS.find(h => h.id === it.hr);
                  const overdue = (it.requirements || []).find(r => r.overdue);
                  const isSel = it.id === sel?.id;
                  return (
                    <tr key={it.id} onClick={() => setSelectedId(it.id)}
                      style={{
                        cursor: "pointer",
                        background: isSel ? T.surface2 : "transparent",
                        borderBottom: `1px solid ${T.rule2}`,
                      }}>
                      <td style={tdStyle(T)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {overdue && <span title={overdue.label} style={{
                            width: 6, height: 6, borderRadius: 3, background: T.danger, flex: "0 0 auto",
                          }}/>}
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink,
                              letterSpacing: "-0.005em", maxWidth: 280,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nomenclature}</div>
                            <div className="hr-mono" style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{it.nsn}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle(T)}>
                        <div className="hr-mono" style={{ fontSize: 11.5, color: T.ink, fontWeight: 600 }}>{it.serial}</div>
                        {it.ecn && <div className="hr-mono" style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{it.ecn}</div>}
                      </td>
                      <td style={tdStyle(T)}>
                        <div style={{ fontSize: 11.5, color: T.ink2, letterSpacing: "-0.005em" }}>{hr?.name}</div>
                        <div className="hr-mono" style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{hr?.code}</div>
                      </td>
                      <td style={tdStyle(T)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StatusDot color={sm.dot}/>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.ink }}>{sm.label}</span>
                        </div>
                        {c && <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>→ {c.name}</div>}
                      </td>
                      <td style={tdStyle(T)}>
                        <div style={{ fontSize: 11.5, color: T.ink2, display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ color: T.ink3, display: "inline-flex" }}>{Icon.loc(11)}</span>
                          {it.location}
                        </div>
                      </td>
                      <td style={{ ...tdStyle(T), textAlign: "right" }}>
                        <span className="hr-tnum" style={{ fontSize: 11.5, fontWeight: 600, color: T.ink2 }}>{fmtUSD(it.valueUsd)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail rail */}
        {sel && (
          <div style={{
            width: 300, flex: "0 0 auto",
            borderLeft: `1px solid ${T.rule}`,
            background: T.surface,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${T.rule2}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>{selHr?.code}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{sel.nomenclature}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Tag T={T}><StatusDot color={selSm.dot} size={6}/><span style={{ marginLeft: 4 }}>{selSm.label}</span></Tag>
                {(sel.requirements || []).some(r => r.overdue) && <Tag T={T} tone="danger">Overdue</Tag>}
              </div>
            </div>
            <div className="hr-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 12, columnGap: 12, marginBottom: 16 }}>
                <Field T={T} label="NSN" value={sel.nsn} mono />
                <Field T={T} label="Serial" value={sel.serial} mono />
                <Field T={T} label="ECN" value={sel.ecn || "—"} mono />
                <Field T={T} label="App ID" value={sel.appId} mono />
                <Field T={T} label="Location" value={sel.location} />
                <Field T={T} label="Value" value={fmtUSD(sel.valueUsd)} />
              </div>

              {selContact && (
                <div style={{
                  background: T.surface2, border: `1px solid ${T.rule}`,
                  borderRadius: 5, padding: "10px 12px", marginBottom: 14,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 15,
                    background: T.accent, color: T.accentInk,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10.5, fontWeight: 700,
                  }}>{selContact.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase" }}>Signed to</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, marginTop: 1 }}>{selContact.name}</div>
                    <div style={{ fontSize: 10.5, color: T.ink3, marginTop: 1 }}>{Math.abs(daysFromToday(sel.signedDate))}d · since {sel.signedDate.slice(5)}</div>
                  </div>
                </div>
              )}

              {sel.requirements && sel.requirements.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.ink2, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Requirements</div>
                  {sel.requirements.map((r, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 0",
                      borderBottom: i < sel.requirements.length - 1 ? `1px solid ${T.rule2}` : "none",
                    }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 14, fontSize: 9, fontWeight: 700,
                        background: r.overdue ? T.danger : T.surface2,
                        color: r.overdue ? T.accentInk : T.ink3,
                        border: `1px solid ${r.overdue ? T.danger : T.rule}`,
                        borderRadius: 2,
                      }}>{reqIcon(r.kind)}</span>
                      <span style={{ flex: 1, fontSize: 12, color: T.ink, fontWeight: 500 }}>{r.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.overdue ? T.danger : T.ink3, textTransform: "uppercase" }}>
                        {dueLabel(r.due)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{
              padding: "10px 14px",
              borderTop: `1px solid ${T.rule2}`,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
            }}>
              <Btn T={T} size="sm" icon={Icon.upload(13)}>2062</Btn>
              <Btn T={T} kind="primary" size="sm" onClick={() => onOpenItem(sel.id)}>Open</Btn>
            </div>
          </div>
        )}
      </div>
    </DesktopFrame>
  );
}

function FilterGroup({ T, label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.ink3, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", padding: "5px 6px", margin: "0 -6px",
            background: active ? T.surface2 : "transparent",
            border: "none", borderRadius: 4, cursor: "pointer",
            fontFamily: HR_FONT_SANS, fontSize: 12,
            fontWeight: active ? 600 : 500,
            color: active ? T.ink : T.ink2,
            letterSpacing: "-0.005em", textAlign: "left",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 4, flex: "0 0 auto",
              border: `1.5px solid ${active ? T.accent : T.rule}`,
              background: active ? T.accent : "transparent",
            }}/>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
            <span className="hr-mono" style={{ fontSize: 10, color: T.ink3 }}>{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { DesktopItems });
