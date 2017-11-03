// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

let fs = require('fs');
let classReadLine = require('readline');
var split = require('split')

let rsReadStream = fs.createReadStream('./EarhartFellowsMerged.rtf');
let wsWriteStream = fs.createWriteStream('./output.csv');
let regexDelimiter = /Graduate Fellowship(s)/;

main();

function main() {
    let rl = classReadLine.createInterface({
        input: rsReadStream
    });

    rl.on('line', (sLine) => {
        if (sLine.toLowerCase().includes('address')) { //address is for testing only
            wsWriteStream.write(convertToPlain(sLine));
            wsWriteStream.write('\n');
        }
    });

    rsReadStream
        .pipe(split(regexDelimiter))
        .on('data', fHandleData)
}

function fHandleData(sSplitData) {
    console.log(sSplitData);
}

// ref: https://stackoverflow.com/questions/29922771/convert-rtf-to-and-from-plain-text
function convertToRtf(plain) {
    plain = plain.replace(/\n/g, "\\par\n");
    return "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang2057{\\fonttbl{\\f0\\fnil\\fcharset0 Microsoft Sans Serif;}}\n\\viewkind4\\uc1\\pard\\f0\\fs17 " + plain + "\\par\n}";
}

// ref: https://stackoverflow.com/questions/29922771/convert-rtf-to-and-from-plain-text
// not sure if it works w/ streams
function convertToPlain(rtf) {
    rtf = rtf.replace(/\\par[d]?/g, "");
    return rtf.replace(/\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g, "").trim();
}
