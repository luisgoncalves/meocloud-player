/* eslint-env amd */
/* eslint no-implicit-globals: "off" */

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var ignore = require('gulp-ignore');
var flatten = require('gulp-flatten');
var inject = require('gulp-inject');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var series = require('stream-series');
var del = require('del');

var appScriptsLinted = function () {
    return gulp.src(['app/scripts/**/*.js', '!app/scripts/vendor/*.js', 'gulpfile.js'])
        .pipe(eslint({
            extends: 'eslint:recommended',
            rules: {
                'no-unused-vars': 'warn',
                'no-extra-parens': 'error',
                'consistent-return': 'error',
                'curly': 'error',
                'eqeqeq': 'error',
                'no-implicit-globals': 'warn',
                'no-lone-blocks': 'error',
                'no-loop-func': 'error',
                /* style */
                'camelcase': 'error',
                'indent': 'error',
                'key-spacing': 'error',
                'keyword-spacing': 'error',
                'no-unneeded-ternary': 'error',
                'space-before-function-paren': 'error'
            },
            envs: [
                'browser'
            ],
            globals: {
                angular: false,
                jsmediatags: false,
                URITemplate: false,
                URI: false,
                Uint8Array: false
            }
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(ignore.exclude('gulpfile.js'));
};

var vendorScripts = function (read) {
    return gulp.src('app/scripts/vendor/*.js', { read: read });
};

var appStyles = function (read) {
    return gulp.src('app/styles/*.css', { read: read })
}

gulp.task('dist:clean', function () {
    return del(['dist']);
});

gulp.task('dist:main', function () {
    var appScripts = appScriptsLinted()
        .pipe(flatten())
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'));
    var scripts = series(vendorScripts(true), appScripts)
        .pipe(gulp.dest('dist/js'));
    var styles = appStyles(true)
        .pipe(cssnano())
        .pipe(gulp.dest('dist'));

    return gulp.src('app/index.html')
        .pipe(inject(scripts, { ignorePath: 'dist', removeTags: true }))
        .pipe(inject(styles, { ignorePath: 'dist', removeTags: true }))
        .pipe(gulp.dest('dist'));
});

gulp.task('dist:assets', function () {
    return gulp.src(['app/**/*.html', 'app/*.png'])
        .pipe(gulp.dest('dist'));
});

gulp.task('dist', ['dist:clean'], function () {
    return gulp.start('dist:main', 'dist:assets');
});

gulp.task('local', function () {
    var scripts = series(vendorScripts(false), appScriptsLinted());
    var styles = appStyles(false);
    return gulp.src('app/index.html')
        .pipe(inject(scripts, { relative: true }))
        .pipe(inject(styles, { relative: true }))
        .pipe(gulp.dest('app'));
});

gulp.task('default', ['local']);