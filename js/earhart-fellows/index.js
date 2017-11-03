// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

const OSEOL = require('os').EOL;

let fs = require('fs');
let split = require('split');

let rsReadStream = fs.createReadStream('./EarhartFellowsMerged.txt');
let wsWriteStream = fs.createWriteStream('./output.csv');
let regexDelimiter = /Graduate Fellowship\(s\)/;

main();

async function main() {
    //fWriteFirstName()
    fParseTxt();
}

function fParseTxt() {
    rsReadStream
        .pipe(split(regexDelimiter))
        .on('data', fHandleData)
        .on('close', fNotifyEndProgram);
}

function fHandleData(sSplitData) {
    //wsWriteStream.write(convertToPlain(sSplitData));
    let sParsedBlock = sSplitData;

    if (sParsedBlock.toLowerCase().includes('address')) { //address is for testing only
        wsWriteStream.write(sParsedBlock);
        wsWriteStream.write(OSEOL);
    }
}

function fNotifyEndProgram() {
    console.log('Program completed.');
}

// ref: https://github.com/petkaantonov/bluebird/issues/332
function fpStreamToPromise(stream) {
    return new Promise(function (resolve, reject) {
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}
