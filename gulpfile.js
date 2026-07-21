var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var cleanCss = require('gulp-clean-css');
var obfuscatorJs = require('gulp-javascript-obfuscator');

var manifestPath = path.join(__dirname, 'manifest.json');

function updateManifest(key, hash) {
    var manifest = {};

    if(fs.existsSync(manifestPath)) manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    var oldHash = manifest[key];

    manifest[key] = hash;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));

    return oldHash;
}

gulp.task('pack-app-js', function () {
    var hash = crypto.randomBytes(8).toString('hex');

    var oldHash = updateManifest('app_js_version', hash);

    return gulp.src([
            'assets/js/app.js'
        ], { base: 'assets/js' })
        .pipe(obfuscatorJs({
            compact: true,
            controlFlowFlattening: false,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: false,
            stringArray: true,
            stringArrayEncoding: [ 'base64' ],
            stringArrayThreshold: 0.75,
            transformObjectKeys: false
        }))
        .pipe(rename({ suffix: '.' + hash }))
        .pipe(gulp.dest('public/js'))
        .on('end', function () {
            if(oldHash) {
                var oldFile = path.join(__dirname, 'public/js/app.' + oldHash + '.js');

                if(fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
        });
});

gulp.task('pack-auth-js', function () {
    var hash = crypto.randomBytes(8).toString('hex');

    var oldHash = updateManifest('auth_js_version', hash);

    return gulp.src([
            'assets/js/auth.js'
        ], { base: 'assets/js' })
        .pipe(obfuscatorJs({
            compact: true,
            controlFlowFlattening: false,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: false,
            stringArray: true,
            stringArrayEncoding: [ 'base64' ],
            stringArrayThreshold: 0.75,
            transformObjectKeys: false
        }))
        .pipe(rename({ suffix: '.' + hash }))
        .pipe(gulp.dest('public/js'))
        .on('end', function () {
            if(oldHash) {
                var oldFile = path.join(__dirname, 'public/js/auth.' + oldHash + '.js');

                if(fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
        });
});

gulp.task('pack-graph-js', function () {
    var hash = crypto.randomBytes(8).toString('hex');

    var oldHash = updateManifest('graph_js_version', hash);

    return gulp.src([
            'assets/js/graph.js'
        ], { base: 'assets/js' })
        .pipe(obfuscatorJs({
            compact: true,
            controlFlowFlattening: false,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: false,
            stringArray: true,
            stringArrayEncoding: [ 'base64' ],
            stringArrayThreshold: 0.75,
            transformObjectKeys: false
        }))
        .pipe(rename({ suffix: '.' + hash }))
        .pipe(gulp.dest('public/js'))
        .on('end', function () {
            if(oldHash) {
                var oldFile = path.join(__dirname, 'public/js/graph.' + oldHash + '.js');

                if(fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
        });
});

gulp.task('pack-components-js', function () {
    var hash = crypto.randomBytes(8).toString('hex');

    var oldHash = updateManifest('components_js_version', hash);

    return gulp.src([
            'assets/js/utils/**/*.js',
            'assets/js/components/**/*.js',
            'assets/js/ui/**/*.js'
        ])
        .pipe(concat('components.js'))
        .pipe(obfuscatorJs({
            compact: true,
            controlFlowFlattening: false,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: false,
            debugProtection: false,
            stringArray: true,
            stringArrayEncoding: [ 'base64' ],
            stringArrayThreshold: 0.75,
            transformObjectKeys: false
        }))
        .pipe(rename({ suffix: '.' + hash }))
        .pipe(gulp.dest('public/js'))
        .on('end', function () {
            if(oldHash) {
                var oldFile = path.join(__dirname, 'public/js/components.' + oldHash + '.js');

                if(fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
        });
});

gulp.task('pack-globals-css', function () {
    var hash = crypto.randomBytes(8).toString('hex');

    var oldHash = updateManifest('globals_css_version', hash);

    return gulp.src(['assets/css/**/*.css'])
        .pipe(concat('globals.css'))
        .pipe(cleanCss())
        .pipe(rename({ suffix: '.' + hash }))
        .pipe(gulp.dest('public/css'))
        .on('end', function () {
            if(oldHash) {
                var oldFile = path.join(__dirname, 'public/css/globals.' + oldHash + '.css');

                if(fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
        });
});

gulp.task('pack', gulp.series('pack-app-js', 'pack-auth-js', 'pack-graph-js', 'pack-components-js', 'pack-globals-css'));

gulp.task('watch', function () {
    gulp.watch([
        'assets/js/app.js'
    ], { delay: 5000, queue: false }, gulp.series('pack-app-js'));

    gulp.watch([
        'assets/js/auth.js'
    ], { delay: 5000, queue: false }, gulp.series('pack-auth-js'));

    gulp.watch([
        'assets/js/graph.js'
    ], { delay: 5000, queue: false }, gulp.series('pack-graph-js'));

    gulp.watch([
        'assets/js/utils/**/*.js',
        'assets/js/components/**/*.js',
        'assets/js/ui/**/*.js'
    ], { delay: 5000, queue: false }, gulp.series('pack-components-js'));

    gulp.watch([
        'assets/css/**/*.css'
    ], { delay: 5000, queue: false }, gulp.series('pack-globals-css'));
});

gulp.task('default', gulp.series('pack', 'watch'));