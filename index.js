var inject = require("./console-inject");
var jasmine = require("./jasmine-reporter");
var jshint = require("./jshint-reporter");
var server = require("./server");

var path = require("path");

module.exports = function (params) {
    var options = params || {};

    options.port = options.port || 45600;
    options.reports = options.reports || {};

    options.reports.jasmine = path.resolve(options.reports.jasmine || "report/jasmine.json");
    options.reports.jshint = path.resolve(options.reports.jshint || "report/jshint.json");

    server({ "port" : options.port, "watch": options.reports });

    return {
        "consoleInjector": function () { return inject({ "port": options.port }); },
        "jasmineReporter": function () { return jasmine({ "out": options.reports.jasmine }); },
        "jshintReporter": function () { return jshint({ "out": options.reports.jshint }); }
    };
};