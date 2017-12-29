// ref: https://github.com/Vandivier/todo-to-csv/blob/master/index.js
// ref: https://github.com/Vandivier/linklist-to-table/blob/master/index.js
// below requires installing a cli tool; last resort
// ref: https://github.com/dbashford/textract
// transform streams ref: https://stackoverflow.com/questions/40781713/getting-chunks-by-newline-in-node-js-data-stream

'use strict';

const fs = require('fs');
const split = require('split');
const utils = require('../grand-tour-study/utils.js');

const arrSeasons = ['sprin', 'summe', 'fall ', 'winte'];
const OSEOL = require('os').EOL;
const oTitleLine = {
    'sName': 'Name',
    'sAcademicYear': 'Academic Year',
    'vMultipleDegrees': 'Multiple Degrees',
    'sGraduateInstitution': 'Graduate Institution',
    'vInstitutionValid': 'Graduate Institution In Validated List',
    'sAreaOfStudy': 'Area of Study',
    'sInvalidPreFixAreaOfStudy': 'Invalid Pre-Fix Area of Study',
    'sInvalidPostFixAreaOfStudy': 'Invalid Post-Fix Area of Study',
    'sSponsors': 'Sponsors',
    'sCompletionDegree': 'Completion Degree',
    'sCompletionYear': 'Completion Year',
    'sMailingAddress': 'Mailing Address',
    'sEmailAddress': 'Email Address',
    'vCharacterAfterPeriod': 'Valid Email Address',
    'bDeceased': 'Deceased'
};

const arrAreas = [
    'Business Administration',
    'Culture',
    'Economics',
    'Education',
    'English',
    'Other',
    'Government/Politics',
    'Health/Welfare',
    'History',
    'International Studies',
    'Law',
    'National Security Studies',
    'Philosophy',
    'Politics',
    'Religion',
    'Sociology'
];

const oAreasWithSpace = {
    'Business,Administration': 'Business Administration',
    'International,Studies': 'International Studies',
    'National,Security,Studies': 'National Security Studies',
    'National,Security Studies': 'National Security Studies',
    'National Security,Studies': 'National Security Studies'
};

const arrGraduateInstitutions = fs.readFileSync('./graduate-instiutions.csv', 'utf8').split(',');
const arrDegrees = ['Ph.D.', 'M.A.', 'D.Phil.', 'MA.', 'M.B.A.', 'Diploma of Advanced Studies', 'J.D.', 'D.B.A.', 'B.A.', 'D.V.M.'];
const regexDelimiter = /Graduate Fellowship* *\(s\)/;
const regexEmail = /[\S]+@[\S]+\.[, \S]+/g;

let rsReadStream = fs.createReadStream('./EarhartMergedNoBoxNoLines.txt');
let wsWriteStream = fs.createWriteStream('./output.csv');
let wsNonAdjacent = fs.createWriteStream('./non-adjacent-sponsor.txt');

let sLastRecordName = 'ABBAS, Hassan'; // it gets parsed out bc above delimiter
let bVeryFirstRecordDone = false; // very first record has only name, nothing else; skip this record
let iNonAdjacent = 0;

main();

async function main() {
    await utils.fpWait(5000); // only needed to give debugger time to attach
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

    sParsedBlock = sParsedBlock.replace(/;/g, ',');
    sParsedBlock = sParsedBlock.replace(/\/\s/g, '/'); // remove whitespace after a slash character
    sParsedBlock = sParsedBlock.replace(/\/[\r\n]+/g, '/'); // remove whitespace after a slash character
    oRecord.arrSplitByLineBreak = sParsedBlock.split(/(\r\n|\r|\n)/g);
    oRecord.sCommaCollapsedBlock = oRecord
        .arrSplitByLineBreak
        .join(',')
        .replace(/(\r\n|\r|\n|,)+/g, ',');

    for (const sKey in oAreasWithSpace) {
        oRecord.sCommaCollapsedBlock = oRecord.sCommaCollapsedBlock.replace(sKey, oAreasWithSpace[sKey]);
    }

    oRecord.arrSplitByComma = oRecord.sCommaCollapsedBlock
        .split(',')
        .filter(truthy => truthy.replace(/\s/g, ''))
        .map(s => s.trim());

    try {
        fParseSponsors(oRecord);

        /* TODO: refactor below to comply with new sponsor parsing approach */
        fParseName(sParsedBlock, oRecord);
        fParseAcademicYear(sParsedBlock, oRecord);
        fParseGraduateInstitution(sParsedBlock, oRecord);
        fParseAreaOfStudy(sParsedBlock, oRecord);


        fParseCompletionDegree(sParsedBlock, oRecord);
        fParseCompletionYear(sParsedBlock, oRecord);
        fParseEmailAddress(sParsedBlock, oRecord);
        fParseDeceased(sParsedBlock, oRecord);
        fParseMailingAddress(sParsedBlock, oRecord);
    }
    catch (e) {
        console.log('err', oRecord, e);
    }

    fsRecordToCsvLine(oRecord);
}

function fsRecordToCsvLine(oRecord) {
    let sToCsv = ''
                + '"' + oRecord.sName + '",'
                + '"' + oRecord.sAcademicYear + '",'
                + '"' + oRecord.vMultipleDegrees + '",'
                + '"' + oRecord.sGraduateInstitution + '",'
                + '"' + oRecord.vInstitutionValid + '",'
                + '"' + oRecord.sAreaOfStudy + '",'
                + '"' + oRecord.sInvalidPreFixAreaOfStudy + '",'
                + '"' + oRecord.sInvalidPostFixAreaOfStudy + '",'
                + '"' + oRecord.sSponsors + '",'
                + '"' + oRecord.sCompletionDegree + '",'
                + '"' + oRecord.sCompletionYear + '",'
                + '"' + oRecord.sMailingAddress + '",'
                + '"' + oRecord.sEmailAddress + '",'
                + '"' + oRecord.vCharacterAfterPeriod + '",'
                + '"' + oRecord.bDeceased + '"'

    if (oRecord.arrSponsorBlocks
        && oRecord.arrSponsorBlocks.length > 2) {
        iNonAdjacent++;
        wsNonAdjacent.write(sToCsv + OSEOL);
    } else {
        wsWriteStream.write(sToCsv + OSEOL);
    }
}

function fNotifyEndProgram() {
    console.log(iNonAdjacent + ' non-adjacent sponsor records identified.');
    console.log('Program completed.');
}

// because the name appears above the sParsedBlock delimeter,
// name suffers from an index -1 error
// to resolve, specify the very first name as a global and update each time
function fParseName(sParsedBlock, oRecord) {
    oRecord.sName = sLastRecordName;
    sLastRecordName = oRecord.arrSplitByLineBreak[oRecord.arrSplitByLineBreak.length - 3];
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

        if (fCheckAcademicYear(sToCheck)) {
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
    if (arrGraduateInstitutions.includes(oRecord.sGraduateInstitution)) {
        oRecord.vInstitutionValid = '';
    } else {
        oRecord.vInstitutionValid = false;
    }
}

// sAreaSecondGuess supports cases where the institution name includes a commas
// eg 'University of Maryland, College Park'
function fParseAreaOfStudy(sParsedBlock, oRecord) {
    var sAfterInstitution,
        sAreaFirstGuess,
        sAreaSecondGuess;

    oRecord.sInvalidPostFixAreaOfStudy = '';

    try {
        sAfterInstitution = oRecord
            .sCommaCollapsedBlock
            .split(oRecord.sGraduateInstitution)[1];

        sAreaFirstGuess = sAfterInstitution
            .split(',')[1]
            .trim();

        oRecord.sInvalidPreFixAreaOfStudy = !arrAreas.includes(sAreaFirstGuess) || '';

        if (oRecord.sInvalidPreFixAreaOfStudy) {
            sAreaSecondGuess = sAfterInstitution
                .split(',')[2]
                .trim();

            oRecord.sInvalidPostFixAreaOfStudy = !arrAreas.includes(sAreaSecondGuess) || '';
        }

        oRecord.sAreaOfStudy = sAreaSecondGuess || sAreaFirstGuess;
    }
    catch (e) {
        console.log('fParseAreaOfStudy',
                    oRecord.sGraduateInstitution)
    }
}

// assume the pattern is [year 0...year n], school, field / sAreaOfStudy, name, 'Sponsor', completion degree
// edge cases may break this pattern; those will have to be processed by hand for now
function fParseSponsors(oRecord) {
    oRecord.arroSponsors = oRecord
        .arrSplitByComma
        .map((s, i) => {
            if (s === 'Sponsor'
                || s === 'Sponsors') {
                return {
                    'index': i,
                    'sCompletionDegree': oRecord.arrSplitByComma[i + 1],
                    'sSponsorName': oRecord.arrSplitByComma[i - 1],
                    'sAreaOfStudy': oRecord.arrSplitByComma[i - 2],
                    'sGraduateInstitution': oRecord.arrSplitByComma[i - 3]
                }
            }
        })
        .filter(vTruthy => vTruthy); // filter undefined
}

function fParseCompletionDegree(sParsedBlock, oRecord) {
    let sTextAfterSponsors = oRecord
        .sCommaCollapsedBlock
        .split('Sponsor')[1],
        sCharacterAfterSponsors = sTextAfterSponsors && sTextAfterSponsors[0];
    oRecord.vMultipleDegrees = '';

    if (oRecord.arroSponsors.length > 2) {
        //debugger
    }

    if (sCharacterAfterSponsors) {
        if (sCharacterAfterSponsors === 's') {
            sCharacterAfterSponsors = sTextAfterSponsors[1];
        }

        if (sCharacterAfterSponsors === ',') {
            oRecord.sCompletionDegree = sTextAfterSponsors.split(',')[1].trim();

            if (!arrDegrees.includes(oRecord.sCompletionDegree)) {
                if (fCheckAcademicYear(oRecord.sCompletionDegree)) {
                    oRecord.vMultipleDegrees = true;
                }

                oRecord.sCompletionDegree = '';
            }
        } else {
            oRecord.sCompletionDegree = '';
        }
    } else {
        oRecord.sCompletionDegree = '';
    }
}

function fParseCompletionYear(sParsedBlock, oRecord) {
    let arr;

    if (oRecord.sCompletionDegree) {
        arr = oRecord
                .sCommaCollapsedBlock
                .split(oRecord.sCompletionDegree)[1]
                .split(',');

        oRecord.sCompletionYear = arr[1].trim();

        if (isNaN(oRecord.sCompletionYear)) oRecord.sCompletionYear = '';
    }
    else {
        oRecord.sCompletionYear = '';
    }
}

// .slice(0, -1) to remove trailing comma
function fParseEmailAddress(sParsedBlock, oRecord) {
    let arrMatches = oRecord.sCommaCollapsedBlock.match(regexEmail),
        arrCharacterAfterPeriod;

    if (arrMatches) {
        oRecord.sEmailAddress = arrMatches
        .map(function(sMatch){
            return sMatch.replace(/[\s]+/g, '');
        })
        .join(',')
        .split(',')
        .filter(function(sMatch){
            return sMatch.includes('@');
        })
        .join(',');

        arrCharacterAfterPeriod = oRecord.sEmailAddress.split('.');
        if (arrCharacterAfterPeriod.length > 1) {
            oRecord.vCharacterAfterPeriod = true;
        } else {
            oRecord.vCharacterAfterPeriod = false;
        }
    }
    else {
      oRecord.sEmailAddress = '';
      oRecord.vCharacterAfterPeriod = '';
    }
}

function fParseDeceased(sParsedBlock, oRecord) {
    oRecord.bDeceased = oRecord.sCommaCollapsedBlock.toLowerCase().includes('deceased');
}

function fParseMailingAddress(sParsedBlock, oRecord) {
    let oMatchedAddress = oRecord.sCommaCollapsedBlock.toLowerCase().match('address'),
        iAddressCharacterStart = oMatchedAddress && oMatchedAddress.index,
        iEndCharacterIndex,
        sFirstEmail;

    if (iAddressCharacterStart) {
        if (oRecord.sEmailAddress) {
            sFirstEmail = oRecord.sEmailAddress.split(',')[0];
            iEndCharacterIndex = oRecord.sCommaCollapsedBlock.indexOf(sFirstEmail);
        }
        else if (oRecord.bDeceased) {
            iEndCharacterIndex = oRecord.sCommaCollapsedBlock.toLowerCase().indexOf('deceased');
        }
        else {
            iEndCharacterIndex = oRecord.sCommaCollapsedBlock.length;
        }

        oRecord.sMailingAddress = oRecord.sCommaCollapsedBlock
                                         .slice(iAddressCharacterStart, iEndCharacterIndex)
                                         .split('Address,')[1]
                                         .trim()
                                         .slice(0, -1); // remove trailing comma
    }
    else {
        oRecord.sMailingAddress = '';
    }
}

function fbSeasonMatch(sToCheck) {
    return arrSeasons.includes(sToCheck.toLowerCase().slice(0,5));
}

// valid 'school time' includes both years as well as semesters
// these can be like "fall 1985" or "calendar year 1973"
function fCheckAcademicYear(sToCheck) {
  return (!isNaN(sToCheck[0])
            || fbSeasonMatch(sToCheck)
            || sToCheck.toLowerCase().slice(0,13) === 'calendar year')
}
