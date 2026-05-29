export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const getIDFromSlug = (param?: string) => {
  if (!param) return null;

  const parts = param.split("_");
  const profileId = parts[parts.length - 1];

  return {
    profileId,
    raw: param,
  };
};

export const getPeerId = ({
  sender_id,
  recipient_id,
  currentUserId,
}: {
  sender_id: string;
  recipient_id: string;
  currentUserId: string;
}) => {
  return sender_id === currentUserId ? recipient_id : sender_id;
};
