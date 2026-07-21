var fs = require('fs');
var path = require('path');

var manifestPath = path.join(__dirname, '..', '..', 'manifest.json');

var manifest = async (req, res, next) => {
    try {
        res.locals.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (err1) {
        res.locals.manifest = {};
    }

    next();
}

module.exports = manifest;