var gulp = require('gulp'),
    gutil = require('gulp-util'),
    jshint = require('gulp-jshint'),

    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    watchify = require('watchify'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    browserify = require('browserify'),
    rename = require("gulp-rename"),
    path = require('path'),
    webserver = require('gulp-webserver'),
    index = './src/index.js',
    outdir = './dist/js',
    bundle = 'dockspawn',
    outfile = 'dockspawn.js';
    

function rebundle(file) {
    if (file) {
        gutil.log('Rebundling,', path.basename(file[0]), 'has changes.');
    }

    return this.bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(outfile))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps:true, debug:true}))             // init source map
        .pipe(gulp.dest(outdir)) //generate the non-minified
        .pipe(rename({extname:'.min.js'}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(outdir));
}

function createBundler(args) {
    args = args || {};
    args.standalone = bundle;
    args.debug = true;//let browserify generate sourcemap. (will be inlined, loaded in sourcemaps, then removed by uglify, and finally generated in .map by sourcemaps)

    return browserify(index, args);
}

/*****
 * Webserver, brilliant for getting up-and-running quickly!
 *****/
gulp.task('webserver', function() {
  gulp.src('dist')
    .pipe(webserver({
      livereload: true,
      directoryListing: true,
      open: 'http://localhost:8000/demos/ide/demo.html'
    }));
});

/*****
 * Dev task, incrementally rebuilds the output bundle as the the sources change
 *****/
gulp.task('dev', function() {
    watchify.args.standalone = bundle;
    var bundler = watchify(createBundler(watchify.args));

    bundler.on('update', rebundle);

    return rebundle.call(bundler);
});

/*****
 * Build task, builds the output bundle
 *****/
gulp.task('build', function () {
    return rebundle.call(createBundler());
});

/*****
 * JSHint task, lints the lib and test *.js files.
 *****/
gulp.task('jshint', function () {
    return gulp.src([
            './src/**/*.js',
            'gulpfile.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-summary'));
});

/*****
 * Base task
 *****/
gulp.task('default', ['jshint', 'build']);
