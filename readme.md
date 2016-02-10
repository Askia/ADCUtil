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
    config                 get or set the configuration (use the --authorXXX flags to set the config)

    Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -o, --output <name>       name of the output to display or path to the output directory for the generation
    -f, --fixture <name>      name of the fixture to use for the `show` command
    -m, --masterPage <path>   path of the master page to use for the `show` command'
    -p, --properties <props>  ADC properties (in url query string format) to set for the `show` command'
    -T, --no-test             skip the execution of ADC unit tests
    -X, --no-xml              skip the validation of the config.xml file
    -A, --no-autoTest         skip the execution of the auto-generated unit tests
    -t, --template <name>     name of the template to use to generate the ADC
    --authorName <name>       default name of the author to set in the config
    --authorEmail <email>     default email of the author to set in the config
    --authorCompany <name>    default company of the author to set in the config
    --authorWebsite <website> default website of the author to set in the config
    
### Generate

Start `Windows PowerShell` (`Start > All programs > Accessories > Windows PowerShell > Windows PowerShell`). 
Target the root directory where you want to generate the ADC (or use the *-o* or *--output* option).

    cd C:\Users\user_name\Documents\ADCProjects\

Then enter the following command:

    ADCUtil generate my_adc_name

That should produce an output like:

![generate (Example output)](ADCUtilGenerate.png "generate (Example output)")


To generate the ADC structure, ADCUtil uses templates stored under the `/ADCUtil/templates/adc/`. 
By default, it use the `default` template (/ADCUtil/templates/adc/default/).

That means that you can predefine many more templates and store them in the `/ADCUtil/templates/adc/` folder. 
Then you only need to specify the name of the template folder you want to use to generate your ADC:

    ADCUtil --template my_template_name generate my_adc_name

#### List of possible error messages

**Errors**

    "The @name@ parameter is required"
    "The --output path is required"
    "The directory @%s@ already exists."
    "Incorrect ADC name. The name of the ADC should only contains letters, digits, spaces, @_,-,.@ characters"
    "Cannot found the @%s@ template"

### Validate

Start `Windows PowerShell` (`Start > All programs > Accessories > Windows PowerShell > Windows PowerShell`). 
Target your ADC directory (or indicates the path of your ADC after the `validate` command).

    cd C:\Users\user_name\Documents\ADCProjects\my_adc_name

Then enter the following command:

    ADCUtil validate

That should produce an output like:

![validate (Example output)](ADCUtilValidate.png "validate (Example output)")


The validation will check:

* The presence of the config.xml file
* The directory structure
* The files extensions using a whitelist and a blacklist (All other extensions will produce a warning)
* The config.xml using the XSD schema
* The logical in the config.xml
** The name information
** The constraints nodes (at least one control or question must be specified)
** The outputs, output, content and attribute nodes
** The properties nodes

It will also run the auto-generated unit tests and all unit tests of the ADC using the @ADXShell@ tool. 
You can skip some validations using the following options in the command line:

* -T, --no-test 
To skip the execution of the unit tests

* -A, --no-autoTest  
To skip the execution of the auto-generated unit tests

* -X, --no-xml           
To skip the validation of the config.xml file

#### List of possible error and warning messages

**Errors**

    "No such file or directory `%s`"
    "missing required argument `path`"
    "cannot find the `Config.xml` file in the directory"
    "File extension `%s` is forbidden"
    "The config.xml must contains the `info` node as a child of the xml root element"
    "The node `name` in `info` doesn't exist or is empty"
    "Duplicate constraints on `%s`"
    "The constraint on `%s` doesn't accept the `%s` attribute"
    "The constraint on `%s` requires at least one rule"
    "A constraint on `%s` is required"
    "Too many outputs with empty condition: `%s`"
    "At least one dynamic file is require for the `%s` output, or set the attribute `defaultGeneration=true` in the output node"
    "Cannot find the `resources` directory"
    "Cannot find the `%s` directory"
    "Output: `%s`. Cannot find the file `%s` in the `%s` directory"
    "Output: `%s`. Type `%s` could not be dynamic (`%s`)"
    "Output: `%s`. Attribute `%s` of the `%s` content could not be override"
    "Output: `%s`. `yield` node required for the binary content `%s` or set his position to `none`"
    "Output: `%s`. Duplicate `%s` attribute node in content `%s`"

**Warnings**

    "Untrust extension of the file `%s`"
    "Duplicate conditions in outputs `%s` and `%s`"
    "Output: `%s`. `attribute` nodes will be ignored for the `%s` content (`%s`)"
    "Output: `%s`. `attribute` nodes will be ignored for dynamic content (`%s`)"
    "Output: `%s`. `attribute` nodes will be ignored when using `yield` (`%s`)"
    "Output: `%s`. It's recommended to test the `Browser.Support(\"Javascript\")` in the condition node, before using `javascript` content."
    "Output: `%s`. It's recommended to test the `Browser.Support(\"Flash\")` in the condition node, before using `flash` content."
    "It's recommended to have at least one fallback with HTML only"
    "It's recommended to define at least one properties"
    "It's recommended to unit test your ADC project"

### Build

Start `Windows PowerShell` (`Start > All programs > Accessories > Windows PowerShell > Windows PowerShell`). 
Target your ADC directory (or indicate the path of your ADC after the `build` command).

    cd C:\Users\user_name\Documents\ADCProjects\my_adc_name

Then enter the following command:

    ADCUtil build

That should produce an output like:

![build (Example output)](ADCUtilBuid.png "build (Example output)")

The `build` command will first validate the ADC like the "validate command":#validate did (it will enforce the XML validation). 
If the validation fails, the build will stop otherwise it will compress all necessary files into a zip file with the *.adc extension.

The file will be generated under the ADC directory in the `\bin\` folder.

#### List of possible error messages

**Errors**

    "Validation failed"
    "Build failed with errors."

### Show

Start @Windows PowerShell@ (@Start > All programs > Accessories > Windows PowerShell > Windows PowerShell@). 
Target your ADC directory (or indicate the path of your ADC after the @show@ command).

    cd C:\Users\user_name\Documents\ADCProjects\my_adc_name

Then enter the following command:

    ADCUtil show --output MyADCOutputName --fixture TheFixtureFileName.xml

OR

    ADCUtil show -o MyADCOutputName -f TheFixtureFileName.xml

That should show the result of the `MyADCOutputName` with the specified fixture.

#### List of possible error messages

**Errors**

    "Please specify the name of the output you want to show, using the option -o or --output.",
    "Please specify the name of the fixture you want to use, using the option -f or --fixture."


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
    