var eventstream = require("event-stream");
var through = require("through2");
var path = require("path");

var cons = require("./client")

module.exports = function (params) {
    var options = params || {};

    options.port = options.port || 45600;

    var snippet = "\n<script>(" + cons.toString() + ")(window, " + options.port + ", {});</script>\n";

    var stream = through.obj(function (file, enc, callback) {
        var insertSnippetIfMatching = function (line) {
            return new Buffer(line.toString(enc).replace(/<\/body>/, function(match) {
                return snippet + match;
            }));
        };

        if (file.isNull() || path.extname(file.path) !== ".html") {
            // If it is not a file or not HTML - do nothing
        } else if (file.contents instanceof Buffer) {
            file.contents = insertSnippetIfMatching(file.contents);
        } else {
            file.contents = file.contents.pipe(eventstream.split("\n")).pipe(through(function (line, enc, callback) {
                this.push(insertSnippetIfMatching(line));

                callback();
            })).pipe(eventstream.join("\n"));
        }

        this.push(file);
        return callback();
    });

    return stream;
};