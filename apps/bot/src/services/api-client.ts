import { healthResponseSchema } from '@mw-platform/shared';

export function createApiClient(baseUrl: string) {
  return {
    async getHealth() {
      const response = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }

      const data = await response.json();
      const parsed = healthResponseSchema.safeParse(data);

      if (!parsed.success) {
        throw new Error('Invalid health response from API');
      }

      return data as typeof parsed.data & { database?: string };
    },
  };
}
