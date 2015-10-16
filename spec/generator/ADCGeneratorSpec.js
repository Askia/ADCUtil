describe('ADCGenerator', function () {

    var fs              = require('fs'),
        wrench          = require('wrench'),
        format          = require('util').format,
        uuid            = require('node-uuid'),
        pathHelper      = require('path'),
        spies           = {},
        common,
        adcGenerator,
        Generator,
        generatorInstance,
        adcPreferences,
        errMsg,
        successMsg;

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the adcGenerator each time
        var adcGeneratorKey = require.resolve('../../app/generator/ADCGenerator.js'),
            commonKey       = require.resolve('../../app/common/common.js');

        delete require.cache[commonKey];
        common = require('../../app/common/common.js');

        delete require.cache[adcGeneratorKey];
        adcGenerator = require('../../app/generator/ADCGenerator.js');

        Generator = adcGenerator.Generator;
        var oldGenerate = Generator.prototype.generate;

        Generator.prototype.generate = function () {
            generatorInstance = this;
            oldGenerate.apply(this, arguments);
        };


        // Messages
        errMsg              = common.messages.error;
        successMsg         = common.messages.success;

        // Court-circuit the validation outputs
        spies.writeError   = spyOn(common, 'writeError');
        spies.writeSuccess = spyOn(common, 'writeSuccess');
        spies.dirExists    = spyOn(common, 'dirExists');
        spies.getDirStructure = spyOn(common, 'getDirStructure');
        spies.getTemplatePath = spyOn(common, 'getTemplatePath');
        spies.getTemplatePath.andCallFake(function (name, cb) {
            cb(null, pathHelper.join(common.TEMPLATES_PATH, name));
        });

        // Court-circuit the access of the filesystem
        spies.fs = {
            stat        : spyOn(fs, 'stat'),
            exists      : spyOn(fs, 'exists'),
            readdirSync : spyOn(fs, 'readdirSync'),
            readFile    : spyOn(fs, 'readFile'),
            writeFile   : spyOn(fs, 'writeFile')
        };

        // Court-circuit wrench
        spies.wrench = {
            copyDirRecursive : spyOn(wrench, 'copyDirRecursive'),
            readdirRecursive : spyOn(wrench, 'readdirRecursive')
        };

        // Court-circuit the uuid generator
        spyOn(uuid, 'v4').andReturn('guid');

        spies.cwd = spyOn(process, 'cwd').andReturn('adc/path/dir');

        adcPreferences  = require('../../app/preferences/ADCPreferences.js');

        spies.readPreferences = spyOn(adcPreferences, 'read');
        spies.readPreferences.andCallFake(function (opt, cb) {
            cb({
                author : {
                    name : 'MyPrefName',
                    email : 'MyPrefEmail',
                    company : 'MyPrefCompany',
                    website : 'MyWebsite'
                }
            });
        });
    });

    describe('#generator', function () {
        it("should output an error when the `name` argument is empty", function () {
            adcGenerator.generate({
                output : 'adc/path/dir'
            }, '');
            expect(common.writeError).toHaveBeenCalledWith(errMsg.missingNameArgument);
        });

        it("should output an error when the `name` argument is not correctly formatted", function () {
            adcGenerator.generate({}, ':/\\#@!');
            expect(common.writeError).toHaveBeenCalledWith(errMsg.incorrectADCName);
        });

        it("should use the current working directory when the `output` path is not specified", function () {
            spies.cwd.andReturn('/cwd');
            adcGenerator.generate({}, 'adcname');
            expect(generatorInstance.outputDirectory).toBe('/cwd');
        });

        it("should use the `output` path when it's specified", function () {
            adcGenerator.generate({
                output : '/adc/path/dir'
            }, 'adcname');
            expect(generatorInstance.outputDirectory).toBe('/adc/path/dir');
        });

        it("should use the template when the `program` argument has a template property", function () {
            adcGenerator.generate({
                template : 'test'
            }, 'adcname');
            expect(generatorInstance.template).toBe('test');
        });

        it("should use the `blank` template when the `program` has no template property", function () {
            adcGenerator.generate({
            }, 'adcname');
            expect(generatorInstance.template).toBe(common.DEFAULT_TEMPLATE_NAME);
        });

        it("should output an error when the specified template was not found", function () {
            spies.getTemplatePath.andCallFake(function (path, callback) {
                if (path === 'adc/dir/path') {
                    callback(null, 'adc/dir/path');
                } else {
                    callback(new Error(format(errMsg.cannotFoundTemplate, 'test')));
                }
            });
            adcGenerator.generate({
                output   : 'test',
                template : 'test'
            }, 'adcname');
            expect(common.writeError).toHaveBeenCalledWith(format(errMsg.cannotFoundTemplate, 'test'));
        });

        describe('#verifyOutputDirExist', function () {
            it("should output an error when the output directory path doesn't exist", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    if (path === 'adc/path/dir') {
                        callback(null, false);
                    } else {
                        callback(null, true);
                    }
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith(format(errMsg.noSuchFileOrDirectory, 'adc/path/dir'));
            });
        });

        describe("#verifyADCDirNotAlreadyExist", function () {
            it("should output an error when the output directory + adc name already exist", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    callback(null, true);
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith(format(errMsg.directoryAlreadyExist, 'adc\\path\\dir\\adcname'));
            });

            it('should not output an error when the output directory and the adc name is valid', function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    if (path == 'adc\\path\\dir\\adcname') {
                        callback(null, false);
                    } else {
                        callback(null, true);
                    }
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).not.toHaveBeenCalled();
            });
        });

        describe("#copyFromTemplate", function () {
            beforeEach(function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    if (path === 'adc\\path\\dir\\adcname') {
                        callback(null, false);
                    } else {
                        callback(null, true);
                    }
                });
            });

            it("should copy the `default` template directory in the ADC output directory", function () {
                var source, destination;
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest) {
                    source = src;
                    destination = dest;
                });
                adcGenerator.rootdir = '/src';
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(wrench.copyDirRecursive).toHaveBeenCalled();
                expect(source).toBe('\\templates\\\adc\\' + common.DEFAULT_TEMPLATE_NAME);
                expect(destination).toBe('adc\\path\\dir\\adcname');
            });

            it("should search the path of template using `common.getTemplatePath` when the `templatePath` is not defined", function () {
                var source;
                spies.getTemplatePath.andCallFake(function (name, cb) {
                    cb(null, 'template/path/test');
                });
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest) {
                    source = src;
                });
                adcGenerator.generate({
                    template : 'test',
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(source).toBe('template/path/test');
            });

            it("should output an error when the copy failed", function () {
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest, option, callback) {
                    callback(new Error('Fake error'));
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith('Fake error');
            });

            it("should not output an error when the copy doesn't failed", function () {
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest, option, callback) {
                    callback(null);
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).not.toHaveBeenCalled();
            });
        });

        describe("#updateFiles", function () {
            beforeEach(function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    if (path === 'adc\\path\\dir\\adcname') {
                        callback(null, false);
                    } else {
                        callback(null, true);
                    }
                });
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest, option, callback) {
                    callback(null);
                });
            });

            it("should read the config.xml and the readme.md files", function () {
                var paths = [];
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    paths.push(path);
                    callback(null, "");
                });
                adcGenerator.generate({
                   output : 'adc/path/dir'
                }, 'adcname');
                expect(paths).toEqual(['adc\\path\\dir\\adcname\\config.xml', 'adc\\path\\dir\\adcname\\readme.md']);
            });

            it("should output an error when an error occurred while reading the file", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(new Error('fake error'));
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith('fake error');
            });

            it("should not output an error while reading the file succeed", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(null, "");
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).not.toHaveBeenCalled();
            });

            function testReplacement(obj) {
                it("should replace the `" + obj.pattern + "` by the right value", function () {
                    var result;
                    spies.fs.readFile.andCallFake(function (path, option, callback) {
                        callback(null, obj.pattern);
                    });
                    spies.fs.writeFile.andCallFake(function (path, content) {
                        result = content;
                    });
                    spyOn(common, 'formatXmlDate').andReturn('2013-12-31');
                    adcGenerator.generate({
                        output : 'adc/path/dir',
                        description : 'My description',
                        author : {
                            name : 'MySelf',
                            email : 'myself@test.com',
                            company : 'My Company',
                            website : 'http://my/web/site.com'
                        }
                    }, 'adcname');
                    expect(result).toBe(obj.replacement);
                });
            }

            var replacement = [
                {
                    pattern : "{{ADCName}}",
                    replacement : "adcname"
                },
                {
                    pattern : "{{ADCGuid}}",
                    replacement : "guid"
                },
                {
                    pattern : "2000-01-01",
                    replacement : "2013-12-31"
                },
                {
                    pattern : '{{ADCDescription}}',
                    replacement : 'My description'
                },
                {
                    pattern : '{{ADCAuthor}}',
                    replacement : 'MySelf <myself@test.com>'
                },
                {
                    pattern : '{{ADCAuthor.Name}}',
                    replacement : 'MySelf'
                },
                {
                    pattern : '{{ADCAuthor.Email}}',
                    replacement : 'myself@test.com'
                },
                {
                    pattern : '{{ADCAuthor.Company}}',
                    replacement : 'My Company'
                },
                {
                    pattern : '{{ADCAuthor.website}}',
                    replacement : 'http://my/web/site.com'
                }
            ];
            replacement.forEach(testReplacement);


            function testReplaceWithPreferences(obj) {
                it("should replace the `" + obj.pattern + "` by the value from the preferences", function () {
                    var result;
                    spies.fs.readFile.andCallFake(function (path, option, callback) {
                        callback(null, obj.pattern);
                    });
                    spies.fs.writeFile.andCallFake(function (path, content) {
                        result = content;
                    });
                    spyOn(common, 'formatXmlDate').andReturn('2013-12-31');
                    adcGenerator.generate({
                        output : 'adc/path/dir',
                        description : 'My description'
                    }, 'adcname');
                    expect(result).toBe(obj.replacement);
                });
            }

            var preferencesReplacement = [
                {
                    pattern : '{{ADCAuthor.Name}}',
                    replacement : 'MyPrefName'
                },
                {
                    pattern : '{{ADCAuthor.Email}}',
                    replacement : 'MyPrefEmail'
                },
                {
                    pattern : '{{ADCAuthor.Company}}',
                    replacement : 'MyPrefCompany'
                },
                {
                    pattern : '{{ADCAuthor.website}}',
                    replacement : 'MyWebsite'
                }
            ];

            preferencesReplacement.forEach(testReplaceWithPreferences);

            it("should output an error when failing to rewrite the file", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(null, "");
                });
                spies.fs.writeFile.andCallFake(function (path, content, callback) {
                    callback(new Error('fake error'));
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith('fake error');
            });

            it("should not output an error when rewrite the file succeed", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(null, "");
                });
                spies.fs.writeFile.andCallFake(function (path, content, callback) {
                    callback(null);
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).not.toHaveBeenCalled();
            });
        });

        describe("#done", function () {
           it("should output the structure of the ADC directory and a success message", function () {
               spies.dirExists.andCallFake(function (path, callback) {
                   if (path === 'adc\\path\\dir\\adcname' || path === 'adc\\path\\dir\\tests\\units') {
                       callback(null, false);
                   } else {
                       callback(null, true);
                   }
               });
               spies.wrench.copyDirRecursive.andCallFake(function (src, dest, option, callback) {
                   callback(null);
               });
               spies.fs.readFile.andCallFake(function (path, option, callback) {
                  callback(null, "");
               });
               spies.fs.writeFile.andCallFake(function (path, content, callback) {
                   callback(null);
               });
               spies.getDirStructure.andCallFake(function (path, callback) {
                    callback(null, [
                        {
                            name : 'resources',
                            sub  : [
                                {
                                    name : 'dynamic',
                                    sub  : ['default.html']
                                },
                                {
                                    name : 'share',
                                    sub  : []
                                },
                                {
                                    name : 'static',
                                    sub  : []
                                }
                            ]
                        },
                        {
                            name : 'tests',
                            sub  : [
                                {
                                    name : 'units',
                                    sub  : [
                                        'test.xml'
                                    ]
                                }
                            ]
                        },
                        'config.xml'
                    ]);
               });
               adcGenerator.generate({
                   output : 'adc/path/dir'
               }, 'adcname');

               var d = [];
               d.push('|-- resources\\');
               d.push('|--|-- dynamic\\');
               d.push('|--|--|-- default.html');
               d.push('|--|-- share\\');
               d.push('|--|-- static\\');
               d.push('|-- tests\\');
               d.push('|--|-- units\\');
               d.push('|--|--|-- test.xml');
               d.push('|-- config.xml');
               d = d.join('\r\n');
               expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.adcStructureGenerated, d, 'adcname', 'adc\\path\\dir\\adcname');
           });
        });

        describe("API `callback`", function () {
            beforeEach(function () {

                spies.dirExists.andCallFake(function (path, callback) {
                    if (path === 'adc\\path\\dir\\adcname' || path === 'adc\\path\\dir\\tests\\units') {
                        callback(null, false);
                    } else {
                        callback(null, true);
                    }
                });
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest, option, callback) {
                    callback(null);
                });
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(null, "");
                });
                spies.fs.writeFile.andCallFake(function (path, content, callback) {
                    callback(null);
                });
                spies.getDirStructure.andCallFake(function (path, callback) {
                    callback(null, [
                        {
                            name : 'resources',
                            sub  : [
                                {
                                    name : 'dynamic',
                                    sub  : ['default.html']
                                },
                                {
                                    name : 'share',
                                    sub  : []
                                },
                                {
                                    name : 'static',
                                    sub  : []
                                }
                            ]
                        },
                        {
                            name : 'tests',
                            sub  : [
                                {
                                    name : 'units',
                                    sub  : [
                                        'test.xml'
                                    ]
                                }
                            ]
                        },
                        'config.xml'
                    ]);
                });
            });

            it("should be called when defined without `options` arg", function () {
                var generator = new Generator();
                var wasCalled = false;
                generator.generate('myadc', function () {
                    wasCalled = true;
                });

                expect(wasCalled).toBe(true);
            });

            it("should be called when defined with the`options` arg", function () {
                var generator = new Generator();
                var wasCalled = false;
                generator.generate('myadc', {}, function () {
                    wasCalled = true;
                });

                expect(wasCalled).toBe(true);
            });

            it("should be call with an err argument as an Error", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    callback(new Error("Fake error"));
                });
                var generator = new Generator();
                var callbackErr;
                generator.generate('myadc', function (err) {
                    callbackErr = err;
                });
                expect(callbackErr instanceof Error).toBe(true);
            });

            it("should be call with the `outputDir` in arg", function () {
                var generator = new Generator();
                var callbackPath;
                generator.generate('myadc', function (err, outputDir) {
                    callbackPath = outputDir;
                });

                expect(callbackPath).toEqual('adc\\path\\dir\\\myadc');
            });

        });
    });
});
