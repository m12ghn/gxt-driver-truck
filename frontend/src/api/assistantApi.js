import api from "./axios";

export const chatAssistant = (messages) => {
  return api.post("/assistant/chat", { messages }, { timeout: 60000 });
};
