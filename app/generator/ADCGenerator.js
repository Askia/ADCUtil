    // Filesystem
var fs = require('fs'),

    // Util
    format   = require('util').format,

    // Path helper
    pathHelper = require('path'),

    // Common
    common = require('../common/common.js'),

    // Wrench
    wrench = require('wrench'),

    // uuid generator
    uuid  = require('node-uuid'),

    // Error messages
    errMsg          = common.messages.error,
    // Regular messages
    successMsg             = common.messages.success;

exports = module.exports;

/**
 * Root directory of the program
 * @type {string}
 */
exports.rootdir    = pathHelper.resolve(__dirname, "../../");

/**
 * Path of the template directory
 * @type {string}
 */
exports.templateSrc = '';

/**
 * Output directory
 * @type {string}
 */
exports.outputDirectory = '';

/**
 * Name of the ADC
 * @type {string}
 */
exports.adcName = '';

/**
 * Name of the template to use
 * @type {string}
 */
exports.template = common.DEFAULT_TEMPLATE_NAME;

// Sequence of calls
var sequence = new common.Sequence([
    verifyOutputDirExist,
    verifyADCDirNotalreadyExist,
    copyFromTemplate,
    updateConfigFile
], done);


/**
 * Generate a new ADC structure
 *
 * @param {Command} program Commander object which hold the arguments pass to the program
 * @param {String} name Name of the ADC to generate
 */
exports.generate = function generate(program, name) {
    if (!name) {
        done(new Error(errMsg.missingNameArgument));
        return;
    }

    if (!/^([a-z0-9_ .-]+)$/gi.test(name)) {
        done(new Error(errMsg.incorrectADCName));
        return;
    }

    exports.adcName = name;
    exports.outputDirectory = (program && program.output) || process.cwd();
    exports.template = (program && program.template) || common.DEFAULT_TEMPLATE_NAME;

    if (!exports.outputDirectory) {
        done(new Error(errMsg.missingOutputArgument));
        return;
    }


    exports.templateSrc = exports.rootdir + common.TEMPLATES_PATH + exports.template;
    common.dirExists(exports.templateSrc, function verifyTemplatePath(err, exist) {
       if (err || !exist) {
           return done(new Error(format(errMsg.cannotFoundTemplate, exports.template)));
       }
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
    common.getDirStructure(exports.outputDirectory, function getDirStructure(err, structure) {
        if (err) {
            return common.writeError(err.message);
        }
        var level = 0,
            s     = [];

        function indent(text) {
            var str = '|--';
            for (var i = 0; i < level; i++) {
                str += '|--';
            }
            str += ' ' + text;
            return str;
        }

        structure.forEach(function write(o) {
            if (typeof o === 'string') {
                s.push(indent(o));
            } else {
                s.push(indent(o.name) + '\\');
                level++;
                if (o.sub) {
                    o.sub.forEach(write);
                }
                level--;
            }
        });

        s = s.join('\r\n');
        return common.writeSuccess(successMsg.adcStructureGenerated, s, exports.adcName, exports.outputDirectory.replace(/\\/g, '/'));
    });
}

/**
 * Verify that the output directory
 */
function verifyOutputDirExist() {
    // Validate the existence of the specify the output directory
    common.dirExists(exports.outputDirectory, function outputDirExist(err, exists) {
        if (!exists || err) {
            return sequence.resume(new Error(format(errMsg.noSuchFileOrDirectory, exports.outputDirectory)));
        }
        if (exports.outputDirectory.substr(-1, 1) !== '/' || exports.outputDirectory.substr(-1, 1) !== '\\') {
            exports.outputDirectory += '/';
        }
        exports.outputDirectory += exports.adcName + '/';
        return sequence.resume();
    });
}

/**
 * Verify that the ADC directory doesn't exist
 */
function verifyADCDirNotalreadyExist() {
    common.dirExists(exports.outputDirectory, function adcDirExist(err, exists) {
        if (exists && !err) {
            return sequence.resume(new Error(format(errMsg.directoryAlreadyExist, exports.outputDirectory)));
        }
        return sequence.resume();
    });
}

/**
 * Copy an ADC structure from the template
 */
function copyFromTemplate() {
    wrench.copyDirRecursive(exports.templateSrc, exports.outputDirectory, {
        forceDelete       : false,
        excludeHiddenUnix : true,
        preserveFiles     : true
    }, function copyDirRecursive(err) {
        sequence.resume(err);
    });
}

/**
 * Update the config file with the name of the ADC, the GUID and the creation date
 */
function updateConfigFile() {
    var configFilePath = exports.outputDirectory + common.CONFIG_FILE_NAME;
    fs.readFile(configFilePath, 'utf8', function readConfigXMLFile(err, data) {
        if (err) {
            sequence.resume(err);
            return;
        }

        var result = data;

        result = result.replace(/\{\{ADCName\}\}/gi, exports.adcName);
        result = result.replace(/\{\{ADCGuid\}\}/gi, uuid.v4());
        result = result.replace(/2000-01-01/, common.formatXmlDate());
        result = result.replace('\ufeff', ''); // Remove the BOM characters (Marker of the UTF-8 in the string)

        fs.writeFile(configFilePath, result, function writeFileCallback(err) {
            return sequence.resume(err);
        });
    });
}


