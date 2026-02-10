interface Env {
  BACKEND_WORKER: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // 1. Parse the incoming request URL (e.g., https://freeposterapi.pages.dev/api/movie/123)
  const url = new URL(context.request.url);

  // 2. Remove the "/api" prefix so the worker sees the path it expects (e.g., /movie/123)
  const workerPath = url.pathname.replace(/^\/api/, '');
  
  // 3. Construct the internal request URL
  const internalUrl = new URL(workerPath + url.search, 'https://internal-worker');

  // 4. Create a new Request object to inject the secret header
  const newRequest = new Request(internalUrl.toString(), context.request);
  newRequest.headers.set('X-Internal-Secret', 'spicydevs-internal-v1');

  // 5. Call the bound worker directly
  return context.env.BACKEND_WORKER.fetch(newRequest);
}