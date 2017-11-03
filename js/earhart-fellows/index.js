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
    //fWriteFirstName();
    fParseTxt();
}

function fParseTxt() {
    rsReadStream
        .pipe(split(regexDelimiter))
        .on('data', fHandleData)
        .on('close', fNotifyEndProgram);
}

function fHandleData(sSplitData) {
    let oRecord = {};

    fParseAcademicYear(sSplitData, oRecord);
    fParseGraduateInstitution(sSplitData, oRecord);
    fParseAreaOfStudy(sSplitData, oRecord);
    fParseSponsors(sSplitData, oRecord);
    fParseCompletionDegree(sSplitData, oRecord);
    fParseCompletionYear(sSplitData, oRecord);
    fParseMailingAddress(sSplitData, oRecord);
    fParseEmailAddress(sSplitData, oRecord);
    fParseDeceased(sSplitData, oRecord);

    wsWriteStream.write(fsRecordToCsvLine(oRecord));
    wsWriteStream.write(OSEOL);
}

function fsRecordToCsvLine() {
    
}

function fNotifyEndProgram() {
    console.log('Program completed.');
}

function fParseAcademicYear(sSplitData, oRecord) {
    
}

function fParseGraduateInstitution(sSplitData, oRecord) {
    
}

function fParseAreaOfStudy(sSplitData, oRecord) {
    
}

function fParseSponsors(sSplitData, oRecord) {
    
}

function fParseCompletionDegree(sSplitData, oRecord) {
    
}

function fParseMailingAddress(sSplitData, oRecord) {
    
}

function fParseEmailAddress(sSplitData, oRecord) {
    
}

function fParseDeceased(sSplitData, oRecord) {
    
}
