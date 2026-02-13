const imdbSource = {
    name: 'imdb',
    requirementKey: 'imdb',
    supportsTextless: false,
    getPoster(posters) {
        return posters?.imdb?.text || null;
    }
};

export default imdbSource;
