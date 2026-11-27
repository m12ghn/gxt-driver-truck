function llmConfig() {
  const openaiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const groqKey = String(process.env.GROQ_API_KEY || "").trim();
  const apiKey = openaiKey || groqKey;
  const groqOnly = Boolean(groqKey && !openaiKey);
  const baseUrl = String(
    process.env.OPENAI_BASE_URL ||
      (groqOnly ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1")
  ).replace(/\/$/, "");
  const model =
    process.env.ODO_VISION_MODEL ||
    process.env.OPENAI_MODEL ||
    (groqOnly
      ? "meta-llama/llama-4-scout-17b-16e-instruct"
      : "gpt-4o-mini");
  return { apiKey, baseUrl, model };
}

function normalizeOdoDigits(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function odoValuesMatch(entered, read) {
  const a = normalizeOdoDigits(entered);
  const b = normalizeOdoDigits(read);
  if (!a || !b) return false;
  return a === b;
}

function parseVisionOdo(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      const odo = parsed.odo ?? parsed.reading ?? parsed.number;
      const digits = normalizeOdoDigits(odo);
      if (digits) return digits;
    }
  } catch {
    // fall through to regex
  }

  const matches = text.match(/\d[\d\s.,]{2,}/g) || [];
  const longest = matches
    .map((item) => normalizeOdoDigits(item))
    .sort((a, b) => b.length - a.length)[0];
  return longest || null;
}

async function readOdoFromImage(buffer, mimeType = "image/jpeg") {
  const { apiKey, baseUrl, model } = llmConfig();
  if (!apiKey) {
    const err = new Error(
      "Chưa cấu hình OPENAI_API_KEY hoặc GROQ_API_KEY để AI đọc ảnh ODO."
    );
    err.code = "NO_VISION_KEY";
    throw err;
  }

  const mime = String(mimeType || "image/jpeg").startsWith("image/")
    ? mimeType
    : "image/jpeg";
  const dataUrl = `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are reading a vehicle odometer / dashboard photo.
Return ONLY JSON: {"odo":"123456"} with the integer kilometers shown, digits only, no units.
If unreadable, return {"odo":null}.
Ignore speed, fuel, time, and trip A/B unless it is clearly the main odometer.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.error?.message || res.statusText || "Vision error";
    const err = new Error(detail);
    err.status = res.status >= 500 ? 502 : 400;
    throw err;
  }

  const content = body?.choices?.[0]?.message?.content;
  return parseVisionOdo(content);
}

module.exports = {
  llmConfig,
  normalizeOdoDigits,
  odoValuesMatch,
  parseVisionOdo,
  readOdoFromImage,
};
