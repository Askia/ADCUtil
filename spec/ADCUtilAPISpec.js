
describe('ADCUtilAPI', function () {
    afterEach(function () {
        var adcUtilApi = require.resolve('../app/ADCUtilAPI.js');
        if (adcUtilApi) {
            delete require.cache[adcUtilApi];
        }
    });

    describe("#validate", function () {
        it("should be a function", function () {
            var adcUtilApi = require("../app/ADCUtilAPI.js");
            expect(typeof adcUtilApi.validate).toBe('function');
        });
    });


    describe("#show", function () {
        it("should be a function", function () {
            var adcUtilApi = require("../app/ADCUtilAPI.js");
            expect(typeof adcUtilApi.show).toBe('function');
        });
    });

});