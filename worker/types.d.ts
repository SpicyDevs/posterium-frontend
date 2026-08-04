// Minimal Cloudflare Workers runtime types for type-checking worker/index.ts
// without pulling in @cloudflare/workers-types (unresolvable on this registry).

interface Env {
  ASSETS: Fetcher;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

type ExportedHandler<E> = {
  fetch(request: Request, env: E): Promise<Response> | Response;
};
