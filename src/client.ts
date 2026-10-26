import { createDirectus, rest, staticToken } from "@directus/sdk";
import type { QueryClient } from "./types.js";

export function createClient({ url, token }: { url: string; token: string }): QueryClient {
  if (!url) {
    throw new Error("Directus URL is required");
  }
  if (!token) {
    throw new Error("Directus token is required");
  }

  return createDirectus(url).with(staticToken(token)).with(rest()) as QueryClient;
}
