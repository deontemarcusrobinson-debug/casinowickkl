require('module-alias/register');

var chokidar = require('chokidar');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');

var { snakeToCamel } = require('@/utils/utils.js');

var inputDir = path.join(__dirname, '..', 'views', 'components');
var outputDir = path.join(__dirname, '..', 'assets', 'js', 'ui');

var watcher = chokidar.watch('.', {
    cwd: inputDir,
    persistent: true,
    ignoreInitial: true,
    atomic: false,
    awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
    },
    ignored: (path, stats) => stats?.isFile() && !path.endsWith('.ejs')
});

function inlineIncludes(templateStr, baseDir) {
    return templateStr.replaceAll(/include\((['"`])(.+?)\1\s*,\s*/g, (match, quote, includePath) => {
        var fullPath = path.resolve(baseDir, includePath);

        var file = path.relative(inputDir, fullPath);
        var outputFunctionName = snakeToCamel(path.join(path.dirname(file), path.basename(file, '.ejs')).split(path.sep).join('_'));

        return outputFunctionName + '(';
    }).replaceAll(/include\((['"`])(.+?)\1\s*/g, (match, quote, includePath) => {
        var fullPath = path.resolve(baseDir, includePath);

        var file = path.relative(inputDir, fullPath);
        var outputFunctionName = snakeToCamel(path.join(path.dirname(file), path.basename(file, '.ejs')).split(path.sep).join('_'));

        return outputFunctionName + '(';
    });
}

function processComponents(callback){
    fs.readdir(inputDir, { recursive: true, encoding: 'utf-8' }, function(err1, files) {
        if(err1) return callback(err1);

        function runNext(index){
            if(index >= files.length) return callback(null);

            if(path.extname(files[index]) != '.ejs') return runNext(index + 1);

            buildComponent(files[index], false, function(err2){
                if(err2) return callback(err2);

                runNext(index + 1);
            });
        }

        runNext(0);
    });
}

function buildComponent(file, parents, callback){
    var templatePath = path.join(inputDir, file);
    var outputFileName = path.join(path.dirname(file), path.basename(file, '.ejs') + '.js');
    var outputFunctionName = snakeToCamel(path.join(path.dirname(file), path.basename(file, '.ejs')).split(path.sep).join('_'));
    var outputPath = path.join(outputDir, outputFileName);

    var template = fs.readFileSync(templatePath, 'utf-8');
    var compiledFunction = ejs.compile(template, { client: true }).toString();

    var fullTemplate = inlineIncludes(compiledFunction, path.dirname(templatePath));

    var outputJS = `
function ${outputFunctionName}(edata) {
    ${fullTemplate}
    return anonymous(edata);
}
    `.trim();

    fs.mkdir(path.dirname(outputPath), { recursive: true }, function(err1) {
        if(err1) return callback(err1);

        fs.writeFile(outputPath, outputJS, function(err2) {
            if(err2) return callback(err2);

            console.log('\x1B[33m[components] component ' + file + ' compiled to ' + outputFileName);

            callback(null);
        });
    });
}

function initComponents(callback){
    fs.access(outputDir, function(err1){
        if(err1) {
            return fs.mkdir(outputDir, { recursive: true }, function(err2) {
                if(err2) return callback(err2);

                processComponents(callback);
            });
        }

        fs.readdir(outputDir, function(err2, files) {
            if(err2) return callback(err2);

            if(files.length <= 0) return processComponents(callback);

            function runNext(i) {
                if(i >= files.length) return processComponents(callback);

                var filePath = path.join(outputDir, files[i]);

                fs.rm(filePath, { recursive: true }, function(err3) {
                    if(err3) return callback(err3);

                    runNext(i + 1);
                });
            }

            runNext(0);
        });
    });
}

if(process.argv[2] == '--watch'){
    watcher.on('add', function(file){
        console.log('\x1B[33m[components] component ' + file + ' added');

        buildComponent(file, true, function(err1){
            if(err1) {
                console.log('\x1b[31m[components] ' + err1.message);

                process.exit(1);
            }

            console.log('\x1B[32m[components] all components compiled successfully');
        });
    });

    watcher.on('change', function(file){
        console.log('\x1B[33m[components] component ' + file + ' changed');

        buildComponent(file, true, function(err1){
            if(err1) {
                console.log('\x1b[31m[components] ' + err1.message);

                process.exit(1);
            }

            console.log('\x1B[32m[components] all components compiled successfully');
        });
    });

    watcher.on('unlink', function(file){
        console.log('\x1B[33m[components] component ' + file + ' removed');

        var outputFileName = path.join(path.dirname(file), path.basename(file, '.ejs') + '.js');
        var outputPath = path.join(outputDir, outputFileName);

        fs.unlink(outputPath, function(err1) {
            if(err1) {
                console.log('\x1b[31m[components] ' + err1.message);

                process.exit(1);
            }

            console.log('\x1B[32m[components] all components compiled successfully');
        });
    });
} else {
    initComponents(function(err1){
        if(err1) {
            console.log('\x1b[31m[components] ' + err1.message);

            process.exit(1);
        }

        console.log('\x1B[32m[components] all components compiled successfully');

        process.exit(0);
    });
}