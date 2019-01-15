var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  jshint = require('gulp-jshint'),
  concat = require('gulp-concat'),
  bump = require('gulp-bump'),
  notify = require('gulp-notify'),
  git = require('gulp-git'),
  size = require('gulp-size'),
  ngannotate = require('gulp-ng-annotate'),
  npm = require('npm'),
  prompt = require('gulp-prompt'),
  watch = require('gulp-watch'),
  batch = require('gulp-batch'),
  path = require('path'),
  gutil = require('gulp-util');

var paths = {
  src: ['./src/index.js', './src/*.js'],
  dist: ['./dist/*.js'],
};

var sourceMin = 'twjs.min.js';

gulp.task('lint', function () {
  return gulp.src(paths.src)
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function () {
  watch(['src/**/*'], batch(function (events, done) {
    gulp.start('build', done);
  }));
});

var rootDirectory = path.resolve('./');

var sourceDirectory = path.join(rootDirectory, './src');

var sourceFiles = [

  path.join(sourceDirectory, '/**/*.module.js'),

  path.join(sourceDirectory, '/**/*.js')
];


gulp.task('build', ['lint'], function () {
  return gulp.src(sourceFiles)
    .pipe(ngannotate())
    .pipe(concat('twjs.js'))
    .pipe(gulp.dest('./dist/'))
    .pipe(uglify())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(concat(sourceMin))
    .pipe(size())
    .pipe(gulp.dest('dist'));
});

gulp.task('bump', function (cb) {
  var versionType = 'major';
  gulp.src(['.']).pipe(
    prompt.prompt({
      type: 'list',
      name: 'bump',
      message: 'Qual tipo de alteração de versão você deseja fazer?',
      choices: ['patch', 'minor', 'major']
    }, function (res) {
      versionType = res.bump;
      gulp.src(['./bower.json', './package.json'])
        .pipe(bump({
          type: versionType
        }))
        .pipe(gulp.dest('./'))
        .on('end', function () {
          cb();
        });
    }));
});

gulp.task('publish-git', ['bump', 'build'], function (cb) {
  var pkg = require('./package.json');
  var msg = 'Atualização de versão ' + pkg.version;
  gulp.src('./*.json')
    .pipe(git.add())
    .pipe(git.commit(msg))
    .pipe(git.tag('v' + pkg.version, msg, function () {
      git.push('origin', 'master', {
        args: '--tags'
      }, function () {
        cb();
      });
    }));
});

gulp.task('publish-npm', ['publish-git'], function (cb) {
  npm.load({}, function (error) {
    if (error) return console.error(error);
    npm.commands.publish(['.'], function (error) {
      if (error) return console.error(error);
      cb();
    });
  });
});