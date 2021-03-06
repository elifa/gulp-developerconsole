## Example creating a index.dev.html containing the developerconsole

```js
var developerconsole = require("gulp-developerconsole")({
    "reports": {
        "jasmine": "reports/jasmine.json",
        "jshint": "reports/jshint.json"
    }
});

// Lint Task
gulp.task("lint", function() {
    gulp.src("javascripts/src/**/*.js")
        .pipe(jshint())
        .pipe(developerconsole.jshintReporter());           // JSHint reporter from gulp-developerconsole
});

// Jasmine Task
gulp.task("test", function() {
    gulp.src("javascripts/spec/**/*.js")
        .pipe(jasmine({
            "reporter": developerconsole.jasmineReporter()  // Jasmine reporter from gulp-developerconsole
        }));
});

// Add Developer Console to Our HTML
gulp.task("html", function() {
    gulp.src("index.html")
        .pipe(rename("index.dev.html"))
        .pipe(developerconsole.consoleInjector())           // Console from gulp-developerconsole
        .pipe(gulp.dest("."));
});

gulp.task("watch", function() {
    gulp.run("lint", "test", "html");

    // Watch For Changes To Our JS
    gulp.watch("javascripts/**/*.js", function(){
        gulp.run("lint", "test");
    });

    // Watch For Changes To Our HTML
    gulp.watch("index.html", function(){
        gulp.run("html");
    });
});
```
