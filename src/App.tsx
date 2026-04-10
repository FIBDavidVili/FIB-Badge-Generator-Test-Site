import React, { useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  User,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

const MAIN_SHEET_ID = "1R7SpirGzmgUzZK6_MwcH0LGAubwShjsaxxJG2fFDi5g";
const MAIN_GID = "1598342668";
const FTD_SHEET_ID = "1YaUUYYXVPOffZQr7L51SPaDscz7XA6foQImhFqbu5yk";
const FTD_GID = "476091669";

const REQUIREMENTS = {
  "Probationary Agent": {
    nextRank: "Agent",
    minHours: 0,
    minTir: 0,
    mustBeInFtd: false,
    minFtdJobs: 0,
  },
  Agent: {
    nextRank: "Senior Agent",
    minHours: 5,
    minTir: 7,
    mustBeInFtd: false,
    minFtdJobs: 0,
  },
  "Senior Agent": {
    nextRank: "Special Agent",
    minHours: 5,
    minTir: 7,
    mustBeInFtd: false,
    minFtdJobs: 0,
  },
  "Special Agent": {
    nextRank: "Senior Special Agent",
    minHours: 5,
    minTir: 7,
    mustBeInFtd: false,
    minFtdJobs: 0,
  },
  "Senior Special Agent": {
    nextRank: "Supervisory Special Agent",
    minHours: 5,
    minTir: 14,
    mustBeInFtd: true,
    minFtdJobs: 3,
  },
  "Supervisory Special Agent": {
    nextRank: "Assistant Special Agent in Charge",
    minHours: 5,
    minTir: 14,
    mustBeInFtd: true,
    minFtdJobs: 3,
  },
  "Assistant Special Agent in Charge": {
    nextRank: "Special Agent in Charge",
    minHours: 5,
    minTir: 14,
    mustBeInFtd: true,
    minFtdJobs: 5,
  },
  "Special Agent in Charge": {
    nextRank: "Senior Special Agent In Charge",
    minHours: 5,
    minTir: 14,
    mustBeInFtd: true,
    minFtdJobs: 6,
  },
  "Senior Special Agent In Charge": {
    nextRank: "Agent Commander",
    minHours: 5,
    minTir: 21,
    mustBeInFtd: true,
    minFtdJobs: 6,
  },
  "Agent Commander": {
    nextRank: "Section Commander",
    minHours: 5,
    minTir: 21,
    mustBeInFtd: true,
    minFtdJobs: 3,
  },
  "Section Commander": {
    nextRank: "Commander in Charge",
    minHours: 5,
    minTir: 21,
    mustBeInFtd: true,
    minFtdJobs: 3,
  },
  "Commander in Charge": {
    nextRank: "Command Specialist",
    minHours: 5,
    minTir: 21,
    mustBeInFtd: true,
    minFtdJobs: 3,
  },
  "Command Specialist": {
    nextRank: null,
    minHours: 5,
    minTir: 28,
    mustBeInFtd: true,
    minFtdJobs: 3,
  },
};

const DISPLAY_RANKS = Object.keys(REQUIREMENTS).filter(
  (rank) => rank !== "Probationary Agent"
);

const EMPTY_AGENT = {
  name: "",
  rank: "",
  hours: "",
  tir: "",
  inFtd: false,
  ftdJobs: "",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111827",
    padding: "24px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  shell: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "grid",
    gap: "24px",
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  
  card: {
    background: "#ffffff",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  iconBox: {
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "16px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },
  subtitle: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  stat: {
    borderRadius: "18px",
    border: "1px solid rgba(17,24,39,0.08)",
    padding: "14px",
    background: "#f8fafc",
  },
  statLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#9ca3af",
  },
  statValue: {
    marginTop: "6px",
    fontSize: "18px",
    fontWeight: 700,
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "220px",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid rgba(17,24,39,0.12)",
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  muted: {
    marginTop: "10px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  error: {
    marginTop: "10px",
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: 600,
  },
  employeeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  badge: {
    borderRadius: "999px",
    padding: "8px 12px",
    background: "#f3f4f6",
    border: "1px solid rgba(17,24,39,0.08)",
    fontSize: "14px",
    fontWeight: 600,
  },
  divider: {
    border: 0,
    borderTop: "1px solid rgba(17,24,39,0.08)",
    margin: "18px 0",
  },
  resultBox: {
    borderRadius: "20px",
    border: "1px solid rgba(17,24,39,0.08)",
    padding: "18px",
    marginTop: "16px",
    background: "#f8fafc",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  pillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  pill: {
    borderRadius: "999px",
    padding: "8px 12px",
    border: "1px solid rgba(17,24,39,0.12)",
    background: "transparent",
    fontSize: "14px",
  },
  requirementRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: "18px",
    padding: "14px",
    background: "#f8fafc",
    marginBottom: "10px",
  },
  smallLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#9ca3af",
  },
  strong: {
    marginTop: "6px",
    fontWeight: 700,
  },
};

function normalize(value) {
  return String(value ?? "").replace(/\uFEFF/g, "").trim().toLowerCase();
}

function cleanDiscordId(value) {
  return String(value ?? "").replace(/\D/g, "").trim();
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((cell) => cell.trim());
}

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map(parseCsvLine);
}

async function fetchCsv(sheetId, gid) {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (!text.trim()) throw new Error("Empty sheet response");
      return parseCsv(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to read sheet");
}

function getHeaderMap(row) {
  const map = {};
  row.forEach((cell, index) => {
    const key = normalize(cell);
    if (key) map[key] = index;
  });
  return map;
}

function findMainRosterEmployee(rows, discordId) {
  let headerMap = null;

  for (const row of rows) {
    const normalizedRow = row.map(normalize);
    if (normalizedRow.includes("rank") && normalizedRow.includes("discord id")) {
      headerMap = getHeaderMap(row);
      continue;
    }

    if (!headerMap) continue;

    const discordIdx = headerMap["discord id"];
    const rankIdx = headerMap["rank"];
    const hoursIdx = headerMap["hours"];
    const tirIdx = headerMap["time in rank"];
    const nameIdx = headerMap["name"];

    if ([discordIdx, rankIdx, hoursIdx, tirIdx, nameIdx].some((idx) => idx === undefined)) {
      continue;
    }

    const rowDiscordId = cleanDiscordId(row[discordIdx]);
    if (!rowDiscordId || rowDiscordId !== discordId) continue;

    return {
      name: row[nameIdx] || "",
      rank: row[rankIdx] || "",
      hours: Number(row[hoursIdx] || 0),
      tir: Number(row[tirIdx] || 0),
    };
  }

  return null;
}

function findFtdEmployee(rows, discordId) {
  let headerMap = null;

  for (const row of rows) {
    const normalizedRow = row.map(normalize);
    if (normalizedRow.includes("discord id") && (normalizedRow.includes("activities") || normalizedRow.includes("total logs"))) {
      headerMap = getHeaderMap(row);
      continue;
    }

    if (!headerMap) continue;

    const discordIdx = headerMap["discord id"];
    const activitiesIdx = headerMap["activities"] ?? headerMap["total logs"];

    if (discordIdx === undefined || activitiesIdx === undefined) {
      continue;
    }

    const rowDiscordId = cleanDiscordId(row[discordIdx]);
    if (!rowDiscordId || rowDiscordId !== discordId) continue;

    return {
      inFtd: true,
      ftdJobs: Number(row[activitiesIdx] || 0),
    };
  }

  return {
    inFtd: false,
    ftdJobs: 0,
  };
}

async function fetchRosterData(discordId) {
  const cleanId = cleanDiscordId(discordId);
  if (!cleanId) {
    return { ok: false, error: "Enter a valid Discord ID first." };
  }

  try {
    const [mainRows, ftdRows] = await Promise.all([
      fetchCsv(MAIN_SHEET_ID, MAIN_GID),
      fetchCsv(FTD_SHEET_ID, FTD_GID),
    ]);

    const mainEmployee = findMainRosterEmployee(mainRows, cleanId);
    if (!mainEmployee) {
      return { ok: false, error: "Employee not found in the main roster." };
    }

    const ftdEmployee = findFtdEmployee(ftdRows, cleanId);

    return {
      ok: true,
      employee: {
        ...mainEmployee,
        inFtd: Boolean(ftdEmployee.inFtd),
        ftdJobs: Number(ftdEmployee.ftdJobs || 0),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: "Could not read one or both Google Sheets. Make sure the sheets are publicly viewable and exportable.",
    };
  }
}

function evaluatePromotion(agent) {
  if (!agent?.rank || !REQUIREMENTS[agent.rank]) {
    return {
      eligible: false,
      nextRank: null,
      missing: agent?.rank ? ["Unknown or unsupported rank"] : ["No employee data loaded"],
      requirement: null,
    };
  }

  const requirement = REQUIREMENTS[agent.rank];
  const hours = Number(agent.hours || 0);
  const tir = Number(agent.tir || 0);
  const ftdJobs = Number(agent.ftdJobs || 0);
  const missing = [];

  if (hours < requirement.minHours) {
    missing.push(`${requirement.minHours - hours} more hour(s)`);
  }
  if (tir < requirement.minTir) {
    missing.push(`${requirement.minTir - tir} more TIR day(s)`);
  }
  if (requirement.mustBeInFtd && !agent.inFtd) {
    missing.push("Must be in FTD");
  }
  if (ftdJobs < requirement.minFtdJobs) {
    missing.push(`${requirement.minFtdJobs - ftdJobs} more FTD activit(ies)`);
  }

  if (!requirement.nextRank) {
    return {
      eligible: false,
      nextRank: null,
      missing: ["Top rank reached"],
      requirement,
    };
  }

  return {
    eligible: missing.length === 0,
    nextRank: requirement.nextRank,
    missing,
    requirement,
  };
}

function StatPill({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function RequirementRow({ rank, data }) {
  return (
    <div style={styles.requirementRow}>
      <div>
        <div style={styles.smallLabel}>Rank</div>
        <div style={styles.strong}>{rank}</div>
      </div>
      <div>
        <div style={styles.smallLabel}>Next Rank</div>
        <div style={styles.strong}>{data.nextRank ?? "Top Rank"}</div>
      </div>
      <div>
        <div style={styles.smallLabel}>Hours</div>
        <div style={styles.strong}>{data.minHours}</div>
      </div>
      <div>
        <div style={styles.smallLabel}>TIR</div>
        <div style={styles.strong}>{data.minTir} days</div>
      </div>
      <div>
        <div style={styles.smallLabel}>FTD</div>
        <div style={styles.strong}>{data.mustBeInFtd ? `Yes · ${data.minFtdJobs} job(s)` : "No"}</div>
      </div>
    </div>
  );
}

export default function FibPromotionEvaluator() {
  const [discordId, setDiscordId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [employee, setEmployee] = useState(EMPTY_AGENT);

  const result = useMemo(() => evaluatePromotion(employee), [employee]);

  async function handleLookup() {
    setLoading(true);
    setLookupError("");

    const resultData = await fetchRosterData(discordId);

    if (!resultData.ok || !resultData.employee) {
      setEmployee(EMPTY_AGENT);
      setLookupError(resultData.error || "Lookup failed.");
      setLoading(false);
      return;
    }

    setEmployee(resultData.employee);
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topGrid}>
          <div style={styles.card}>
            <div style={styles.headerRow}>
              <div style={styles.iconBox}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 style={styles.title}>FIB Promotion Evaluator</h1>
                <p style={styles.subtitle}>
                  Live Discord ID lookup using your public main roster and FTD roster.
                </p>
              </div>
            </div>

            <div style={styles.statsGrid}>
              <StatPill label="Ranks Supported" value={DISPLAY_RANKS.length} />
              <StatPill label="Lookup Source" value="Google Sheets" />
            </div>

            <label htmlFor="discordId" style={styles.label}>
              Discord ID
            </label>
            <div style={styles.inputRow}>
              <input
                id="discordId"
                style={styles.input}
                placeholder="Enter Discord ID"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
              />
              <button type="button" style={styles.button} onClick={handleLookup} disabled={loading}>
                <Search size={16} />
                {loading ? "Checking" : "Check"}
              </button>
            </div>

            <p style={styles.muted}>The page starts blank and only fills after a Discord ID lookup.</p>
            {lookupError ? <p style={styles.error}>{lookupError}</p> : null}
          </div>

          <div style={styles.card}>
            <div style={styles.headerRow}>
              <div style={styles.iconBox}>
                <User size={24} />
              </div>
              <div>
                <h2 style={{ ...styles.title, fontSize: "24px" }}>Evaluation Result</h2>
                <p style={styles.subtitle}>Rank, hours, TIR, FTD status, and promotion eligibility.</p>
              </div>
            </div>

            <div>
              <div style={styles.employeeHeader}>
                <div>
                  <div style={styles.smallLabel}>Employee</div>
                  <div style={{ ...styles.strong, fontSize: "22px" }}>
                    {employee.name || "No employee loaded"}
                  </div>
                </div>
                <div style={styles.badge}>{employee.rank || "No rank"}</div>
              </div>

              <hr style={styles.divider} />

              <div style={styles.statsGrid}>
                <StatPill label="Hours" value={employee.hours || 0} />
                <StatPill label="TIR" value={employee.tir || 0} />
                <StatPill label="In FTD" value={employee.inFtd ? "Yes" : "No"} />
                <StatPill label="FTD Activities" value={employee.ftdJobs || 0} />
              </div>
            </div>

            <div style={styles.resultBox}>
              <div style={styles.resultHeader}>
                {result.eligible ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>
                    {result.eligible ? "Eligible for Promotion" : "Not Yet Eligible"}
                  </div>
                  <div style={styles.subtitle}>
                    {result.nextRank ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {employee.rank || "No rank"} <ArrowRight size={16} /> {result.nextRank}
                      </span>
                    ) : (
                      "No further promotion rank configured"
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "16px", fontSize: "14px", fontWeight: 600 }}>Requirement Summary</div>
              {result.requirement ? (
                <div style={{ ...styles.statsGrid, marginTop: "12px", marginBottom: 0 }}>
                  <StatPill label="Required Hours" value={result.requirement.minHours} />
                  <StatPill label="Required TIR" value={result.requirement.minTir} />
                  <StatPill
                    label="FTD Membership"
                    value={result.requirement.mustBeInFtd ? "Required" : "Not Required"}
                  />
                  <StatPill label="FTD Activities Needed" value={result.requirement.minFtdJobs} />
                </div>
              ) : (
                <p style={styles.muted}>No requirement data available for this rank.</p>
              )}

              {!result.eligible && result.missing.length > 0 ? (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Still Missing</div>
                  <div style={styles.pillWrap}>
                    {result.missing.map((item) => (
                      <div key={item} style={styles.pill}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.headerRow}>
            <div style={styles.iconBox}>
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 style={{ ...styles.title, fontSize: "24px" }}>Rank Requirements</h2>
              <p style={styles.subtitle}>
                Probationary Agent is excluded from the public website list like you asked.
              </p>
            </div>
          </div>

          {DISPLAY_RANKS.map((rank) => (
            <RequirementRow key={rank} rank={rank} data={REQUIREMENTS[rank]} />
          ))}
        </div>
      </div>
    </div>
  );
}
