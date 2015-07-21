
describe('ADCUtilAPI', function () {
    afterEach(function () {
        var adcUtilApi = require.resolve('../app/ADCUtilAPI.js');
        if (adcUtilApi) {
            delete require.cache[adcUtilApi];
        }
    });

    describe("#validate", function () {
        it("should be the ADCValidator#validator function", function () {
            var adcUtilApi = require("../app/ADCUtilAPI.js");
            var adcValidator = require('../app/validator/ADCValidator.js');
            expect(adcUtilApi.validate).toBe(adcValidator.validate);
        });

    });


    describe("#show", function () {
        it("should be ADCShow#show function", function () {
            var adcUtilApi = require("../app/ADCUtilAPI.js");
            var adcShow = require('../app/show/ADCShow.js');
            expect(adcUtilApi.show).toBe(adcShow.show);
        });
    });

    describe('#Configurator', function () {
        it("should be ADCConfigurator#Configurator function", function () {
            var adcUtilApi = require("../app/ADCUtilAPI.js");
            var adcConf = require('../app/configurator/ADCConfigurator.js');
            expect(adcUtilApi.Configurator).toBe(adcConf.Configurator);
        });
    });

});