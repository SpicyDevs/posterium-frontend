const traktSource = {
    name: 'trakt',
    requirementKey: 'trakt',
    supportsTextless: false,
    getPoster(posters) {
        return posters?.trakt?.text || null;
    }
};

export default traktSource;
