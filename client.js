module.exports = function(window, port, tabs) {
    var document = window.document;
    var container = null;
    var tabs = null;
    var model = [];

    var insertContainer = function () {
        container = document.createElement("article");

        container.style.position = "fixed";
        container.style.bottom = "0px";
        container.style.left = "0px";
        container.style.width = "100%";
        container.style.borderTop = "1px solid #444"
        container.style.backgroundColor = "#f1f0ec"

        var body = document.getElementsByTagName("body")[0];

        body.appendChild(container);
    };

    var insertLayout = function () {
        tabs = document.createElement("ul");

        tabs.style.width = "100%"
        tabs.style.margin = "0px";
        tabs.style.padding = "0px"
        tabs.style.listStyle = "inside none none";
        tabs.style.backgroundColor = "#dedede";

        container.appendChild(tabs);
    };

    var insertTab = function (name, file, controller) {
        var count = document.createElement("span");
        var link = document.createElement("a");
        var tab = document.createElement("li");
        var card = document.createElement("section");

        count.style.backgroundColor = "orange";
        count.style.borderRadius = "0.75rem";
        count.style.display = "none";
        count.style.width = "1.5rem";
        count.style.textAlign = "center";

        link.style.display = "inline-block"
        link.style.padding = "3px";

        tab.style.lineHeight = "1.3rem";
        tab.style.float = "left";
        tab.style.display = "inline-block";
        tab.style.padding = "0px 15px 0px 5px";
        tab.style.margin = "5px 5px -1px 5px";
        tab.style.border = "1px solid #444"
        tab.style.borderRadius = "5px 5px 0px 0px";

        card.style.scroll = "auto";
        card.style.maxHeight = "200px";
        card.style.borderTop = "1px solid #444";
        //card.style.fontSize = "20em";

        tab.appendChild(count);
        tab.appendChild(link);
        tabs.appendChild(tab);
        container.appendChild(card);

        model.push({
            "name": name,
            "file": file,
            "controller": new controller({
                "name": name,
                "count": count,
                "link": link,
                "tab": tab,
                "card": card
            })
        });
    };

    /**
     * Console base class.
     *
     * @constructor
     */
    function Console(view) {
        var self = this;

        this.view = view;

        if (model.length === 0) {
            this.doFocus();
        } else {
            this.doBlur();
        }

        this.view.link.textContent = this.view.name;
        this.view.link.setAttribute("href", "#");
        this.view.link.addEventListener("click", function (event) {
            Console.prototype.doFocus.call(self, event);
        }, false);
    }

    Console.prototype.doFocus = function () {
        this.state = Console.STATE.FOCUSED;

        for (var i = 0; i < model.length; ++i) {
            if (model[i].controller !== this) {
                model[i].controller.doBlur();
            }
        }

        this.view.card.style.display = "block";
        this.view.tab.style.borderBottom = "1px solid #f1f0ec";
        this.view.tab.style.backgroundColor = "#f1f0ec";
    };

    Console.prototype.doBlur = function () {
        this.state = Console.STATE.BLURED;

        this.view.card.style.display = "none";
        this.view.tab.style.borderBottom = "1px solid #444";
        this.view.tab.style.backgroundColor = "transparent";
    };

    Console.prototype.doRender = function (data) {
        throw new Error("Render must be overridden by Console implementation.");
    };

    Console.prototype.doError = function (data) {

    };

    Console.STATE = {
        "FOCUSED": "FOCUSED",
        "BLURED": "BLURED",
        "INACTIVE": "INACTIVE"
    };

    /**
     * Jasmine console class.
     *
     * @constructor
     */
    function JasmineConsole(model) {
        Console.call(this, model);
    }

    JasmineConsole.prototype = Object.create(Console.prototype);

    JasmineConsole.prototype.doRender = function (data) {
        var suiteItem, errorList, errorItem, suite, spec, count = 0;
        var suiteList = document.createElement("ul");

        for (var i = 0; i < data.suites.length; ++i) {
            suite = data.suites[i];

            suiteItem = document.createElement("li");
            errorList = document.createElement("ul");
            suiteItem.innerHTML = suite.description;
            suiteItem.appendChild(errorList);

            for (var j = 0; j < suite.specs.length; ++j) {
                spec = suite.specs[j];
                errorItem = document.createElement("li");
                errorItem.innerHTML = spec.description;//JSON.stringify(spec);
                errorList.appendChild(errorItem);
                count += spec.failedCount;
            }

            suiteList.appendChild(suiteItem);
        }

        this.view.count.innerHTML = count;

        if (count) {
            this.view.count.style.display = "inline-block";
        } else {
            this.view.count.style.display = "none";
        }

        this.view.card.innerHTML = "";
        this.view.card.appendChild(suiteList);
    };

    /**
     * JSHint console class.
     *
     * @constructor
     */
    function JSHintConsole(model) {
        Console.call(this, model);
    }

    JSHintConsole.prototype = Object.create(Console.prototype);

    JSHintConsole.prototype.doRender = function (data) {
        var fileItem, errorList, errorItem, file, name, error, i, count = 0;
        var fileList = document.createElement("ul");

        for (name in data) {
            if (name === "files") {
                continue; // TODO: Fix this in the reporter
            }

            file = data[name];
            fileItem = document.createElement("li");
            errorList = document.createElement("ul");
            fileItem.innerHTML = name;
            fileItem.appendChild(errorList);

            for (i = 0; i < file.errors.length; ++i) {
                error = file.errors[i];
                errorItem = document.createElement("li");
                errorItem.innerHTML = error.reason;//JSON.stringify(error);
                errorList.appendChild(errorItem);
                count++;
            }

            fileList.appendChild(fileItem);
        }

        this.view.count.innerHTML = count;

        if (count) {
            this.view.count.style.display = "inline-block";
        } else {
            this.view.count.style.display = "none";
        }

        this.view.card.innerHTML = "";
        this.view.card.appendChild(fileList);
    };

    insertContainer();
    insertLayout();

    for (var id in tabs) {
        var tab = tabs[id];

        //insertTab(tab.name, tab.file, tab.class);
    }

    insertTab("Unit tests", "/vagrant/report/jasmine.json", JasmineConsole);
    insertTab("Static analysis", "/vagrant/report/jshint.json", JSHintConsole);

    var socket = new WebSocket("ws://" + document.location.hostname + ":" + port);

    socket.onopen = function (event) {
        //console.log("Connected to ws://" + document.location.hostname + ":" + port);
    };

    socket.onmessage = function (event) {
        var i, data = JSON.parse(event.data);
        for (i = 0; i < model.length; i++) {
            if (model[i].file === data.filename) {
                model[i].controller.doRender(JSON.parse(data.content));
            }
        }
    };
};