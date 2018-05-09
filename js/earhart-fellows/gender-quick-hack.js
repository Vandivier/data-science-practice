// based on earhart-fellows/index.js; this file is meant to take a single column of first names and append a column of gender; it could become a seperate utility or package.

// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

const beautify = require('js-beautify').js_beautify;
const fs = require('fs');
const genderize = require('genderize');
const reorder = require('csv-reorder');
const split = require('split');
const utils = require('ella-utils');

const OSEOL = require('os').EOL;
const oTitleLine = {
    'iInputRow': 'inputrownumber',
    'sGenderizedName': 'recipientgenderizedname',
    'sGender': 'gender',
    'sGenderProbability': 'genderprobability', // TODO: iGenderProbability ?
};

// TODO: conventionalize var name to column title line value
// proposed rule: encounter each capital letter; splice before first letter and insert spaces in other cases
const arrTableColumnKeys = [
    'iInputRow',
    'sGenderizedName',
    'sGender',
    'sGenderProbability',
];

const regexDelimiter = new RegExp(OSEOL);

const sFirstNameCacheFile = './first-name-cache.json';
const sOrderedOutputFilePath = './quick-genderize-ordered-output.csv';
const sOutputFilePath = './quick-genderize-output.csv';

let rsReadStream = fs.createReadStream('./quick-genderize-input.csv');
let wsWriteStream = fs.createWriteStream(sOutputFilePath);

let oFirstNameCache = JSON.parse(fs.readFileSync(sFirstNameCacheFile, 'utf8'));
let bVeryFirstRecordDone = false; // very first record has only name, nothing else; skip this record
let iCurrentRowNumber = 1;

main();

async function main() {
    //await utils.fpWait(5000); // only needed to give debugger time to attach
    fsRecordToCsvLine(oTitleLine);

    if (typeof oFirstNameCache == 'object') { // don't waste time or genderize requests if there's a problem
        fParseTxt();
    } else {
        console.log('error obtaining oFirstNameCache');
    }
}

function fParseTxt() {
    rsReadStream
        .pipe(split(regexDelimiter))
        .on('data', fpHandleData)
        .on('close', fpNotifyEndProgram);
}

async function fpHandleData(sRow) {
    let oRecord = {};

    if (!bVeryFirstRecordDone) {
        bVeryFirstRecordDone = true;
        return;
    }

    oRecord.arrSplitByComma = sRow
        .split(',')
        .map(s => s.trim());
    iCurrentRowNumber++;
    oRecord.iInputRow = iCurrentRowNumber;

    try {
        await fpParseGender(oRecord);
    } catch (e) {
        console.log('fpParseGender error', oRecord, e);
    }

    console.log(oRecord);
    fsRecordToCsvLine(oRecord);
}

function fsRecordToCsvLine(oRecord) {
    utils.fsRecordToCsvLine(oRecord, arrTableColumnKeys, wsWriteStream);
}

async function fpNotifyEndProgram() {
    let sBeautifiedData;

    await utils.fpWait(10000); // allow ongoing processes to hopefully complete; not guaranteed

    sBeautifiedData = JSON.stringify(oFirstNameCache);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    fs.writeFile(sFirstNameCacheFile, sBeautifiedData, 'utf8', (err) => {
        reorder({
            input: sOutputFilePath, // too bad input can't be sBeautifiedData
            output: sOrderedOutputFilePath,
            sort: 'inputrownumber'
        })
        .then(metadata => {
            console.log('Program completed.');
        })
        .catch(error => {
            console.log('Program completed with error.', error);
        });
    });
}

async function fpParseGender(oRecord) {
    let sFirstName = oRecord.arrSplitByComma[0];

    return new Promise(function (resolve, reject) {
        let oCachedResult = oFirstNameCache[sFirstName];

        if (oCachedResult
            && oCachedResult.gender)
        {
            oRecord.sGenderizedName = sFirstName;
            oRecord.sGender = oCachedResult.gender;
            oRecord.sGenderProbability = oCachedResult.probability;
            resolve();
        } else {
            genderize(sFirstName, function (err, obj) {
                if (err || !obj) {
                    resolve();
                } else {
                    oRecord.sGenderizedName = sFirstName;
                    oRecord.sGender = obj.gender;
                    oRecord.sGenderProbability = obj.probability;
                    oFirstNameCache[sFirstName] = {};
                    oFirstNameCache[sFirstName].gender = obj.gender;
                    oFirstNameCache[sFirstName].probability = obj.probability;
                    resolve();
                }
            });
        }
    });
}
