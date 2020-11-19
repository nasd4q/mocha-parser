describe.only('#flattenArray()', function() {
    // This test will run
    it.only('should flatten array', function() {});

    // This test will not run
    it('should recursively flatten array', function() {});
})

describe.only('#mergeArray()', function() {

    // This test is skipped at runtime for production environment
    // In production, it will not run and will be marked as pending

    it('should merge two arrays', function() {
        if (process.env.NODE_ENV === 'production') {
            return this.skip();
        }
    });

})