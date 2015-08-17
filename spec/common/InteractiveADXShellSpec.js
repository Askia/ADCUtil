describe('InteractiveADXShell', function () {

    var childProcess    = require('child_process'),
        common          = require('../../app/common/common.js'),
        pathHelper      = require('path'),
        spies           = {},
        InteractiveADXShell;

    function ChildProcessFake() {
        var self = this;
        self.stdin = {
            write : function () {}
        };

        self.stdout = {
            events  : {},
            removeListener : function (event) {
                delete self.stdout.events[event];
            },
            on : function (event, callback) {
                self.stdout.events[event] = callback;
            }
        };

        self.stderr = {
            events  : {},
            removeListener : function (event) {
                delete self.stderr.events[event];
            },
            on : function (event, callback) {
                self.stderr.events[event] = callback;
            }
        };
    }

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the module each time
        var moduleKey = require.resolve('../../app/common/InteractiveADXShell.js');
        delete require.cache[moduleKey];
        InteractiveADXShell = require('../../app/common/InteractiveADXShell.js').InteractiveADXShell;

        // Court-circuit the access of the child process
        spies.spawn = spyOn(childProcess, 'spawn').andCallFake(function () {
            return new ChildProcessFake();
        });

        // CWD
        spyOn(process, 'cwd').andReturn('');
    });

    describe('#constructor', function () {
        it("save the `path` arg in #path", function () {
            var adxShell = new InteractiveADXShell('/adc/path');
            expect(adxShell.path).toEqual('/adc/path');
        });
    });

    describe('#exec', function () {
        it("should spawn the ADXShell process with the `interactive` command", function () {
            var adxShell = new InteractiveADXShell('/adc/path');
            adxShell.exec('');
            var processPath = '.\\' + common.ADC_UNIT_PROCESS_NAME;
            var processArgs = [
                'interactive',
                '/adc/path'
            ];
            var processOptions = {
                cwd   : pathHelper.join('/adc/path', common.ADC_UNIT_DIR_PATH),
                env   : process.env
            };
            expect(spies.spawn).toHaveBeenCalledWith(processPath, processArgs, processOptions);
        });

        it("should not call spawn twice when the ADXShell process was already initialized", function () {
            var adxShell = new InteractiveADXShell('/adc/path');
            var callCount = 0;
            spies.spawn.andCallFake(function () {
                callCount++;
                return new ChildProcessFake();
            });
            adxShell.exec('');
            adxShell.exec('');
            expect(callCount).toBe(1);
        });

        it("should send the command in the standard input of the process", function () {
            var writeData;
            spies.spawn.andCallFake(function () {
                var mock = new ChildProcessFake();
                mock.stdin.write = function (data) {
                    writeData = data;
                };
                return mock;
            });
            var adxShell = new InteractiveADXShell('/adc/path');
            adxShell.exec('this is the command');
            expect(writeData).toBe('this is the command');
        });

        [{
            name : 'standard output',
            prop : 'stdout'
        }, {
            name : 'standard error',
            prop : 'stderr'
        }].forEach(function (obj) {
            it("should read in the " + obj.name  + " of the process", function () {
                var mock;
                spies.spawn.andCallFake(function () {
                    mock = new ChildProcessFake();
                    return mock;
                });
                var adxShell = new InteractiveADXShell('/adc/path');
                adxShell.exec('hello');
                expect(typeof mock[obj.prop].events.data).toBe('function');
            });

            it("should call the callback with the data of the " + obj.name  + " of the process", function () {
                var stub, result;
                spies.spawn.andCallFake(function () {
                    stub = new ChildProcessFake();
                    return stub;
                });
                var adxShell = new InteractiveADXShell('/adc/path');
                adxShell.exec('hello', function (err, data) {
                    if (obj.prop === 'stdout') {
                        result = data;
                    } else {
                        result = err.message;
                    }
                });
                if (obj.prop === 'stdout') {
                    stub[obj.prop].events.data("first call");
                }
                stub[obj.prop].events.data("process result");
                expect(result).toBe('process result');
            });

            it("should remove the listener after data was emit via the " + obj.name  + " of the process", function () {
                var mock;
                spies.spawn.andCallFake(function () {
                    mock = new ChildProcessFake();
                    return mock;
                });
                var adxShell = new InteractiveADXShell('/adc/path');
                adxShell.exec('hello');
                if (obj.prop === 'stdout') {
                    mock[obj.prop].events.data("first call");
                }
                mock[obj.prop].events.data("process result");
                expect(mock.stdout.events.data).toBe(undefined);
                expect(mock.stderr.events.data).toBe(undefined);
            });
        });

        it("should ignore the first output", function () {
            var stub, result = '';
            spies.spawn.andCallFake(function () {
                stub = new ChildProcessFake();
                return stub;
            });
            var adxShell = new InteractiveADXShell('/adc/path');
            adxShell.exec('hello', function (err, data) {
               result += data;
            });
            stub.stdout.events.data("first call");
            stub.stdout.events.data("second call");
            expect(result).toBe('second call');
        });

    });
});