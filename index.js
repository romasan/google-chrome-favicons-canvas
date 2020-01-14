const fs = require('fs'); 
const md5Hex = require('md5-hex');
const _ = require('lodash');
const Canvas = require("canvas");
const colorThief = require('color-thief-node');
const { rgbToHex, rgbToDec } = require('./helpers');
const path = require('path');
const hd = require('humanize-duration');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const sql = require('sql');
require('require-sql');
const initsql = require('./shemas/init.sql');
// console.log('---', initsql.replace(/[\t\n\r]+/ig, ' '));
// const { Parser } = require('node-sql-parser');
// const parser = new Parser();
// const ast = parser.astify(initsql.replace(/[\t\n\r]+/ig, ' '));
// console.log({ast});
sql.setDialect('sqlite');
const colors = sql.define({
    name: 'colors',
    columns: ['id', 'dec', 'hex', 'path', 'hash', 'image', 'width', 'height']
});

// console.log('--- sql:', Object.keys(sql));
// console.log('--- sql:', sql.create('select * from qwe;'));

/*
const size = 16;

const start = Date.now();

const drawData = data => {
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
        AS >= BS ? 1 : -1
    ));
    lines = _.flatten(lines)

    const canvassize = side * size;
    
    const canvas = new Canvas.Canvas(canvassize, canvassize, "png");
    const ctx = canvas.getContext('2d');

    for (const i in lines) {
        const x = i % side;
        const y = parseInt(i / side);

        // ctx.fillStyle = lines[i].hex;
        // ctx.fillRect(canvassize + (x * size), y * size, size, size);

        ctx.drawImage(lines[i].image, x * size, y * size);
    }
    fs.writeFileSync("out.png", canvas.toBuffer());

    // const MiB = 1024 * 1024;
    // const used_memory = '~' + parseFloat(( process.memoryUsage().heapUsed / MiB ).toFixed(2)) + ' MiB';
    console.log('Done', hd(Date.now() - start));
}
*/

// const query = new icons.create();
// console.log('--- query:', query.toQuery());

// const query = favicon_bitmaps
//     .select(favicon_bitmaps.id, favicon_bitmaps.image_data)
//     .from(favicon_bitmaps)
//     .where(favicon_bitmaps.width.equals(size))
//     .toString();

const findNearest = (arr, value) => arr.reduce((prev, curr) => (
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
));

let dbfilepath = './db.sqlite';

// const fsSync = func => (path, options = {}) => new Promise((resolve, reject) => {
//     func(path, options, (err, data) => err ? reject(err) : resolve(data));
// });

// const readdir = fsSync(fs.readdir);
// const readFile = fsSync(fs.readFile);

const imageInfo = (src, pixels = false) => {
    const image = new Canvas.Image;
    image.src = src;
    const { width, height } = image;

    const color = colorThief.getColor(image);
    // const hex = rgbToHex(color);
    // const dec = rgbToDec(color);
    // const hash = md5Hex(input);

    if (pixels) {
        const canvas = new Canvas.Canvas(width, height, "png");
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        for (let y = 0; y < height; y++) {
            pixels = [];
            for (let x = 0; x < width; x++) {
                pixels[y] = pixels[y] || [];
                pixels[y].push( [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)] );
                // const pixelHex = rgbToHex(rgb);
                // const pixelDec = rgbToDec(color);
                // console.log({ x, y, pixelHex, pixelDec });
            }
        }
    }

    return {
        width,
        height,
        color,
        ...(pixels && { pixels })
    }
}

const assetsPath = './assets/';

const addAssetsToDB = (db, wipeBefore) => {

    if (wipeBefore) {
        const query = colors
            .delete()
            .toString();
        db.exec(query);
        return;
    }

    const assets = fs.readdirSync(assetsPath, {
        withFileTypes: true,
    });

    assets
        .filter(e => e.isFile())
        .map(e => assetsPath + e.name)
        .forEach(path => {
            const buf = fs.readFileSync(path);
            const info = imageInfo(buf);
            const query = colors
                .insert({
                    dec: rgbToDec(info.color),
                    hex: rgbToHex(info.color),
                    path,
                    hash: md5Hex(buf),
                    image: buf,
                    width: info.width,
                    height: info.height,
                })
                .toString();
            console.log('add:', path);
            db.exec(query);
        });
}

const getAssetsFromDB = db => {
    console.log('---', Object.keys(colors))
    // const query = colors
    //     .select(...colors)
    //     .from(colors)
    // return db.all(query);
}
const action = 'add';

const init = () => {
    sqlite.open(dbfilepath).then(async db => {
        await db.exec(initsql);
        const input = fs.readFileSync('./input.png');

        switch (action) {
            case 'add':
                const wipeBefore = true;
                addAssetsToDB(db, wipeBefore);
                break;
            case 'draw':
                // const assets = await getAssetsFromDB(db);
                // getAssetsFromDB(db);
                break;
        }
        

        // const image = imageInfo(input, true);
        // console.log('--- image:', image);

        // console.log({
        //     dec,
        //     hex,
        //     path,
        //     hash,
        //     image,
        //     width,
        //     height,
        // });

        // const canvas = new Canvas.Canvas(width * 2, height * 2, "png");
        // const ctx = canvas.getContext('2d');

        // for (let i = 0; i < 4; i++) {
        //     const x = i % 2;
        //     const y = parseInt(i / 2);
        //     ctx.drawImage(image, x * width, y * height);
        // }

        // fs.writeFileSync("output.png", canvas.toBuffer());
    });
}

fs.exists(dbfilepath, exists => {
    if (exists) {
        init();
    } else {
        console.log(`Error: file "${dbfilepath}" not found.`);
        new sqlite3.Database(
            dbfilepath, 
            sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
            err => { 
                if (err) {
                    console.log('Error: database don\'t created', err);
                    return;
                }
                console.log('New database created', dbfilepath);
                init();
            }
        );
    }
});
