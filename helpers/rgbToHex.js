module.exports = function rgbToHex(color) {
    return '#' + color
        .map(e => e.toString(16))
        .map(e => e.padStart(2, 0))
        .join('');
}