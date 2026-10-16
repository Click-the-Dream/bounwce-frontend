import type { Metadata } from "next";
import GroupInvitePreview from "./GroupInvitePreview";

const siteUrl = "https://bouwnce.com";

async function fetchGroup(groupId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  try {
    // Load the existing group-details resource for previews and share metadata.
    // The public invitation/token endpoint should be used here once its exact
    // response shape is confirmed from the backend's OpenAPI schema.
    const response = await fetch(
      `${base.replace(/\/$/, "")}/api/v1/groups/${encodeURIComponent(groupId)}`,
      {
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data?.group ?? payload?.group ?? payload?.data ?? payload;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}): Promise<Metadata> {
  const { groupId } = await params;
  const value = await fetchGroup(groupId);
  const record = value?.group ?? value;
  const name = String(record?.name ?? record?.title ?? "Bouwnce group");
  const description = String(
    record?.description ?? `View information about ${name} on Bouwnce.`,
  );
  const image = record?.avatar_url ?? record?.icon_url ?? "/logo-white.png";
  const url = `${siteUrl}/group-invite/${encodeURIComponent(groupId)}`;
  return {
    metadataBase: new URL(siteUrl),
    title: `${name}`,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${name}`,
      description,
      url,
      siteName: "Bouwnce",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${name} group on Bouwnce`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name}`,
      description,
      images: [image],
    },
  };
}

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <GroupInvitePreview groupId={groupId} />;
}
