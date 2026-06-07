module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/', '/build', '/examples', '/faq'], // Key pages to test
      numberOfRuns: 3, // Runs 3 times to prevent flaky scores
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Gives you a shareable link to the report
    },
  },
};
