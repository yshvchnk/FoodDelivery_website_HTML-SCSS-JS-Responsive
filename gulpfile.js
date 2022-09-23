import gulp from 'gulp';
import webpack from 'webpack-stream';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import autoprefixer from 'autoprefixer';
import cleanCSS from 'gulp-clean-css';
import postcss from 'gulp-postcss';
import browsersync from 'browser-sync';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import { deleteAsync } from 'del';
import imgmin from 'gulp-imagemin';
import jsonserver from 'gulp-json-srv';
const server = jsonserver.create({
  port: 3000
});

const dist = "dist";
const src = "src";


gulp.task("json", () => {
  return gulp.src('dist/*.json')
    .pipe(server.pipe());
});

// reset
gulp.task("reset", () => {
  return deleteAsync('dist/*');
});

// copy html
gulp.task("copy-html", () => {
  return gulp.src(src + '/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(dist))
    .pipe(browsersync.stream());
});

// build js
gulp.task("build-js", () => {
  return gulp.src(src + '/js/script.js')
    .pipe(webpack({
      mode: 'production',
      output: {
        filename: 'bundle.js'
      },
      watch: true,
      module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [['@babel/preset-env', {
                  debug: true,
                  corejs: 3,
                  useBuiltIns: "usage"
                }]]
              }
            }
          }
        ]
      }
    }))
    .pipe(gulp.dest(dist + '/js'))
    .pipe(browsersync.stream());
});

// build sass
gulp.task("build-sass", () => {
  return gulp.src(src + '/scss/**/*.+(scss|sass)')
    .pipe(sass().on('error', sass.logError))
    .pipe(rename({suffix: '.min', prefix: ''}))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest(dist + '/css'))
    .pipe(browsersync.stream());
});

// copy files
gulp.task("copy-assets", () => {
  gulp.src("src/icons/**/*.*")
    .pipe(gulp.dest(dist + "/icons"));
  
  gulp.src("src/*.json")
    .pipe(gulp.dest(dist));
  
  gulp.src("src/server.php")
    .pipe(gulp.dest(dist));

  return gulp.src("src/img/**/*.*")
    .pipe(imgmin())
    .pipe(gulp.dest(dist + "/img"))
    .pipe(browsersync.stream());
});

// run browsersync and watch
gulp.task("watch", () => {
  browsersync.init({
    server: "dist/",
    port: 4000,
    notify: true
  });

  gulp.watch("src/*.html", gulp.parallel("copy-html"));
  gulp.watch("src/icons/**/*.*", gulp.parallel("copy-assets"));
  gulp.watch("src/img/**/*.*", gulp.parallel("copy-assets"));
  gulp.watch("src/scss/**/**/*.scss", gulp.parallel("build-sass"));
  gulp.watch("src/js/**/*.js", gulp.parallel("build-js"));
});


gulp.task("build", gulp.parallel("copy-html", "copy-assets", "build-sass", "build-js"));
gulp.task("preparebuild", gulp.series("reset", "build"));
gulp.task("default", gulp.parallel("watch", "json", "preparebuild"));

