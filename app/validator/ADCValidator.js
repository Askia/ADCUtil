/*

ASP Classic
 asp

ASP.NET
 aspx
 axd
 asx
 asmx
 ashx
 axd
 ascx

CSS
 css
 hss
 sass
 less
 ccss
 pcss

Coldfusion
 cfm

Erlang
 yaws

Flash
 swf

HTML
 html
 htm
 xhtml
 jhtml

Java
 jsp
 jspx
 wss
 do
 action

JavaScript
 js

Perl
 pl

PHP
 php
 php4
 php3
 phtml

Python
 py

Ruby
 rb
 rhtml
 rjs
 erb

XML
 xml
 rss
 atom
 svg

Other (C, perl etc.)
 cgi
 dll

Executable
 Extension	Format	                                    Operating System(s)
 ACTION	    Automator Action	                        Mac OS
 APK	    Application	                                Android
 APP	    Executable	                                Mac OS
 BAT	    Batch File	                                Windows
 BIN	    Binary Executable	                        Windows, Mac OS, Linux
 CMD	    Command Script	                            Windows
 COM	    Command File	                            Windows
 COMMAND	Terminal Command	                        Mac OS
 CPL	    Control Panel Extension	                    Windows
 CSH	    C Shell Script	                            Mac OS, Linux
 EXE	    Executable	                                Windows
 GADGET	    Windows Gadget	                            Windows
 INF1	    Setup Information File	                    Windows
 INS	    Internet Communication Settings	            Windows
 INX	    InstallShield Compiled Script	            Windows
 IPA	    Application	                                iOS
 ISU	    InstallShield Uninstaller Script	        Windows
 JOB	    Windows Task Scheduler Job File	            Windows
 JSE	    JScript Encoded File	                    Windows
 KSH	    Unix Korn Shell Script	                    Linux
 LNK	    File Shortcut	                            Windows
 MSC	    Microsoft Common Console Document	        Windows
 MSI	    Windows Installer Package	                Windows
 MSP	    Windows Installer Patch	                    Windows
 MST	    Windows Installer Setup Transform File	    Windows
 OSX	    Executable	                                Mac OS
 OUT	    Executable	                                Linux
 PAF	    Portable Application Installer File	        Windows
 PIF	    Program Information File	                Windows
 PRG	    Executable	                                GEM
 PS1	    Windows PowerShell Cmdlet	                Windows
 REG	    Registry Data File	                        Windows
 RGS	    Registry Script	                            Windows
 RUN	    Executable	                                Linux
 SCT	    Windows Scriptlet	                        Windows
 SHB	    Windows Document Shortcut	                Windows
 SHS	    Shell Scrap Object	                        Windows
 U3P	    U3 Smart Application	                    Windows
 VB	        VBScript File	                            Windows
 VBE	    VBScript Encoded Script	                    Windows
 VBS	    VBScript File	                            Windows
 VBSCRIPT	Visual Basic Script	                        Windows
 WORKFLOW	Automator Workflow	                        Mac OS
 WS	        Windows Script	                            Windows
 WSF	    Windows Script                              Windows


 Audio File Types and Formats
 .aif	Audio Interchange File Format
 .iff	Interchange File Format
 .m3u	Media Playlist File
 .m4a	MPEG-4 Audio File
 .mid	MIDI File
 .mp3	MP3 Audio File
 .mpa	MPEG-2 Audio File
 .ra	Real Audio File
 .wav	WAVE Audio File
 .wma	Windows Media Audio File
  AddType audio/ogg ogg
 AddType audio/ogg oga
 AddType audio/webm webma



 Video Files Types and Formats
 .3g2	3GPP2 Multimedia File
 .3gp	3GPP Multimedia File
 .asf	Advanced Systems Format File
 .asx	Microsoft ASF Redirector File
 .avi	Audio Video Interleave File
 .flv	Flash Video File
 .mov	Apple QuickTime Movie
 .mp4	MPEG-4 Video File
 .mpg	MPEG Video File
 .rm	Real Media File
 .swf	Shockwave Flash Movie
 .vob	DVD Video Object File
 .wmv	Windows Media Video File

white
xml|rss|atom|svg|js|xhtml|htm|html|swf|css|hss|sass|less|ccss|pcss|txt|csv|json|
gif|jpeg|jpg|tif|tiff|png|bmp|pdf|ico|cur|
aif|iff|m4a|mid|mp3|mpa|ra|wav|wma|ogg|oga|webma|
3g2|3gp|avi|flv|mov|mp4|mpg|rm|wmv|webm


black
cgi|dll|erb|rjs|rhtml|rb|py|phtml|php3|php4|php|pl|action|do|wss|jspx|jsp|jhtml|yaws|cfm|aspx|axd|asx|asmx|ashx|axd|ascx|asp|config|
action|apk|app|bat|bin|cmd|com|command|cpl|csh|exe|gadget|inf1|ins|inx|ipa|isu|
job|jse|ksh|lnk|msc|msi|msp|mst|ocx|osx|out|paf|pif|prg|ps1|reg|rgs|run|sct|shb|shs|u3p|
vb|vbe|vbs|vbscript|workflow|ws|wsf|cs|cpp|
zip|rar|sql|ini|dmg|iso|vcd|class|java|htaccess


*/
        /**
         * Stack of validators
         */
    var validators = {
            'validatePathArg'               : validatePathArg,
            'validateADCDirectoryStructure' : validateADCDirectoryStructure,
            'validateFileExtensions'        : validateFileExtensions,
            'validateXMLAgainstXSD'         : validateXMLAgainstXSD,
            'initConfigXMLDoc'              : initConfigXMLDoc,
            'validateADCInfo'               : validateADCInfo,
            'validateADCInfoConstraints'    : validateADCInfoConstraints,
            'validateADCOutputs'            : validateADCOutputs,
            'validateADCProperties'         : validateADCProperties,
            'runADCUnitTests'               : runADCUnitTests,
            'runAutoTests'                  : runAutoTests,
            current  : -1,
            sequence : [
                'validatePathArg',
                'validateADCDirectoryStructure',
                'validateFileExtensions',
                'validateXMLAgainstXSD',
                'initConfigXMLDoc',
                'validateADCInfo',
                'validateADCInfoConstraints',
                'validateADCOutputs',
                'validateADCProperties',
                'runAutoTests',
                'runADCUnitTests'
            ]
        },

        /**
         * Filesystem
         */
        fs = require('fs'),

        /**
         * Path helper
         */
        pathHelper = require('path'),

        /**
         * Parse xml
         */
        xml2js = require('xml2js'),

        /**
         * Util
         */
        util   = require('util'),

        /**
         * cli-color
         */
        clc      = require('cli-color'),

        /**
         * Common
         */
        common = require('../common/common.js'),

        // Error messages
        errMsg = common.messages.error,

        // Warning messages
        warnMsg = common.messages.warning,

        // Success messages
        successMsg = common.messages.success,

        // Regular messages
        msg     = common.messages.message,

        /**
         * Test the file extension
         */
        fileExt         = {
            blacklist : /\.(cgi|dll|erb|rjs|rhtml|rb|py|phtml|php3|php4|php|pl|action|do|wss|jspx|jsp|jhtml|yaws|cfm|aspx|axd|asx|asmx|ashx|axd|ascx|asp|config|action|apk|app|bat|bin|cmd|com|command|cpl|csh|exe|gadget|inf1|ins|inx|ipa|isu|job|jse|ksh|lnk|msc|msi|msp|mst|ocx|osx|out|paf|pif|prg|ps1|reg|rgs|run|sct|shb|shs|u3p|vb|vbe|vbs|vbscript|workflow|ws|wsf|cs|cpp|zip|rar|sql|ini|dmg|iso|vcd|class|java|htaccess)$/gi,
            whitelist : /\.(xml|rss|atom|svg|js|xhtml|htm|html|swf|css|hss|sass|less|ccss|pcss|txt|csv|json|gif|jpeg|jpg|tif|tiff|png|bmp|pdf|ico|cur|aif|iff|m4a|mid|mp3|mpa|ra|wav|wma|ogg|oga|webma|3g2|3gp|avi|flv|mov|mp4|mpg|rm|wmv|ogv|webm)$/gi
        },

        /**
         * Hash with all content type
         */
        contentType      = {
            'text'      : 'text',
            'html'      : 'text',
            'javascript': 'text',
            'css'       : 'text',
            'binary'    : 'binary',
            'image'     : 'binary',
            'video'     : 'binary',
            'audio'     : 'binary',
            'flash'     : 'binary'
        },

        /**
         * Hash with the rule of the <attribute> node in the <content>
         * Indicates if the attribute is overridable or not
         * true for not-overridable
         */
        contentSealAttr = {
            'javascript' : {
                'src'  : true,
                'type' : false
            },
            'css'       : {
                'href' : true,
                'rel'  : false
            },
            'image'     : {
                'src'   : true,
                'alt'   : false
            },
            'video'     : {
                'src'   : true
            },
            'audio'     : {
                'src'   : true
            }
        },

        /**
         * Hash with the rule of the constraint attribute node.
         */
        constraintAttributeRules = {
            questions : ['chapter', 'single', 'multiple', 'open', 'numeric', 'date', 'requireParentLoop'],
            responses : ['min', 'max'],
            controls  : ['label', 'textbox', 'listbox', 'radiobutton', 'responseblock']
        },

        /**
         *  Callback function to call at the end of the validation
         */
        validationCallback;

    exports = module.exports;

    exports.rootdir    = pathHelper.resolve(__dirname, "../../");
    exports.adcName    = '';
    exports.adcDirectoryPath = '';
    exports.validate   = validate;
    exports.validators = validators;
    exports.resume     = resume;

    exports.report     = {
        startTime : null,
        endTime   : null,
        runs      : 0,
        total     : 0,
        success   : 0,
        warnings  : 0,
        errors    : 0
    };

    /**
     * Map all files in the resources directory
     */
    exports.dirResources  = {
        isExist  : false,
        dynamic  : {
            isExist : false
        },
        statics  : {
            isExist : false
        },
        share   : {
            isExist : false
        }
    };

    /**
     * Config xml document in json format
     */
    exports.configXmlDoc  = null;

    /**
     * Fix path to windows path with \ instead of /
     * And surround with quotes if there is a space
     *
     * @param {String} path
     * @returns {String}
     */
    function fixPath(path) {
        if (path.indexOf(" ") !== -1) {
            path = '"' + path + '"';
        }
        return path.replace(/\//g, "\\");
    }

    /**
     * Build a new error messag
     * @param {String} message Error message
     * @return {Error} New error
     */
    function newError(message) {
       return new Error(util.format.apply(null, arguments));
    }

    /**
     * Remove the specified validators on the validators sequence
     *
     * @param {Array} vals Validators to remove
     */
    function removeOnSequence(vals) {
        var sequence = exports.validators.sequence,
            index;

        vals.forEach(function (value) {
            index = sequence.indexOf(value);
            if (index !== -1) {
                sequence.splice(index, 1);
            }
        });
    }

    /**
     * Validate an ADC
     *
     * @param {Command} program Commander object which hold the arguments pass to the program
     * @param {String} path Path to the ADC directory
     * @param {Function} callback Callback function to run at the end it take a single Error argument
     */
    function validate(program, path, callback) {
        exports.report.startTime  = new Date().getTime();

        path = path || process.cwd();
        validationCallback = callback;

        if (path.substr(-1, 1) !== '/' || path.substr(-1, 1) !== '\\') {
            path += '/';
            path = path.replace('//', '/');
        }

        exports.adcDirectoryPath = path;

        // Validate according to the program options
        if (program) {

            // --no-autoTest
            if (!program.autoTest) {
                removeOnSequence(['runAutoTests']);
            }

            // --no-test
            if (!program.test) {
                removeOnSequence(['runADCUnitTests']);
            }

            // --no-xml
            if (!program.xml) {
                removeOnSequence([
                    'validateXMLAgainstXSD',
                    'initConfigXMLDoc',
                    'validateADCInfo',
                    'validateADCInfoConstraints',
                    'validateADCOutputs',
                    'validateADCProperties'
                ]);
            }

        }

        exports.report.total = exports.validators.sequence.length;

        resume(null);
    }

    /**
     * Summarize the unit test
     *
     * @param {Error} [err] Last error
     */
    function done(err) {
        exports.report.endTime = new Date().getTime();
        var executionTime = exports.report.endTime - exports.report.startTime,
            report        = exports.report,
            color         = report.errors ? clc.red.bold : ((report.warnings) ? clc.yellowBright : clc.greenBright);

        if (err) {
            common.writeError(err.message);
        }

        // Write the summary
        common.writeMessage(msg.validationFinishedIn, executionTime);
        common.writeMessage(color(util.format(msg.validationReport, report.runs, report.total, report.success, report.warnings, report.errors)));

        if (typeof validationCallback === 'function') {
            validationCallback(err);
        }
    }

    /**
     * Execute the next validation
     *
     * @param {Error|void} err Error which occured during the previous validation
     */
    function resume(err) {
        if (err) {
            // Mark the error
            exports.report.errors++;
            done(err);
            return;
        }

        // Mark the success
        if (validators.current !== -1 && validators[validators.sequence[validators.current]])  {
            exports.report.success++;
        }

        validators.current++;
        if (validators.current >= validators.sequence.length) {
            done(err);
            return;
        }

        // Search the next validators (recursive call)
        var validatorName = validators.sequence[validators.current];
        if (!validators[validatorName]) {
            resume(null);
            return;
        }

        // Execute the find validator
        // Mark the runs
        exports.report.runs++;
        validators[validatorName]();
    }

    /**
     * Validate that the `path` argument is correct
     */
    function validatePathArg() {
        if (!exports.adcDirectoryPath) {
            resume(newError(errMsg.missingArgPath));
            return;
        }

        // Validate the existence of the specify ADC directory
        common.dirExists(exports.adcDirectoryPath, function verifyADCDirectory(err, exists) {
            var er;
            if (!exists) {
                er = newError(errMsg.noSuchFileOrDirectory, fixPath(exports.adcDirectoryPath));
            }
            resume(er);
        });
    }

    /**
     * Validate the structure of the ADC directory
     */
    function validateADCDirectoryStructure() {
        // Verify if the config.xml exists
        fs.exists(exports.adcDirectoryPath + common.CONFIG_FILE_NAME, function verifyConfigFileExist(exists) {
            var resourcesPath = exports.adcDirectoryPath + common.RESOURCES_DIR_NAME + '/',
                dirResources  = exports.dirResources;

            // Check  the resources directory
            function loadResources() {
                common.dirExists(resourcesPath, function initResourcesFileMap(er, find) {
                    if (!find) {
                        resume(null);
                        return;
                    }
                    dirResources.isExist = true;
                    loadDynamic();
                });
            }

            // Check the dynamic directory
            function loadDynamic() {
                common.dirExists(resourcesPath + common.DYNAMIC_DIR_NAME, function initDynamicFileMap(er, find) {
                    var dirDynamic = dirResources.dynamic;
                    dirDynamic.isExist = find;
                    if (find) {
                        try {
                            var files = fs.readdirSync(resourcesPath + common.DYNAMIC_DIR_NAME);
                            files.forEach(function (file) {
                                if (common.isIgnoreFile(file)) {
                                    return;
                                }
                                dirDynamic[file.toLocaleLowerCase()] = file;
                            })
                        } catch (ex) {
                            // Do nothing
                        }
                    }
                    loadStatic();
                });
            }

            // Check the static directory
            function loadStatic(){
                common.dirExists(resourcesPath + common.STATIC_DIR_NAME, function initStaticFileMap(er, find) {
                    var dirStatic = dirResources.statics;
                    dirStatic.isExist = find;
                    if (find) {
                        try {
                            var files = fs.readdirSync(resourcesPath + common.STATIC_DIR_NAME);
                            files.forEach(function (file) {
                                if (common.isIgnoreFile(file)) {
                                    return;
                                }
                                dirStatic[file.toLocaleLowerCase()] = file;
                            })
                        } catch (ex) {
                            // Do nothing
                        }
                    }

                    loadShare();
                });
            }

            // Check the share directory and resume the validation
            function loadShare() {
                common.dirExists(resourcesPath + common.SHARE_DIR_NAME, function initShareFileMap(er, find) {
                    var dirShare = dirResources.share;
                    dirShare.isExist = find;
                    if (find) {
                        try {
                            var files = fs.readdirSync(resourcesPath + common.SHARE_DIR_NAME);
                            files.forEach(function (file) {
                                if (common.isIgnoreFile(file)) {
                                    return;
                                }
                                dirShare[file.toLocaleLowerCase()] = file;
                            })
                        } catch (ex) {
                            // Do nothing
                        }
                    }

                    resume(null);
                });
            }


            if (!exists) {
                resume(newError(errMsg.noConfigFile));
            } else {
                common.writeSuccess(successMsg.directoryStructureValidate);
                loadResources();
            }
        });
    }

    /**
     * Validate all file extension against the while list and the black list
     */
    function validateFileExtensions() {
        var dirResources = exports.dirResources,
            dir   = [dirResources.dynamic, dirResources.statics, dirResources.share],
            current, i, l, key, match;

        if (!dirResources.isExist) {
            resume(null);
        }

        for (i = 0, l = dir.length; i < l; i++) {
            current = dir[i];
            if (current.isExist) {
                for (key in current) {
                    if (current.hasOwnProperty(key) && key !== 'isExist') {
                        // Test against the black list
                        match = key.toString().match(fileExt.blacklist);
                        if (match) {
                            resume(newError(errMsg.fileExtensionForbidden, match[0]));
                            return;
                        }

                        // Test against the white list
                        match = key.toString().match(fileExt.whitelist);
                        if (!match) {
                            exports.report.warnings++;
                            common.writeWarning(warnMsg.untrustExtension, key);
                        }
                    }
                }
            }
        }

        common.writeSuccess(successMsg.fileExtensionValidate);
        resume(null);
    }

    /**
     * Validate the config.xml file of the ADC against the XSD schema
     */
    function validateXMLAgainstXSD() {
        var exec        = require('child_process').exec,
            xmlLintPath = exports.rootdir + common.XML_LINT_PATH,
            xmlSchemaPath = exports.rootdir + common.SCHEMA_PATH + common.SCHEMA_CONFIG ,
            xmlPath     = exports.adcDirectoryPath + common.CONFIG_FILE_NAME,

            commandLine = fixPath(xmlLintPath) + ' --noout --schema ' + fixPath(xmlSchemaPath) + ' ' + fixPath(xmlPath);

        exec(commandLine, function callback(err) {
            if (!err) {
                exports.report.success++;
                common.writeSuccess(successMsg.xsdValidate);
            }
            resume(err);
        });
    }

    /**
     * Initialize the XMLDoc using the config.xml
     */
    function initConfigXMLDoc() {
        fs.readFile(exports.adcDirectoryPath + common.CONFIG_FILE_NAME, 'utf8', function readConfigXMLFile(err, data) {
            if (err) {
                resume(err);
                return;
            }
            // Remove the BOM characters in UTF-8 string
            data = data.replace(/^\uFEFF/, '');
            xml2js.parseString(data, function parseXML(err, result) {
                exports.configXmlDoc = result;
                resume(err);
            });
        });
    }

    /**
     * Validate the info of the ADC config file
     */
    function validateADCInfo() {
        var infosEl = exports.configXmlDoc.control.info && exports.configXmlDoc.control.info[0],
            nameEl  = infosEl && infosEl.name && infosEl.name[0];

        if (!infosEl) {
            resume(newError(errMsg.missingInfoNode));
            return;
        }

        if (!nameEl) {
            resume(newError(errMsg.missingOrEmptyNameNode));
            return;
        }

        exports.adcName = nameEl;
        resume(null);
    }

    /**
     * Validate the info/constraints of the ADC config file
     */
    function validateADCInfoConstraints() {
        var constraintsEl           = exports.configXmlDoc.control.info[0].constraints[0],
            constraints             = constraintsEl.constraint || [],
            constraintsOn           = {
               questions : 0,
               responses : 0,
               controls  : 0
            }, attr, i, l, key, hasRule = false;

        for (i = 0, l = constraints.length; i < l; i++) {
            hasRule = false;
            attr = constraints[i].$ || {};
            if (!attr.on) {
                continue;
            }

            // Validate the duplicate constraints
            constraintsOn[attr.on]++;
            if (constraintsOn[attr.on] > 1) {
                resume(newError(errMsg.duplicateConstraints, attr.on));
                return;
            }

            // Validate the attribute logic
            for (key in attr) {
                if (attr.hasOwnProperty(key) && key !== 'on') {
                    if (constraintAttributeRules[attr.on].indexOf(key) === -1) {
                        resume(newError(errMsg.invalidConstraintAttribute, attr.on, key));
                        return;
                    }
                    if (key !== 'min' && key !== 'max') {
                        if (attr[key] == '1' || attr[key] == 'true') {
                            hasRule = true;
                        }
                    } else {
                        hasRule = true;
                    }
                }
            }

            // No rule specified
            if (!hasRule) {
                resume(newError(errMsg.noRuleOnConstraint, attr.on));
                return;
            }
        }

        if (!constraintsOn.questions) {
            resume(newError(errMsg.requireConstraintOn, 'questions'));
            return;
        }

        if (!constraintsOn.controls) {
            resume(newError(errMsg.requireConstraintOn, 'controls'));
            return;
        }

        resume(null);
    }

    /**
     * Validate the outputs of the ADC config file
     */
    function validateADCOutputs() {
        var outputsEl               = exports.configXmlDoc.control.outputs[0],
            outputs                 = outputsEl.output,
            conditions              = {},
            outputsEmptyCondition   = [],
            htmlFallBackCount       = 0,
            lastOutput,
            defaultGeneration, i, l, output, id, condition, err;

        for (i = 0, l = outputs.length; i < l; i++) {
            output      = outputs[i];
            id          = output.$.id;
            condition   = output.condition && output.condition[0];
            defaultGeneration = output.$.defaultGeneration || false;

            if (!condition) {
                outputsEmptyCondition.push(id);
            }
            if (condition && conditions[condition]) {
                exports.report.warnings++;
                common.writeWarning(warnMsg.duplicateOutputCondition, conditions[condition], id);
            }

            conditions[condition] = id;
            lastOutput = {
                id                : id,
                defaultGeneration : defaultGeneration,
                contents          : output.content || [],
                condition         : condition,
                dynamicContentCount     : 0,
                javascriptContentCount  : 0,
                flashContentCount       : 0
            };

            err = validateADCContents(lastOutput);

            if (defaultGeneration || !lastOutput.javascriptContentCount) {
                htmlFallBackCount++;
            }

            if (err) {
                resume(err);
                return;
            }
        }

        if (outputsEmptyCondition.length > 1) {
            err = newError(errMsg.tooManyEmptyCondition, outputsEmptyCondition.join(", "));
        }

        if (!htmlFallBackCount) {
            exports.report.warnings++;
            common.writeWarning(warnMsg.noHTMLFallBack);
        }

        if (!err) {
            common.writeSuccess(successMsg.xmlOutputsValidate);
        }
        resume(err);
    }

    /**
     * Validate the contents of an ADC output
     *
     * @param {Object} output Helper output object
     * @return {Error|void} Return the error or null when no error.
     */
    function validateADCContents(output) {
        var contents = output.contents,
            i, l,
            err = null,
            condition = output.condition || "";

        if (contents.length && !exports.dirResources.isExist) {
            return newError(errMsg.noResourcesDirectory);
        }

        for (i = 0, l = contents.length; i < l; i++) {
            err = validateADCContent(output, contents[i]);
            if (err) {
                return err;
            }
        }

        if (!output.defaultGeneration && !output.dynamicContentCount) {
            return newError(errMsg.dynamicFileRequire, output.id);
        }

        if (!output.defaultGeneration && output.javascriptContentCount && !/browser\.support\("javascript"\)/gi.test(condition)) {
            exports.report.warnings++;
            common.writeWarning(warnMsg.javascriptUseWithoutBrowserCheck, output.id);
        }

        if (!output.defaultGeneration && output.flashContentCount  && !/browser\.support\("flash"\)/gi.test(condition)) {
            exports.report.warnings++;
            common.writeWarning(warnMsg.flashUseWithoutBrowserCheck, output.id);
        }

        return err;
    }

    /**
     * Validate the content of an ADC output
     *
     * @param {Object} output Helper output object
     * @param {Object} content Content node
     * @return {Error|void} Return the error or null when no error.
     */
    function validateADCContent(output, content) {
        var atts        = content.$,
            type        = atts.type,
            position    = atts.position,
            mode        = atts.mode,
            key         = (mode !== 'static') ? mode : 'statics',
            fileName    = atts.fileName,
            yieldNode   = content['yield'] || [],
            dirResources = exports.dirResources;

        // Missing directory
        if (!dirResources[key].isExist) {
            return newError(errMsg.cannotFindDirectory, mode);
        }

        // Missing file
        if (!dirResources[key][fileName.toLocaleLowerCase()]) {
            return newError(errMsg.cannotFindFileInDirectory, output.id, fileName, mode);
        }

        // A binary file could not be dynamic
        if (mode === 'dynamic' && contentType[type] === 'binary') {
            return newError(errMsg.typeCouldNotBeDynamic, output.id, type, fileName);
        }

        // A binary file require a 'yield' node or 'position=none'
        if (type === 'binary' && position !== 'none' && !yieldNode.length) {
            return newError(errMsg.yieldRequireForBinary, output.id, fileName);
        }

        // Increment the information about the dynamic content
        if (position !== 'none' && mode === 'dynamic' && (type === 'javascript' || type === 'html')) {
            output.dynamicContentCount++;
        }

        // Increment the information about the javascript content
        if (type === 'javascript') {
            output.javascriptContentCount++;
        }

        // Increment the information about the flash content
        if (type === 'flash') {
            output.flashContentCount++;
        }

        // Validate attribute
        return validateADCContentAttribute(output, content);
    }

    /**
     * Validate the attribute tag of the content node
     *
     * @param {Object} output Helper output object
     * @param {Object} content Content node
     * @return {Error|void} Return error or null when no error
     */
    function validateADCContentAttribute(output, content) {
        if (!content.attribute || !content.attribute.length) {
            return null;
        }

        var atts        = content.$,
            type        = atts.type,
            mode        = atts.mode,
            fileName    = atts.fileName,
            attributes  = content.attribute,
            attribute,
            attName,
            attMap      = {},
            i, l;

        // Attribute nodes are ignored for the following type
        if (/(text|binary|html|flash)/.test(type)) {
            exports.report.warnings++;
            common.writeWarning(warnMsg.attributeNodeWillBeIgnored, output.id, type, fileName);
        }

        // Attribute nodes are ignored for dynamic mode
        if (mode === 'dynamic') {
            exports.report.warnings++;
            common.writeWarning(warnMsg.attributeNodeAndDynamicContent, output.id, fileName);
        }

        // Attribute nodes are ignored with yield
        if (content['yield'] && content['yield'].length) {
            exports.report.warnings++;
            common.writeWarning(warnMsg.attributeNodeAndYieldNode, output.id, fileName);
        }

        for (i = 0, l = attributes.length; i < l; i++) {
            attribute = attributes[i];
            attName     = (attribute.$ && attribute.$.name && attribute.$.name.toLocaleLowerCase()) || '';

            if (contentSealAttr[type] && contentSealAttr[type][attName]) {
                return newError(errMsg.attributeNotOverridable, output.id, attName, fileName);
            }
            if (attMap[attName]) {
                return newError(errMsg.duplicateAttributeNode, output.id, attName, fileName);
            }
            if (attName) {
                attMap[attName] = attName;
            }
        }

        return null;
    }

    /**
     * Validate the ADC properties node
     */
    function validateADCProperties() {
        var propertiesEl           = (exports.configXmlDoc.control.properties && exports.configXmlDoc.control.properties[0]) || {},
            categories             = propertiesEl.category || [],
            properties             = propertiesEl.property || [];

        if (!properties.length && !categories.length) {
            exports.report.warnings++;
            common.writeWarning(warnMsg.noProperties);
        }

        resume(null);
    }

    /**
     * Run the ADC Unit tests process with specify arguments
     * @param {Array} args
     * @param {String} message
     */
    function runTests(args, message) {
        // Validate the existence of the specify unit test directory
        common.dirExists(exports.adcDirectoryPath + common.UNIT_TEST_DIR_PATH, function verifyUnitTestDirectory(err, exists) {
            if (!exists) {
                exports.report.warnings++;
                common.writeWarning(warnMsg.noUnitTests);
                resume(null);
                return ;
            }

            var execFile = require('child_process').execFile;
            execFile('.\\' + common.ADC_UNIT_PROCESS_NAME, args, {
                cwd   : exports.rootdir + common.ADC_UNIT_DIR_PATH,
                env   : process.env
            }, function callback(err, stdout, stderr) {
                common.writeMessage(message);
                if (stderr) {
                    exports.report.warnings++;
                    common.writeWarning("\r\n" + stderr);
                    common.writeMessage(stdout);
                } else {
                    common.writeMessage(stdout);
                    common.writeSuccess(successMsg.adcUnitSucceed);
                }
                resume(null);
            });
        });
    }

    /**
     * Run the ADC unit tests auto-generated
     */
    function runAutoTests() {
        runTests(['--auto', exports.adcDirectoryPath], msg.runningAutoUnit);
    }

    /**
     * Run the ADC unit tests
     */
    function runADCUnitTests() {
        runTests([exports.adcDirectoryPath], msg.runningADCUnit);
    }