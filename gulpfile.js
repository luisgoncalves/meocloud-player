/* eslint-env amd */
/* eslint no-implicit-globals: "off" */

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var ignore = require('gulp-ignore');
//var flatten = require('gulp-flatten');
var inject = require('gulp-inject');
var series = require('stream-series');
//var del = require('del');

var appScripts = function () {
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

var vendorScripts = function () {
    return gulp.src('app/scripts/vendor/*.js');
};

// gulp.task('clean', function () {
//     return del(['dist/js']);
// });

// gulp.task('main', function () {
//     var scripts = series(vendorScripts(), appScripts().pipe(flatten()))
//         .pipe(gulp.dest('dist/js'));

//     return gulp.src('app/index.html')
//         .pipe(inject(scripts, { ignorePath: 'dist', removeTags: true }))
//         .pipe(gulp.dest('dist'));
// });

// gulp.task('assets', function () {
//     return gulp.src(['app/**/*.html', 'app/*.png'])
//         .pipe(gulp.dest('dist'));
// });

gulp.task('default', function () {
    //gulp.start('assets', 'main');
    var scripts = series(vendorScripts(), appScripts());
    return gulp.src('app/index.html')
        .pipe(inject(scripts, { relative: true }))
        .pipe(gulp.dest('app'));
});