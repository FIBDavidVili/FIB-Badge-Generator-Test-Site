import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Search, User, CheckCircle2, XCircle, ArrowRight, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

const RANKS = Object.keys(REQUIREMENTS);
const DISPLAY_RANKS = RANKS.filter((rank) => rank !== "Probationary Agent");

const EMPTY_AGENT = {
  name: "",
  rank: "",
  hours: "",
  tir: "",
  inFtd: false,
  ftdJobs: "",
};

function normalize(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .trim()
    .toLowerCase();
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
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      if (!text.trim()) {
        throw new Error("Empty sheet response");
      }
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
    if (key) {
      map[key] = index;
    }
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
      hours: row[hoursIdx] || 0,
      tir: row[tirIdx] || 0,
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
      ftdJobs: row[activitiesIdx] || 0,
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
        inFtd: Boolean(ftdEmployee?.inFtd),
        ftdJobs: Number(ftdEmployee?.ftdJobs || 0),
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
    missing.push(`${requirement.minFtdJobs - ftdJobs} more FTD job(s)`);
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
    <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function RequirementRow({ rank, data }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border p-4 md:grid-cols-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Rank</div>
        <div className="font-semibold">{rank}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Next Rank</div>
        <div className="font-medium">{data.nextRank ?? "Top Rank"}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Hours</div>
        <div className="font-medium">{data.minHours}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">TIR</div>
        <div className="font-medium">{data.minTir} days</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">FTD</div>
        <div className="font-medium">{data.mustBeInFtd ? `Yes · ${data.minFtdJobs} job(s)` : "No"}</div>
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 p-4 md:p-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <Card className="rounded-3xl border shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border p-3">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">FIB Promotion Evaluator</CardTitle>
                  <CardDescription>
                    Live Discord ID lookup using your public main roster and FTD roster.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <StatPill label="Ranks Supported" value={DISPLAY_RANKS.length} />
                <StatPill label="Lookup Source" value="Google Sheets" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discordId">Discord ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="discordId"
                    placeholder="Enter Discord ID"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                  />
                  <Button className="rounded-2xl" onClick={handleLookup} disabled={loading}>
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "Checking" : "Check"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  The page starts blank and only fills after a Discord ID lookup.
                </p>
                {lookupError ? (
                  <p className="text-sm font-medium text-destructive">{lookupError}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border p-3">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Evaluation Result</CardTitle>
                  <CardDescription>
                    Rank, hours, TIR, FTD status, and promotion eligibility.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Employee</div>
                    <div className="text-xl font-semibold">{employee.name || "No employee loaded"}</div>
                  </div>
                  <Badge variant="secondary" className="rounded-xl px-3 py-1 text-sm">
                    {employee.rank || "No rank"}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-3 md:grid-cols-2">
                  <StatPill label="Hours" value={employee.hours || 0} />
                  <StatPill label="TIR" value={employee.tir || 0} />
                  <StatPill label="In FTD" value={employee.inFtd ? "Yes" : "No"} />
                  <StatPill label="FTD Jobs" value={employee.ftdJobs || 0} />
                </div>
              </div>

              <motion.div
                key={`${employee.rank}-${employee.hours}-${employee.tir}-${employee.ftdJobs}-${employee.inFtd}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-5"
              >
                <div className="flex items-center gap-3">
                  {result.eligible ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  <div>
                    <div className="text-lg font-semibold">
                      {result.eligible ? "Eligible for Promotion" : "Not Yet Eligible"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.nextRank ? (
                        <span className="inline-flex items-center gap-2">
                          {employee.rank || "No rank"} <ArrowRight className="h-4 w-4" /> {result.nextRank}
                        </span>
                      ) : (
                        "No further promotion rank configured"
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="text-sm font-medium">Requirement Summary</div>
                  {result.requirement ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <StatPill label="Required Hours" value={result.requirement.minHours} />
                      <StatPill label="Required TIR" value={result.requirement.minTir} />
                      <StatPill
                        label="FTD Membership"
                        value={result.requirement.mustBeInFtd ? "Required" : "Not Required"}
                      />
                      <StatPill label="FTD Jobs Needed" value={result.requirement.minFtdJobs} />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No requirement data available for this rank.</div>
                  )}
                </div>

                {!result.eligible && result.missing.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed p-4">
                    <div className="mb-2 text-sm font-medium">Still Missing</div>
                    <div className="flex flex-wrap gap-2">
                      {result.missing.map((item) => (
                        <Badge key={item} variant="outline" className="rounded-xl px-3 py-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border p-3">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Rank Requirements</CardTitle>
                  <CardDescription>
                    Probationary Agent is excluded from the public website list like you asked.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {DISPLAY_RANKS.map((rank) => (
                <RequirementRow key={rank} rank={rank} data={REQUIREMENTS[rank]} />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-lg">
            <CardHeader>
              <CardTitle>Live Sheet Notes</CardTitle>
              <CardDescription>
                This version reads directly from the two public sheet links you shared.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border p-4">
                <div className="font-medium text-foreground">Main roster</div>
                <p className="mt-1">Used for name, rank, time in rank, hours, and Discord ID matching.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium text-foreground">FTD roster</div>
                <p className="mt-1">Used for FTD membership and activity count by Discord ID.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-medium text-foreground">If lookups still fail</div>
                <p className="mt-1">
                  The most common reason is Google blocking CSV export access in the browser. In that case, the next step is moving the same sheet-reading logic into a Vercel API route.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
