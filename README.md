# directus-astro

Read-only client for a multi-tenant Directus blog. Posts, categories, and pages are filtered by `tenant.domain`.

Install from a sibling checkout:

```json
"directus-astro": "file:../../directus-astro"
```

The relative path depends on where the site lives. From `ai-code/sudobox`, the package is two directories up.

Or from git, pinned to a tag:

```json
"directus-astro": "github:snimavat/directus-astro#v0.1.0"
```

```ts
import { createClient, createBlog } from "directus-astro";

const blog = createBlog({
  client: createClient({ url: DIRECTUS_URL, token: DIRECTUS_TOKEN }),
  tenant: "example.com",
  assetsUrl: "https://admin.example.com/cdn",
});

const posts = await blog.getPosts({ page: 1, limit: 15 });
const post = await blog.getPost("hello-world");
const image = blog.assetUrl(post?.image);
```

`assetsUrl` is the prefix before the file id. Use `/cdn` when nginx serves public files there, or `/assets` when that path is public.

`getPosts` and `getPost` default to `status = published`. Pass `status: null` to skip that filter. `getPostCount` returns a number for pagination.
