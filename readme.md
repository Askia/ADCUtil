# ADCUtil


## Usage

This application works through Windows PowerShell


    adcutil [options] [command]

    Commands:

    generate <name>        generate a new ADC structure
    validate [<path>]      validate the uncompressed ADC structure
    build [<path>]         build the ADC file
    show [<path>]          show the output of the ADC

    Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -o, --output <name>    name of the output to display or path to the output directory for the generation
    -f, --fixture <name>   name of the fixture to use for the `show` command
    -T, --no-test          skip the execution of ADC unit tests
    -X, --no-xml           skip the validation of the config.xml file
    -A, --no-autoTest      skip the execution of the auto-generated unit tests
    -t, --template <name>  name of the template to use to generate the ADC

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


