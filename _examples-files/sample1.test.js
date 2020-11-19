const dbConfig = require("../../app/00_config/db.config");

describe("using process env", function() {
    this.timeout(60 * 1000);

    it("general", async(done) => {
        console.log(`process.env.NODE_ENV: ${process.env.NODE_ENV}`);
        console.log("done");
        console.log("allo");
        console.log(`process.env.SPECIAL: ${process.env.SPECIAL}`);
        done();
    })

    it("db config is set right", () => {
        console.log(dbConfig.url);
        console.log(dbConfig);
    })
})