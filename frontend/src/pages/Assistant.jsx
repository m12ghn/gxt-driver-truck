import { useEffect, useRef, useState } from "react";

import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  alpha,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";

import { chatAssistant } from "../api/assistantApi";
import { brand } from "../theme/brand";

const SUGGESTIONS = [
  "Hôm nay GXT có bao nhiêu chuyến chưa Check In?",
  "Xe nào Check In trễ hôm nay?",
  "Ca 1 và Ca 2 tan ca lúc mấy?",
  "Phân công GXT khác Vùng HCM chỗ nào?",
];

const SESSION_KEY = "gxt-assistant-messages";

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Assistant() {
  const [messages, setMessages] = useState(loadSession);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.slice(-20)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text) {
    const content = String(text || "").trim();
    if (!content || busy) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await chatAssistant(next);
      const reply = res.data?.data?.content || "Không có câu trả lời.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            err.response?.data?.message ||
            "Không gọi được trợ lý. Thử lại sau.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(brand.teal, 0.12),
            color: brand.teal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SmartToyIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Trợ lý vận tải
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hỏi thông tin vận hành GXT: chuyến, xe, tài xế, kho, Check In/Out
          </Typography>
        </Box>
      </Stack>

      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 3,
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2.5 }}>
          {messages.length === 0 && (
            <Box sx={{ maxWidth: 640, mx: "auto", mt: 4, textAlign: "center" }}>
              <Typography color="text.secondary" mb={2}>
                Gợi ý câu hỏi
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                justifyContent="center"
              >
                {SUGGESTIONS.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onClick={() => send(item)}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {messages.map((item, index) => {
            const mine = item.role === "user";
            return (
              <Stack
                key={`${item.role}-${index}`}
                direction="row"
                spacing={1}
                justifyContent={mine ? "flex-end" : "flex-start"}
                mb={1.5}
              >
                {!mine && (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: brand.teal,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 18 }} />
                  </Box>
                )}
                <Box
                  sx={{
                    maxWidth: "78%",
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: mine ? brand.teal : "action.hover",
                    color: mine ? "#fff" : "text.primary",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {item.content}
                  </Typography>
                </Box>
                {mine && (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "action.selected",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </Box>
                )}
              </Stack>
            );
          })}

          {busy && (
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <CircularProgress size={18} sx={{ color: brand.teal }} />
              <Typography variant="body2" color="text.secondary">
                Đang tra dữ liệu GXT...
              </Typography>
            </Stack>
          )}
          <div ref={bottomRef} />
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              size="small"
              placeholder="Hỏi trợ lý vận tải..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              multiline
              maxRows={4}
            />
            <IconButton
              type="submit"
              color="primary"
              disabled={busy || !input.trim()}
              sx={{
                bgcolor: brand.teal,
                color: "#fff",
                "&:hover": { bgcolor: brand.tealDark },
                "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
              }}
            >
              <SendIcon />
            </IconButton>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
