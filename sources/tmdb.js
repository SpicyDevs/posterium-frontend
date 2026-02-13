const tmdbSource = {
    name: 'tmdb',
    requirementKey: 'tmdbImages',
    supportsTextless: true,
    getPoster(posters, variant = 'text') {
        return posters?.tmdb?.[variant] || posters?.tmdb?.text || null;
    }
};

export default tmdbSource;
