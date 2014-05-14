var fs = require('fs');
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var header = require('gulp-header');

var pkg = 'twitch-plays-control';
var metafile = pkg + '.meta.js';
var userfile = pkg + '.user.js';

gulp.task('scripts', function() {
  gulp.src(['src/control.js'])
      .pipe(browserify({ paths: ['src'] }))
      .pipe(concat(userfile))
      .pipe(header(fs.readFileSync(metafile, 'utf8')))
      .pipe(gulp.dest('.'));
});

gulp.task('default', function() {
  gulp.watch([metafile, 'src/*.js'], ['scripts']);
});
