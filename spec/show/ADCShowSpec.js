describe('ADCShow', function () {

    var common,
        adcShow,
        spies = {},
        errMsg,
        successMsg;

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the adcShow each time
        var adcShowKey   = require.resolve('../../app/show/ADCShow.js'),
            commonKey       = require.resolve('../../app/common/common.js');

        delete require.cache[commonKey];
        common = require('../../app/common/common.js');

        delete require.cache[adcShowKey];
        adcShow = require('../../app/show/ADCShow.js');

        // Messages
        errMsg      = common.messages.error;
        successMsg  = common.messages.success;

        // Court-circuit the validation outputs
        spies.writeError   = spyOn(common, 'writeError');
        spies.writeSuccess = spyOn(common, 'writeSuccess');
        spies.dirExists    = spyOn(common, 'dirExists');


    });

    describe('#show', function () {
        it("should output an error when the `output` option is not defined", function () {
            adcShow.show({});
            expect(common.writeError).toHaveBeenCalledWith(errMsg.noOutputDefinedForShow);
        });

        it("should output an error when the `fixture` option is not defined", function () {
            adcShow.show({
                output : 'Something'
            });
            expect(common.writeError).toHaveBeenCalledWith(errMsg.noFixtureDefinedForShow);
        });

        it("should call the program `ADCUnit.exe` with the correct arguments", function () {
            var childProc = require('child_process'),
                spyExec   = spyOn(childProc, 'execFile');

            spyOn(process, 'cwd').andReturn('');

            spyExec.andCallFake(function (file, args) {
                expect(file).toBe('.\\ADCUnit.exe');
                expect(args).toEqual(['show', '-output:something', '-fixture:single.xml', '/adc/path/dir']);
            });
            adcShow.show({
                output : 'something',
                fixture : 'single.xml'
            }, '/adc/path/dir');

            expect(childProc.execFile).toHaveBeenCalled();
        });
    });
});

