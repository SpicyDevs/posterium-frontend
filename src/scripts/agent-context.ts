declare global {
  interface Navigator {
    modelContext?: {
      provideContext: (context: unknown) => Promise<unknown>;
    };
  }
}

(() => {
  if (typeof navigator === 'undefined') return;

  const modelContext = navigator.modelContext;
  if (!modelContext || typeof modelContext.provideContext !== 'function') return;

  const tools = [
    {
      name: 'open_builder',
      description: 'Open the Posterium builder with optional title prefill.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Optional title to prefill in the builder.' },
        },
      },
      execute: async (input: { title?: string } = {}) => {
        const title = typeof input.title === 'string' ? input.title.trim() : '';
        const target = title ? `/build?title=${encodeURIComponent(title)}` : '/build';
        window.location.assign(target);
        return { success: true, url: `${window.location.origin}${target}` };
      },
    },
    {
      name: 'open_examples',
      description: 'Open the examples page with an optional search query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional examples search query.' },
        },
      },
      execute: async (input: { query?: string } = {}) => {
        const query = typeof input.query === 'string' ? input.query.trim() : '';
        const target = query ? `/examples?q=${encodeURIComponent(query)}` : '/examples';
        window.location.assign(target);
        return { success: true, url: `${window.location.origin}${target}` };
      },
    },
  ];

  Promise.resolve(
    modelContext.provideContext({
      server: {
        name: 'Posterium Browser Context',
        description: 'WebMCP context for poster generation and discovery actions.',
      },
      capabilities: {
        tools: {},
      },
      tools,
    })
  ).catch(() => {
    // no-op: browser/agent compatibility can vary
  });
})();

export {};
