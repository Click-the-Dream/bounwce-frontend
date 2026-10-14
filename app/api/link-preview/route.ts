import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as http from "node:http";
import * as https from "node:https";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HTML_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_REDIRECTS = 3;

const isPublicIpv4 = (address: string) => {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
};

const isPublicIp = (address: string, family: number) => {
  if (family === 4 || isIP(address) === 4) return isPublicIpv4(address);

  const value = address.toLowerCase().split("%", 1)[0];
  if (value.startsWith("::ffff:")) {
    const mapped = value.slice("::ffff:".length);
    return isIP(mapped) === 4 ? isPublicIpv4(mapped) : false;
  }

  // Reject unspecified, loopback, unique-local, link-local, multicast, and
  // documentation IPv6 ranges. Other globally routable addresses are allowed.
  const firstHextet = Number.parseInt(value.split(":", 1)[0] || "0", 16);
  if (
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    /^(?:fe[89ab])/i.test(value) ||
    value.startsWith("ff") ||
    // Only globally-routable unicast space (2000::/3) is accepted.
    firstHextet < 0x2000 ||
    firstHextet > 0x3fff ||
    value.startsWith("2001:0:") ||
    value.startsWith("2001:2:") ||
    value.startsWith("2001:db8") ||
    value.startsWith("2001:10:") ||
    value.startsWith("2001:20:") ||
    value.startsWith("2002:") ||
    value.startsWith("3fff:")
  ) {
    return false;
  }

  return isIP(value) === 6;
};

const resolvePublicAddresses = async (hostname: string) => {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Private hostname is not allowed");
  }

  const family = isIP(host);
  const addresses = family
    ? [{ address: host, family }]
    : await lookup(host, { all: true, verbatim: true });

  if (!addresses.length || addresses.some((item) => !isPublicIp(item.address, item.family))) {
    throw new Error("Non-public destination is not allowed");
  }

  return addresses;
};

const validatePublicUrl = async (input: string) => {
  const url = new URL(input);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP(S) links are supported");
  }
  if (url.username || url.password) throw new Error("Credentials are not allowed in URLs");
  if (
    url.port &&
    ((url.protocol === "http:" && url.port !== "80") ||
      (url.protocol === "https:" && url.port !== "443"))
  ) {
    throw new Error("Non-standard ports are not allowed");
  }
  await resolvePublicAddresses(url.hostname);
  return url;
};

interface FetchResult {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

const requestHtml = async (url: URL): Promise<FetchResult> => {
  const addresses = await resolvePublicAddresses(url.hostname);
  const chosen = addresses[0];
  const transport = (url.protocol === "https:" ? https : http) as typeof http;

  return await new Promise((resolve, reject) => {
    let settled = false;
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname.replace(/^\[|\]$/g, ""),
        port: url.port || undefined,
        method: "GET",
        path: `${url.pathname || "/"}${url.search}`,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          "User-Agent": "BouwnceLinkPreview/1.0 (+https://bouwnce.com)",
          "Accept-Encoding": "identity",
          Connection: "close",
        },
        timeout: REQUEST_TIMEOUT_MS,
        // Pin the outgoing connection to the already-validated public IP so a
        // DNS change between validation and connection cannot target localhost.
        lookup: ((_: string, options: any, callback: any) => {
          if (options?.all) {
            callback(null, [{ address: chosen.address, family: chosen.family }]);
          } else {
            callback(null, chosen.address, chosen.family);
          }
        }) as any,
        servername: isIP(url.hostname.replace(/^\[|\]$/g, "")) ? undefined : url.hostname,
      } as any,
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const chunks: Buffer[] = [];
        let byteCount = 0;

        response.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          byteCount += buffer.length;
          if (byteCount > MAX_HTML_BYTES) {
            response.destroy(new Error("Preview page is too large"));
            return;
          }
          chunks.push(buffer);
        });
        response.on("error", (error) => {
          if (settled) return;
          settled = true;
          reject(error);
        });
        response.on("end", () => {
          if (settled) return;
          settled = true;
          resolve({
            statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Preview request timed out"));
    });
    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    request.end();
  });
};

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .trim();

const getAttributes = (tag: string) => {
  const attributes: Record<string, string> = {};
  const regex = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(tag)) !== null) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
};

const readMetadata = async (html: string, pageUrl: URL) => {
  const meta: Record<string, string> = {};
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attributes = getAttributes(tag);
    const key = (attributes.property || attributes.name || attributes.itemprop || "").toLowerCase();
    const content = attributes.content;
    if (key && content && !meta[key]) meta[key] = content;
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = meta["og:title"] || meta["twitter:title"] || (titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "") : "");
  const description = meta["og:description"] || meta["twitter:description"] || meta.description || "";
  const imageSource = meta["og:image"] || meta["og:image:url"] || meta["twitter:image"] || "";
  let image: string | null = null;

  if (imageSource) {
    try {
      const parsedImage = new URL(imageSource, pageUrl);
      if (parsedImage.protocol === "https:" || parsedImage.protocol === "http:") {
        await validatePublicUrl(parsedImage.href);
        image = parsedImage.href;
      }
    } catch {
      image = null;
    }
  }

  return {
    title: decodeHtml(title).replace(/\s+/g, " ").slice(0, 180),
    description: decodeHtml(description).replace(/\s+/g, " ").slice(0, 360),
    image,
    siteName: meta["og:site_name"] || pageUrl.hostname.replace(/^www\./, ""),
    url: pageUrl.href,
  };
};

export async function GET(request: NextRequest) {
  const requestedUrl = request.nextUrl.searchParams.get("url");
  if (!requestedUrl || requestedUrl.length > 2048) {
    return NextResponse.json({ error: "A valid URL is required" }, { status: 400 });
  }

  try {
    let url = await validatePublicUrl(requestedUrl);
    let result: FetchResult | null = null;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      result = await requestHtml(url);
      const location = result.headers.location;
      if (result.statusCode >= 300 && result.statusCode < 400 && location) {
        if (redirects === MAX_REDIRECTS) throw new Error("Too many redirects");
        url = await validatePublicUrl(new URL(location, url).href);
        continue;
      }
      break;
    }

    if (!result || result.statusCode < 200 || result.statusCode >= 300) {
      return NextResponse.json({ error: "Preview is unavailable" }, { status: 502 });
    }

    const contentType = String(result.headers["content-type"] ?? "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return NextResponse.json({
        title: url.hostname.replace(/^www\./, ""),
        description: "Open this link to view its content.",
        image: null,
        siteName: url.hostname.replace(/^www\./, ""),
        url: url.href,
      }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
    }

    const metadata = await readMetadata(result.body, url);
    if (!metadata.title && !metadata.description && !metadata.image) {
      metadata.title = url.hostname.replace(/^www\./, "");
      metadata.description = "Open this link to view its content.";
    }

    return NextResponse.json(metadata, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    // A preview is an enhancement; unavailable pages should never prevent
    // the message itself from rendering or opening normally.
    return NextResponse.json({ error: "Preview is unavailable" }, { status: 502 });
  }
}
