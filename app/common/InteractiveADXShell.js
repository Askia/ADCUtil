var childProcess = require('child_process');
var path         = require('path');
var common       = require('./common.js');


/**
 * Manage the ADXShell process in interactive mode.
 *
 * It allow a single instance creation of the ADXShell
 * and a bi-directional communication using the stdio of the spawn process
 *
 * @class InteractiveADXShell
 * @private
 */
function InteractiveADXShell(dir) {
    this.path = dir;
}

/**
 * Create an interactive spawn process with the ADXShell
 *
 * @constructor
 * @param {String} dir Path of the ADC directory
 */
InteractiveADXShell.prototype.constructor = InteractiveADXShell;


/**
 * Send the specified command in the ADXShell process
 *
 * @param {String} command Command to execute
 * @param {Function} callback
 */
InteractiveADXShell.prototype.exec = function exec(command, callback) {
    var self = this;
    if (!self._process) {
        self._process = childProcess.spawn('.\\' + common.ADC_UNIT_PROCESS_NAME, [
            'interactive',
            self.path
        ], {
            cwd   : path.join(this.path, common.ADC_UNIT_DIR_PATH),
            env   : process.env
        });
        self._process._firstData = true;
    }

    function onOutput(data) {
        if (self._process._firstData) {
            self._process._firstData = false;
            return;
        }
        if (typeof callback === 'function') {
            callback(null, data.toString());
        }
        // Remove the listener at the end of the process
        self._process.stdout.removeListener('data', onOutput);
        self._process.stderr.removeListener('data', onOutput);
    }

    function onError(data) {
        if (typeof callback === 'function') {
            callback(new Error(data.toString()), null);
        }
        // Remove the listener at the end of the process
        self._process.stdout.removeListener('data', onOutput);
        self._process.stderr.removeListener('data', onOutput);
    }

    self._process.stdout.on('data', onOutput);
    self._process.stderr.on('data', onError);
    self._process.stdin.write(command);
};

exports.InteractiveADXShell = InteractiveADXShell;