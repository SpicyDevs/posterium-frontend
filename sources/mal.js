const malSource = {
    name: 'mal',
    requirementKey: 'malImages',
    supportsTextless: false,
    getPoster(posters) {
        return posters?.mal?.text || null;
    }
};

export default malSource;
