/**
 * Custom prompt generator API client (browser-side).
 *
 * Contract (verified against gop-back src/modules/generator):
 *   POST /api/generator/custom-prompt-generate
 *        { email, task(10–1000), prompt_type? } -> { url, task_id }
 *   GET  /api/generator/task-status/:taskId -> { status, prompt_name?, prompt_body? }
 *
 * The POST does findOrCreateByEmail and returns a STRIPE CHECKOUT url — a
 * generation is paid. We front it with a sign-up gate (see the generator
 * client), so only account-holders reach checkout. After payment, the success
 * page polls task-status for the finished prompt.
 *
 * `prompt_type` is a backend NUMBER whose enum mapping isn't yet confirmed, so
 * we omit it for now rather than send a guessed value.
 */
import { API_BASE } from "./base";

export type GeneratePayload = {
  email: string;
  task: string;
  prompt_type?: number;
};

export type CheckoutSession = { url: string; task_id: number };

export type TaskStatus = {
  status: string;
  prompt_name?: string;
  page_name?: string;
  prompt_body?: string;
};

export class GeneratorError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GeneratorError";
    this.status = status;
  }
}

export async function createCustomPrompt(payload: GeneratePayload): Promise<CheckoutSession> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/generator/custom-prompt-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(payload),
    });
  } catch {
    throw new GeneratorError("Network error — check your connection and try again.", 0);
  }

  if (!res.ok) {
    let raw = "";
    try {
      const j = await res.json();
      raw = Array.isArray(j?.message) ? j.message.join(" ") : j?.message || j?.error || "";
    } catch {
      /* not JSON */
    }
    if (res.status === 429) {
      throw new GeneratorError("You've hit the generation limit — try again shortly.", 429);
    }
    throw new GeneratorError(
      raw || (res.status >= 500 ? "Something went wrong generating your prompt." : "Couldn't start the generation."),
      res.status,
    );
  }

  return (await res.json()) as CheckoutSession;
}

export async function getGeneratorTaskStatus(taskId: number): Promise<TaskStatus> {
  const res = await fetch(`${API_BASE}/api/generator/task-status/${taskId}`, {
    method: "GET",
    credentials: "omit",
  });
  if (!res.ok) throw new GeneratorError("Couldn't fetch the generation status.", res.status);
  return (await res.json()) as TaskStatus;
}
