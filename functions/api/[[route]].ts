interface Env {
  BACKEND_WORKER: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // 1. Parse the incoming request URL (e.g., https://freeposterapi.pages.dev/api/movie/123)
  const url = new URL(context.request.url);

  // 2. Remove the "/api" prefix so the worker sees the path it expects (e.g., /movie/123)
  const workerPath = url.pathname.replace(/^\/api/, '');
  
  // 3. Construct the internal request URL
  // The hostname doesn't matter for Service Bindings, but we need a valid URL structure.
  const internalUrl = new URL(workerPath + url.search, 'https://internal-worker');

  // 4. Call the bound worker directly (Zero-Latency RPC)
  // We recreate the Request to strip headers that might cause issues (like CF-Connecting-IP immutable headers)
  // or simply pass the original request if your worker handles it well.
  return context.env.BACKEND_WORKER.fetch(internalUrl.toString(), context.request);
}