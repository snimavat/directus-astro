export interface QueryClient {
  request: (command: unknown) => Promise<unknown>;
}

export interface DirectusFile {
  id: string;
  title?: string | null;
  width?: number | null;
  height?: number | null;
  type?: string | null;
}

export interface Seo {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  seo?: Seo | null;
}

export interface Author {
  id: string;
  name?: string | null;
  job_title?: string | null;
  image?: DirectusFile | null;
}

export interface ContentBlock {
  id: number | string;
  collection: string;
  sort?: number | null;
  item?: Record<string, unknown> | null;
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  image?: DirectusFile | null;
  sticky?: boolean | null;
  date_created?: string | null;
  date_published?: string | null;
  category?: Pick<Category, "id" | "title" | "slug"> | null;
  seo?: Seo | null;
}

export type RelatedItem =
  | {
      type: "post";
      post: {
        title: string;
        slug: string;
        summary?: string | null;
        category?: { slug: string } | null;
      };
    }
  | {
      type: "page";
      page: {
        title: string;
        permalink: string;
      };
    };

export interface Post extends PostSummary {
  content?: string | null;
  status?: string | null;
  link_title?: string | null;
  query?: string | null;
  date_updated?: string | null;
  author?: Author | null;
  blocks?: ContentBlock[] | null;
  related_content?: RelatedItem[];
}

export interface Page {
  id: string;
  title: string;
  permalink: string;
  status?: string | null;
  seo?: Seo | null;
  blocks?: ContentBlock[] | null;
}

export interface PostListQuery {
  category?: string | null;
  page?: number;
  limit?: number;
  sticky?: boolean | null;
  /** Defaults to `published`. Pass `null` to skip the status filter. */
  status?: string | null;
}

export interface PostCountQuery {
  category?: string | null;
  status?: string | null;
}

export interface AssetFile {
  id: string;
}
