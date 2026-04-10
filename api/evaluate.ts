export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "❌ Method not allowed",
    });
  }

  const MAIN_SHEET_ID = "1R7SpirGzmgUzZK6_MwcH0LGAubwShjsaxxJG2fFDi5g";
  const MAIN_GID = "1598342668";
  const FTD_SHEET_ID = "1YaUUYYXVPOffZQr7L51SPaDscz7XA6foQImhFqbu5yk";
  const FTD_GID = "476091669";
  const HOURS_MANAGER_GID = "264837711";

  const REQUIREMENTS: Record<
    string,
    {
      nextRank: string | null;
      minHours: number;
      minTir: number;
      mustBeInFtd: boolean;
      minFtdJobs: number;
      minMonthlyHours?: number;
    }
  > = {
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
      minMonthlyHours: 25,
    },
    "Agent Commander": {
      nextRank: "Section Commander",
      minHours: 5,
      minTir: 21,
      mustBeInFtd: true,
      minFtdJobs: 3,
      minMonthlyHours: 25,
    },
    "Section Commander": {
      nextRank: "Commander in Charge",
      minHours: 5,
      minTir: 21,
      mustBeInFtd: true,
      minFtdJobs: 3,
      minMonthlyHours: 25,
    },
    "Commander in Charge": {
      nextRank: "Command Specialist",
      minHours: 5,
      minTir: 21,
      mustBeInFtd: true,
      minFtdJobs: 3,
      minMonthlyHours: 25,
    },
    "Command Specialist": {
      nextRank: null,
      minHours: 5,
      minTir: 28,
      mustBeInFtd: true,
      minFtdJobs: 3,
      minMonthlyHours: 30,
    },
  };

  function cleanId(id: any) {
    return String(id || "").replace(/\D/g, "").trim();
  }

  function parseCSVLine(line: string) {
    const result: string[] = [];
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

  function parseCSV(text: string) {
    return text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map(parseCSVLine);
  }

  async function fetchSheet(sheetId: string, gid: string) {
    const urls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    ];

    let lastError: any = null;

    for (const url of urls) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch sheet ${gid}`);
        }

        const text = await response.text();
        if (!text.trim()) {
          throw new Error(`Empty sheet ${gid}`);
        }

        return parseCSV(text);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(`Failed to fetch sheet ${gid}`);
  }

  const discordId = cleanId(req.query.discordId);

  if (!discordId) {
    return res.status(400).json({
      ok: false,
      message: "❌ No Discord ID provided",
    });
  }

  try {
    const [main, ftd, hours] = await Promise.all([
      fetchSheet(MAIN_SHEET_ID, MAIN_GID),
      fetchSheet(FTD_SHEET_ID, FTD_GID),
      fetchSheet(MAIN_SHEET_ID, HOURS_MANAGER_GID),
    ]);

    let employee: {
      name: string;
      rank: string;
      hours: number;
      tir: number;
    } | null = null;

    for (const row of main) {
      if (cleanId(row[10]) === discordId) {
        employee = {
          name: row[3] || "",
          rank: row[4] || "",
          hours: Number(row[9] || 0),
          tir: Number(row[8] || 0),
        };
        break;
      }
    }

    if (!employee) {
      return res.status(404).json({
        ok: false,
        message: "❌ User not found",
      });
    }

    let ftdActivities = 0;
    let inFtd = false;

    for (const row of ftd) {
      if (cleanId(row[2]) === discordId) {
        ftdActivities = Number(row[5] || 0);
        inFtd = true;
        break;
      }
    }

    let monthlyHours = 0;

    for (const row of hours) {
      if (cleanId(row[5]) === discordId) {
        monthlyHours = Number(row[6] || 0);
        break;
      }
    }

    const reqData = REQUIREMENTS[employee.rank];

    if (!reqData) {
      return res.status(400).json({
        ok: false,
        message: `❌ Unsupported rank: ${employee.rank}`,
      });
    }

    const missing: string[] = [];

    if (employee.hours < reqData.minHours) {
      missing.push(`${reqData.minHours - employee.hours} more hour(s)`);
    }

    if (employee.tir < reqData.minTir) {
      missing.push(`${reqData.minTir - employee.tir} more TIR day(s)`);
    }

    if (reqData.mustBeInFtd && !inFtd) {
      missing.push("Must be in FTD");
    }

    if (ftdActivities < reqData.minFtdJobs) {
      missing.push(`${reqData.minFtdJobs - ftdActivities} more FTD activities`);
    }

    if ((reqData.minMonthlyHours || 0) > 0 && monthlyHours < (reqData.minMonthlyHours || 0)) {
      missing.push(`${(reqData.minMonthlyHours || 0) - monthlyHours} more monthly hour(s)`);
    }

    const eligible = missing.length === 0;
    const nextRank = reqData.nextRank || "High Command";
    const status = eligible ? "✅ Eligible" : "❌ Not Eligible";
    const missingText = eligible ? "None" : missing.join(", ");

    const monthlyLine =
      (reqData.minMonthlyHours || 0) > 0 ? `**Monthly Hours:** ${monthlyHours}\n` : "";

    const message = `**Name:** ${employee.name}
**Rank:** ${employee.rank}
**Next Rank:** ${nextRank}

**Status:** ${status}

**Hours:** ${employee.hours}
**TIR:** ${employee.tir}
**FTD:** ${inFtd ? "Yes" : "No"}
**FTD Activities:** ${ftdActivities}
${monthlyLine}**Missing:** ${missingText}`;

    return res.status(200).json({
      ok: true,
      message,
      name: employee.name,
      rank: employee.rank,
      nextRank,
      eligible: status,
      hours: employee.hours,
      tir: employee.tir,
      ftd: inFtd ? "Yes" : "No",
      ftdActivities,
      monthlyHours,
      missing: missingText,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      message: `❌ ${e?.message || "Failed to fetch data"}`,
    });
  }
}
