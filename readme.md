# ADCUtil

This utilities is use to facilitate the creation and the packaging of and ADC project.

It contains validators and allow to display outputs of the ADC using the ADCEngine. 

ADCUtil is a CLI tools (Command Line Interface) but it also provide an API for NodeJS project. 

## Setup

Install NodeJs: https://nodejs.org/download/

Then install the npm package adcutil:
 
    npm install -g adcutil


## Run unit tests of ADCUtil

Install jasmine-node for unit tests

    npm install jasmine-node -g
    
Then run

    jasmine-node spec/

or

    npm test
    

## CLI Usage

This application works through Windows PowerShell


    adcutil [options] [command]

    Commands:

    generate <name>        generate a new ADC structure
    validate [<path>]      validate the uncompressed ADC structure
    build [<path>]         build the ADC file
    show [<path>]          show the output of the ADC

    Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -o, --output <name>      name of the output to display or path to the output directory for the generation
    -f, --fixture <name>     name of the fixture to use for the `show` command
    -m, --masterPage <path>  path of the master page to use for the `show` command'
    -p, --properties <props> ADC properties (in url query string format) to set for the `show` command'
    -T, --no-test            skip the execution of ADC unit tests
    -X, --no-xml             skip the validation of the config.xml file
    -A, --no-autoTest        skip the execution of the auto-generated unit tests
    -t, --template <name>    name of the template to use to generate the ADC
    

## API Usage

Please find the [full API documentation here](http://www.askia.com/Downloads/dev/docs/ADCUtil/index.html)

Example of usage of existing ADC

    var ADC = require('adcutil').ADC;
    
    var myAdc = new ADC('path/to/adc/dir');
        
    // Validate an ADC
    myAdc.validate({test : false, autoTest : false}, function (err, report) {
        // Callback when the ADC structure has been validated
    });
    
    // Show the output of an ADC
    myAdc.show({ output : 'fallback', fixture : 'single.xml'  },  function (err, output) {
        // Callback with the output of the ADC
    });
    
    // Build the ADC (package it)
    myAdc.build({test : false, autoTest : false}, function (err, path, report) {
        // Callback when the ADC has been built 
    });
    

Generate and use the new ADC instance
    
    ADC.generate('myNewADC', {output : '/path/of/parent/dir', template : 'blank'}, function (err, adc) {
        console.log(adc.path);
        adc.load(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(adc.configurator.info.get());
        });
    });
    



