// Filesystem
var fs = require('fs'),

// Util
    format   = require('util').format,

// Path helper
    pathHelper = require('path'),

// Common
    common = require('../common/common.js'),

// Error messages
    errMsg          = common.messages.error,

// Regular messages
    successMsg       = common.messages.success;

exports = module.exports;

/**
 * Root directory of the program
 * @type {string}
 */
exports.rootdir    = pathHelper.resolve(__dirname, "../../");


/**
 * ADC directory
 * @type {string}
 */
exports.adcDirectoryPath = '';

/**
 * Bin path of the ADC
 * @type {string}
 */
exports.binPath = '';

/**
 * Name of the ADC
 * @type {string}
 */
exports.adcName = '';

/**
* Report of the validation process
*/
exports.validationReport;


// Sequence of calls
var sequence = new common.Sequence([
    createBinDir,
    compressADC
], done);


/**
 * Build the ADC file
 *
 * @param {Command} program Commander object which hold the arguments pass to the program
 * @param {String} path Path of the ADC to directory
 */
exports.build = function build(program, path) {
    var validator = require('../validator/ADCValidator.js');
    program = program || {};
    program.xml = true;
    program.autoTest = true;
    validator.validate(program, path, function validateCallback(err) {
        if (err) {
            return sequence.resume(new Error(errMsg.validationFailed));
        }

        exports.adcName          = validator.adcName;
        exports.adcDirectoryPath = validator.adcDirectoryPath;
        exports.binPath          = pathHelper.join(exports.adcDirectoryPath, common.ADC_BIN_PATH);
        exports.validationReport = validator.report;

        return sequence.resume();
    });
};

/**
 * End of the sequence chain
 * @param {Error} err Error
 */
function done(err) {
    if (err) {
        common.writeError(err.message);
        return;
    }

    var output = pathHelper.join(exports.binPath, exports.adcName + '.adc');

    if (!exports.validationReport.warnings) {
        common.writeSuccess(successMsg.buildSucceed, output);
    } else {
        common.writeSuccess(successMsg.buildSucceedWithWarning, exports.validationReport.warnings, output);
    }
}

/**
 * Create a bin directory
 */
function createBinDir() {
   common.dirExists(exports.binPath, function binPathExist(err, exist) {
        if (!exist || err) {
            var er = fs.mkdirSync(exports.binPath);
            if (er) {
                return sequence.resume(er);
            }
        }
       return sequence.resume();
   });
}

/**
 * Compress the ADC directory
 */
function compressADC() {
    common.getDirStructure(exports.adcDirectoryPath, function callbackGetStructure(err, structure) {
        if (err) {
            return sequence.resume(err);
        }

        var zip     = common.getNewZip(),
            zipDir = '';

        structure.forEach(function appendInZip(file) {
            var prevDir,
                folderLower,
                zipDirLower = zipDir.toLowerCase();

            if (typeof file === 'string') {  // File
                if (zipDirLower === 'resources/') return; // Exclude extra files
                if (zipDirLower === '' && !/^(config\.xml|readme|changelog)/i.test(file)) return; // Exclude extra files
                if (common.isIgnoreFile(file)) return; // Ignore files
                zip.file(zipDir + file, fs.readFileSync(exports.adcDirectoryPath + zipDir + file));
            } else { // Directory
                if (!file.sub || !file.sub.length) return;        // Exclude empty folder

                folderLower = file.name.toLowerCase();

                if (folderLower === 'bin') return;   // Exclude the bin folder
                if (folderLower === 'tests') return; // Exclude tests folder
                if (zipDirLower === 'resources/' &&  !/^(dynamic|static|share)$/i.test(folderLower)) return; // Exclude extra directories
                if (zipDirLower === '' && !/^(resources)$/.test(folderLower)) return; // Exclude extra directories

                prevDir = zipDir;
                zipDir += file.name + '/';
                zip.folder(zipDir);
                file.sub.forEach(appendInZip);
                zipDir = prevDir;
            }
        });

        var buffer = zip.generate({type:"nodebuffer"});

        fs.writeFile(pathHelper.join(exports.binPath, exports.adcName + '.adc'), buffer, function writeZipFile(err) {
            if (err) {
                throw err;
            }
        });

        sequence.resume();
    });
}





