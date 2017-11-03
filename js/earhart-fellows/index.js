// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

const OSEOL = require('os').EOL;

let fs = require('fs');
let classReadLine = require('readline');
let split = require('split');

let rsReadStream = fs.createReadStream('./EarhartFellowsMerged.rtf');
let wsIntermediate = fs.createWriteStream('./intermediate.txt');
let wsWriteStream = fs.createWriteStream('./output.csv');
let regexDelimiter = /Graduate Fellowship(s)/;

main();

async function main() {
    try {
        await fpConvertRtfToTxt();
    } catch (error) {
        console.error('fpConvertRtfToTxt failed.\n');
    }

    fParseTxt();
}

// return a promise which indicates that txt is written
function fpConvertRtfToTxt() {
    let rl = classReadLine.createInterface({
        input: rsReadStream
    });

    rl.on('line', (sLine) => {
        if (sLine.toLowerCase().includes('address')) { //address is for testing only
            wsIntermediate.write(convertToPlain(sLine) + OSEOL);
        }
    });

    return fpStreamToPromise(rsReadStream);
}

function fParseTxt() {
    let rl = classReadLine.createInterface({
        input: rsReadStream
    });

    rsReadStream
        .pipe(split(regexDelimiter))
        .on('data', fHandleData)
        .on('close', fNotifyEndProgram);
}

function fHandleData(sSplitData) {
    //wsWriteStream.write(convertToPlain(sSplitData));
    let sParsedBlock = convertToPlain(sSplitData);

    if (sParsedBlock.toLowerCase().includes('address')) { //address is for testing only
        wsWriteStream.write(sParsedBlock);
        wsWriteStream.write('\n');
    }
}

function fNotifyEndProgram() {
    console.log('Program completed.');
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

// ref: https://github.com/petkaantonov/bluebird/issues/332
function fpStreamToPromise(stream) {
    return new Promise(function (resolve, reject) {
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}
