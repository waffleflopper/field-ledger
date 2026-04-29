// Mock data for HandReceipt
// Realistic Army nomenclature, NSNs, ECNs

const HAND_RECEIPTS = [
  {
    id: "hr-primary",
    name: "Primary Hand Receipt",
    code: "0023-A",
    holder: "SGT MORALES, J.",
    parent: "1ABCT, 3BDE / B CO",
    itemCount: 47,
    valueUsd: 184250,
    lastUpdated: "2026-04-22",
  },
  {
    id: "hr-comms",
    name: "Comms Sub-Hand Receipt",
    code: "0023-A-1",
    holder: "SGT MORALES, J.",
    parent: "from CPT REID, T.",
    itemCount: 12,
    valueUsd: 38400,
    lastUpdated: "2026-04-19",
  },
  {
    id: "hr-arms",
    name: "Arms Room Sub",
    code: "0023-A-2",
    holder: "SGT MORALES, J.",
    parent: "from 1SG VANCE, R.",
    itemCount: 6,
    valueUsd: 7820,
    lastUpdated: "2026-04-26",
  },
  {
    id: "hr-nvg",
    name: "Optics & NVG Pool",
    code: "0023-A-3",
    holder: "SGT MORALES, J.",
    parent: "from SSG DELACRUZ, M.",
    itemCount: 9,
    valueUsd: 96100,
    lastUpdated: "2026-04-15",
  },
];

const CONTACTS = [
  { id: "c1", name: "PFC ALVAREZ, D.", role: "Rifleman, 1st Sqd", initials: "DA" },
  { id: "c2", name: "SPC HAYES, K.",   role: "RTO, HQ Plt",       initials: "KH" },
  { id: "c3", name: "PFC OKONKWO, E.", role: "Driver, 2nd Sqd",   initials: "EO" },
  { id: "c4", name: "SPC TRAN, L.",    role: "Medic",             initials: "LT" },
  { id: "c5", name: "SSG BAKER, R.",   role: "Sqd Ldr, 3rd Sqd",  initials: "RB" },
  { id: "c6", name: "PFC YOUNG, M.",   role: "Grenadier",         initials: "MY" },
];

const LOCATIONS = [
  "Arms Room A-12",
  "Conex 03 / Shelf B",
  "Comms Cage",
  "NVG Vault",
  "CIF Issue",
  "Vehicle Bay 4",
  "Pers. Wall Locker",
];

// Status: in_storage | signed_out | in_use | missing | maintenance
const ITEMS = [
  {
    id: "itm-001",
    nomenclature: "RIFLE, 5.56MM, M4A1",
    nsn: "1005-01-382-0953",
    serial: "W486231",
    ecn: null,
    appId: "HR-A1-0014",
    hr: "hr-arms",
    location: "Arms Room A-12",
    status: "in_storage",
    valueUsd: 1240,
    lastSeen: "2026-04-26",
    requirements: [
      { kind: "sensitive", label: "Sensitive Item Check", every: "daily", due: "2026-04-27", overdue: false },
      { kind: "service",   label: "Quarterly Service",     every: "90d",   due: "2026-06-12", overdue: false },
    ],
    history: [
      { date: "2026-04-26", action: "Sensitive item check", by: "SGT MORALES, J." },
      { date: "2026-04-19", action: "Signed in from PFC ALVAREZ", by: "SGT MORALES, J." },
      { date: "2026-04-12", action: "Signed out to PFC ALVAREZ", by: "SGT MORALES, J." },
    ],
  },
  {
    id: "itm-002",
    nomenclature: "OPTIC, CCO, M68",
    nsn: "1240-01-411-1265",
    serial: "CCO-77124",
    ecn: "ECN-22418",
    appId: "HR-A1-0015",
    hr: "hr-arms",
    location: "Arms Room A-12",
    status: "signed_out",
    signedTo: "c1",
    signedDate: "2026-04-21",
    valueUsd: 410,
    lastSeen: "2026-04-21",
    requirements: [
      { kind: "sensitive", label: "Sensitive Item Check", every: "daily", due: "2026-04-27", overdue: false },
    ],
  },
  {
    id: "itm-003",
    nomenclature: "NIGHT VISION, MONOCULAR, AN/PVS-14",
    nsn: "5855-01-432-0524",
    serial: "PVS-091224",
    ecn: "ECN-09112",
    appId: "HR-N1-0003",
    hr: "hr-nvg",
    location: "NVG Vault",
    status: "signed_out",
    signedTo: "c5",
    signedDate: "2026-04-18",
    valueUsd: 3420,
    lastSeen: "2026-04-18",
    requirements: [
      { kind: "sensitive", label: "Sensitive Item Check", every: "daily", due: "2026-04-25", overdue: true },
      { kind: "service",   label: "Battery Replacement",  every: "30d",   due: "2026-05-04", overdue: false },
    ],
  },
  {
    id: "itm-004",
    nomenclature: "RADIO SET, AN/PRC-117G",
    nsn: "5820-01-547-0743",
    serial: "117G-2204",
    ecn: "ECN-44021",
    appId: "HR-C1-0007",
    hr: "hr-comms",
    location: "Comms Cage",
    status: "signed_out",
    signedTo: "c2",
    signedDate: "2026-04-15",
    valueUsd: 18900,
    lastSeen: "2026-04-15",
    requirements: [
      { kind: "sensitive", label: "Sensitive Item Check", every: "weekly", due: "2026-04-26", overdue: true },
      { kind: "pmcs",      label: "Operator PMCS",        every: "weekly", due: "2026-05-01", overdue: false },
    ],
  },
  {
    id: "itm-005",
    nomenclature: "HELMET, ADVANCED COMBAT, ACH",
    nsn: "8470-01-529-6306",
    serial: "ACH-ML-3318",
    ecn: null,
    appId: "HR-A1-0042",
    hr: "hr-primary",
    location: "Pers. Wall Locker",
    status: "in_use",
    valueUsd: 295,
    lastSeen: "2026-04-26",
    requirements: [],
  },
  {
    id: "itm-006",
    nomenclature: "BODY ARMOR, IOTV, GEN IV",
    nsn: "8470-01-604-7297",
    serial: "IOTV-LG-88142",
    ecn: null,
    appId: "HR-A1-0043",
    hr: "hr-primary",
    location: "Pers. Wall Locker",
    status: "in_use",
    valueUsd: 1620,
    lastSeen: "2026-04-26",
    requirements: [
      { kind: "service", label: "Plate Inspection", every: "180d", due: "2026-09-01", overdue: false },
    ],
  },
  {
    id: "itm-007",
    nomenclature: "MACHINE GUN, 7.62MM, M240B",
    nsn: "1005-01-412-3129",
    serial: "M240-09921",
    ecn: null,
    appId: "HR-A1-0021",
    hr: "hr-arms",
    location: "Arms Room A-12",
    status: "in_storage",
    valueUsd: 6500,
    lastSeen: "2026-04-26",
    requirements: [
      { kind: "sensitive", label: "Sensitive Item Check", every: "daily", due: "2026-04-27", overdue: false },
      { kind: "service",   label: "Lubrication / Service",  every: "90d", due: "2026-04-22", overdue: true },
    ],
  },
  {
    id: "itm-008",
    nomenclature: "LASER, AIMING, AN/PEQ-15",
    nsn: "5855-01-534-5931",
    serial: "PEQ-15-44102",
    ecn: "ECN-22517",
    appId: "HR-A1-0028",
    hr: "hr-arms",
    location: "Arms Room A-12",
    status: "signed_out",
    signedTo: "c6",
    signedDate: "2026-04-22",
    valueUsd: 1190,
    lastSeen: "2026-04-22",
    requirements: [
      { kind: "sensitive", label: "Sensitive Item Check", every: "daily", due: "2026-04-27", overdue: false },
    ],
  },
  {
    id: "itm-009",
    nomenclature: "BINOCULAR, M22",
    nsn: "1240-01-207-5787",
    serial: "M22-9211",
    ecn: null,
    appId: "HR-N1-0011",
    hr: "hr-nvg",
    location: "NVG Vault",
    status: "in_storage",
    valueUsd: 1280,
    lastSeen: "2026-04-25",
    requirements: [],
  },
  {
    id: "itm-010",
    nomenclature: "RADIO, HANDHELD, AN/PRC-152",
    nsn: "5820-01-451-8250",
    serial: "152-0822",
    ecn: "ECN-44099",
    appId: "HR-C1-0014",
    hr: "hr-comms",
    location: "Comms Cage",
    status: "in_storage",
    valueUsd: 5400,
    lastSeen: "2026-04-26",
    requirements: [
      { kind: "service", label: "Battery Replacement", every: "30d", due: "2026-05-02", overdue: false },
    ],
  },
  {
    id: "itm-011",
    nomenclature: "CHEMICAL AGENT MONITOR, M22 CAM",
    nsn: "6665-01-357-8502",
    serial: "CAM-7782",
    ecn: "ECN-31104",
    appId: "HR-A1-0049",
    hr: "hr-primary",
    location: "Conex 03 / Shelf B",
    status: "in_storage",
    valueUsd: 9800,
    lastSeen: "2026-04-12",
    requirements: [
      { kind: "service", label: "Calibration", every: "180d", due: "2026-04-30", overdue: false },
    ],
  },
  {
    id: "itm-012",
    nomenclature: "GENERATOR SET, MEP-803A, 10KW",
    nsn: "6115-01-275-5061",
    serial: "MEP-803-44201",
    ecn: "ECN-90012",
    appId: "HR-A1-0051",
    hr: "hr-primary",
    location: "Vehicle Bay 4",
    status: "maintenance",
    valueUsd: 14200,
    lastSeen: "2026-04-22",
    requirements: [
      { kind: "pmcs",    label: "Quarterly PMCS",   every: "90d", due: "2026-04-20", overdue: true },
      { kind: "service", label: "Oil Change",       every: "90d", due: "2026-05-15", overdue: false },
    ],
  },
];

// Roll up requirements into a flat queue
function buildRequirementQueue() {
  const queue = [];
  ITEMS.forEach((it) => {
    (it.requirements || []).forEach((r, idx) => {
      queue.push({
        id: `${it.id}-r${idx}`,
        item: it,
        ...r,
      });
    });
  });
  // Overdue first, then by due date
  queue.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.due.localeCompare(b.due);
  });
  return queue;
}

const REQ_QUEUE = buildRequirementQueue();

const RECENT_2062 = [
  { id: "f1", filename: "DA2062_2026-04-22_signout_alvarez.pdf", date: "2026-04-22", items: 3, signedTo: "PFC ALVAREZ, D." },
  { id: "f2", filename: "DA2062_2026-04-18_NVG_baker.pdf",       date: "2026-04-18", items: 1, signedTo: "SSG BAKER, R." },
  { id: "f3", filename: "DA2062_2026-04-15_comms_hayes.pdf",     date: "2026-04-15", items: 2, signedTo: "SPC HAYES, K." },
];

Object.assign(window, {
  HAND_RECEIPTS, CONTACTS, LOCATIONS, ITEMS, REQ_QUEUE, RECENT_2062,
});
