// Common
var common = require('../common/common.js'),

// Path helper
    pathHelper = require('path'),

// Error messages
    errMsg          = common.messages.error,

// Regular messages
    successMsg       = common.messages.success;

/**
 * Show an ADC output
 *
 * @param {Command} program Commander object which hold the arguments pass to the program
 * @param {String} path Path of the ADC to directory
 */
exports.show = function show(program, path) {
    program = program || {};
    path = path || process.cwd();

    if (!program.output) {
        common.writeError(errMsg.noOutputDefinedForShow);
        return;
    }

    if (!program.fixture) {
        common.writeError(errMsg.noFixtureDefinedForShow);
        return;
    }

    var execFile = require('child_process').execFile,
        args     = [
            'show',
            '-output:' + program.output,
            '-fixture:' + program.fixture,
            path
        ],
        rootDir = pathHelper.resolve(__dirname, "../../");

    execFile('.\\' + common.ADC_UNIT_PROCESS_NAME, args, {
        cwd   : rootDir + common.ADC_UNIT_DIR_PATH,
        env   : process.env
    }, function callback(err, stdout, stderr) {
        common.writeMessage(stdout);

        if (stderr) {
            common.writeError("\r\n" + stderr);
        }
    });

};