const { watch, series, parallel, src, dest, gulp } = require('gulp');
const del = require('del'); // Empty folders before commpiling
const uglify = require('gulp-uglify'); // JavaScript Minifier
const rename = require('gulp-rename'); // Rename files after compile
const cache = require('gulp-cache'); // A temp file based caching proxy task for gulp.
const sass = require('gulp-sass'); // Gulp Sass plugin
const sass_compiler = require('node-sass'); // Sass Compiler
const cleanCSS = require('gulp-clean-css'); // CSS Minifier
const inject = require('gulp-inject'); // Injects CSS/JS into html
const connect = require('gulp-connect'); // Runs a local webserver
const livereload = require('gulp-livereload'); // Triggers livereload on file changes
const open = require('gulp-open'); // Opens a URL in a web browser

// General Config Vars
const config = {
    port: 8080,
    devBaseUrl: 'http://localhost',
    paths: {
        root: './src/',
        html: './src/*.html',
        scss: './src/scss/*.scss',
        js: './src/js/*.js',
        images: './src/img/**',
        dist: './dist/',
        distCSSDir: './dist/css/',
        distJSDir: './dist/js/',
        distIMGDir: './dist/img/',
        node_modules:'./node_modules/'
    }
}


// Removes files and folders. Deprecated but still works.
// https://www.npmjs.com/package/gulp-clean
function clean() {
  return del([config.paths.dist + '*.html', config.paths.distCSSDir + '*.css', config.paths.distJSDir + '*.js']);
}

// Compile all SASS files in scss folder
function sassCompile() {
  return src(config.paths.scss)
  .pipe(cache(sass()))
  .pipe(cleanCSS())
  .pipe(rename({ extname: '.css' }))
  .pipe(dest(config.paths.distCSSDir));
}

// Compile any JS files in JS folder
function jsCompile() {
  return src(config.paths.js)
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest(config.paths.distJSDir));
}

// Move HTML files to dist
function html() {
  return src(config.paths.html)
    .pipe(dest(config.paths.dist));
}

// Move images to dist/img/
function images() {
  return src(config.paths.images)
    .pipe(dest(config.paths.distIMGDir));
}


// A stylesheet, javascript and webcomponent reference injection plugin for gulp.
// https://www.npmjs.com/package/gulp-inject
function injectFiles() {
  var target = src(config.paths.dist + 'index.html');
  var sources = src([
    config.paths.distJSDir + '*.js',
    config.paths.distCSSDir + '*.css'
  ], {read: false});
  return target.pipe(inject(sources, {relative: true}))
  .pipe(dest(config.paths.dist))
  .pipe(livereload());
}

// Gulp plugin to run a webserver (with LiveReload)
// https://www.npmjs.com/package/gulp-connect
function server() {
  return connect.server({
    root: config.paths.dist,
    port: config.port,
    // livereload: true,
    debug: true,
  });
}

// Launch Chrome browser
// https://www.npmjs.com/package/gulp-open
function openBrowser() {
  var options = {
    uri: config.devBaseUrl + ':' + config.port + '/',
    // app: 'Google Chrome'
  };
  return src(config.paths.dist + 'index.html')
  .pipe(open(options));
}

// Build Tasks
function buildTasks(done) {
  return series(clean, sassCompile, jsCompile, html, images, injectFiles);
  done();
}

// Watch Task
// Gulp will watch all on events with a set delay followed by build task.
function watchTasks() {
  return watch([config.paths.html, config.paths.scss, config.paths.js], { events: 'all', delay: 200}, buildTasks(), livereload.listen());
}

// Clear cached files
/*
Use this command if files are not updated.
*/
exports.clear = function(done) {
  cache.clearAll();
  done();
}

// Empty Folders
/*
Run gulp clean command for a clean slate in dist directory.
You will need to run the command gulp build again to prevent errors.
*/
exports.clean = function(done) {
  clean();
  done();
}

// Gulp build
/*
Run gulp build command to build files only.
*/
exports.build = series(clean, sassCompile, jsCompile, html, images, injectFiles);

/*
The default gulp command.
1. Launch Browser
2. Start connect server
3. Watch files for changes with LiveReload
*/
exports.default = series(openBrowser, parallel(server, watchTasks));
