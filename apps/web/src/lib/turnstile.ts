// Cloudflare Turnstile 위젯 로더. 명시적 렌더(render=explicit)로 위젯을 띄우고
// 콜백으로 토큰을 받는다. 토큰은 POST /submissions 의 turnstile_token 으로 전송한다.

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** 비워두면 Cloudflare 테스트키(항상 통과)를 사용한다. */
export const TURNSTILE_SITEKEY =
  import.meta.env.PUBLIC_TURNSTILE_SITEKEY ?? "1x00000000000000000000AA";

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, opts: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loadPromise: Promise<TurnstileApi> | null = null;

/** Turnstile 스크립트를 1회만 로드하고 window.turnstile 을 반환한다. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile 은 브라우저에서만 로드됩니다."));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://challenges.cloudflare.com/turnstile"]`,
    );
    const onReady = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile 로드 실패."));
    };
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile 스크립트 로드 오류.")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile 스크립트 로드 오류.")), {
      once: true,
    });
    document.head.appendChild(script);
  });
  return loadPromise;
}

export type { TurnstileApi, TurnstileRenderOptions };
