var fs = require('fs');
var path = require('path');


/* Rename the AskCmn32.dll if the arch is not x64 */
if (process.arch !== 'x64') {
    fs.unlink('./lib/adxshell/AskCmn.dll', function () {
        fs.rename('./lib/adxshell/AskCmn32.dll', './lib/adxshell/AskCmn.dll');
    });
    fs.unlink('./lib/adxshell/AskCmn.pdb', function () {
        fs.rename('./lib/adxshell/AskCmn32.pdb', './lib/adxshell/AskCmn.pdb');
    });
}
