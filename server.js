var fs = require("fs");
var ws = require("ws");
var path = require("path");
var server, sockets = [], files = {};

function read(filename) {
    fs.readFile(files[filename], function read(err, data) {
        if (err) {
            throw err;
        }

        broadcast(files[filename], data);
    });
}

function broadcast (filename, data) {
    var socket, i;

    for (i = 0; i < sockets.length; i++) {
        socket = sockets[i];
        if (socket) {
            socket.send(JSON.stringify({ "filename": filename, "content": data.toString() }));
        }
    }
}

module.exports = function (options) {
    server = new ws.Server({ "port": options.port });

    server.on("connection", function (socket) {
        sockets.push(socket);

        socket.on("message", function (message) {
            console.log('received: %s', message);
        });

        socket.on("close", function () {
            var i;

            for (i = 0; i < sockets.length; i++) {
                if (sockets[i] === socket) {
                    delete sockets[i];
                }
            }
        });

        for (var file in files) {
            read(file);
        }
    });

    for (var name in options.watch) {
        var file = options.watch[name];

        fs.watch(file, function (event, filename) {
            if (filename) {
                read(filename);
            }
        });

        files[path.basename(file)] = file;
    }
};