var fs = require('fs');
var path = require('path');
var et = require('elementtree');
var subElement = et.SubElement;
var common = require('../common/common.js');
var errMsg = common.messages.error;

/**
 * Object used to read and manipulate the config.xml file of an ADC
 *
 * @constructor
 * @param {String} dir Path of the ADC directory
 */
function Configurator(dir) {
    if (!dir) {
        throw new Error(errMsg.invalidPathArg);
    }
    this.path   = dir;
    this.xmldoc = null;
}


/**
 * Read the config.xml file and initialize all properties of the current instance object
 *
 * @param {Function} [callback] Callback function
 * @param {Error} [callback.err] Error
 */
Configurator.prototype.load = function load(callback) {
    callback = callback || function () {};
    var self = this;

    common.dirExists(this.path, function (err, isExist) {
        if (err) {
            callback(err);
            return;
        }
        if (!isExist) {
            callback(errMsg.noSuchFileOrDirectory);
            return;
        }

        var filePath = path.join(self.path, 'config.xml');

        fs.readFile(filePath, function (err, data) {
            if (err) {
                callback(err);
                return;
            }

            self.xmldoc = et.parse(data);

            self.info = new ADCInfo(self);
            callback(null);

        });


    });
};


/**
 * ADC Info
 * @constructor
 * @param {Configurator} configurator Instance of the configurator
 */
function ADCInfo(configurator) {
    this.configurator = configurator;
}

/**
 * Get the entire information as object
 *
 * @return {Object}
 */
ADCInfo.prototype.get = function get() {
    var self = this,
        result = {};

    ["name", "guid", "version", "date", "description", "company", "author", "site",
        "helpURL", "categories", "style", "constraints"].forEach(function (methodName) {
            result[methodName] = self[methodName]();
    });
    return result;
};


/**
 * Set the information using a plain object
 *
 * @param {Object} data Data to set
 * @return {Object}
 */
ADCInfo.prototype.set = function set(data) {
    var self = this;

    if (!data) {
        return self.get();
    }


    ["name", "guid", "version", "date", "description", "company", "author", "site",
        "helpURL", "categories", "style", "constraints"].forEach(function (methodName) {
            if (data.hasOwnProperty(methodName)) {
                self[methodName](data[methodName]);
            }
        });

    return self.get();
};

(["name", "guid", "version", "date", "description", "company", "author", "site", "helpURL"].forEach(function (propName) {

    ADCInfo.prototype[propName] = function (data) {
        var xmldoc = this.configurator.xmldoc;
        var el = xmldoc.find("info/" + propName);
        if (data !== undefined) {
            el.text = data;
        }
        return el.text;
    };
}));

/**
 * Get or set the style
 *
 * @param {Object} [data] Style to set
 * #param {Number} [data.width] Style width
 * @param {Number} [data.height] Style height
 * @returns {Object}
 */
ADCInfo.prototype.style = function style(data) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("info/style");
    var result = {}, w, h;
    if (data !== undefined) {
        if (data.width !== undefined) {
            el.set("width", data.width);
        }
        if (data.height !== undefined) {
            el.set("height", data.height);
        }
    }
    w = el.get("width") || "0";
    h = el.get("height") || "0";

    result.width = parseInt(w, 10);
    result.height = parseInt(h, 10);

    return result;
};

/**
 * Get or set the categories
 *
 * @param {String[]} [data] Array of string which represent the categories to set
 * @returns {String[]} Name of categories
 */
ADCInfo.prototype.categories = function categories(data) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("info/categories");
    var result = [];
    if (Array.isArray(data)) {
        el.delSlice(0, el.len());
        data.forEach(function (text) {
            var cat = subElement(el, 'category');
            cat.text = text;
        });
    }

    el.iter('category', function (cat) {
        result.push(cat.text);
    });

    return result;
};

/**
 * Get or set the constraints
 *
 * @param {Object} [data] Constraint data to set
 * @return {Object} Constraints
 */
ADCInfo.prototype.constraints = function constraints(data) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("info/constraints");
    var result = {};
    if (data) {
        Object.keys(data).forEach(function (on) {
            if (on !== 'questions' &&  on !== 'responses' &&  on !== 'controls') {
               return;
            }
            var node = el.find("constraint[@on='" + on + "']");
            if (!node) {
                node = subElement(el, "constraint");
                node.set("on", on);
            }

            Object.keys(data[on]).forEach(function (attName) {
                var value = data[on][attName].toString();
                node.set(attName,  value);
            });

        });
    }

    el.iter('constraint', function (constraint) {
        var on = constraint.get("on");
        var value = {};

        constraint.keys().forEach(function (attName) {
            if (attName === 'on') {
                return;
            }
            var v = constraint.get(attName);
            if (attName === 'min' || attName === 'max') {
                if (v !== '*') {
                    v = parseInt(v, 10);
                }
            } else {
                v = v !== undefined && (v !== 'false' && v !== '0' );
            }

            value[attName] = v;
        });

        result[on] = value;
    });

    return result;
};


/**
 * Get or set the constraint
 *
 * @param {String} where Which constraint to target
 * @param {String} attName Name of the constraint attribute to get or set
 * @param {Boolean|Number} [attValue] Value of the attribute to set
 * @return {Boolean|Number} Value of the attribute
 */
ADCInfo.prototype.constraint = function constraint(where, attName, attValue) {
    var xmldoc = this.configurator.xmldoc;
    var el = xmldoc.find("info/constraints/constraint[@on='" + where + "']");
    var result;
    if (attValue !== undefined) {
        if (!el) {
            var parent = xmldoc.find('info/constraints');
            if (!parent) {
                throw new Error("Unable to find the  `constraints` node ");
            }
            el = subElement(parent, 'constraint');
            el.set("on", where);
        }
        el.set(attName, attValue.toString());
    }

    if (!el) {
        return (attName === 'min' || attName === 'max') ? Infinity  : false;
    }

    result = el.get(attName);

    // Some properties are treat as number instead of boolean
    if (attName === 'min' || attName === 'max') {
        if (result === '*') {
            return Infinity;
        }
        return parseInt(result, 10);
    }

    if (result === undefined) {
        return false;
    }

    return (result !== "false" && result !== "0");
};


// Make it public
exports.Configurator = Configurator;