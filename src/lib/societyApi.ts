export type SocietyBackendStatus = 'CHECKING' | 'CONNECTED' | 'UNCONFIGURED' | 'UNREACHABLE';

export interface SocietyHealthResponse {
  ok: boolean;
  source: string;
  mode: string;
}

export interface SocietyHealthProbe {
  status: SocietyBackendStatus;
  health?: SocietyHealthResponse;
  error?: string;
}

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | undefined>;
};

function getSocietyApiBaseUrl(): string {
  const raw = (import.meta as ImportMetaWithEnv).env?.VITE_SOCIETY_API_BASE_URL ?? '';
  return raw.trim().replace(/\/+$/, '');
}

export async function checkSocietyHealth(): Promise<SocietyHealthProbe> {
  const baseUrl = getSocietyApiBaseUrl();
  if (!baseUrl) {
    return { status: 'UNCONFIGURED', error: 'VITE_SOCIETY_API_BASE_URL is not configured' };
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { status: 'UNREACHABLE', error: `Society backend returned HTTP ${response.status}` };
    }

    const health = (await response.json()) as SocietyHealthResponse;
    const backendIdentity = response.headers.get('X-City-Zero-Backend');

    if (
      health.ok !== true ||
      health.source !== 'society.runtime_health' ||
      health.mode !== 'read-only' ||
      backendIdentity !== 'society.v1'
    ) {
      return { status: 'UNREACHABLE', health, error: 'Society backend identity check failed' };
    }

    return { status: 'CONNECTED', health };
  } catch (error) {
    return {
      status: 'UNREACHABLE',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
