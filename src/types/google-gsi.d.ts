// ─── Google Identity Services (GSI) — Tipos globales ─────────────────────────
//
// La librería se carga dinámicamente desde:
//   https://accounts.google.com/gsi/client
//
// Solo se declaran los métodos que el proyecto realmente usa.
// Referencia: https://developers.google.com/identity/gsi/web/reference/js-reference
// ─────────────────────────────────────────────────────────────────────────────

export interface GoogleCredentialResponse {
  /** JWT de identidad firmado por Google. */
  credential: string;
  select_by?: string;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: number;
  locale?: string;
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm?: boolean;
}

interface GoogleAccountsId {
  initialize(config: GoogleInitConfig): void;
  renderButton(parent: HTMLElement, config: GoogleButtonConfig): void;
  prompt(): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}
