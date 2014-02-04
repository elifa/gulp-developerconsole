var fs = require("fs");
var gutil = require("gulp-util");
var through = require("through2");

module.exports = function (options) {
    options = options || {};

    var out = options.out || "jshint.json";
    var result = undefined;

    var collectResult = function (value, encoding, callback) {
        if (value.isNull()) {
            this.push(value);
            return callback();
        }

        if (value.isStream()) {
            this.emit("error", gutil.PluginError("gulp-jshintreporter", "Streaming not supported."));
            return callback();
        }

        var jshint = value.jshint;

        if (result === undefined) {
            result = {"success": jshint.success, "errors": jshint.results || []};
            return callback();
        }

        result.success = result.success && jshint.success;
        result.errors = jshint.results ? result.errors.concat(jshint.results) : result.errors;

        return callback();
    };

    var summarizeResults = function (callback) {
        if (result === undefined) {
            return callback();
        }

        var i, len;
        var output = {};

        for (i = 0, len = result.errors.length; i < len; ++i) {
            var error = result.errors[i];

            if (!output.hasOwnProperty(error.file)) {
                output[error.file] = {errors: []};
            }

            output[error.file].errors.push(error.error);
        }

        fs.writeFile(out, JSON.stringify(output), function (error) {
            if (error) {
                this.emit("error", gutil.PluginError("gulp-jshintreporter", "Report file [" + out + "] could not be written."));
            }
        });

        return callback();
    };

    return through.obj(collectResult, summarizeResults);
};