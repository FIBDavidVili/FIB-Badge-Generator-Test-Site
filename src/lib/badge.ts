import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBadgeDataFromDiscordId } from "../src/lib/badge";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const discordId = String(req.query.discordId || "").replace(/\D/g, "");

    if (!discordId) {
      return res.status(400).json({
        ok: false,
        error: "Missing discordId",
      });
    }

    const badge = await getBadgeDataFromDiscordId(discordId);

    if (!badge) {
      return res.status(404).json({
        ok: false,
        error: "No badge details found for that Discord ID.",
      });
    }

    const params = new URLSearchParams({
      discordId: badge.discordId,
      templateKey: badge.templateKey,
      line1: badge.line1,
      line2: badge.line2,
      line3: badge.line3,
      line4: badge.line4,
      line5: badge.line5,
      line6: badge.line6,
      fontType: badge.fontType,
      finish: badge.finish,
    });

    return res.status(200).json({
      ok: true,
      badge,
      imageUrl: `https://www.fibbadges.com/api/badge-image?${params.toString()}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
