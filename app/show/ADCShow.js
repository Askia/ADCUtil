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
 * @param {Function} callback Callback function
 * @param {Error} callback.err Error
 * @param {String} callback.output Output string
 */
exports.show = function show(program, path, callback) {
    program = program || {};
    path = path || process.cwd();

    if (!program.output) {
        common.writeError(errMsg.noOutputDefinedForShow);
        if (typeof callback === 'function') {
            callback(new Error(errMsg.noOutputDefinedForShow));
        }
        return;
    }

    if (!program.fixture) {
        common.writeError(errMsg.noFixtureDefinedForShow);
        if (typeof callback === 'function') {
            callback(new Error(errMsg.noFixtureDefinedForShow));
        }
        return;
    }

    var execFile = require('child_process').execFile,
        args     = [
            'show',
            '-output:' + program.output,
            '-fixture:' + program.fixture
        ],
        rootDir = pathHelper.resolve(__dirname, "../../");

    if (program.masterPage) {
        args.push('-masterPage:' + pathHelper.resolve(program.masterPage));
    }
    args.push(path);

    execFile('.\\' + common.ADC_UNIT_PROCESS_NAME, args, {
        cwd   : rootDir + common.ADC_UNIT_DIR_PATH,
        env   : process.env
    }, function cb(err, stdout, stderr) {
        if (err && typeof callback === 'function') {
            callback(err, null);
            return;
        }

        common.writeMessage(stdout);
        if (!stderr && typeof  callback === 'function') {
            callback(null, stdout);
        }

        if (stderr) {
            common.writeError("\r\n" + stderr);
            if (typeof callback === 'function') {
                callback(new Error(stderr));
            }
        }
    });

};