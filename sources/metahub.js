const metahubSource = {
    name: 'metahub',
    requirementKey: 'metahub',
    supportsTextless: false,
    getPoster(posters) {
        return posters?.metahub?.text || null;
    }
};

export default metahubSource;
