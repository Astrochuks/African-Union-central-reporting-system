import { apiPost } from "./client";
import type { ChatResponse } from "../types/api";

export async function sendChatMessage(
  message: string,
  history?: { role: string; content: string }[]
): Promise<ChatResponse> {
  return apiPost("/chat", { message, history });
}
