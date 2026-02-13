const fanartSource = {
    name: 'fanart',
    requirementKey: 'fanart',
    supportsTextless: true,
    getPoster(posters, variant = 'text') {
        return posters?.fanart?.[variant] || posters?.fanart?.text || null;
    }
};

export default fanartSource;
