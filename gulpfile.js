"use strict";

/*
 1. Creates a documentation
 */


var gulp        = require('gulp'),
    del         = require('del'),
    shell       = require('gulp-shell');

// Destination files
var DEST_DOCS            = 'docs/';

// Source files
var SRC                 = 'app/';

// Default task
gulp.task('default', ['clean', 'document']);

// Global cleaning
gulp.task('clean', ['clean:docs']);

// Cleanup the documentation folder
gulp.task('clean:docs', function (cb) {
    del([DEST_DOCS + '**/*'], cb);
});

// Document
gulp.task('document', ['clean:docs'], function (cb) {
    var args = [
        '--title=ADCUtil',
        '--output=' + DEST_DOCS,
        SRC + 'builder/ADCBuilder.js',
        SRC + 'configurator/ADCConfigurator.js',
        SRC + 'generator/ADCGenerator.js',
        SRC + 'show/ADCShow.js',
        SRC + 'validator/ADCValidator.js',
        SRC + 'ADCUtilAPI.js'
    ];

    var execFile = require('child_process').execFile;
    execFile('jsduck', args, {
        cwd   : process.cwd,
        env   : process.env
    }, function callback(err, stdout, stderr) {

        if (stderr) {
            console.warn(stderr);
        } else {
            console.log(stdout);
        }
        cb(err);
    });

    /*shell.task([
        'jsduck --title "ADCUtil" --output "' + DEST_DOCS + '" ' + files.join(' ')
    ]);*/
    // cb();
});

