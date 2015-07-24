describe('ADCConfigurator', function () {

    var fs = require('fs'),
        path = require("path"),
        et = require('elementtree'),
        ElementTree = et.ElementTree,
        common,
        ADCConfigurator,
        spies = {},
        errMsg,
        successMsg;

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the object each time
        var adcConfigKey = require.resolve('../../app/configurator/ADCConfigurator.js'),
            commonKey = require.resolve('../../app/common/common.js');

        delete require.cache[commonKey];
        common = require('../../app/common/common.js');

        delete require.cache[adcConfigKey];
        ADCConfigurator = require('../../app/configurator/ADCConfigurator.js').Configurator;

        // Messages
        errMsg = common.messages.error;
        successMsg = common.messages.success;

        // Court-circuit the validation outputs
        // spies.writeError    = spyOn(common, 'writeError');
        // spies.writeSuccess  = spyOn(common, 'writeSuccess');
        // spies.writeMessage  = spyOn(common, 'writeMessage');
        spies.dirExists     = spyOn(common, 'dirExists');

        // Court-circuit the access of the filesystem
        spies.fs = {
            readFile    : spyOn(fs, 'readFile')
        };

    });


    function runSync(fn) {
        var wasCalled = false;
        runs(function () {
            fn(function () {
                wasCalled = true;
            });
        });
        waitsFor(function () {
            return wasCalled;
        });
    }

    describe("#constructor", function () {

        it("should throw an exception when the `path` argument of the constructor is a falsy", function () {

            expect(function () {
                var configurator = new ADCConfigurator();
            }).toThrow(errMsg.invalidPathArg);

        });

        it("should set the property #path to the object instance", function () {

            var configurator = new ADCConfigurator("my/path");
            expect(configurator.path).toEqual("my/path");
        });

    });

    describe("#load", function () {

        it("should return an error when the `path` specified via the constructor doesn't exist", function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(new Error(errMsg.noSuchFileOrDirectory));
            });
            runSync(function (done) {
                var configurator = new ADCConfigurator("an/invalid/path");
                configurator.load(function (err) {
                    expect(err.message).toEqual(errMsg.noSuchFileOrDirectory);
                    done();
                });
            });
        });

        it("should try to read the config.xml file", function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            runSync(function (done) {
                var configurator = new ADCConfigurator("a/valid/path");

                spies.fs.readFile.andCallFake(function (filepath) {
                    expect(filepath).toEqual(path.join("a/valid/path", "config.xml"));
                    done();
                });


                configurator.load();
            });
        });

        it("should return an error when it could not config.xml read the file", function () {
            var theError = new Error("A fake errror");
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(theError, null);
            });
            runSync(function (done) {
                var configurator = new ADCConfigurator("an/invalid/path");
                configurator.load(function (err) {
                    expect(err).toBe(theError);
                    done();
                });
            });
        });

        it("should initialize the #xmldoc property with the XML parse result", function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, '<xml></xml>');
            });
            runSync(function (done) {
                var configurator = new ADCConfigurator("an/valid/path");
                configurator.load(function () {
                    expect(configurator.xmldoc instanceof ElementTree).toBe(true);
                    done();
                });
            });

        });

        it("should initialize the #info property with an object to manage the ADC info", function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, '<control><info><guid>the-guid</guid><name>the-name</name></info></control>');
            });
            runSync(function (done) {
                var configurator = new ADCConfigurator("an/valid/path");
                configurator.load(function () {
                    expect(configurator.info).toBeDefined();
                    done();
                });
            });

        });
    });


    describe("#fromXml", function () {
        beforeEach(function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, '<control>\n  <info>\n  <name>the-name</name>\n  <guid>the-guid</guid>\n  ' +
                    '<version>the-version</version>\n  <date>the-date</date>\n  <description><![CDATA[the-description]]></description>\n  ' +
                    '<company>the-company</company>\n  <author>the-author</author>\n  <site>the-site</site>\n  ' +
                    '<helpURL>the-helpURL</helpURL>\n  ' +
                    '<categories>\n    <category>cat-1</category>\n    <category>cat-2</category>\n  </categories>' +
                    '\n  <style width="200" height="400" />' +
                    '\n  <constraints>\n    <constraint on="questions" single="true" multiple="true" open="false" />' +
                    '\n    <constraint on="controls" label="true" responseblock="true" />' +
                    '\n    <constraint on="responses" min="2" max="*" />' +
                    '\n  </constraints>' +
                    '\n  </info></control>');
            });
        });

        it("should reset the configuration with XML", function () {
            runSync(function (done) {
                var configurator = new ADCConfigurator("an/valid/path");
                configurator.load(function () {
                    configurator.fromXml('<control>\n  <info>\n  <name>new-name</name>\n  <guid>new-guid</guid>\n  ' +
                        '<version>new-version</version>\n  <date>new-date</date>\n  <description><![CDATA[new-description]]></description>\n  ' +
                        '<company>new-company</company>\n  <author>new-author</author>\n  <site>new-site</site>\n  ' +
                        '<helpURL>new-helpURL</helpURL>\n  ' +
                        '<categories>\n    <category>new-cat-1</category>\n    <category>new-cat-2</category>\n    <category>new-cat-3</category>\n  </categories>' +
                        '\n  <style width="300" height="500" />' +
                        '\n  <constraints>\n    <constraint on="questions" single="false" multiple="true" open="false" numeric="true" />' +
                        '\n    <constraint on="controls" label="false" responseblock="true" checkbox="true" />' +
                        '\n    <constraint on="responses" min="10" max="*" />' +
                        '\n  </constraints>' +
                        '\n  </info></control>');
                    var result = configurator.toXml();
                    expect(result ).toEqual('<?xml version="1.0" encoding="utf-8"?>'+
                        '\n<control  xmlns="http://www.askia.com/ADCSchema"' +
                        '\n          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
                        '\n          xsi:schemaLocation="http://www.askia.com/ADCSchema http://www.askia.com/Downloads/dev/schemas/adc2.0/Config.xsd"' +
                        '\n          version="2.0.0"' +
                        '\n          askiaCompat="5.3.3">' +
                        '\n  <info>' +
                        '\n    <name>new-name</name>' +
                        '\n    <guid>new-guid</guid>' +
                        '\n    <version>new-version</version>' +
                        '\n    <date>new-date</date>' +
                        '\n    <description><![CDATA[new-description]]></description>' +
                        '\n    <company>new-company</company>' +
                        '\n    <author><![CDATA[new-author]]></author>' +
                        '\n    <site>new-site</site>' +
                        '\n    <helpURL>new-helpURL</helpURL>' +
                        '\n    <categories>' +
                        '\n      <category>new-cat-1</category>' +
                        '\n      <category>new-cat-2</category>' +
                        '\n      <category>new-cat-3</category>' +
                        '\n    </categories>' +
                        '\n    <style width="300" height="500" />' +
                        '\n    <constraints>' +
                        '\n      <constraint on="questions" single="false" multiple="true" open="false" numeric="true" />' +
                        '\n      <constraint on="controls" label="false" responseblock="true" checkbox="true" />' +
                        '\n      <constraint on="responses" min="10" max="*" />' +
                        '\n    </constraints>' +
                        '\n  </info>' +
                        '\n</control>');
                    done();
                });
            });
        });
    });

    describe("#toXml", function () {
        beforeEach(function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, '<control><info><name>the-name</name><guid>the-guid</guid>' +
                '<version>the-version</version><date>the-date</date><description><![CDATA[the-description]]></description>' +
                '<company>the-company</company><author>the-author</author><site>the-site</site>' +
                '<helpURL>the-helpURL</helpURL>' +
                '<categories><category>cat-1</category><category>cat-2</category></categories>' +
                '<style width="200" height="400" />' +
                '<constraints><constraint on="questions" single="true" multiple="true" open="false" />' +
                '<constraint on="controls" label="true" responseblock="true" />' +
                '<constraint on="responses" min="2" max="*" />' +
                '</constraints>' +
                '</info></control>');
            });
        });

        it("should return the configuration as XML", function () {
            runSync(function (done) {
                var configurator = new ADCConfigurator("an/valid/path");
                configurator.load(function () {
                    var result = configurator.toXml();
                    expect(result ).toEqual('<?xml version="1.0" encoding="utf-8"?>'+
                        '\n<control  xmlns="http://www.askia.com/ADCSchema"' +
                        '\n          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
                        '\n          xsi:schemaLocation="http://www.askia.com/ADCSchema http://www.askia.com/Downloads/dev/schemas/adc2.0/Config.xsd"' +
                        '\n          version="2.0.0"' +
                        '\n          askiaCompat="5.3.3">' +
                        '\n  <info>' +
                        '\n    <name>the-name</name>' +
                        '\n    <guid>the-guid</guid>' +
                        '\n    <version>the-version</version>' +
                        '\n    <date>the-date</date>' +
                        '\n    <description><![CDATA[the-description]]></description>' +
                        '\n    <company>the-company</company>' +
                        '\n    <author><![CDATA[the-author]]></author>' +
                        '\n    <site>the-site</site>' +
                        '\n    <helpURL>the-helpURL</helpURL>' +
                        '\n    <categories>' +
                        '\n      <category>cat-1</category>' +
                        '\n      <category>cat-2</category>' +
                        '\n    </categories>' +
                        '\n    <style width="200" height="400" />' +
                        '\n    <constraints>' +
                        '\n      <constraint on="questions" single="true" multiple="true" open="false" />' +
                        '\n      <constraint on="controls" label="true" responseblock="true" />' +
                        '\n      <constraint on="responses" min="2" max="*" />' +
                        '\n    </constraints>' +
                        '\n  </info>' +
                        '\n</control>');
                    done();
                });
            });
        });
    });

    describe("#info", function () {

        beforeEach(function () {
            spies.dirExists.andCallFake(function (p, cb) {
                cb(null, true);
            });
            spies.fs.readFile.andCallFake(function (p, cb) {
                cb(null, '<control><info><name>the-name</name><guid>the-guid</guid>' +
                        '<version>the-version</version><date>the-date</date><description><![CDATA[the-description]]></description>' +
                        '<company>the-company</company><author>the-author</author><site>the-site</site>' +
                        '<helpURL>the-helpURL</helpURL>' +
                        '<categories><category>cat-1</category><category>cat-2</category></categories>' +
                        '<style width="200" height="400" />' +
                        '<constraints><constraint on="questions" single="true" multiple="true" open="false" />' +
                        '<constraint on="controls" label="true" responseblock="true" />' +
                        '<constraint on="responses" min="2" max="*" />' +
                        '</constraints>' +
                        '</info></control>');
            });
        });

        describe("#get", function () {
            it("should return the ADC information as plain object", function () {

                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        var result = configurator.info.get();
                        expect(result ).toEqual({
                            name : "the-name",
                            guid : "the-guid",
                            version : "the-version",
                            date : "the-date",
                            description : "the-description",
                            company : "the-company",
                            author : "the-author",
                            site : "the-site",
                            helpURL : "the-helpURL",
                            categories : ["cat-1", "cat-2"],
                            style : {
                                width : 200,
                                height : 400
                            },
                            constraints : {
                                questions : {
                                    single : true,
                                    multiple : true,
                                    open : false
                                },
                                controls : {
                                    label : true,
                                    responseblock : true
                                },
                                responses : {
                                    min : 2,
                                    max : '*'
                                }
                            }
                        });
                        done();
                    });
                });
            });
        });

        describe("#set", function () {
            it("should set the ADC information with plain object", function () {

                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        configurator.info.set({
                            name : "new-name",
                            guid : "new-guid",
                            version : "new-version",
                            date : "new-date",
                            description : "new-description",
                            company : "new-company",
                            author : "new-author",
                            site : "new-site",
                            helpURL : "new-helpURL",
                            categories : ["new-cat-1", "new-cat-2", "new-cat-3"],
                            style : {
                                width : 300,
                                height : 500
                            },
                            constraints : {
                                questions : {
                                    single : false,
                                    numeric : true
                                },
                                controls : {
                                    label :false,
                                    checkbox : true
                                },
                                responses : {
                                    min : 10
                                }
                            }
                        });
                        var result = configurator.info.get();
                        expect(result ).toEqual({
                            name : "new-name",
                            guid : "new-guid",
                            version : "new-version",
                            date : "new-date",
                            description : "new-description",
                            company : "new-company",
                            author : "new-author",
                            site : "new-site",
                            helpURL : "new-helpURL",
                            categories : ["new-cat-1", "new-cat-2", "new-cat-3"],
                            style : {
                                width : 300,
                                height : 500
                            },
                            constraints : {
                                questions : {
                                    single : false,
                                    multiple : true,
                                    open : false,
                                    numeric : true
                                },
                                controls : {
                                    label : false,
                                    responseblock : true,
                                    checkbox : true
                                },
                                responses : {
                                    min : 10,
                                    max : '*'
                                }
                            }
                        });
                        done();
                    });
                });
            });
        });

        ["name", "guid", "version", "date", "description", "company", "author", "site", "helpURL"].forEach(function (propName) {

            describe("#" + propName, function () {

                it("should return the value from the xml node", function () {

                    runSync(function (done) {
                        var configurator = new ADCConfigurator("an/valid/path");
                        configurator.load(function () {
                            var result = configurator.info[propName]();
                            expect(result ).toEqual('the-' + propName);
                            done();
                        });
                    });
                });

                it("should set the value", function () {
                    runSync(function (done) {
                        var configurator = new ADCConfigurator("an/valid/path");
                        configurator.load(function () {
                            configurator.info[propName]('new-' + propName);
                            var result = configurator.info[propName]();
                            expect(result ).toEqual('new-' + propName);
                            done();
                        });
                    });
                });
            });

        });

        describe("#style", function () {

            it("should return the value from the xml node", function () {

                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        var result = configurator.info.style();
                        expect(result ).toEqual({ width : 200, height : 400});
                        done();
                    });
                });
            });

            it("should set the value", function () {
                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        configurator.info.style({width : 300, height : 500});
                        var result = configurator.info.style();
                        expect(result ).toEqual({width : 300, height : 500});
                        done();
                    });
                });
            });
        });

        describe("#categories", function () {
            it("should return the value from the xml node", function () {

                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        var result = configurator.info.categories();
                        expect(result ).toEqual(['cat-1', 'cat-2']);
                        done();
                    });
                });
            });

            it("should set the value", function () {
                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        configurator.info.categories(['new-1', 'new-2', 'new-3']);
                        var result = configurator.info.categories();
                        expect(result ).toEqual(['new-1', 'new-2', 'new-3']);
                        done();
                    });
                });
            });
        });

        describe("#constraints", function () {
            it("should return the value from the xml node", function () {

                 runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        var result = configurator.info.constraints();
                        expect(result ).toEqual({
                            questions : {
                                single : true,
                                multiple : true,
                                open : false
                            },
                            controls : {
                                label : true,
                                responseblock : true
                            },
                            responses : {
                                min : 2,
                                max : '*'
                            }
                        });
                        done();
                    });
                });
            });

            it("should set the value", function () {
                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        configurator.info.constraints({
                            questions : {
                                single : false,
                                open : true
                            },
                            controls : {
                                label : false
                            },
                            responses : {
                                max : 50
                            }
                        });
                        var result = configurator.info.constraints();
                        expect(result ).toEqual({
                            questions : {
                                single : false,
                                multiple : true,
                                open : true
                            },
                            controls : {
                                label : false,
                                responseblock : true
                            },
                            responses : {
                                min : 2,
                                max : 50
                            }
                        });
                        done();
                    });
                });
            });
        });

        describe("#constraint", function () {

            [
                {
                    name : "questions",
                    atts : [
                        {
                            name : "single",
                            value : true,
                            newValue : false
                        },
                        {
                            name : "multiple",
                            value : true,
                            newValue : false
                        },
                        {
                            name : "open",
                            value : false,
                            newValue : true
                        },
                        {
                            name : "numeric",
                            value : false,
                            newValue : true
                        }
                    ]
                },
                {
                    name : "controls",
                    atts : [
                        {
                            name : "label",
                            value : true,
                            newValue : false
                        },
                        {
                            name : "responseblock",
                            value : true,
                            newValue : false
                        },
                        {
                            name : "checkbox",
                            value : false,
                            newValue : true
                        }
                    ]
                },
                {
                    name : "responses",
                    atts : [
                        {
                            name : "min",
                            value : 2,
                            newValue : 10
                        },
                        {
                            name : "max",
                            value : Infinity,
                            newValue : 50
                        }
                    ]
                }
            ].forEach(function (target) {

                   describe("#constraint on=" + target.name, function () {
                        target.atts.forEach(function(att) {

                            it("should return the value from the xml attribute ('" + att.name + "')", function () {

                                runSync(function (done) {
                                    var configurator = new ADCConfigurator("an/valid/path");
                                    configurator.load(function () {
                                        var result = configurator.info.constraint(target.name, att.name);
                                        expect(result).toEqual(att.value);
                                        done();
                                    });
                                });
                            });

                            it("should set the value ('" + att.name + "')", function () {
                                runSync(function (done) {
                                    var configurator = new ADCConfigurator("an/valid/path");
                                    configurator.load(function () {
                                        configurator.info.constraint(target.name, att.name, att.newValue);
                                        var result = configurator.info.constraint(target.name, att.name);
                                        expect(result ).toEqual(att.newValue);
                                        done();
                                    });
                                });
                            });


                        });
                   });


            });

        });

        describe("#toXml", function () {
            it("should return the ADC information as plain object", function () {

                runSync(function (done) {
                    var configurator = new ADCConfigurator("an/valid/path");
                    configurator.load(function () {
                        var result = configurator.info.toXml();
                        expect(result ).toEqual('  <info>' +
                            '\n    <name>the-name</name>' +
                            '\n    <guid>the-guid</guid>' +
                            '\n    <version>the-version</version>' +
                            '\n    <date>the-date</date>' +
                            '\n    <description><![CDATA[the-description]]></description>' +
                            '\n    <company>the-company</company>' +
                            '\n    <author><![CDATA[the-author]]></author>' +
                            '\n    <site>the-site</site>' +
                            '\n    <helpURL>the-helpURL</helpURL>' +
                            '\n    <categories>' +
                            '\n      <category>cat-1</category>' +
                            '\n      <category>cat-2</category>' +
                            '\n    </categories>' +
                            '\n    <style width="200" height="400" />' +
                            '\n    <constraints>' +
                            '\n      <constraint on="questions" single="true" multiple="true" open="false" />' +
                            '\n      <constraint on="controls" label="true" responseblock="true" />' +
                            '\n      <constraint on="responses" min="2" max="*" />' +
                            '\n    </constraints>' +
                            '\n  </info>');
                        done();
                    });
                });
            });
        });
    });

});