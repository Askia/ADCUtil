describe('ADCBuilder', function () {

    var fs              = require('fs'),
        format          = require('util').format,
        pathHelper      = require('path'),
        spies           = {},
        common,
        adcValidator,
        adcBuilder,
        errMsg,
        successMsg;

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the adcGenerator each time
        var adcBuilderKey   = require.resolve('../../app/builder/ADCBuilder.js'),
            adcValidatorKey = require.resolve('../../app/validator/ADCValidator.js'),
            commonKey       = require.resolve('../../app/common/common.js');

        delete require.cache[commonKey];
        common = require('../../app/common/common.js');

        delete require.cache[adcValidatorKey];
        adcValidator = require('../../app/validator/ADCValidator.js');

        delete require.cache[adcBuilderKey];
        adcBuilder = require('../../app/builder/ADCBuilder.js');

        // Messages
        errMsg      = common.messages.error;
        successMsg  = common.messages.success;

        // Court-circuit the validation
        spies.validate    =  spyOn(adcValidator, 'validate');

        // Court-circuit the validation outputs
        spies.writeError   = spyOn(common, 'writeError');
        spies.writeSuccess = spyOn(common, 'writeSuccess');
        spies.dirExists    = spyOn(common, 'dirExists');

        // Court-circuit the creation of the zip object
        spies.getNewZip   = spyOn(common, 'getNewZip');

        // Court-circuit the access of the filesystem
        spies.fs = {
            stat        : spyOn(fs, 'stat'),
            exists      : spyOn(fs, 'exists'),
            readdirSync : spyOn(fs, 'readdirSync'),
            readFile    : spyOn(fs, 'readFile'),
            readFileSync: spyOn(fs, 'readFileSync'),
            writeFile   : spyOn(fs, 'writeFile'),
            mkdirSync   : spyOn(fs, 'mkdirSync')
        };

        spyOn(common, 'isIgnoreFile').andCallFake(function (f) {
            return (f === 'Thumbs.db' || f === '.DS_Store');
        });

    });

    describe('#build', function () {
        it("should run the validator", function () {
            adcBuilder.build();
            expect(adcValidator.validate).toHaveBeenCalled();
        });

        it("should run the validator with xml validation, even if the flag --no-xml is true", function () {
            var p;
            adcValidator.validate.andCallFake(function (program, path, callback) {
                p = program;
            });
            adcBuilder.build({
                xml : false
            });
            expect(p.xml).toBe(true);
        });

        it("should run the validator with auto-test validation, even if the flag --no-test is true", function () {
            var p;
            adcValidator.validate.andCallFake(function (program, path, callback) {
                p = program;
            });
            adcBuilder.build({
                test : false
            });
            expect(p.autoTest).toBe(true);
        });

        it("should output an error when the validation failed", function () {
            adcValidator.validate.andCallFake(function (program, path, callback) {
                callback(new Error("Fake error"));
            });
            adcBuilder.build();
            expect(common.writeError).toHaveBeenCalledWith(errMsg.validationFailed);
        });

        describe("create `bin` directory", function () {
            beforeEach(function () {
                adcValidator.validate.andCallFake(function (program, path, callback) {
                    adcValidator.adcDirectoryPath = 'adc/path/dir/';
                    callback(null);
                });
            });

            it("should create a `bin` directory, if it doesn't exist", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                   callback(null, false);
                });
                adcBuilder.build();
                expect(fs.mkdirSync).toHaveBeenCalled();
            });

            it("should not create a `bin` directory, if it already exist", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    callback(null, true);
                });
                adcBuilder.build();
                expect(fs.mkdirSync).not.toHaveBeenCalled();
            });

            it("should output an error when it cannot create the `bin` folder", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    callback(null, false);
                });
                spies.fs.mkdirSync.andReturn(new Error("Fake error"));
                adcBuilder.build();
                expect(common.writeError).toHaveBeenCalledWith("Fake error");
            });
        });

        describe("compress the ADC directory", function () {
            var struct, newZip, files;
            beforeEach(function () {
                adcValidator.validate.andCallFake(function (program, path, callback) {
                    adcValidator.adcName = 'myadc';
                    adcValidator.adcDirectoryPath = 'adc/path/dir/';
                    callback(null);
                });

                spies.dirExists.andCallFake(function (path, callback) {
                    callback(null, true);
                });

                struct =   [
                    {
                        name : 'resources',
                        sub  : [
                            {
                                name : 'dynamic',
                                sub  : [
                                    'default.html',
                                    'dynamic.css'
                                ]
                            },
                            {
                                name : 'static',
                                sub  : [
                                    'default.html',
                                    'static.css'
                                ]
                            },
                            {
                                name : 'share',
                                sub  : [
                                    'default.js',
                                    'share.js'
                                ]
                            }
                        ]
                    },
                    'config.xml',
                    'readme.txt'
                ];
                spyOn(common, 'getDirStructure').andCallFake(function (path, callback) {
                    callback(null, struct);
                });


                newZip = {
                    addFile : function () {},
                    writeZip : function () {}
                };

                spies.getNewZip.andReturn(newZip);

                files = [];
                spyOn(newZip, 'addFile').andCallFake(function (zipPath) {
                    files.push(zipPath);
                });
                spyOn(newZip, 'writeZip');
            });

            it("should add files and directories recursively in the zip", function () {
                adcBuilder.build();
                expect(files).toEqual([
                    'resources/',
                    'resources/dynamic/',
                    'resources/dynamic/default.html',
                    'resources/dynamic/dynamic.css',
                    'resources/static/',
                    'resources/static/default.html',
                    'resources/static/static.css',
                    'resources/share/',
                    'resources/share/default.js',
                    'resources/share/share.js',
                    'config.xml',
                    'readme.txt'
                ]);
            });

            it("should exclude the bin/ and the tests/ directory", function () {

                struct.push({
                    name : 'bin',
                    sub  : ['test.html']
                });
                struct.push({
                    name : 'tests',
                    sub  : ['test.html']
                });

                adcBuilder.build();
                expect(files).toEqual([
                    'resources/',
                    'resources/dynamic/',
                    'resources/dynamic/default.html',
                    'resources/dynamic/dynamic.css',
                    'resources/static/',
                    'resources/static/default.html',
                    'resources/static/static.css',
                    'resources/share/',
                    'resources/share/default.js',
                    'resources/share/share.js',
                    'config.xml',
                    'readme.txt'
                ]);
            });

            it("should exclude empty directories", function () {
                var resources = struct[0].sub,
                    dynamic   = resources[0],
                    share     = resources[2];

                dynamic.sub = [];
                share.sub   = [];

                adcBuilder.build();
                expect(files).toEqual([
                    'resources/',
                    'resources/static/',
                    'resources/static/default.html',
                    'resources/static/static.css',
                    'config.xml',
                    'readme.txt'
                ]);
            });

            it("should exclude all extra files and directories that will not be read by the ADC engine", function () {
                var resources = struct[0].sub,
                    dynamic   = resources[0].sub;

                struct.push('atroot.html');
                resources.push({
                    name : 'extra',
                    sub  : [
                        'test.html'
                    ]
                });
                resources.push('inroot.html');
                dynamic.push({
                    name : 'shouldbeinclude',
                    sub  : ['test.html', 'Thumbs.db', '.DS_Store']
                });
                struct.push({
                    name : 'anotherextra',
                    sub  : ['text.html']
                });

                adcBuilder.build();
                expect(files).toEqual([
                    'resources/',
                    'resources/dynamic/',
                    'resources/dynamic/default.html',
                    'resources/dynamic/dynamic.css',
                    'resources/dynamic/shouldbeinclude/',
                    'resources/dynamic/shouldbeinclude/test.html',
                    'resources/static/',
                    'resources/static/default.html',
                    'resources/static/static.css',
                    'resources/share/',
                    'resources/share/default.js',
                    'resources/share/share.js',
                    'config.xml',
                    'readme.txt'
                ]);
            });

            it("should write the adc file in the `bin` directory", function () {
                adcBuilder.build(null, 'adc/path/dir');
                expect(newZip.writeZip).toHaveBeenCalledWith('adc\\path\\dir\\bin\\myadc.adc');
            });

        });

        describe("done", function () {
            beforeEach(function () {
                adcValidator.validate.andCallFake(function (program, path, callback) {
                    adcValidator.adcName = 'myadc';
                    adcValidator.adcDirectoryPath = 'adc/path/dir/';
                    callback(null);
                });

                spies.dirExists.andCallFake(function (path, callback) {
                    callback(null, true);
                });

                spyOn(common, 'getDirStructure').andCallFake(function (path, callback) {
                    callback(null, [
                        {
                            name : 'resources',
                            sub  : [
                                {
                                    name : 'dynamic',
                                    sub  : [
                                        'default.html',
                                        'dynamic.css'
                                    ]
                                },
                                {
                                    name : 'static',
                                    sub  : [
                                        'default.html',
                                        'static.css'
                                    ]
                                },
                                {
                                    name : 'share',
                                    sub  : [
                                        'default.js',
                                        'share.js'
                                    ]
                                }
                            ]
                        },
                        'config.xml',
                        'readme.txt'
                    ]);
                });

                spies.getNewZip.andReturn({
                    addFile : function () {},
                    writeZip : function () {}
                });
            });

            it("should output a success when the build succeed", function () {
                adcBuilder.build(null, 'adc/path/dir');
                expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.buildSucceed, 'adc\\path\\dir\\bin\\myadc.adc');
            });

            it("should output a with warning when the build succeed with warning", function () {
                adcValidator.report = {
                    warnings : 1
                };
                adcBuilder.build(null, 'adc/path/dir');
                expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.buildSucceedWithWarning, 1, 'adc\\path\\dir\\bin\\myadc.adc');
            });
        });

    });
});

