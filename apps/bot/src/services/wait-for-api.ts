import type { createApiClient } from './api-client.js';

type ApiClient = ReturnType<typeof createApiClient>;

interface WaitForApiOptions {
  maxAttempts?: number;
  delayMs?: number;
}

export async function waitForApi(
  apiClient: ApiClient,
  { maxAttempts = 30, delayMs = 1000 }: WaitForApiOptions = {},
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await apiClient.getHealth();
      if (attempt > 1) {
        console.log(`API ready after ${attempt} attempt(s)`);
      }
      return;
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(`API not reachable after ${maxAttempts} attempts (${maxAttempts * delayMs / 1000}s)`);
      }

      console.log(`Waiting for API... (${attempt}/${maxAttempts})`);
      await sleep(delayMs);
    }
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
