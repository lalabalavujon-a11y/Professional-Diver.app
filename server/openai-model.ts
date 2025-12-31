/**
 * Centralized OpenAI model selection.
 *
 * Priority order:
 * 1) OPENAI_CHAT_MODEL (recommended global override)
 * 2) AI_TUTOR_MODEL (legacy override used across the codebase)
 * 3) gpt-5.2 (platform default)
 */
export function getOpenAIChatModel(): string {
  const model = process.env.OPENAI_CHAT_MODEL || process.env.AI_TUTOR_MODEL || "gpt-5.2";
  return model.trim();
}

/**
 * Model used for healthcheck/pipeline tests.
 *
 * If you want a cheaper/faster model for health checks, set OPENAI_HEALTHCHECK_MODEL.
 */
export function getOpenAIHealthcheckModel(): string {
  const model = process.env.OPENAI_HEALTHCHECK_MODEL || getOpenAIChatModel();
  return model.trim();
}

