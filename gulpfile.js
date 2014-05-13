var fs = require('fs');
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var header = require('gulp-header');

gulp.task('scripts', function() {
  gulp.src(['control.js'])
      .pipe(browserify({ paths: ['.'] }))
      .pipe(concat('twitch-plays-control.user.js'))
      .pipe(header(fs.readFileSync('intro.js', 'utf8')))
      .pipe(gulp.dest('.'))
});

gulp.task('default', function() {
  gulp.watch('*.js', ['scripts']);
});
