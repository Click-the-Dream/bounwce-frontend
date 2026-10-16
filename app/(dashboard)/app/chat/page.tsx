import type { Metadata } from "next";
import { generatePageMetadata } from "@/app/_utils/metadata";
import ChatComponent from "./_components/ChatComponent";
import { getGroupForMetadata } from "@/app/_utils/server_functions/fetchers";
const SITE_URL = "https://bouwnce.com";
const DEFAULT_DESCRIPTION =
  "Chat with other users and stay connected with your community.";

type ChatPageProps = {
  searchParams: Promise<{
    groupId?: string | string[];
  }>;
};

export async function generateMetadata({
  searchParams,
}: ChatPageProps): Promise<Metadata> {
  const params = await searchParams;
  const rawGroupId = Array.isArray(params.groupId)
    ? params.groupId[0]
    : params.groupId;
  const groupId = rawGroupId?.trim();

  if (!groupId) {
    return generatePageMetadata({
      title: "Chat",
      description: DEFAULT_DESCRIPTION,
      path: "/app/chat",
      noIndex: true,
    });
  }

  const group = await getGroupForMetadata(groupId);
  const groupName = group?.name ?? "Group chat";
  const title = `${groupName}`;
  const description = (
    group?.description ||
    `View information about ${groupName} and connect with its community on Bouwnce.`
  ).slice(0, 200);
  const imageUrl = group?.imageUrl ?? `${SITE_URL}/logo-white.png`;
  const pageUrl = `${SITE_URL}/app/chat?groupId=${encodeURIComponent(groupId)}`;

  const base = generatePageMetadata({
    title,
    description,
    imageUrl,
    path: `/app/chat?groupId=${encodeURIComponent(groupId)}`,
    noIndex: true,
    keywords: ["group chat", "community group", groupName],
  });

  return {
    ...base,
    // Explicit title avoids inheriting a generic Chat title/template.
    title,
    description,
    alternates: { canonical: pageUrl },
    robots: { index: false, follow: false },
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: pageUrl,
      siteName: "Bouwnce",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${groupName} on Bouwnce`,
        },
      ],
    },
    twitter: {
      ...base.twitter,
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

const ChatPage = () => <ChatComponent />;

export default ChatPage;
