var fs = require("fs");

/**
 * Calculate elapsed time, in Seconds.
 *
 * @param startMs Start time in Milliseconds
 * @param finishMs Finish time in Milliseconds
 * @return Elapsed time in Seconds */
function elapsedSec (startMs, finishMs) {
    return (finishMs - startMs) / 1000;
}

/**
 * Round an amount to the given number of Digits.
 * If no number of digits is given, than '2' is assumed.
 *
 * @param amount Amount to round
 * @param numOfDecDigits Number of Digits to round to. Default value is '2'.
 * @return Rounded amount */
function round (amount, numOfDecDigits) {
    numOfDecDigits = numOfDecDigits || 2;
    return Math.round(amount * Math.pow(10, numOfDecDigits)) / Math.pow(10, numOfDecDigits);
}

/**
 * Collect information about a Suite, recursively, and return a JSON result.
 *
 * @param suite The Jasmine Suite to get data from
 */
function getSuiteData (suite) {
    var suiteData = {
            description : suite.description,
            durationSec : 0,
            specs: [],
            suites: [],
            passed: true
        },
        specs = suite.specs(),
        suites = suite.suites(),
        i, ilen;

    // Loop over all the Suite's Specs
    for (i = 0, ilen = specs.length; i < ilen; ++i) {
        suiteData.specs[i] = {
            description : specs[i].description,
            durationSec : specs[i].durationSec,
            passed : specs[i].results().passedCount === specs[i].results().totalCount,
            skipped : specs[i].results().skipped,
            passedCount : specs[i].results().passedCount,
            failedCount : specs[i].results().failedCount,
            totalCount : specs[i].results().totalCount
        };
        suiteData.passed = !suiteData.specs[i].passed ? false : suiteData.passed;
        suiteData.durationSec += suiteData.specs[i].durationSec;
    }

    // Loop over all the Suite's sub-Suites
    for (i = 0, ilen = suites.length; i < ilen; ++i) {
        suiteData.suites[i] = getSuiteData(suites[i]); //< recursive population
        suiteData.passed = !suiteData.suites[i].passed ? false : suiteData.passed;
        suiteData.durationSec += suiteData.suites[i].durationSec;
    }

    // Rounding duration numbers to 3 decimal digits
    suiteData.durationSec = round(suiteData.durationSec, 4);

    return suiteData;
}

function JasmineReporter(reportFile) {
    this.reportFile = reportFile;
}

JasmineReporter.prototype.reportRunnerStarting = function (runner) {
    // Nothing to do
};

JasmineReporter.prototype.reportSpecStarting = function (spec) {
    // Start timing this spec
    spec.startedAt = new Date();
};

JasmineReporter.prototype.reportSpecResults = function (spec) {
    // Finish timing this spec and calculate duration/delta (in sec)
    spec.finishedAt = new Date();
    // If the spec was skipped, reportSpecStarting is never called and spec.startedAt is undefined
    spec.durationSec = spec.startedAt ? elapsedSec(spec.startedAt.getTime(), spec.finishedAt.getTime()) : 0;
};

JasmineReporter.prototype.reportSuiteResults = function (suite) {
    // Nothing to do
};

JasmineReporter.prototype.reportRunnerResults = function (runner) {
    var suites = runner.suites(),
        i, j, ilen;

    // Attach results to the "jasmine" object to make those results easy to scrap/find
    var runnerResults = {
        suites: [],
        durationSec : 0,
        passed : true
    };

    // Loop over all the Suites
    for (i = 0, ilen = suites.length, j = 0; i < ilen; ++i) {
        if (suites[i].parentSuite === null) {
            runnerResults.suites[j] = getSuiteData(suites[i]);
            // If 1 suite fails, the whole runner fails
            runnerResults.passed = !runnerResults.suites[j].passed ? false : runnerResults.passed;
            // Add up all the durations
            runnerResults.durationSec += runnerResults.suites[j].durationSec;
            j++;
        }
    }

    fs.writeFile(this.reportFile, JSON.stringify(runnerResults), function (err) {
        if (err) {
            console.log(err);
        }
    });
};

module.exports = function (options) {
    options = options || {};

    return new JasmineReporter(options.out || "jasmine.json");
};