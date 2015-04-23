describe('ADCGenerator', function () {

    var fs              = require('fs'),
        wrench          = require('wrench'),
        format          = require('util').format,
        uuid            = require('node-uuid'),
        pathHelper      = require('path'),
        spies           = {},
        common,
        adcGenerator,
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

        // Messages
        errMsg      = common.messages.error;
        successMsg         = common.messages.success;

        // Court-circuit the validation outputs
        spies.writeError   = spyOn(common, 'writeError');
        spies.writeSuccess = spyOn(common, 'writeSuccess');
        spies.dirExists    = spyOn(common, 'dirExists');
        spies.getDirStructure = spyOn(common, 'getDirStructure');

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
    });

    describe('#generator', function () {
        it("should output an error when the `name` argument is empty", function () {
            adcGenerator.generate({
                output : 'adc/path/dir'
            }, '');
            expect(common.writeError).toHaveBeenCalledWith(errMsg.missingNameArgument);
        });

        it("should output an error when the `name` argument is malformatted", function () {
            adcGenerator.generate({}, ':/\\#@!');
            expect(common.writeError).toHaveBeenCalledWith(errMsg.incorrectADCName);
        });

        it("should use the current working directory when the `output` path is not specified", function () {
            spyOn(process, 'cwd').andReturn('/cwd');
            adcGenerator.generate({}, 'adcname');
            expect(adcGenerator.outputDirectory).toBe('/cwd');
        });

        it("should use the `output` path when it's specified", function () {
            adcGenerator.generate({
                output : '/adc/path/dir'
            }, 'adcname');
            expect(adcGenerator.outputDirectory).toBe('/adc/path/dir');
        });

        it("should use the template when the `program` argument has a template property", function () {
            adcGenerator.generate({
                template : 'test'
            }, 'adcname');
            expect(adcGenerator.template).toBe('test');
        });

        it("should use the `default` template when the `program` has no template property", function () {
            adcGenerator.generate({
            }, 'adcname');
            expect(adcGenerator.template).toBe(common.DEFAULT_TEMPLATE_NAME);
        });

        it("should output an error when the specified template was not found", function () {
            spies.dirExists.andCallFake(function (path, callback) {
                if (path === 'adc/dir/path') {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            })
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

        describe("#verifyADCDirNotalreadyExist", function () {
            it("should output an error when the output directory + adc name already exist", function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    callback(null, true);
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith(format(errMsg.directoryAlreadyExist, 'adc/path/dir/adcname/'));
            });

            it('should not output an error when the output directory and the adc name is valid', function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    if (path == 'adc/path/dir/adcname/') {
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
                    if (path === 'adc/path/dir/adcname/') {
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
                expect(source).toBe(adcGenerator.rootdir + common.TEMPLATES_PATH + common.DEFAULT_TEMPLATE_NAME);
                expect(destination).toBe('adc/path/dir/adcname/');
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

        describe("#updateConfigFile", function () {
            beforeEach(function () {
                spies.dirExists.andCallFake(function (path, callback) {
                    if (path === 'adc/path/dir/adcname/') {
                        callback(null, false);
                    } else {
                        callback(null, true);
                    }
                });
                spies.wrench.copyDirRecursive.andCallFake(function (src, dest, option, callback) {
                    callback(null);
                });
            });

            it("should read the config.xml file", function () {
                adcGenerator.generate({
                   output : 'adc/path/dir'
                }, 'adcname');
                expect(fs.readFile).toHaveBeenCalled();
            });

            it("should output an error when an error occurred during the read of the config.xml", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(new Error('fake error'));
                });
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith('fake error');
            });

            it("should not output an error when the read of the config.xml succeed", function () {
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
                        output : 'adc/path/dir'
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
                }
            ];
            replacement.forEach(testReplacement);

            it("should output an error when failing to rewrite the config file", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(null, "");
                });
                spies.fs.writeFile.andCallFake(function (path, content, callback) {
                    callback(new Error('fake error'));
                })
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).toHaveBeenCalledWith('fake error');
            });

            it("should not output an error when rewrite the config file succeed", function () {
                spies.fs.readFile.andCallFake(function (path, option, callback) {
                    callback(null, "");
                });
                spies.fs.writeFile.andCallFake(function (path, content, callback) {
                    callback(null);
                })
                adcGenerator.generate({
                    output : 'adc/path/dir'
                }, 'adcname');
                expect(common.writeError).not.toHaveBeenCalled();
            });
        });

        describe("#done", function () {
           it("should output the structure of the ADC directory and a success message", function () {
               spies.dirExists.andCallFake(function (path, callback) {
                   if (path === 'adc/path/dir/adcname/' || path === 'adc/path/dir/tests/units') {
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
               expect(common.writeSuccess).toHaveBeenCalledWith(successMsg.adcStructureGenerated, d, 'adcname', 'adc/path/dir/adcname/');
           });
        });
    });
});
