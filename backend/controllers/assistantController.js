const { buildSystemPrompt } = require("../utils/assistantKnowledge");
const { TOOLS, runTool } = require("../utils/assistantTools");

const MAX_MESSAGES = 16;
const MAX_CHARS = 4000;
const MAX_TOOL_ROUNDS = 4;

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
    process.env.OPENAI_MODEL ||
    (groqOnly ? "llama-3.3-70b-versatile" : "gpt-4o-mini");
  return { apiKey, baseUrl, model };
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_MESSAGES)
    .map((item) => {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = String(item?.content || "").trim().slice(0, MAX_CHARS);
      return { role, content };
    })
    .filter((item) => item.content);
}

async function callLlm(messages) {
  const { apiKey, baseUrl, model } = llmConfig();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.error?.message || res.statusText || "LLM error";
    const err = new Error(detail);
    err.status = res.status >= 500 ? 502 : 400;
    throw err;
  }
  return body;
}

function parseToolArgs(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

exports.chat = async (req, res) => {
  try {
    const { apiKey } = llmConfig();
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message:
          "Chưa cấu hình OPENAI_API_KEY (hoặc GROQ_API_KEY) trên server. Thêm key rồi deploy lại để dùng Trợ lý vận tải.",
      });
    }

    const history = sanitizeMessages(req.body?.messages);
    if (!history.length) {
      return res.status(400).json({
        success: false,
        message: "Nhập câu hỏi để Trợ lý vận tải trả lời.",
      });
    }

    const messages = [
      { role: "system", content: buildSystemPrompt(req.user) },
      ...history,
    ];

    let reply = "";
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await callLlm(messages);
      const choice = data?.choices?.[0]?.message;
      if (!choice) break;

      const toolCalls = choice.tool_calls;
      if (Array.isArray(toolCalls) && toolCalls.length) {
        messages.push({
          role: "assistant",
          content: choice.content || "",
          tool_calls: toolCalls,
        });
        for (const call of toolCalls) {
          const name = call?.function?.name;
          const args = parseToolArgs(call?.function?.arguments);
          let result;
          try {
            result = await runTool(req, name, args);
          } catch (err) {
            result = { error: err.message || "Không lấy được dữ liệu." };
          }
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result).slice(0, 12000),
          });
        }
        continue;
      }

      reply = String(choice.content || "").trim();
      break;
    }

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "Trợ lý chưa trả lời được. Thử hỏi lại ngắn hơn.",
      });
    }

    res.json({
      success: true,
      data: { role: "assistant", content: reply },
    });
  } catch (err) {
    console.error("assistant.chat:", err.message);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Trợ lý vận tải tạm thời không phản hồi.",
    });
  }
};
