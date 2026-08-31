export interface CookieOptions {
  expires?: Date | number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    if (typeof options.expires === "number") {
      const date = new Date();
      date.setTime(date.getTime() + options.expires * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    } else {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
  }

  cookieString += `; path=${options.path || "/"}`;

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += "; secure";
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string, options: CookieOptions = {}): void {
  setCookie(name, "", {
    ...options,
    expires: new Date(0),
    path: options.path || "/",
  });
}
