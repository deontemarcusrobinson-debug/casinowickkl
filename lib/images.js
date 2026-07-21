var sharp = require('sharp');

function getImageMime(buffer) {
    if(buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
    if(buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
    if(buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';

    if(buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
        var brand = buffer.slice(8, 12).toString('ascii');

        if([ 'avif', 'avis' ].includes(brand)) return 'image/avif';
        if([ 'heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1' ].includes(brand)) return 'image/heic';
    }

    if(buffer[0] === 0x42 && buffer[1] === 0x4D) return 'image/bmp';
    if((buffer[0] === 0x49 && buffer[1] === 0x49) || (buffer[0] === 0x4D && buffer[1] === 0x4D)) return 'image/tiff';
    if(buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) return 'image/x-icon';

    var start = buffer.slice(0, 64).toString('utf8').trimStart();
    if(start.startsWith('<?xml') || start.startsWith('<svg')) return 'image/svg+xml';

    return null;
}

function convertImage(image, mime, callback) {
    if(mime == 'image/jpeg') return image.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toBuffer(callback);
    if(mime == 'image/png') return image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer(callback);
    if(mime == 'image/webp') return image.webp({ quality: 80, effort: 4 }).toBuffer(callback);
    if(mime == 'image/avif') return image.avif({ quality: 50, effort: 4 }).toBuffer(callback);
    if(mime == 'image/tiff') return image.tiff({ quality: 80, compression: 'lzw' }).toBuffer(callback);

    return callback(new Error('Output format not supported'));
}

function resizeBuffer(buffer, size, callback) {
    sharp(buffer).metadata(function(err1, metadata) {
        if(err1) return callback(err1);

        var width = metadata.width;
        var height = metadata.height;

        var newWidth, newHeight;

        if (width == height) {
            newWidth = size;
            newHeight = size;
        } else if (width > height) {
            newWidth = size;
            newHeight = null;
        } else {
            newWidth = null;
            newHeight = size;
        }

        var animated = metadata.pages && metadata.pages > 1;

        var image = sharp(buffer, { animated }).resize(newWidth, newHeight, { fit: 'inside' });
        var mime = getImageMime(buffer);

        return convertImage(image, mime, callback);
    });
}

module.exports = {
    getImageMime, resizeBuffer
}