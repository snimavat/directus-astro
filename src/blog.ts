import { readItems } from "@directus/sdk";
import { assetUrl as buildAssetUrl } from "./assets.js";
import type {
  AssetFile,
  Category,
  ContentBlock,
  Page,
  Post,
  PostCountQuery,
  PostListQuery,
  PostSummary,
  QueryClient,
  RelatedItem,
} from "./types.js";

const queryItems = readItems as (
  collection: string,
  query: Record<string, unknown>,
) => unknown;

const POST_SUMMARY_FIELDS = [
  "id",
  "slug",
  "title",
  "summary",
  "sticky",
  "date_created",
  "date_published",
  "image.id",
  "image.title",
  "image.width",
  "image.height",
  "category.id",
  "category.title",
  "category.slug",
  "seo.title",
  "seo.description",
  "seo.keywords",
];

const POST_FIELDS = [
  ...POST_SUMMARY_FIELDS,
  "content",
  "status",
  "link_title",
  "query",
  "date_updated",
  "author.id",
  "author.name",
  "author.job_title",
  "author.image.id",
  "author.image.title",
  "blocks.id",
  "blocks.sort",
  "blocks.collection",
  "blocks.item.*",
  "blocks.item.faqs.faq.id",
  "blocks.item.faqs.faq.title",
  "blocks.item.faqs.faq.content",
  "blocks.item.files.directus_files_id.id",
  "blocks.item.files.directus_files_id.title",
  "blocks.item.files.directus_files_id.filename_download",
  "related_content.related_content.type",
  "related_content.related_content.post.title",
  "related_content.related_content.post.slug",
  "related_content.related_content.post.summary",
  "related_content.related_content.post.category.slug",
  "related_content.related_content.page.title",
  "related_content.related_content.page.permalink",
];

const CATEGORY_FIELDS = [
  "id",
  "title",
  "slug",
  "description",
  "color",
  "icon",
  "seo.title",
  "seo.description",
  "seo.keywords",
];

const PAGE_FIELDS = [
  "id",
  "title",
  "permalink",
  "status",
  "seo.title",
  "seo.description",
  "seo.keywords",
  "blocks.id",
  "blocks.sort",
  "blocks.collection",
  "blocks.item.*",
];

interface RawRelatedRow {
  related_content?: {
    type?: string | null;
    post?: {
      title?: string | null;
      slug?: string | null;
      summary?: string | null;
      category?: { slug?: string | null } | null;
    } | null;
    page?: {
      title?: string | null;
      permalink?: string | null;
    } | null;
  } | null;
}

interface RawPost extends PostSummary {
  content?: string | null;
  status?: string | null;
  link_title?: string | null;
  query?: string | null;
  date_updated?: string | null;
  author?: Post["author"];
  blocks?: ContentBlock[] | null;
  related_content?: RawRelatedRow[] | null;
}

export interface CreateBlogOptions {
  client: QueryClient;
  /** `tenant.domain` for this site. */
  tenant: string;
  /** Prefix before the file id, such as `https://admin.example.com/cdn`. */
  assetsUrl: string;
}

export function createBlog({ client, tenant, assetsUrl }: CreateBlogOptions) {
  if (!tenant) {
    throw new Error("Blog tenant domain is required");
  }

  return {
    getPosts: (query: PostListQuery = {}) => getPosts(client, tenant, query),
    getPostCount: (query: PostCountQuery = {}) => getPostCount(client, tenant, query),
    getPost: (slug: string) => getPost(client, tenant, slug),
    getCategories: () => getCategories(client, tenant),
    getCategory: (slug: string) => getCategory(client, tenant, slug),
    getPage: (permalink: string) => getPage(client, tenant, permalink),
    assetUrl: (file: AssetFile | string | null | undefined) => buildAssetUrl(assetsUrl, file),
  };
}

async function getPosts(client: QueryClient, tenant: string, query: PostListQuery): Promise<PostSummary[]> {
  const list = await client.request(
    queryItems("posts", {
      fields: POST_SUMMARY_FIELDS,
      filter: postFilter(tenant, query.category, query.status),
      sort: query.sticky ? ["-sticky", "-date_published", "-sort"] : ["-date_published", "-sort"],
      limit: query.limit ?? 15,
      page: query.page ?? 1,
    }),
  );

  return asList<PostSummary>(list);
}

async function getPostCount(client: QueryClient, tenant: string, query: PostCountQuery): Promise<number> {
  const list = await client.request(
    queryItems("posts", {
      filter: postFilter(tenant, query.category, query.status),
      aggregate: { count: "*" },
    }),
  );

  const row = asList<{ count?: string | number }>(list)[0];
  return Number(row?.count ?? 0);
}

async function getPost(client: QueryClient, tenant: string, slug: string): Promise<Post | null> {
  const list = await client.request(
    queryItems("posts", {
      fields: POST_FIELDS,
      filter: {
        ...postFilter(tenant, null, undefined),
        slug: { _eq: slug },
      },
      limit: 1,
    }),
  );

  const raw = asList<RawPost>(list)[0];
  if (!raw) {
    return null;
  }

  const { related_content, ...post } = raw;
  return {
    ...post,
    related_content: flattenRelated(related_content),
  };
}

async function getCategories(client: QueryClient, tenant: string): Promise<Category[]> {
  const list = await client.request(
    queryItems("categories", {
      fields: CATEGORY_FIELDS,
      filter: { tenant: { domain: { _eq: tenant } } },
      sort: ["sort"],
    }),
  );

  return asList<Category>(list);
}

async function getCategory(client: QueryClient, tenant: string, slug: string): Promise<Category | null> {
  const list = await client.request(
    queryItems("categories", {
      fields: CATEGORY_FIELDS,
      filter: {
        tenant: { domain: { _eq: tenant } },
        slug: { _eq: slug },
      },
      limit: 1,
    }),
  );

  return asList<Category>(list)[0] ?? null;
}

async function getPage(client: QueryClient, tenant: string, permalink: string): Promise<Page | null> {
  const list = await client.request(
    queryItems("pages", {
      fields: PAGE_FIELDS,
      filter: {
        tenant: { domain: { _eq: tenant } },
        permalink: { _eq: permalink },
        status: { _eq: "published" },
      },
      limit: 1,
    }),
  );

  return asList<Page>(list)[0] ?? null;
}

function postFilter(tenant: string, category: string | null | undefined, status: string | null | undefined) {
  const filter: Record<string, unknown> = {
    tenant: { domain: { _eq: tenant } },
  };

  if (status !== null) {
    filter.status = { _eq: status === undefined ? "published" : status };
  }

  if (category) {
    filter.category = { slug: { _eq: category } };
  }

  return filter;
}

function flattenRelated(rows: RawRelatedRow[] | null | undefined): RelatedItem[] {
  if (!rows) {
    return [];
  }

  const items: RelatedItem[] = [];
  for (const row of rows) {
    const item = row.related_content;
    if (item?.type === "post" && item.post?.title && item.post.slug) {
      items.push({
        type: "post",
        post: {
          title: item.post.title,
          slug: item.post.slug,
          summary: item.post.summary ?? null,
          category: item.post.category?.slug ? { slug: item.post.category.slug } : null,
        },
      });
      continue;
    }

    if (item?.type === "page" && item.page?.title && item.page.permalink) {
      items.push({
        type: "page",
        page: {
          title: item.page.title,
          permalink: item.page.permalink,
        },
      });
    }
  }

  return items;
}

function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
