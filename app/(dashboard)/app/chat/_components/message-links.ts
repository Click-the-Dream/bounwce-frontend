const MESSAGE_URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

export interface MessageUrlInfo {
  raw: string;
  href: string;
  navigationHref: string;
  host: string;
  pathname: string;
  isInternal: boolean;
  isBouwnce: boolean;
}

export const trimUrlPunctuation = (raw: string) => {
  let url = raw;
  let trailing = "";

  while (/[.,!?;:]$/.test(url)) {
    trailing = url.slice(-1) + trailing;
    url = url.slice(0, -1);
  }

  // Keep balanced brackets in URLs but avoid swallowing sentence punctuation.
  const bracketPairs: Array<[string, string]> = [ ["(", ")"], ["[", "]"], ["{", "}"] ];
  let changed = true;
  while (changed && url.length) {
    changed = false;
    for (const [open, close] of bracketPairs) {
      if (!url.endsWith(close)) continue;
      const openCount = url.split(open).length - 1;
      const closeCount = url.split(close).length - 1;
      if (closeCount > openCount) {
        trailing = close + trailing;
        url = url.slice(0, -1);
        changed = true;
      }
    }
  }

  return { url, trailing };
};

const isBouwnceHostname = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === "bouwnce.com" || host.endsWith(".bouwnce.com");
};

const getCurrentHostname = () => {
  // Use the public app URL instead of window.location so the server-rendered
  // message and the hydrated client agree on whether a link is internal.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return "";

  try {
    return new URL(appUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
};

export const resolveMessageUrl = (raw: string): MessageUrlInfo | null => {
  const cleaned = trimUrlPunctuation(raw).url;
  if (!cleaned) return null;

  const normalized = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;

    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const isBouwnce = isBouwnceHostname(parsed.hostname);
    const currentHost = getCurrentHostname();
    const isSameOrigin = Boolean(currentHost && parsed.hostname.toLowerCase() === currentHost);
    const isInternal = isBouwnce || isSameOrigin;
    const internalPath = `${parsed.pathname || "/"}${parsed.search}${parsed.hash}`;

    return {
      raw: cleaned,
      href: parsed.href,
      navigationHref: isInternal ? internalPath : parsed.href,
      host,
      pathname: parsed.pathname || "/",
      isInternal,
      isBouwnce,
    };
  } catch {
    return null;
  }
};

export const extractMessageUrls = (text: string) => {
  const matches = text.match(MESSAGE_URL_PATTERN) ?? [];
  return matches
    .map((raw) => ({ raw, ...trimUrlPunctuation(raw) }))
    .filter((item) => Boolean(item.url))
    .map((item) => ({
      source: item.raw,
      url: item.url,
      trailing: item.trailing,
      info: resolveMessageUrl(item.url),
    }))
    .filter((item) => Boolean(item.info));
};

export const getMessageUrlSegments = (text: string) => {
  const segments: Array<{ type: "text" | "url"; value: string; trailing?: string }> = [];
  const matcher = new RegExp(MESSAGE_URL_PATTERN.source, "gi");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    const index = match.index;
    const raw = match[0];
    const { url, trailing } = trimUrlPunctuation(raw);
    const info = resolveMessageUrl(url);
    if (!info) continue;

    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    segments.push({ type: "url", value: url, trailing });
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  if (!segments.length) return [{ type: "text" as const, value: text }];
  return segments;
};

export const getFallbackPreviewTitle = (info: MessageUrlInfo) => {
  const segments = info.pathname.split("/").filter(Boolean);
  const last = segments.at(-1);

  if (!last || /^[0-9a-f-]{12,}$/i.test(last)) {
    return info.isBouwnce ? "Bouwnce" : info.host;
  }

  let decodedLast = last;
  try {
    decodedLast = decodeURIComponent(last);
  } catch {
    // Keep the raw path segment if it contains invalid percent encoding.
  }

  const humanized = decodedLast
    .replace(/[-_]+/g, " ")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .trim();

  if (!humanized || /^[0-9]+$/.test(humanized)) {
    return info.isBouwnce ? "Bouwnce" : info.host;
  }

  return humanized.replace(/\b\w/g, (letter) => letter.toUpperCase());
};
