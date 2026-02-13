const anilistSource = {
    name: 'anilist',
    requirementKey: 'anilist',
    supportsTextless: false,
    getPoster(posters) {
        return posters?.anilist?.text || null;
    }
};

export default anilistSource;
