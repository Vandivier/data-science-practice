// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

const OSEOL = require('os').EOL;
const oTitleLine = {
    'sName': 'Name',
    'sAcademicYear': 'Academic Year',
    'sGraduateInstitution': 'Graduate Institution',
    'sAreaOfStudy': 'Area of Study',
    'sSponsors': 'Sponsors',
    'sCompletionDegree': 'Completion Degree',
    'sCompletionYear': 'Completion Year',
    'sMailingAddress': 'Mailing Address',
    'sEmailAddress': 'Email Address',
    'sDeceased': 'Deceased'
};

let fs = require('fs');
let split = require('split');

let rsReadStream = fs.createReadStream('./EarhartFellowsMerged.txt');
let wsWriteStream = fs.createWriteStream('./output.csv');
let regexDelimiter = /Graduate Fellowship\(s\)/;
let sVeryFirstName = 'ABBAS, Hassan'; // it gets parsed out bc above delimiter

main();

async function main() {
    fsRecordToCsvLine(oTitleLine);
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

    fParseName(sSplitData, oRecord);
    fParseAcademicYear(sSplitData, oRecord);
    fParseGraduateInstitution(sSplitData, oRecord);
    fParseAreaOfStudy(sSplitData, oRecord);
    fParseSponsors(sSplitData, oRecord);
    fParseCompletionDegree(sSplitData, oRecord);
    fParseCompletionYear(sSplitData, oRecord);
    fParseMailingAddress(sSplitData, oRecord);
    fParseEmailAddress(sSplitData, oRecord);
    fParseDeceased(sSplitData, oRecord);

    fsRecordToCsvLine(oRecord);
}

function fsRecordToCsvLine(oRecord) {
    let sToCsv = ''
                + '"' + oRecord.sName + '",'
                + '"' + oRecord.sAcademicYear + '",'
                + '"' + oRecord.sGraduateInstitution + '",'
                + '"' + oRecord.sAreaOfStudy + '",'
                + '"' + oRecord.sSponsors + '",'
                + '"' + oRecord.sCompletionDegree + '",'
                + '"' + oRecord.sCompletionYear + '",'
                + '"' + oRecord.sMailingAddress + '",'
                + '"' + oRecord.sEmailAddress + '",'
                + '"' + oRecord.sDeceased + '"'

    wsWriteStream.write(sToCsv + OSEOL);
}

function fNotifyEndProgram() {
    console.log('Program completed.');
}

function fParseName(sSplitData, oRecord) {
    var arrSplitByLineBreak = sSplitData.split(/(\r\n|\r|\n)/);

    if (sVeryFirstName) {
        oRecord.sName = sVeryFirstName;
        sVeryFirstName = '';
    } else {
        oRecord.sName = arrSplitByLineBreak[arrSplitByLineBreak.length - 3];
    }
}

// TODO: multiple years
function fParseAcademicYear(sSplitData, oRecord) {
    var arrSplitByLineBreak = sSplitData.split(/(\r\n|\r|\n)/),
        iCurrentLine = 2; // first possible line w year on it

    oRecord.sAcademicYear = arrSplitByLineBreak[2];
}

function fParseGraduateInstitution(sSplitData, oRecord) {
    
}

function fParseAreaOfStudy(sSplitData, oRecord) {
    
}

function fParseSponsors(sSplitData, oRecord) {
    
}

function fParseCompletionDegree(sSplitData, oRecord) {
    
}

function fParseCompletionYear(sSplitData, oRecord) {
    
}

function fParseMailingAddress(sSplitData, oRecord) {
    
}

function fParseEmailAddress(sSplitData, oRecord) {
    
}

function fParseDeceased(sSplitData, oRecord) {
    
}
