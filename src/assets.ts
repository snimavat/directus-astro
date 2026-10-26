import type { AssetFile } from "./types.js";

/**
 * Public file URL. `assetsUrl` is the prefix before the file id,
 * for example `https://admin.example.com/cdn` or `https://admin.example.com/assets`.
 */
export function assetUrl(
  assetsUrl: string,
  file: AssetFile | string | null | undefined,
): string | null {
  if (!file || !assetsUrl) {
    return null;
  }

  const id = typeof file === "string" ? file : file.id;
  if (!id) {
    return null;
  }

  return `${assetsUrl.replace(/\/$/, "")}/${id}`;
}
