module.exports = function rgbToHex(color) {
    return '#' + color
        .map(e => e.toString(16))
        .map(e => e.length > 1 ? e : '0' + e)
        .join('');
}