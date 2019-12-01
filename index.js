const fs = require('fs'); 
const sqlite = require('sqlite');
const sql = require('sql');
const md5Hex = require('md5-hex');
const _ = require('lodash');
const Canvas = require("canvas");
const colorThief = require('color-thief-node');
const rgbToHex = require('./rgbToHex.js');
const rgbToHsl = require('./rgbToHsl.js');
var path = require('path');
const hd = require('humanize-duration');

const size = 16;

const start = Date.now();

const drawData = data => {
    // let lines = data.sort(e => Math.random() - .5);
    let lines = data.map(e => {
        const buf = e.image_data;

        let image = new Canvas.Image;
        image.src = buf;

        const color = colorThief.getColor(image);
        const hsl = rgbToHsl(color);
        // const hex = rgbToHex(color)
        const hash = md5Hex(buf);

        return {
            color,
            // hex,
            image,
            hsl,
            hash,
        }
    });
    lines = _.uniqBy(lines, 'hash');

    const side = Math.ceil(Math.sqrt(lines.length));

    lines.sort((a, b) => a.hsl[0] - b.hsl[0]);

    lines = _.chunk(lines, side);
    lines.forEach(line => line.sort(({hsl: [AH, AS, AL]}, {hsl: [BH, BS, BL]}) => 
        AS >= BS
            ? 1
            : -1
    ));
    lines = _.flatten(lines)
    
    const canvas = new Canvas.Canvas(side * size, side * size, "png");
    const ctx = canvas.getContext('2d');

    // const i = 0;
    for (const i in lines) {
        const x = i % side;
        const y = parseInt(i / side);

        // ctx.fillStyle = lines[i].hex;
        // ctx.fillRect((side * size) + (x * size), y * size, size, size);

        ctx.drawImage(lines[i].image, x * size, y * size);
    }
    fs.writeFileSync("out.png", canvas.toBuffer());
    // const MiB = 1024 * 1024;
    // const used_memory = '~' + parseFloat(( process.memoryUsage().heapUsed / MiB ).toFixed(2)) + ' MiB';
    console.log('Done', hd(Date.now() - start));
}

const favicon_bitmaps = sql.define({
    name: 'favicon_bitmaps',
    columns: ['id', 'image_data', 'width']
});
const query = favicon_bitmaps
    .select(favicon_bitmaps.id, favicon_bitmaps.image_data)
    .from(favicon_bitmaps)
    .where(favicon_bitmaps.width.equals(size))
    .toString();

const getData = () => {
    
    const base = sqlite.open(dbfilepath);
    base.then(db => {
        db.all(query).then(drawData)
    });
}

let dbfilepath = ''
switch(process.platform) {
    case 'win32': dbfilepath = path.resolve(process.env.HOMEPATH + '/AppData/Local/Google/Chrome/User Data/Default/Favicons');break;
    case 'linux': dbfilepath = path.resolve(process.env.HOME + '/.config/google-chrome/Default/Favicons');break;
    case 'darwin': dbfilepath = path.resolve(process.env.HOME + '/Library/Application Support/Google/Chrome/Default/Favicons');break;
    default: console.log('Error: unknown platform:', process.platform);return;
}

fs.exists(dbfilepath, exists => {
    if (exists) {
        getData();
    } else {
        console.log(`Error: file "${dbfilepath}" not found.`);
    }
});

/*
const { Parser } = require('node-sql-parser');
const parser = new Parser();
const ast = parser.astify('');
const csv = require('csv-parser')

let sql = '';
fs.createReadStream(__dirname + '\\icons.sql', {encoding : 'utf-8'})
// .pipe(csv())
.on('data', function(data){
    count++;
    sql += data
})
.on('end',function(){
    let lines = sql.split('\n');
});
*/