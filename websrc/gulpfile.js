var gulp = require('gulp');
var less = require('gulp-less');
var concat = require('gulp-concat');
var merge = require('merge-stream');
var watch = require('gulp-watch');
//var minify = require('gulp-minify');
var cleanCSS = require('gulp-clean-css');

var bundleStyles = function() {

  var lessStream = gulp.src('src/less/*.less')
        .pipe(concat('src/less-files.less'))
        .pipe(less())
        .pipe(gulp.dest('./'))
    ;

  var mergedStream = merge(lessStream)
        .pipe(concat('grd_styles.css'))
        //.pipe(minify())
        .pipe(gulp.dest('../webroot/css/'));

    return mergedStream;
};

var compressStyles = function() {
  var lessStream = gulp.src('src/less/*.less')
        .pipe(concat('src/less-files.less'))
        .pipe(less())
        .pipe(gulp.dest('./'))
    ;

  var mergedStream = merge(lessStream)
        .pipe(concat('grd_styles.min.css'))
        .pipe(cleanCSS({
          compatibility: 'ie8',
          level: {
            1: {
              all: true
            },
            2: {
              all: true
            }
          }
        }))
        .pipe(gulp.dest('../webroot/css/'));

    return mergedStream;
};

gulp.task("bundleStyles", bundleStyles);
gulp.task("compressStyles", compressStyles);

gulp.task('watchStyles', function() {
  bundleStyles();
  watch("src/less/*.less", function() {
    bundleStyles();
  });
});