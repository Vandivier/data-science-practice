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

const arrSeasons = ['sprin', 'summe', 'fall ', 'winte'];
const OSEOL = require('os').EOL;
const oTitleLine = {
    'sEntryId': 'Entry ID',
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
    'bDeceased': 'Deceased',
    'sSponsorGenderizedName': 'Simple Sponsor Genderized Name',
    'sSponsorGender': 'Simple Sponsor Gender',
    'sSponsorGenderProbability': 'Simple Sponsor Gender Probability',
    'sGenderizedName': 'Recipient Genderized Name',
    'sGender': 'Recipient Gender',
    'sGenderProbability': 'Recipient Gender Probability',
};

// TODO: conventionalize var name to column title line value
// proposed rule: encounter each capital letter; splice before first letter and insert spaces in other cases
const arrTableColumnKeys = [
    'sEntryId',
    'sName',
    'sAcademicYear',
    'vMultipleDegrees',
    'sGraduateInstitution',
    'vInstitutionValid',
    'sAreaOfStudy',
    'sInvalidPreFixAreaOfStudy',
    'sInvalidPostFixAreaOfStudy',
    'sSponsors',
    'sCompletionDegree',
    'sCompletionYear',
    'sMailingAddress',
    'sEmailAddress',
    'vCharacterAfterPeriod',
    'bDeceased',
    'sSponsorGenderizedName',
    'sSponsorGender',
    'sSponsorGenderProbability',
    'sGenderizedName',
    'sGender',
    'sGenderProbability',
];

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

const sFirstNameCacheFile = './first-name-cache.json';
const sOrderedOutputFilePath = './ordered-output.csv';
const sOutputFilePath = './output.csv';

let rsReadStream = fs.createReadStream('./earhart-source.txt');
let wsWriteStream = fs.createWriteStream(sOutputFilePath);
let wsNonAdjacent = fs.createWriteStream('./non-adjacent-sponsor.txt');

let oFirstNameCache = JSON.parse(fs.readFileSync(sFirstNameCacheFile, 'utf8'));
let sLastRecordName = 'ABBAS, Hassan'; // it gets parsed out bc above delimiter
let bVeryFirstRecordDone = false; // very first record has only name, nothing else; skip this record
let iCurrentEntryId = 1;

main();

async function main() {
    await utils.fpWait(5000); // only needed to give debugger time to attach
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
        .on('close', fNotifyEndProgram);
}

async function fpHandleData(sParsedBlock) {
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
        fParseStudentEntryId(oRecord);
        fParseStudentName(oRecord);
        fParseEmailAddress(sParsedBlock, oRecord);
        fParseDeceased(sParsedBlock, oRecord);
        fParseMailingAddress(sParsedBlock, oRecord);
        await fpParseRecipientGender(oRecord);
        await fpParseSponsors(oRecord);
    } catch (e) {
        console.log('student-level error', oRecord, e);
    }

    // the sponsorship is the main level of analysis
    oRecord.arroSponsors.forEach(function (oSponsor) {
        try {
            fParseAcademicYear(oRecord, oSponsor);
            fParseCompletionYear(oRecord, oSponsor);
        } catch (e) {
            console.log('sponsor-level error', oRecord, e);
        }

        fsRecordToCsvLine(oSponsor);
    });
}

function fsRecordToCsvLine(oRecord) {
    utils.fsRecordToCsvLine(oRecord, arrTableColumnKeys, wsWriteStream);
}

function fNotifyEndProgram() {
    let sBeautifiedData = JSON.stringify(oFirstNameCache);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    fs.writeFile(sFirstNameCacheFile, sBeautifiedData, 'utf8', (err) => {
        reorder({
            input: sOutputFilePath, // too bad input can't be sBeautifiedData
            output: sOrderedOutputFilePath,
            sort: 'Entry ID'
        })
        .then(metadata => {
            console.log('Program completed.');
        })
        .catch(error => {
            console.log('Program completed with error.', error);
        });
    });
}

// student entry id is never output to csv
// instead, it is the base for the sponsor entry id
// eg student id(1) => sponsor id(1_1, 1_2...1_n)
// where n is the index of the string 'Sponsor' within arrSplitByComma
// that index denotes an anchoring point for a sponsor record
function fParseStudentEntryId(oRecord) {
    oRecord.iEntryId = iCurrentEntryId;
    iCurrentEntryId++;
}

// because the name appears above the sParsedBlock delimeter,
// name suffers from an index -1 error
// to resolve, specify the very first name as a global and update each time
function fParseStudentName(oRecord) {
    oRecord.sName = sLastRecordName;
    sLastRecordName = oRecord.arrSplitByLineBreak[oRecord.arrSplitByLineBreak.length - 3];
}

/**
 * assume the pattern is [year 0...year n], school, field / sAreaOfStudy, name, 'Sponsor', completion degree
 * exception: If a valid year comes just after a completion degree,
 * it is not an academic year it is a completion year
 **/
function fParseAcademicYear(oRecord, oSponsor) {
    let arrsAcademicYears = [],
        iYearCandidateIndex = oSponsor.index - 4,
        sToCheckCompletionYear,
        sToCheckAcademicYear;

    while (iYearCandidateIndex + 1) { // iYearCandidateIndex shouldn't be negative
        sToCheckCompletionYear = oRecord.arrSplitByComma[iYearCandidateIndex - 1];
        sToCheckAcademicYear = oRecord.arrSplitByComma[iYearCandidateIndex];

        if (!arrDegrees.includes(sToCheckCompletionYear)) { // completion year exception check
            if (fCheckAcademicYear(sToCheckAcademicYear)) {
                arrsAcademicYears.push(sToCheckAcademicYear);
            } else {
                break; // don't keep looking or you might encounter valid years from an invalid location, such as a different sponsorship record for the same student
            }
        } else {
            oSponsor.sCompletionYear = sToCheckCompletionYear;
        }

        iYearCandidateIndex--;
    }

    oSponsor.sAcademicYear = arrsAcademicYears.join(',');
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
async function fpParseSponsors(oRecord) {
    oRecord.arroSponsors = oRecord
        .arrSplitByComma
        .map((s, i) => {
            let _oSponsor;

            if (s === 'Sponsor' ||
                s === 'Sponsors') {
                _oSponsor = {
                    'index': i,
                    'sEntryId': oRecord.iEntryId + '_' + i,
                    'sCompletionDegree': oRecord.arrSplitByComma[i + 1],
                    'sSponsors': oRecord.arrSplitByComma[i - 1],
                    'sAreaOfStudy': oRecord.arrSplitByComma[i - 2],
                    'sGraduateInstitution': oRecord.arrSplitByComma[i - 3]
                }

                if (!arrDegrees.includes(_oSponsor.sCompletionDegree)) _oSponsor.sCompletionDegree = '';
                return Object.assign(_oSponsor, oRecord); // inherit student-level values to each sponsorship record, eg student name
            }
        })
        .filter(vTruthy => vTruthy); // filter undefined

    return utils.forEachReverseAsyncPhased(oRecord.arroSponsors, (_oSponsor) => {
        return fpParseSponsorGender(_oSponsor);
    });
}

function fParseCompletionDegree(sParsedBlock, oRecord) {
    let sTextAfterSponsors = oRecord
        .sCommaCollapsedBlock
        .split('Sponsor')[1],
        sCharacterAfterSponsors = sTextAfterSponsors && sTextAfterSponsors[0];
    oRecord.vMultipleDegrees = '';

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

async function fpParseRecipientGender(oRecord) {
    let sFirstName = oRecord
        .sName
        .split(', ')[1]
        .split(' ')[0];

    return new Promise(function (resolve, reject) {
        let oCachedResult = oFirstNameCache[sFirstName];

        if (oCachedResult) {
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

async function fpParseSponsorGender(oSponsor) {
    let _sGenderizedName = oSponsor
        .sSponsors
        .split(' ')[0];

    return new Promise(function (resolve, reject) {
        let oCachedResult = oFirstNameCache[_sGenderizedName];

        if (oCachedResult) {
            oSponsor.sSponsorGenderizedName = _sGenderizedName;
            oSponsor.sSponsorGender = oCachedResult.gender;
            oSponsor.sSponsorGenderProbability = oCachedResult.probability;
            resolve();
        } else {
            genderize(_sGenderizedName, function (err, obj) {
                if (err || !obj) {
                    resolve();
                } else {
                    oSponsor.sSponsorGenderizedName = _sGenderizedName;
                    oSponsor.sSponsorGender = obj.gender;
                    oSponsor.sSponsorGenderProbability = obj.probability;
                    oFirstNameCache[_sGenderizedName] = {};
                    oFirstNameCache[_sGenderizedName].gender = obj.gender;
                    oFirstNameCache[_sGenderizedName].probability = obj.probability;
                    resolve();
                }
            });
        }
    });
}
