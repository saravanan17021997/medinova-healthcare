/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_ALLOW_INDEXING?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_ENQUIRY_API_ENABLED?: string;
  readonly VITE_CHATBOT_ENABLED?: string;
  readonly VITE_CHATBOT_URL?: string;
  readonly VITE_CATALOGUE_API_ENABLED?: string;
  readonly VITE_CATALOGUE_API_URL?: string;
  /** Supabase project URL, e.g. https://xxxx.supabase.co (public). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable / anon key (public). Never the service_role or secret key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
