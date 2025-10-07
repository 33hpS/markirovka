const sanitize = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

// Конфигурация для Supabase
const supabaseUrl = sanitize(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = sanitize(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
} as const;

// Конфигурация для Cloudflare R2 Object Storage
const r2Endpoint = sanitize(import.meta.env.VITE_R2_ENDPOINT);
const r2AccessKeyId = sanitize(import.meta.env.VITE_R2_ACCESS_KEY_ID);
const r2SecretAccessKey = sanitize(import.meta.env.VITE_R2_SECRET_ACCESS_KEY);
const r2BucketName = sanitize(import.meta.env.VITE_R2_BUCKET_NAME);

export const r2Config = {
  endpoint: r2Endpoint,
  accessKeyId: r2AccessKeyId,
  secretAccessKey: r2SecretAccessKey,
  region: 'auto',
  bucketName: r2BucketName,
  isConfigured: Boolean(
    r2Endpoint && r2AccessKeyId && r2SecretAccessKey && r2BucketName
  ),
} as const;

// Настройки приложения
export const appConfig = {
  apiUrl:
    sanitize(
      (import.meta as unknown as { env?: Record<string, string> })?.env
        ?.VITE_API_URL
    ) ??
    (process.env.NODE_ENV === 'production'
      ? 'https://markirovka.sherhan1988hp.workers.dev/api'
      : 'http://localhost:3000/api'),
  environment: process.env.NODE_ENV ?? 'development',
};

// Dev-time warnings if critical envs are not configured
if (typeof window !== 'undefined') {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Some features may not work.'
    );
  }
  if (!r2Config.endpoint || !r2Config.bucketName) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] R2 is not configured (VITE_R2_ENDPOINT / VITE_R2_BUCKET_NAME). Upload features may be disabled.'
    );
  }
}
