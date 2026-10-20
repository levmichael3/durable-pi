// LiteLLM provider: an OpenAI-compatible proxy for agent inference, wired in place of
// OpenRouter. Mirrors the `litellm` provider in the ten-levels-of-jev `litellm-wiring`
// branch's .pi/models.json (baseUrl https://litellm.tikalk.dev/v1, model open-weight-smart,
// compat disables the developer role and reasoning_effort). The key comes from
// LITELLM_API_KEY; the URL can be overridden with LITELLM_URL.
import { createProvider, type CreateProviderOptions, type Provider } from "@earendil-works/pi-ai/models";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";

export const DEFAULT_LITELLM_URL = "https://litellm.tikalk.dev/v1";

/** The provider id sessions and models are tagged with. */
export const LITELLM_PROVIDER_ID = "litellm";

/** The single model the proxy exposes for this device. */
export const LITELLM_MODEL_ID = "open-weight-smart";

export const LITELLM_MODEL_NAME = "Open Weight Smart (LiteLLM)";

export const LITELLM_CONTEXT_WINDOW = 1048576;

type ProviderModel = CreateProviderOptions["models"][number];
type ApiKeyAuth = NonNullable<CreateProviderOptions["auth"]["apiKey"]>;

/** pi-ai keeps envApiKeyAuth internal (it is not in the package's exports map), so replicate
 * its env-var contract: a stored credential wins, then the first non-empty env var. */
function envApiKeyAuth(name: string, envVars: string[]): ApiKeyAuth {
  return {
    name,
    resolve: async ({ ctx, credential, signal }) => {
      signal.throwIfAborted();
      if (credential?.key)
        return { auth: { apiKey: credential.key }, env: credential.env, source: "stored credential" };
      for (const envVar of envVars) {
        const value = await ctx.env(envVar);
        signal.throwIfAborted();
        if (value) return { auth: { apiKey: value }, source: envVar };
      }
      return undefined;
    },
  };
}

function litellmModel(baseUrl: string): ProviderModel {
  return {
    type: "chat",
    id: LITELLM_MODEL_ID,
    name: LITELLM_MODEL_NAME,
    api: "openai-completions",
    provider: LITELLM_PROVIDER_ID,
    baseUrl,
    input: ["text"],
    // LiteLLM is a proxy; per-token pricing is unknown here, so report zero.
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    reasoning: true,
    contextWindow: LITELLM_CONTEXT_WINDOW,
    maxTokens: 65536,
    compat: { supportsDeveloperRole: false, supportsReasoningEffort: false },
  };
}

/** The LiteLLM proxy provider. The URL defaults to the branch's proxy and honors LITELLM_URL. */
export function litellmProvider(baseUrl = process.env.LITELLM_URL ?? DEFAULT_LITELLM_URL): Provider {
  return createProvider({
    id: LITELLM_PROVIDER_ID,
    name: "LiteLLM",
    baseUrl,
    auth: { apiKey: envApiKeyAuth("LiteLLM API key", ["LITELLM_API_KEY"]) },
    models: [litellmModel(baseUrl)],
    api: openAICompletionsApi(),
  });
}
