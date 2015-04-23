
describe('ADCUtil', function () {
    afterEach(function () {
        var adcUtil = require.resolve('../app/ADCUtil.js');
        if (adcUtil) {
            delete require.cache[adcUtil];
        }
    });

    describe('#validate', function () {
        it ('should call ADCValidator#validate when the program args contains `validate`', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'validate',
                'adc/directory/path'
            ];

            var adcValidator = require('../app/validator/ADCValidator.js');
            spyOn(adcValidator, 'validate');

            require("../app/ADCUtil.js");

            expect(adcValidator.validate).toHaveBeenCalled();
        });

        describe('--no-test args', function () {
            function noTestArg(flag) {
                it("should call ADCValidator#validate with the `test=true` flag in `program` argument when argv doesn't contains " + flag, function () {
                    process.argv = [
                        'node',
                        'app/ADCUtil.js',
                        'validate',
                        'adc/directory/path'
                    ];

                    var adcValidator = require('../app/validator/ADCValidator.js');
                    spyOn(adcValidator, 'validate').andCallFake(function (program) {
                        expect(program.test).toBe(true);
                    });

                    require("../app/ADCUtil.js");
                });

                it("should call ADCValidator#validate with the `test=false` flag in `program` argument when argv contains " + flag, function () {
                    process.argv = [
                        'node',
                        'app/ADCUtil.js',
                        'validate',
                        flag,
                        'adc/directory/path'
                    ];

                    var adcValidator = require('../app/validator/ADCValidator.js');
                    spyOn(adcValidator, 'validate').andCallFake(function (program) {
                        expect(program.test).toBe(false);
                    });

                    require("../app/ADCUtil.js");
                });
            }

            ['-T', '--no-test'].forEach(noTestArg);
        });

        describe('--no-xml  args', function () {
            function noXmlArg(flag) {
                it("should call ADCValidator#validate with the `xml=true` flag in `program` argument when argv doesn't contains " + flag, function () {
                    process.argv = [
                        'node',
                        'app/ADCUtil.js',
                        'validate',
                        'adc/directory/path'
                    ];

                    var adcValidator = require('../app/validator/ADCValidator.js');
                    spyOn(adcValidator, 'validate').andCallFake(function (program) {
                        expect(program.xml).toBe(true);
                    });

                    require("../app/ADCUtil.js");
                });

                it("should call ADCValidator#validate with the `xml=false` flag in `program` argument when argv contains " + flag, function () {
                    process.argv = [
                        'node',
                        'app/ADCUtil.js',
                        'validate',
                        flag,
                        'adc/directory/path'
                    ];

                    var adcValidator = require('../app/validator/ADCValidator.js');
                    spyOn(adcValidator, 'validate').andCallFake(function (program) {
                        expect(program.xml).toBe(false);
                    });

                    require("../app/ADCUtil.js");
                });
            }

            ['-X', '--no-xml'].forEach(noXmlArg);
        });

    });

    describe('#generate', function () {
        it ('should call the ADCGenerator#generate when the program args contains `generate`', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'generate',
                'adc/directory/path'
            ];

            var adcGenerator = require('../app/generator/ADCGenerator.js');
            spyOn(adcGenerator, 'generate');

            require("../app/ADCUtil.js");

            expect(adcGenerator.generate).toHaveBeenCalled();
        });

        it ('should call the ADCGenerator#generate with the output property in `program` argument', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'generate',
                'adc/directory/path',
                '-o',
                'outputpath'
            ];

            var adcGenerator = require('../app/generator/ADCGenerator.js'),
                output;

            spyOn(adcGenerator, 'generate').andCallFake(function (program) {
                output = program.output;
            });

            require("../app/ADCUtil.js");

            expect(output).toBe('outputpath');
        });

        it ('should call the ADCGenerator#generate with the template property in `program` argument', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'generate',
                'adc/directory/path',
                '-t',
                'templatename'
            ];

            var adcGenerator = require('../app/generator/ADCGenerator.js'),
                template;

            spyOn(adcGenerator, 'generate').andCallFake(function (program) {
                template = program.template;
            });

            require("../app/ADCUtil.js");

            expect(template).toBe('templatename');
        });
    });

    describe('#build', function () {
        it ('should call ADCBuilder#build when the program args contains `build`', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'build',
                'adc/directory/path'
            ];

            var adcBuilder = require('../app/builder/ADCBuilder.js');
            spyOn(adcBuilder, 'build');

            require("../app/ADCUtil.js");

            expect(adcBuilder.build).toHaveBeenCalled();
        });
    });

    describe('#show', function () {
        it ('should call ADCShow#show when the program args contains `show`', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'show',
                'output:fallback',
                'fixture:single.xml',
                'adc/directory/path'
            ];

            var adcShow = require('../app/show/ADCShow.js');
            spyOn(adcShow, 'show');

            require("../app/ADCUtil.js");

            expect(adcShow.show).toHaveBeenCalled();
        });
    });
});