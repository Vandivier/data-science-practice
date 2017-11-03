// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

const arrSeasons = ['sprin', 'summe', 'fall ', 'winte'];
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
    'bDeceased': 'Deceased'
};

let fs = require('fs');
let split = require('split');

let rsReadStream = fs.createReadStream('./EarhartFellowsMerged.txt');
let wsWriteStream = fs.createWriteStream('./output.csv');
let regexDelimiter = /Graduate Fellowship\(s\)/;
let sVeryFirstName = 'ABBAS, Hassan'; // it gets parsed out bc above delimiter
let bVeryFirstRecordDone = false; // very first record has only name, nothing else; skip this record

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

function fHandleData(sParsedBlock) {
    let oRecord = {};

    if (!bVeryFirstRecordDone) {
        bVeryFirstRecordDone = true;
        return;
    }

    oRecord.arrSplitByLineBreak = sParsedBlock.split(/(\r\n|\r|\n)/g);
    oRecord.sCommaCollapsedBlock = oRecord.arrSplitByLineBreak.join(',');
    oRecord.sCommaCollapsedBlock = sParsedBlock.replace(/[\r\n|\r|\n|;|,]+/g, ',');

    try {
        fParseName(sParsedBlock, oRecord);
        fParseAcademicYear(sParsedBlock, oRecord);
        fParseGraduateInstitution(sParsedBlock, oRecord);
        fParseAreaOfStudy(sParsedBlock, oRecord);
        fParseSponsors(sParsedBlock, oRecord);
        fParseCompletionDegree(sParsedBlock, oRecord);
        fParseCompletionYear(sParsedBlock, oRecord);
        fParseMailingAddress(sParsedBlock, oRecord);
        fParseEmailAddress(sParsedBlock, oRecord);
        fParseDeceased(sParsedBlock, oRecord);
    }
    catch (e) {
        console.log('err', oRecord);
    }

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
                + '"' + oRecord.bDeceased + '"'

    wsWriteStream.write(sToCsv + OSEOL);
}

function fNotifyEndProgram() {
    console.log('Program completed.');
}

function fParseName(sParsedBlock, oRecord) {
    if (sVeryFirstName) {
        oRecord.sName = sVeryFirstName;
        sVeryFirstName = '';
    } else {
        oRecord.sName = oRecord.arrSplitByLineBreak[oRecord.arrSplitByLineBreak.length - 3];
    }
}

// TODO: multiple years
function fParseAcademicYear(sParsedBlock, oRecord) {
    var arrsAcademicYears = [],
        bSeasonMatch,
        iCurrentLine = 2, // first possible line w year on it
        sToCheck;

    for (iCurrentLine; iCurrentLine < oRecord.arrSplitByLineBreak.length; iCurrentLine++) {
        sToCheck = oRecord.arrSplitByLineBreak[iCurrentLine].trim();
        oRecord.iLastAcademicYearLine = iCurrentLine;

        if (!isNaN(sToCheck[0])
            || fbSeasonMatch(sToCheck))
        {
            arrsAcademicYears.push(sToCheck);
        }
        else if (!sToCheck) { // continue
        }
        else {
            oRecord.iLastAcademicYearLine -= 1;
            break;
        }
    }

    oRecord.sAcademicYear = arrsAcademicYears.join(',');
}

function fParseGraduateInstitution(sParsedBlock, oRecord) {
    let sWorkingText = oRecord.arrSplitByLineBreak[oRecord.iLastAcademicYearLine + 1];
    oRecord.sGraduateInstitution = sWorkingText.split(',')[0];
}

function fParseAreaOfStudy(sParsedBlock, oRecord) {
    oRecord.sAreaOfStudy = oRecord
                        .sCommaCollapsedBlocksWorkingText
                        .split(oRecord.sGraduateInstitution)[1]
                        .split(',')[0];
}

function fParseSponsors(sParsedBlock, oRecord) {
    
}

function fParseCompletionDegree(sParsedBlock, oRecord) {
    
}

function fParseCompletionYear(sParsedBlock, oRecord) {
    
}

function fParseMailingAddress(sParsedBlock, oRecord) {
    
}

function fParseEmailAddress(sParsedBlock, oRecord) {
    
}

function fParseDeceased(sParsedBlock, oRecord) {
    oRecord.bDeceased = sParsedBlock.toLowerCase().includes('deceased');
}

function fbSeasonMatch(sToCheck) {
    return arrSeasons.includes(sToCheck.toLowerCase().slice(0,5));
}
