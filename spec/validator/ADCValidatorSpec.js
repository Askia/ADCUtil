describe('ADCValidator', function () {

    var fs              = require('fs'),
        spies           = {},
        format          = require('util').format,
        clc      = require('cli-color'),
        common,
        adcValidator,
        errMsg,
        warnMsg,
        successMsg,
        msg;

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the ADCValidator each time
        var adcValidatorKey = require.resolve('../../app/validator/ADCValidator.js'),
            commonKey = require.resolve('../../app/common/common.js');

        delete require.cache[commonKey];
        common = require('../../app/common/common.js');

        delete require.cache[adcValidatorKey];
        adcValidator = require('../../app/validator/ADCValidator.js');

        adcValidator.rootdir = '/root';

        // Messages
        errMsg      = common.messages.error;
        warnMsg     = common.messages.warning;
        successMsg  = common.messages.success;
        msg         = common.messages.message;

        // Court-circuit the validation outputs
        spies.writeError   = spyOn(common, 'writeError');
        spies.writeWarning = spyOn(common, 'writeWarning');
        spies.writeSuccess = spyOn(common, 'writeSuccess');
        spies.writeMessage = spyOn(common, 'writeMessage');

        // Court-circuit the access of the filesystem
        spies.fs = {
            stat        : spyOn(fs, 'stat'),
            exists      : spyOn(fs, 'exists'),
            readdirSync : spyOn(fs, 'readdirSync'),
            readFile    : spyOn(fs, 'readFile')
        };

        // Add matchers
        this.addMatchers({
            /**
             * Validate that the actual array contains the expected value
             * @param {*} expected
             * @returns {Boolean}
             */
            toContains: function(expected) {
                var actual = this.actual,
                    notText = this.isNot ? " not" : "",
                    expectedValue = expected;

                this.message = function () {
                    return "Expected " + actual + notText + " contains " + expectedValue;
                };

                if (!Array.isArray(actual)) {
                     return false;
                }
                return actual.some(function (value) {
                    if (Array.isArray(expected)) {
                        expectedValue = value;
                        return (expected.indexOf(value) !== -1);
                    }

                    return value === expected;
                });
            }
        });
    });

    describe('#validate', function () {

        it("should call each function in the ADCValidator.validators.sequence", function () {
            var key, callCount = 0;
            function increment() {
                callCount++;
                adcValidator.resume(null);
            }
            for (key in adcValidator.validators) {
                if (adcValidator.validators.hasOwnProperty(key)) {
                    if (typeof adcValidator.validators[key] === 'function') {
                        adcValidator.validators[key] = increment;
                    }
                }
            }
            adcValidator.validate(null, 'adc/path/dir');
            expect(callCount).toBe(adcValidator.validators.sequence.length);
        });

        it("should break the validations when at least one validators call #resume with an error", function () {
            var key, callCount = 0;
            function increment() {
                var err = null;
                callCount++;
                if (callCount === 3) {
                    err = new Error("An error occurred in the third validation");
                }
                adcValidator.resume(err);
            }
            for (key in adcValidator.validators) {
                if (adcValidator.validators.hasOwnProperty(key)) {
                    if (typeof adcValidator.validators[key] === 'function') {
                        adcValidator.validators[key] = increment;
                    }
                }
            }
            adcValidator.validate(null, 'adc/path/dir');
            expect(callCount).toBe(3);
        });

        it("should call the callback function in arg at the end of the validation", function () {
            var key, wasCalled = false;
            function fakeValidation() {
                adcValidator.resume(null);
            }
            for (key in adcValidator.validators) {
                if (adcValidator.validators.hasOwnProperty(key)) {
                    if (typeof adcValidator.validators[key] === 'function') {
                        adcValidator.validators[key] = fakeValidation;
                    }
                }
            }
            adcValidator.validate(null, 'adc/path/dir', function () {
                wasCalled = true;
            });
            expect(wasCalled).toBe(true);
        });

        it("should output error message of the failed validator", function () {
            function raiseError() {
                adcValidator.resume(new Error("An error occurred"));
            }
            adcValidator.validators.raiseError = raiseError;
            adcValidator.validators.sequence = ['raiseError'];

            adcValidator.validate(null, 'adc/path/dir');

            expect(common.writeError).toHaveBeenCalledWith("An error occurred");
        });

        it("should run the unit tests when called with the `program#test=true`", function () {
            var backupSequence = adcValidator.validators.sequence;
            adcValidator.validators = {
                current  : -1,
                sequence : backupSequence
            };

            adcValidator.validate({
                test : true
            }, 'adc/path/dir');

            expect(adcValidator.validators.sequence).toContains(['runADCUnitTests']);
        });

        it("should not run the unit tests when called with the `program#test=false`", function () {
            var backupSequence = adcValidator.validators.sequence;
            adcValidator.validators = {
                current  : -1,
                sequence : backupSequence
            };

            adcValidator.validate({
                test : false
            }, 'adc/path/dir');

            expect(adcValidator.validators.sequence).not.toContains(['runADCUnitTests']);
        });

        it("should run the auto unit tests when called with the `program#autoTest=true`", function () {
            var backupSequence = adcValidator.validators.sequence;
            adcValidator.validators = {
                current  : -1,
                sequence : backupSequence
            };

            adcValidator.validate({
                autoTest : true
            }, 'adc/path/dir');

            expect(adcValidator.validators.sequence).toContains(['runAutoTests']);
        });

        it("should not run the auto unit tests when called with the `program#autoTest=false`", function () {
            var backupSequence = adcValidator.validators.sequence;
            adcValidator.validators = {
                current  : -1,
                sequence : backupSequence
            };

            adcValidator.validate({
                autoTest : false
            }, 'adc/path/dir');

            expect(adcValidator.validators.sequence).not.toContains(['runAutoTests']);
        });

        it("should run the xml validation when called with the `program#xml=true`", function () {
            var backupSequence = adcValidator.validators.sequence;
            adcValidator.validators = {
                current  : -1,
                sequence : backupSequence
            };

            adcValidator.validate({
                xml : true
            }, 'adc/path/dir');

            expect(adcValidator.validators.sequence).toContains([
                'validateXMLAgainstXSD',
                'initConfigXMLDoc',
                'validateADCInfo',
                'validateADCInfoConstraints',
                'validateADCOutputs',
                'validateADCProperties'
            ]);
        });

        it("should not run the xml validation when called with the `program#xml=false`", function () {
            var backupSequence = adcValidator.validators.sequence;
            adcValidator.validators = {
                current  : -1,
                sequence : backupSequence
            };

            adcValidator.validate({
                xml : false
            }, 'adc/path/dir');

            expect(adcValidator.validators.sequence).not.toContains([
                'validateXMLAgainstXSD',
                'initConfigXMLDoc',
                'validateADCInfo',
                'validateADCInfoConstraints',
                'validateADCOutputs',
                'validateADCProperties'
            ]);
        });

        it("should display a report with the execution time", function () {
            adcValidator.validators.sequence = [];
            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeMessage).toHaveBeenCalledWith(msg.validationFinishedIn, 0);
        });

        it("should display a report in red with the number of success, warnings and failures when at least one error", function () {
            adcValidator.validators.sequence = [];

            adcValidator.report.runs      = 6;
            adcValidator.report.success   = 1;
            adcValidator.report.warnings  = 2;
            adcValidator.report.errors    = 3;

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeMessage).toHaveBeenCalledWith(clc.red.bold(format(msg.validationReport,6, 0, 1, 2, 3)));
        });

        it("should display a report in yellow with the number of success, warnings and failures when at least one warning", function () {
            adcValidator.validators.sequence = [];
            adcValidator.report.runs      = 6;
            adcValidator.report.success   = 1;
            adcValidator.report.warnings  = 2;
            adcValidator.report.errors    = 0;

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeMessage).toHaveBeenCalledWith(clc.yellowBright(format(msg.validationReport, 6, 0, 1, 2, 0)));
        });

        it("should display a report in green with the number of success, warnings and failures when no warning and error", function () {
            adcValidator.validators.sequence = [];
            adcValidator.report.runs      = 6;
            adcValidator.report.success   = 1;
            adcValidator.report.warnings  = 0;
            adcValidator.report.errors    = 0;

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeMessage).toHaveBeenCalledWith(clc.greenBright(format(msg.validationReport,6, 0, 1, 0, 0)));
        });
    });

    describe('#validatePathArg', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validatePathArg method
            adcValidator.validators.sequence = ['validatePathArg'];
        });

        it("should output an error when the path specified doesn't exist", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(new Error("No such file or directory"));
            });

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeError).toHaveBeenCalledWith(format(errMsg.noSuchFileOrDirectory, "\\adc\\path\\dir\\"));
        });

        it("should not output an error when the path specified exist", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).not.toHaveBeenCalled();
        });

        it("should use the current directory when the path is not specified", function () {
            spyOn(process, 'cwd').andReturn('/cwd/');

            adcValidator.validate(null);

            expect(adcValidator.adcDirectoryPath).toBe('/cwd/');
        });
    });

    describe('#validateADCDirectoryStructure', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCDirectoryStructure method
            adcValidator.validators.sequence = ['validateADCDirectoryStructure'];
        });

        it("should output an error when the config.xml file doesn't exist", function () {
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(false);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalledWith(errMsg.noConfigFile);
        });

        it("should not output an error when the config.xml file exist", function () {
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(true);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).not.toHaveBeenCalled();
        });

        it("should output a success message when the config.xml file exist", function () {
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(true);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeSuccess).toHaveBeenCalled();
        });

        it("should search the `resources` directory", function () {
            var searchResourcesDirectory = false;
            spies.fs.exists.andCallFake(function (path, callback) {
                callback(true);
            });

            spies.fs.stat.andCallFake(function (path) {
                if (path === '/adc/path/dir/resources/') {
                    searchResourcesDirectory = true;
                }
            });

            adcValidator.validate('null', '/adc/path/dir');

            expect(searchResourcesDirectory).toBe(true);
        });

        function loadResourcesDirectory(mode) {
            it("should search the `resources/" + mode + "/` directory", function () {
                var searchResources = false;
                spies.fs.exists.andCallFake(function (path, callback) {
                    callback(true);
                });

                spies.fs.stat.andCallFake(function (path, callback) {
                    if (path === '/adc/path/dir/resources/') {
                        callback(null, true);
                    } else if (path === '/adc/path/dir/resources/' + mode) {
                        searchResources = true;
                    } else {
                        callback(null, false);
                    }
                });

                adcValidator.validate('null', '/adc/path/dir');

                expect(searchResources).toBe(true);
            });

            it("should load files from the `resources/" + mode + "/` directory", function () {
                var files = ['123.txt', '456.html'],
                    key   = (mode === 'static') ? 'statics' : mode;
                spies.fs.exists.andCallFake(function (path, callback) {
                    callback(true);
                });

                spies.fs.stat.andCallFake(function (path, callback) {
                    if (path === '/adc/path/dir/resources/') {
                        callback(null, true);
                    } else if (path === '/adc/path/dir/resources/' + mode) {
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }
                });

                spies.fs.readdirSync.andReturn(files);

                spyOn(common, 'isIgnoreFile').andReturn(false);

                adcValidator.validate('null', '/adc/path/dir');


                expect(adcValidator.dirResources[key]).toEqual({
                    isExist : true,
                    '123.txt' : '123.txt',
                    '456.html' : '456.html'
                });

            });

            it("should ignore certain files from the `resources/" + mode + "/` directory", function () {
                var files = ['123.txt', '456.html', 'Thumbs.db'],
                    key   = (mode === 'static') ? 'statics' : mode;
                spies.fs.exists.andCallFake(function (path, callback) {
                    callback(true);
                });

                spies.fs.stat.andCallFake(function (path, callback) {
                    if (path === '/adc/path/dir/resources/') {
                        callback(null, true);
                    } else if (path === '/adc/path/dir/resources/' + mode) {
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }
                });

                spies.fs.readdirSync.andReturn(files);

                spyOn(common, 'isIgnoreFile').andCallFake(function (f) {
                   return (f === 'Thumbs.db');
                });

                adcValidator.validate('null', '/adc/path/dir');


                expect(adcValidator.dirResources[key]).toEqual({
                    isExist : true,
                    '123.txt' : '123.txt',
                    '456.html' : '456.html'
                });

            });
        }

        ['dynamic', 'static', 'share'].forEach(loadResourcesDirectory);
    });

    describe('#validateFileExtensions', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateFileExtensions method
            adcValidator.validators.sequence = ['validateFileExtensions'];
        });

        var directories = ['dynamic', 'static', 'share'];

        function testForbiddenExtensionIn(directoryName) {
            it('should output an error when found in `' + directoryName + '` directory', function () {
                    (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                    var dirResources = adcValidator.dirResources;
                    dirResources.isExist = true;
                    dirResources[directoryName].isExist = true;
                    dirResources[directoryName]['filewithforbiddenextension.exe'] = 'filewithforbiddenextension.exe';

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeError).toHaveBeenCalledWith(format(errMsg.fileExtensionForbidden, ".exe"));
                });
        }

        function testTrustExtensionIn(directoryName) {
            it('should not output an error when found in `' + directoryName + '` directory', function () {
                (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                var dirResources = adcValidator.dirResources;
                dirResources.isExist = true;
                dirResources[directoryName].isExist = true;
                dirResources[directoryName]['trustfileextension.html'] = 'trustfileextension.html';

                adcValidator.validate(null, '/adc/path/dir');

                expect(common.writeError).not.toHaveBeenCalled();
            });
            it('should not output a warning when found in `' + directoryName + '` directory', function () {
                    (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                    var dirResources = adcValidator.dirResources;
                    dirResources.isExist = true;
                    dirResources[directoryName].isExist = true;
                    dirResources[directoryName]['trustfileextension.html'] = 'trustfileextension.html';

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).not.toHaveBeenCalled();
                });
        }

        function testUnknownExtensionIn(directoryName) {
            it('should output a warning when found in `' + directoryName + '` directory', function () {
                (directoryName = directoryName === 'static' ? 'statics' : directoryName);
                var dirResources = adcValidator.dirResources;
                dirResources.isExist = true;
                dirResources[directoryName].isExist = true;
                dirResources[directoryName]['unknownextension.unknown'] = 'unknownextension.unknown';

                adcValidator.validate(null, '/adc/path/dir');

                expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.untrustExtension, 'unknownextension.unknown');
            });
        }

        describe('file with forbidden extension', function () {
            directories.forEach(testForbiddenExtensionIn);
        });
        describe('file with trust extension', function () {
            directories.forEach(testTrustExtensionIn);
        });
        describe('file with unknown extension', function () {
            directories.forEach(testUnknownExtensionIn);
        });

        describe('all files are valid', function () {
            beforeEach(function () {
                var dirResources = adcValidator.dirResources;
                dirResources.isExist = true;
                dirResources.dynamic.isExist = true;
                dirResources.statics.isExist = true;
                dirResources.share.isExist   = true;

                dirResources.dynamic['valid.html'] = 'valid.html';
                dirResources.statics['valid.js']   = 'valid.js';
                dirResources.share['valid.css'] = 'valid.css';
            })
            it('should not output an error', function () {
                adcValidator.validate(null, '/adc/path/dir');
                expect(common.writeError).not.toHaveBeenCalled();
            });
            it('should output a success message', function () {
                adcValidator.validate(null, '/adc/path/dir');
                expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.fileExtensionValidate);
            });
        });

        describe('at least one invalid files', function () {
            it('should output an error', function () {
                var dirResources = adcValidator.dirResources;
                dirResources.isExist = true;
                dirResources.dynamic.isExist = true;
                dirResources.statics.isExist = true;
                dirResources.share.isExist   = true;

                dirResources.dynamic['valid.html'] = 'valid.html';
                dirResources.statics['valid.js']   = 'valid.js';
                dirResources.statics['invalid.exe'] = 'invalid.exe';
                dirResources.share['valid.css'] = 'valid.css';

                adcValidator.validate(null, '/adc/path/dir');

                expect(common.writeError).toHaveBeenCalled();
            });
        });

    });

    describe('#validateXMLAgainstXSD', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateXMLAgainstXSD method
            adcValidator.validators.sequence = ['validateXMLAgainstXSD'];
        });

        it('should run the xmllint process with the config.xsd and the config.xml file', function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command) {
                expect(command).toBe('\\root\\lib\\libxml\\xmllint.exe --noout --schema \\root\\schema\\config.xsd \\adc\\path\\dir\\config.xml');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(childProc.exec).toHaveBeenCalled();
        });

        it('should output an error when the xmllint process failed', function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command, callback) {
                callback(new Error('Fake validation error'));
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalled();
        });

        it("should not output an error when the xmllint process doesn't failed", function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).not.toHaveBeenCalled();
        });

        it("should output a success when the xmllint process doesn't failed", function () {
            var childProc = require('child_process');
            spyOn(childProc, 'exec').andCallFake(function (command, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.xsdValidate);
        });
    });

    describe('#initConfigXMLDoc', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the initConfigXMLDoc method
            adcValidator.validators.sequence = ['initConfigXMLDoc'];
        });

        it("should output an error when the config file could not be read", function () {
            spies.fs.readFile.andCallFake(function (path, config, callback) {
                callback(new Error("Fake error"));
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalled();
        });

        it("should not output an error when the config file could be read", function () {
            spies.fs.readFile.andCallFake(function (path, config,callback) {
                callback(null, '');
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).not.toHaveBeenCalled();
        });

        it("should correctly initialize the config.xml document", function () {
            var xml2js = require('xml2js'),
                obj    = {
                    test : 'test'
                };
            spies.fs.readFile.andCallFake(function (path, config,callback) {
                callback(null, '');
            });
            spyOn(xml2js, 'parseString').andCallFake(function (data, callback) {
                callback(null, obj);
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(adcValidator.configXmlDoc).toBe(obj);
        });

    });

    describe("#validateADCInfo", function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCInfo method
            adcValidator.validators.sequence = ['validateADCInfo'];
        });

        it("should output an error when the info doesn't exist", function () {
            adcValidator.configXmlDoc = {
                control : {}
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalledWith(errMsg.missingInfoNode);
        });

        it("should output an error when the info/name doesn't exist", function () {
            adcValidator.configXmlDoc = {
                control : {
                    info  : [{}]
                }
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalledWith(errMsg.missingOrEmptyNameNode);
        });

        it("should output an error when the info/name is empty", function () {
            adcValidator.configXmlDoc = {
                control : {
                    info  : [
                        {
                            name : []
                        }
                    ]
                }
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalledWith(errMsg.missingOrEmptyNameNode);
        });

        it("should not output an error when the info/name is valid", function () {
            adcValidator.configXmlDoc = {
                control : {
                    info : [
                        {
                            name : [
                                'test'
                            ]
                        }
                    ]
                }
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).not.toHaveBeenCalled();
        });

        it("should initialize the adcName property with the name of the ADC", function () {
            adcValidator.configXmlDoc = {
                control : {
                    info : [
                        {
                            name : [
                                'test'
                            ]
                        }
                    ]
                }
            };
            adcValidator.validate(null, '/adc/path/dir');

            expect(adcValidator.adcName).toBe('test');
        });
    });

    describe('#validateADCInfoConstraints', function () {
        beforeEach(function () {
           // Modify the sequence of the validation to only call the validateADCInfoConstraints method
           adcValidator.validators.sequence = ['validateADCInfoConstraints'];
        });

        var elements = ['questions', 'responses', 'controls'],
            constraintAttrs = [
            {
                name : 'chapter',
                on   : 'questions'
            },
            {
                name : 'single',
                on   : 'questions'
            },
            {
                name : 'multiple',
                on   : 'questions'
            },
            {
                name : 'open',
                on   : 'questions'
            },
            {
                name : 'numeric',
                on   : 'questions'
            },
            {
                name : 'date',
                on   : 'questions'
            },
            {
                name : 'requireParentLoop',
                on   : 'questions'
            },
            {
                name : 'min',
                on   : 'responses'
            },
            {
                name : 'max',
                on   : 'responses'
            },
            {
                name : 'label',
                on   : 'controls'
            },
            {
                name : 'textbox',
                on   : 'controls'
            },
            {
                name : 'listbox',
                on   : 'controls'
            },
            {
                name : 'radiobutton',
                on   : 'controls'
            },
            {
                name : 'responseblock',
                on   : 'controls'
            }
            ],
            fakeAttr = {
                'questions' : 'single',
                'responses' : 'min',
                'controls'  : 'label'
            };

        function testDuplicateConstraints(element) {
            it("should output an error when 2 constraints defined on " + element, function () {
                adcValidator.configXmlDoc = {
                    control : {
                        info : [
                            {
                                constraints : [
                                    {
                                        constraint : [
                                            {
                                                $ : {
                                                    on      : element
                                                }
                                            },
                                            {
                                                $ : {
                                                    on      : element
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };

                adcValidator.configXmlDoc.control.info[0].constraints[0].constraint[0].$[fakeAttr[element]] = 1;
                adcValidator.configXmlDoc.control.info[0].constraints[0].constraint[1].$[fakeAttr[element]] = 1;

                adcValidator.validate(null, '/adc/path/dir');

                expect(common.writeError).toHaveBeenCalledWith(format(errMsg.duplicateConstraints, element));
            });
        }

        elements.forEach(testDuplicateConstraints);

        function testRequireConstraint(element) {
            it("should output an error when no constraint defined on `" + element + "`", function () {
                var oppositeElement =  (element === 'questions') ? 'controls' : 'questions';
                adcValidator.configXmlDoc = {
                    control : {
                        info : [
                            {
                                constraints : [
                                    {
                                        constraint : [
                                            {
                                                $ : {
                                                    on      :   oppositeElement
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };

                adcValidator.configXmlDoc.control.info[0].constraints[0].constraint[0].$[fakeAttr[oppositeElement]] = 1;

                adcValidator.validate(null, '/adc/path/dir');
                expect(common.writeError).toHaveBeenCalledWith(format(errMsg.requireConstraintOn, element));
            });
        }
        ['questions', 'controls'].forEach(testRequireConstraint);
        it ("should not output an error when constraints are defined on `questions` and `controls`", function () {
            adcValidator.configXmlDoc = {
                control : {
                    info : [
                        {
                            constraints : [
                                {
                                    constraint : [
                                        {
                                            $ : {
                                                on      :   'questions',
                                                single  :   'true'
                                            }
                                        },
                                        {
                                            $ : {
                                                on      : 'controls',
                                                label   : 'true'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeError).not.toHaveBeenCalled();
        });

        function testConstraintAttribute(element) {
            describe('constraint@on=' + element, function () {

                constraintAttrs.forEach(function (attribute) {
                    var notText = (attribute.on === element) ? 'not ' : '';
                    it("should " + notText +  "output an error when the attribute `" + attribute.name + "` is present", function () {
                        adcValidator.configXmlDoc = {
                            control : {
                                info : [
                                    {
                                        constraints : [
                                            {
                                                constraint : [
                                                    {
                                                        $ : {
                                                            on      : element
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };

                        adcValidator.configXmlDoc.control.info[0].constraints[0].constraint[0].$[attribute.name] = true;

                        adcValidator.validate(null, '/adc/path/dir');
                        if (attribute.on === element) {
                            expect(common.writeError).not.toHaveBeenCalledWith(format(errMsg.invalidConstraintAttribute, element, attribute.name));
                        } else {
                            expect(common.writeError).toHaveBeenCalledWith(format(errMsg.invalidConstraintAttribute, element, attribute.name));
                        }
                    });
                });

                it("should output an error when no other attribute is specified", function () {
                    adcValidator.configXmlDoc = {
                        control : {
                            info : [
                                {
                                    constraints : [
                                        {
                                            constraint : [
                                                {
                                                    $ : {
                                                        on      : element
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).toHaveBeenCalledWith(format(errMsg.noRuleOnConstraint, element));
                });

                if (element !== 'responses') {
                    it("should output an error when no other attribute is specified with the truthly value", function () {
                        adcValidator.configXmlDoc = {
                            control : {
                                info : [
                                    {
                                        constraints : [
                                            {
                                                constraint : [
                                                    {
                                                        $ : {
                                                            on      : element
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };

                        adcValidator.configXmlDoc.control.info[0].constraints[0].constraint[0].$[fakeAttr[element]] = false;

                        adcValidator.validate(null, '/adc/path/dir');
                        expect(common.writeError).toHaveBeenCalledWith(format(errMsg.noRuleOnConstraint, element));
                    });
                }

            });
        }

        elements.forEach(testConstraintAttribute);

    });

    describe('#validateADCOutputs', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCOutputs method
            adcValidator.validators.sequence = ['validateADCOutputs'];
        });

        it('should output a warning when duplicate conditions', function () {
            adcValidator.configXmlDoc = {
                control : {
                    outputs : [
                        {
                            output : [
                                {
                                    $ : {
                                        id : 'first',
                                        defaultGeneration : true
                                    },
                                    condition : [
                                        "duplicate condition"
                                    ]
                                },
                                {
                                    $ : {
                                        id : 'second',
                                        defaultGeneration : true
                                    },
                                    condition : [
                                        "duplicate condition"
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.duplicateOutputCondition, "first", "second");
        });

        it('should not output an error when one condition is empty', function () {
            adcValidator.configXmlDoc = {
                control : {
                    outputs : [
                        {
                            output : [
                                {
                                    $ : {
                                        id   : 'empty',
                                        defaultGeneration : true
                                    }
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).not.toHaveBeenCalled();
        });

        it('should output an error when at least two conditions are empty', function () {
            adcValidator.configXmlDoc = {
                control : {
                    outputs : [
                        {
                            output : [
                                {
                                    $ : {
                                        id : 'first',
                                        defaultGeneration : true
                                    }
                                },
                                {
                                    $ : {
                                        id : 'second',
                                        defaultGeneration : true
                                    },
                                    condition : [
                                        ""
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeError).toHaveBeenCalledWith(format(errMsg.tooManyEmptyCondition, "first, second"));
        });

        it('should output a warning when only one `output` node is use with no defaultGeneration and when it uses dynamic javascript', function (){
            adcValidator.dirResources.isExist = true;
            adcValidator.dirResources.dynamic.isExist = true;
            adcValidator.dirResources.dynamic['test.js'] = 'test.js';
            adcValidator.configXmlDoc = {
                control : {
                    outputs : [
                        {
                            output : [
                                {
                                    $ : {
                                        id : 'empty'
                                    },
                                    condition : [
                                        "Browser.Support(\"Javascript\")"
                                    ],
                                    content : [
                                        {
                                            $ : {
                                                type        : 'javascript',
                                                fileName    : 'test.js',
                                                mode        : 'dynamic',
                                                position    : 'foot'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.noHTMLFallBack);
        });

        it('should output a success when no error found', function () {
            adcValidator.configXmlDoc = {
                control : {
                    outputs : [
                        {
                            output : [
                                {
                                    $ : {
                                        id : 'empty',
                                        defaultGeneration : true
                                    }
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.xmlOutputsValidate);
        });

        describe("#validateADCContents", function () {

            it("should output an error when the resources directory doesn't exist", function () {
                adcValidator.dirResources.isExist = false;
                adcValidator.configXmlDoc = {
                    control : {
                        outputs : [
                            {
                                output : [
                                    {
                                        $ : {
                                            id : 'empty'
                                        },
                                        content : [
                                            "a content"
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                };

                adcValidator.validate(null, '/adc/path/dir');
                expect(common.writeError).toHaveBeenCalledWith(errMsg.noResourcesDirectory);
            });

            describe('@defaultGeneration=false', function () {
                var jsContent, htmlContent;
                beforeEach(function () {
                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.js'] = 'test.js';
                    adcValidator.dirResources.dynamic['test.html'] = 'test.html';
                    adcValidator.dirResources.dynamic['test.css'] = 'test.css';
                    adcValidator.dirResources.statics.isExist = true;
                    adcValidator.dirResources.statics['test.js'] = 'test.js';
                    adcValidator.dirResources.statics['test.html'] = 'test.html';
                    adcValidator.dirResources.statics['test.css'] = 'test.css';
                    adcValidator.dirResources.share.isExist = true;
                    adcValidator.dirResources.share['test.js'] = 'test.js';
                    adcValidator.dirResources.share['test.html'] = 'test.html';
                    adcValidator.dirResources.share['test.css'] = 'test.css';

                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty'
                                            },
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'javascript',
                                                        fileName    : 'test.js',
                                                        mode        : 'static'
                                                    }
                                                },
                                                {
                                                    $ : {
                                                        type        : 'html',
                                                        fileName    : 'test.html',
                                                        mode        : 'static'
                                                    }
                                                },
                                                {
                                                    $ : {
                                                        type        : 'css',
                                                        fileName    : 'test.css',
                                                        mode        : 'dynamic'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };
                    var contents = adcValidator.configXmlDoc.control.outputs[0].output[0].content;
                    jsContent   = contents[0];
                    htmlContent = contents[1];
                });

                it("should output an error when there is no contents", function () {
                    delete adcValidator.configXmlDoc.control.outputs[0].output[0].content;
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should output an error when there is no dynamic html or javascript content", function () {
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should output an error when there is a dynamic html content but with position=none", function () {
                    htmlContent.$.mode = 'dynamic';
                    htmlContent.$.position = 'none';
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should not output an error when there is a dynamic html content", function () {
                    htmlContent.$.mode = 'dynamic';
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).not.toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should not output an error when there is a dynamic javascript content", function () {
                    jsContent.$.mode = 'dynamic';
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).not.toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
                it("should  output an error when there is a dynamic javascript content but with position=none", function () {
                    jsContent.$.mode = 'dynamic';
                    jsContent.$.position = 'none';
                    adcValidator.validate(null, '/adc/path/dir');
                    expect(common.writeError).toHaveBeenCalledWith(format(errMsg.dynamicFileRequire, "empty"));
                });
            });

            describe('test content type against condition', function () {
                it("should output a warning when using a javascript content with no check of the browser.support(javascript) in the condition", function () {

                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.js'] = 'test.js';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty'
                                            },
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'javascript',
                                                        fileName    : 'test.js',
                                                        mode        : 'dynamic',
                                                        position    : 'foot'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.javascriptUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a javascript content with a check of the browser.support(javascript) in the condition", function () {

                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.js'] = 'test.js';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty'
                                            },
                                            condition : [
                                                "Lorem ipsum dolor Browser.Support(\"javascript\") lorem ipsum"
                                            ],
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'javascript',
                                                        fileName    : 'test.js',
                                                        mode        : 'dynamic',
                                                        position    : 'foot'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).not.toHaveBeenCalledWith(warnMsg.javascriptUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a javascript content with no check of the browser.support(javascript) but with defaultGeneration=true", function () {

                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.js'] = 'test.js';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty',
                                                defaultGeneration : true
                                            },
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'javascript',
                                                        fileName    : 'test.js',
                                                        mode        : 'dynamic',
                                                        position    : 'foot'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).not.toHaveBeenCalledWith(warnMsg.javascriptUseWithoutBrowserCheck, "empty");
                });

                it("should output a warning when using a flash content with no check of the browser.support(flash) in the condition", function () {

                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.statics.isExist = true;
                    adcValidator.dirResources.statics['test.swf'] = 'test.swf';
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.html'] = 'test.html';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty'
                                            },
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'flash',
                                                        fileName    : 'test.swf',
                                                        mode        : 'static',
                                                        position    : 'placeholder'
                                                    }
                                                },
                                                {
                                                    $ : {
                                                        type        : 'html',
                                                        fileName    : 'test.html',
                                                        mode        : 'dynamic',
                                                        position    : 'placeholder'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.flashUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a flash content with a check of the browser.support(flash) in the condition", function () {

                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.statics.isExist = true;
                    adcValidator.dirResources.statics['test.swf'] = 'test.swf';
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.html'] = 'test.html';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty'
                                            },
                                            condition : [
                                                "Lorem ipsum dolor Browser.Support(\"flash\") lorem ipsum"
                                            ],
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'flash',
                                                        fileName    : 'test.swf',
                                                        mode        : 'static',
                                                        position    : 'placeholder'
                                                    }
                                                },
                                                {
                                                    $ : {
                                                        type        : 'html',
                                                        fileName    : 'test.html',
                                                        mode        : 'dynamic',
                                                        position    : 'placeholder'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).not.toHaveBeenCalledWith(warnMsg.flashUseWithoutBrowserCheck, "empty");
                });

                it("should not output a warning when using a flash content with with no check of the browser.support(flash) but with defaultGeneration=true", function () {

                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.statics.isExist = true;
                    adcValidator.dirResources.statics['test.swf'] = 'test.swf';
                    adcValidator.dirResources.dynamic.isExist = true;
                    adcValidator.dirResources.dynamic['test.html'] = 'test.html';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty',
                                                defaultGeneration : true
                                            },
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'flash',
                                                        fileName    : 'test.swf',
                                                        mode        : 'static',
                                                        position    : 'placeholder'
                                                    }
                                                },
                                                {
                                                    $ : {
                                                        type        : 'html',
                                                        fileName    : 'test.html',
                                                        mode        : 'dynamic',
                                                        position    : 'placeholder'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).not.toHaveBeenCalledWith(warnMsg.flashUseWithoutBrowserCheck, "empty");
                });

            });

            describe("#validateADCContent", function () {
                var directories = ['dynamic', 'static', 'share'];

                it("should output a warning when using the attribute and yield nodes in the same content", function () {
                    adcValidator.dirResources.isExist = true;
                    adcValidator.dirResources.statics.isExist = true;
                    adcValidator.dirResources.statics['test.js'] = 'test.js';
                    adcValidator.configXmlDoc = {
                        control : {
                            outputs : [
                                {
                                    output : [
                                        {
                                            $ : {
                                                id : 'empty',
                                                defaultGeneration : true
                                            },
                                            content : [
                                                {
                                                    $ : {
                                                        type        : 'javascript',
                                                        fileName    : 'test.js',
                                                        mode        : 'static'
                                                    },
                                                    attribute :  [
                                                        {
                                                            $ : {
                                                                name : 'test'
                                                            }
                                                        }
                                                    ],
                                                    'yield' : [
                                                        "test"
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    };

                    adcValidator.validate(null, '/adc/path/dir');

                    expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.attributeNodeAndYieldNode, "empty", 'test.js');
                });

                describe('binary content', function () {
                    var content;
                    beforeEach(function () {
                        adcValidator.dirResources.isExist = true;
                        adcValidator.dirResources.statics.isExist = true;
                        adcValidator.dirResources.statics['test.js'] = 'test.js';
                        adcValidator.configXmlDoc = {
                            control : {
                                outputs : [
                                    {
                                        output : [
                                            {
                                                $ : {
                                                    id : 'empty',
                                                    defaultGeneration : true
                                                },
                                                content : [
                                                    {
                                                        $ : {
                                                            type        : 'binary',
                                                            fileName    : 'test.js',
                                                            mode        : 'static',
                                                            position    : 'placeholder'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };

                        content = adcValidator.configXmlDoc.control.outputs[0].output[0].content[0];
                    });

                    it("should output an error when binary content doesn't have a yield or position=none", function () {
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(common.writeError).toHaveBeenCalledWith(format(errMsg.yieldRequireForBinary, "empty", 'test.js'));
                    });

                    it("should not output an error when binary content have a yield", function () {
                        content.yield = ['test'];
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(common.writeError).not.toHaveBeenCalledWith(format(errMsg.yieldRequireForBinary, "empty", 'test.js'));
                    });

                    it("should not output an error when binary content have a position=none", function () {
                        content.$.position = 'none';
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(common.writeError).not.toHaveBeenCalledWith(format(errMsg.yieldRequireForBinary, "empty", 'test.js'));
                    });
                });

                function testMode(mode) {
                    var key =  mode === 'static' ? 'statics' : mode;

                    describe('content with mode ' + mode, function () {
                       beforeEach(function () {
                           adcValidator.dirResources.isExist = true;
                           adcValidator.configXmlDoc = {
                               control : {
                                   outputs : [
                                       {
                                           output : [
                                               {
                                                   $ : {
                                                       id : 'empty',
                                                       defaultGeneration : true
                                                   },
                                                   content : [
                                                       {
                                                           $ : {
                                                               type        : 'html',
                                                               fileName    : 'test.html',
                                                               mode        : mode
                                                           }
                                                       }
                                                   ]
                                               }
                                           ]
                                       }
                                   ]
                               }
                           };
                       });

                        it("should output an error when the directory associated doesn't exist", function () {
                            adcValidator.dirResources[key].isExist = false;
                            adcValidator.validate(null, '/adc/path/dir');
                            expect(common.writeError).toHaveBeenCalledWith(format(errMsg.cannotFindDirectory, mode));
                        });

                        it("should output an error when the file associated doesn't exist", function () {
                            adcValidator.dirResources[key].isExist = true;
                            adcValidator.validate(null, '/adc/path/dir');
                            expect(common.writeError).toHaveBeenCalledWith(format(errMsg.cannotFindFileInDirectory, "empty", "test.html", mode));
                        });

                        function testDynamicBinary(type) {
                            it("should output an error when trying to use " + type + " file", function () {
                                adcValidator.configXmlDoc.control.outputs[0].output[0].content[0].$.type = type;
                                adcValidator.dirResources[key].isExist = true;
                                adcValidator.dirResources[key]['test.html'] = 'test.html';
                                adcValidator.validate(null, '/adc/path/dir');
                                expect(common.writeError).toHaveBeenCalledWith(format(errMsg.typeCouldNotBeDynamic, "empty", type , "test.html"));
                            });
                        }

                        function testDynamicText(type) {
                            it("should not output an error when trying to use " + type + " file", function () {
                                adcValidator.configXmlDoc.control.outputs[0].output[0].content[0].$.type = type;
                                adcValidator.dirResources[key].isExist = true;
                                adcValidator.dirResources[key]['test.html'] = 'test.html';
                                adcValidator.validate(null, '/adc/path/dir');
                                expect(common.writeError).not.toHaveBeenCalledWith(format(errMsg.typeCouldNotBeDynamic, "empty", type , "test.html"));
                            });
                        }

                        if (mode === 'dynamic') {
                            ['binary', 'image', 'video', 'audio', 'flash'].forEach(testDynamicBinary);
                            ['text', 'html', 'javascript', 'css'].forEach(testDynamicText);
                        }

                    });
                }

                directories.forEach(testMode);

                describe("#validateADCContentAttribute", function () {
                    var content;
                    beforeEach(function () {
                        adcValidator.dirResources.isExist = true;
                        adcValidator.dirResources.dynamic.isExist = true;
                        adcValidator.dirResources.dynamic['test.js'] = 'test.js';
                        adcValidator.dirResources.statics.isExist = true;
                        adcValidator.dirResources.statics['test.js'] = 'test.js';
                        adcValidator.dirResources.share.isExist = true;
                        adcValidator.dirResources.share['test.js'] = 'test.js';

                        adcValidator.configXmlDoc = {
                            control : {
                                outputs : [
                                    {
                                        output : [
                                            {
                                                $ : {
                                                    id : 'empty',
                                                    defaultGeneration : true

                                                },
                                                content : [
                                                    {
                                                        $ : {
                                                            type        : 'javascript',
                                                            fileName    : 'test.js',
                                                            mode        : 'static',
                                                            position    : 'none'
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        };
                        content = adcValidator.configXmlDoc.control.outputs[0].output[0].content[0];
                    });

                    it("should not output an error when there is no attributes node", function () {
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(common.writeError).not.toHaveBeenCalled();
                    });

                    it("should output an error when there is duplicate attribute node with the same name", function () {
                        content.attribute = [
                            {
                                $ : {
                                    name : 'test'
                                }
                            },
                            {
                                $ : {
                                    name : 'test'
                                }
                            }
                        ];
                        adcValidator.validate(null, '/adc/path/dir');
                        expect(common.writeError).toHaveBeenCalledWith(format(errMsg.duplicateAttributeNode, 'empty', 'test', 'test.js'));
                    });

                    function testIgnoredFile(type) {
                        it("should output a warning with " + type + " file", function () {

                            content.$.type = type;
                            content.attribute = [
                                {}
                            ];

                            adcValidator.validate(null, 'adc/path/dir');
                            expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.attributeNodeWillBeIgnored, "empty", type, "test.js");
                        });
                    }

                    describe('ignored attributes node', function () {
                        ['text', 'binary', 'html', 'flash'].forEach(testIgnoredFile);

                        it("should output a warning with dynamic file", function () {

                            content.$.mode = 'dynamic';
                            content.attribute = [
                                {}
                            ];

                            adcValidator.validate(null, 'adc/path/dir');
                            expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.attributeNodeAndDynamicContent, "empty", "test.js");
                        });
                    });

                    function testNotOverridableAttribute(obj) {
                        var type     = obj.type,
                            attrName = obj.attr;
                        it("should output an error on " + type + " content when attempt to override " + attrName, function () {

                            content.$.type = type;
                            content.attribute = [
                                {
                                    $ : {
                                        name : attrName
                                    }
                                }
                            ];

                           adcValidator.validate(null, 'adc/path/dir');
                           expect(common.writeError).toHaveBeenCalledWith(format(errMsg.attributeNotOverridable, "empty", attrName, "test.js"));
                        });
                    }

                    describe('not overridable attribute', function () {
                        var notOverridable = [
                            {
                                type : 'javascript',
                                attr : 'src'
                            },
                            {
                                type : 'css',
                                attr : 'href'
                            },
                            {
                                type : 'image',
                                attr : 'src'
                            },
                            {
                                type : 'video',
                                attr : 'src'
                            },
                            {
                                type : 'audio',
                                attr : 'src'
                            }
                        ];

                        notOverridable.forEach(testNotOverridableAttribute);
                    });

                });
            });

        });

    });

    describe('#validateADCProperties', function () {
        beforeEach(function () {
            // Modify the sequence of the validation to only call the validateADCProperties method
            adcValidator.validators.sequence = ['validateADCProperties'];
        });

        it("should output a warning when no property", function () {
            adcValidator.configXmlDoc = {
                control : {
                    properties : [
                        {}
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).toHaveBeenCalledWith(warnMsg.noProperties);
        });

        it("should not output a warning when there is at least one property", function () {
            adcValidator.configXmlDoc = {
                control : {
                    properties : [
                        {
                            property : [{}]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).not.toHaveBeenCalledWith(warnMsg.noProperties);
        });

        it("should not output a warning when there is at least one property inside category", function () {
            adcValidator.configXmlDoc = {
                control : {
                    properties : [
                        {
                            category : [
                                {
                                    property : [{}]
                                }
                            ]
                        }
                    ]
                }
            };

            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).not.toHaveBeenCalledWith(warnMsg.noProperties);
        });


    });

    describe('#runAutoTests', function () {
        var spyExec,
            childProc;

        beforeEach(function () {
            // Modify the sequence of the validation to only call the runAutoTests method
            adcValidator.validators.sequence = ['runAutoTests'];

            childProc = require('child_process');
            spyOn(process, 'cwd').andReturn('');
            spyExec = spyOn(childProc, 'execFile');
        });


        it('should run the ADXShell process with the path of the ADC directory in arguments and the flag --auto', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args) {
                expect(file).toBe('.\\ADXShell.exe');
                expect(args).toEqual(['--auto', '/adc/path/dir/']);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(childProc.execFile).toHaveBeenCalled();
        });

        it('should output a warning when the ADXShell process failed', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(new Error('Fake validation error'), '', 'Fake validation error');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).toHaveBeenCalledWith('\r\nFake validation error');
        });

        it('should output the stdout of the ADXShell process', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null, 'Fake stdout');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeMessage).toHaveBeenCalledWith('Fake stdout');
        });

        it("should output a success when the ADXShell process doesn't failed", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.adcUnitSucceed);
        });
    });

    describe('#runADCUnitTests', function () {
        var spyExec,
            childProc;

        beforeEach(function () {
            // Modify the sequence of the validation to only call the runADCUnitTests method
            adcValidator.validators.sequence = ['runADCUnitTests'];

            childProc = require('child_process');
            spyOn(process, 'cwd').andReturn('');
            spyExec = spyOn(childProc, 'execFile');
        });

        it('should verify that the `tests/units` directory exists', function () {
            var searchUnitsTests = false;

            spies.fs.stat.andCallFake(function (path) {
                if (path === '/adc/path/dir/tests/units') {
                    searchUnitsTests = true;
                }
            });

            adcValidator.validate(null, '/adc/path/dir');

            expect(searchUnitsTests).toBe(true);
        });

        it("should not output a warning when the `tests/units` directory doesn't exists", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(new Error("No such file or directory"));
            });

            adcValidator.validate(null, '/adc/path/dir');
            expect(common.writeWarning).not.toHaveBeenCalled();
        });

        it('should run the ADXShell process with the path of the ADC directory in arguments', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args) {
                expect(file).toBe('.\\ADXShell.exe');
                expect(args).toEqual(['/adc/path/dir/']);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(childProc.execFile).toHaveBeenCalled();
        });

        it('should output a warning when the ADXShell process failed', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(new Error('Fake validation error'), '', 'Fake validation error');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeWarning).toHaveBeenCalledWith('\r\nFake validation error');
        });

        it('should output the stdout of the ADXShell process', function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null, 'Fake stdout');
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeMessage).toHaveBeenCalledWith('Fake stdout');
        });

        it("should output a success when the ADXShell process doesn't failed", function () {
            spies.fs.stat.andCallFake(function (path, callback) {
                callback(null);
            });
            spyExec.andCallFake(function (file, args, options, callback) {
                callback(null);
            });
            adcValidator.validate(null, '/adc/path/dir');

            expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.adcUnitSucceed);
        });
    });
});
