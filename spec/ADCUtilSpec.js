
describe('ADCUtil', function () {
    afterEach(function () {
        var adcUtil = require.resolve('../app/ADCUtil.js');
        if (adcUtil) {
            delete require.cache[adcUtil];
        }
    });

    describe('cmd `validate`', function () {
        it('should call ADCValidator#validate when the program args contains `validate`', function () {
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

    describe('cmd `generate`', function () {
        it('should call the ADCGenerator#generate when the program args contains `generate`', function () {
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

        it('should call the ADCGenerator#generate with the output property in `program` argument', function () {
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

        it('should call the ADCGenerator#generate with the template property in `program` argument', function () {
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

    describe('cmd `build`', function () {
        it('should call ADCBuilder#build when the program args contains `build`', function () {
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

    describe('cmd `show`', function () {
        it('should call ADCShow#show when the program args contains `show`', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'show',
                'output:fallback',
                'fixture:single.xml',
                'masterPage:masterPage.html',
                'properties:prop1=value1&prop2=value2',
                'adc/directory/path'
            ];

            var adcShow = require('../app/show/ADCShow.js');
            spyOn(adcShow, 'show');

            require("../app/ADCUtil.js");

            expect(adcShow.show).toHaveBeenCalled();
        });
    });

    describe('cmd `config`', function () {
        it('should call ADCPreferences#read when the program args contains `config` and nothing else', function () {
            process.argv = [
                'node',
                'app/ADCUtil.js',
                'config'
            ];

            var adcPreferences = require('../app/preferences/ADCPreferences.js');
            spyOn(adcPreferences, 'read');

            require("../app/ADCUtil.js");

            expect(adcPreferences.read).toHaveBeenCalled();
        });

        ['--authorName', '--authorEmail', '--authorCompany', '--authorWebsite'].forEach(function (flag) {
            it('should call ADCPreferences#write when the program args contains `config` and at least `' + flag + '`', function () {
                process.argv = [
                    'node',
                    'app/ADCUtil.js',
                    'config',
                    flag,
                    'AValue'
                ];

                var adcPreferences = require('../app/preferences/ADCPreferences.js');
                spyOn(adcPreferences, 'write');
                spyOn(adcPreferences, 'read');

                require("../app/ADCUtil.js");

                expect(adcPreferences.write).toHaveBeenCalled();
                expect(adcPreferences.read).not.toHaveBeenCalled();
            });

            it('should call ADCPreferences#write with the right option when the program args contains `config` and at least `' + flag + '`', function () {
                process.argv = [
                    'node',
                    'app/ADCUtil.js',
                    'config',
                    flag,
                    'AValue'
                ];

                var adcPreferences = require('../app/preferences/ADCPreferences.js');
                spyOn(adcPreferences, 'write');
                spyOn(adcPreferences, 'read');

                require("../app/ADCUtil.js");

                adcPreferences.write.andCallFake(function (obj) {
                    var expectation = {};
                    expectation[flag] = 'AValue';
                    expect(obj.author).toEqual(expectation);
                });
                expect(adcPreferences.write).toHaveBeenCalled();
                expect(adcPreferences.read).not.toHaveBeenCalled();
            });


        });

    });

});