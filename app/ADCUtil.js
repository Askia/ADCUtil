var Command = require('../node_modules/commander').Command;
var program = new Command();

program
    .version('0.0.1')
    .option('-o, --output <name>', 'name of the output to display or path to the output directory for the generation')
    .option('-f, --fixture <name>', 'name of the fixture to use for the `show` command')
    // .option('-f, --force', 'overwrite the output directory when it exist')
    .option('-T, --no-test', 'skip the execution of ADC unit tests')
    .option('-X, --no-xml', 'skip the validation of the config.xml file')
    .option('-A, --no-autoTest', 'skip the execution of the auto-generated unit tests')
    .option('-t, --template <name>', 'name of the template to use to generate the ADC');


program
    .command('generate <name>')
    .description('generate a new ADC structure')
    .action(function generateADC(name) {
        var adcGenerator = require('./generator/ADCGenerator.js');
        adcGenerator.generate(program, name);
    });

program
    .command('validate [<path>]')
    .description('validate the uncompressed ADC structure')
    .action(function validateADC(path) {
        var adcValidator = require('./validator/ADCValidator.js');
        adcValidator.validate(program, path);
    });

program
    .command('build [<path>]')
    .description('build the ADC file')
    .action(function buildADC(path) {
        var adcBuilder = require('./builder/ADCBuilder.js');
        adcBuilder.build(program, path);
    });

program
    .command('show [<path>]')
    .description('show the output of the ADC')
    .action(function showADC(output, fixture, path) {
        var adcShow = require('./show/ADCShow.js');
        adcShow.show(program, path);
    });

program.parse(process.argv);