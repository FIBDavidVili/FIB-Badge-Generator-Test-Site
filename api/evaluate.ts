export default async function handler(req: any, res: any) {
  // 🔓 Allow BotGhost to call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const MAIN_SHEET_ID = "1R7SpirGzmgUzZK6_MwcH0LGAubwShjsaxxJG2fFDi5g";
  const MAIN_GID = "1598342668";
  const FTD_SHEET_ID = "1YaUUYYXVPOffZQr7L51SPaDscz7XA6foQImhFqbu5yk";
  const FTD_GID = "476091669";
  const HOURS_MANAGER_GID = "264837711";

  const REQUIREMENTS: any = {
    "Agent": { nextRank: "Senior Agent", minHours: 5, minTir: 7 },
    "Senior Agent": { nextRank: "Special Agent", minHours: 5, minTir: 7 },
    "Special Agent": { nextRank: "Senior Special Agent", minHours: 5, minTir: 7 },
    "Senior Special Agent": { nextRank: "Supervisory Special Agent", minHours: 5, minTir: 14, mustBeInFtd: true, minFtdJobs: 3 },

    "Supervisory Special Agent": { nextRank: "Assistant Special Agent in Charge", minHours: 5, minTir: 14, mustBeInFtd: true, minFtdJobs: 3 },
    "Assistant Special Agent in Charge": { nextRank: "Special Agent in Charge", minHours: 5, minTir: 14, mustBeInFtd: true, minFtdJobs: 5 },
    "Special Agent in Charge": { nextRank: "Senior Special Agent In Charge", minHours: 5, minTir: 14, mustBeInFtd: true, minFtdJobs: 6 },

    "Senior Special Agent In Charge": { nextRank: "Agent Commander", minHours: 5, minTir: 21, mustBeInFtd: true, minFtdJobs: 6, minMonthlyHours: 25 },
    "Agent Commander": { nextRank: "Section Commander", minHours: 5, minTir: 21, mustBeInFtd: true, minFtdJobs: 3, minMonthlyHours: 25 },
    "Section Commander": { nextRank: "Commander in Charge", minHours: 5, minTir: 21, mustBeInFtd: true, minFtdJobs: 3, minMonthlyHours: 25 },
    "Commander in Charge": { nextRank: "Command Specialist", minHours: 5, minTir: 21, mustBeInFtd: true, minFtdJobs: 3, minMonthlyHours: 25 },
    "Command Specialist": { nextRank: null, minHours: 5, minTir: 28, mustBeInFtd: true, minFtdJobs: 3, minMonthlyHours: 30 },
  };

  function cleanId(id: any) {
    return String(id || "").replace(/\D/g, "");
  }

  function parseCSV(text: string) {
    return text.split("\n").map(line => line.split(","));
  }

  async function fetchSheet(sheetId: string, gid: string) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const res = await fetch(url);
    const text = await res.text();
    return parseCSV(text);
  }

  const discordId = cleanId(req.query.discordId);

  if (!discordId) {
    return res.status(400).json({ ok: false, error: "No Discord ID provided" });
  }

  try {
    const [main, ftd, hours] = await Promise.all([
      fetchSheet(MAIN_SHEET_ID, MAIN_GID),
      fetchSheet(FTD_SHEET_ID, FTD_GID),
      fetchSheet(MAIN_SHEET_ID, HOURS_MANAGER_GID),
    ]);

    let employee: any = null;

    // 🔍 FIND MAIN DATA
    for (const row of main) {
      if (cleanId(row[10]) === discordId) {
        employee = {
          name: row[3],
          rank: row[4],
          hours: Number(row[9] || 0),
          tir: Number(row[8] || 0),
        };
      }
    }

    if (!employee) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // 🔍 FTD
    let ftdActivities = 0;
    let inFtd = false;

    for (const row of ftd) {
      if (cleanId(row[2]) === discordId) {
        ftdActivities = Number(row[5] || 0);
        inFtd = true;
      }
    }

    // 🔍 MONTHLY HOURS
    let monthlyHours = 0;

    for (const row of hours) {
      if (cleanId(row[5]) === discordId) {
        monthlyHours = Number(row[6] || 0);
      }
    }

    const reqData = REQUIREMENTS[employee.rank];

    if (!reqData) {
      return res.status(400).json({ ok: false, error: "Unsupported rank" });
    }

    const missing = [];

    if (employee.hours < (reqData.minHours || 0)) {
      missing.push("Hours");
    }

    if (employee.tir < (reqData.minTir || 0)) {
      missing.push("TIR");
    }

    if (reqData.mustBeInFtd && !inFtd) {
      missing.push("FTD");
    }

    if ((reqData.minFtdJobs || 0) > ftdActivities) {
      missing.push("FTD Activities");
    }

    if ((reqData.minMonthlyHours || 0) > monthlyHours) {
      missing.push("Monthly Hours");
    }

    return res.status(200).json({
      ok: true,
      name: employee.name,
      rank: employee.rank,
      nextRank: reqData.nextRank || "High Command",
      eligible: missing.length === 0,
      missing,
      hours: employee.hours,
      tir: employee.tir,
      ftd: inFtd,
      ftdActivities,
      monthlyHours,
    });

  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch data",
    });
  }
}
