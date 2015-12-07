var gulp = require('gulp');
var ts = require('gulp-typescript');
var sm = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var tsProject = ts.createProject('src/tsconfig.json');

var through = require('through2');

function logFileHelpers() {
    return through.obj((file, enc, cb) => {
        console.log(file.babel.usedHelpers);
        cb(null, file);
    });
}


gulp.task('default', ['build']);

// var fs = require('fs');
//
// var template = fs.readFileSync('./umd.jst', 'utf8');

var es2015  = require('babel-preset-es2015');
var transform = require('babel-plugin-transform-runtime');
var umd = require('gulp-umd');
gulp.task("build", [], function () {
    var g = gulp
        .src(['src/**/*.ts'])
        .pipe(sm.init())
        .pipe(ts(tsProject));
    g.dts.pipe(gulp.dest('out'));
    return g.js
         .pipe(babel({
             presets: [es2015],
            // plugins:[transform]
        }))


         .pipe(umd({
            // exports:function(){return 'exports'},
             template: './umd.jst'
         }))


        .pipe(sm.write())

        .pipe(gulp.dest('out'));
});

gulp.task('watch', ['build'],function(){
      gulp.watch(['src/**/*.ts'], ['build']);
});

//
// gulp.task('bable', function(){
//     return gulp
//         .src(['out/**/*.js'])
//         .pipe(babel({
//         presets: [es2015],
//         plugins:[transform]
//    }))
//      //.pipe(logFileHelpers)
//   .pipe(gulp.dest('out/b'));
// });
