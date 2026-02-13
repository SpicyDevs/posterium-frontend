const tvdbSource = {
    name: 'tvdb',
    requirementKey: 'tvdb',
    supportsTextless: true,
    getPoster(posters, variant = 'text') {
        return posters?.tvdb?.[variant] || posters?.tvdb?.text || null;
    }
};

export default tvdbSource;
