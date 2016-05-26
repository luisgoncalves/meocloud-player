/* eslint-env amd */
/* eslint no-implicit-globals: "off" */

var gulp = require('gulp');
var eslint = require('gulp-eslint');

gulp.task('default', function () {
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
        .pipe(eslint.failAfterError());
});