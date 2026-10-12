const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const compressUuid = (id: string): string | null =>
  UUID.test(id)
    ? `u${BigInt(`0x${id.replace(/-/g, "")}`)
        .toString(36)
        .padStart(25, "0")}`
    : null;

const expandUuid = (value: string): string | null => {
  if (!/^u[0-9a-z]{25}$/i.test(value)) return null;

  const number = [...value.slice(1)].reduce(
    (n, char) => n * BigInt(36) + BigInt(parseInt(char, 36)),
    BigInt(0),
  );

  const hex = number.toString(16);
  if (hex.length > 32) return null;

  const h = hex.padStart(32, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export const slugifyStoreName = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "store";

export const createStorePath = (store: {
  user_id: string;
  name?: string | null;
}): string =>
  `/stores/${slugifyStoreName(store.name || "store")}-${compressUuid(String(store.user_id)) ?? encodeURIComponent(String(store.user_id))}`;

export const extractStoreId = (storeRef: string): string => {
  // New format: store-name-u[25 base36 characters]
  const match = storeRef.match(/-(u[0-9a-z]{25})$/i);
  if (match) {
    const id = expandUuid(match[1]);
    if (id) return id;
  }

  // Backward compatibility with previous slug--UUID URLs.
  const separator = storeRef.lastIndexOf("--");
  if (separator !== -1) {
    return decodeURIComponent(storeRef.slice(separator + 2));
  }

  // Existing /stores/{id} URLs.
  return decodeURIComponent(storeRef);
};
