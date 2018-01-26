// description: after installing Puppeteer v1+, redoing the whole scraper. might be merged back later.
// largely based on the earhart fellows pattern, but using logic from udacity-employment.js as well
// also based on email-append-repec
// earhart fellows follows a stream pattern, this doesnt
// TODO: compare subsample pattern vs working backwards from genderize available names

'use strict'

/*** boilerplate pretty much: TODO: extract to lib ***/

//const beautify = require('js-beautify').js_beautify;
const EOL = require('os').EOL;
const fs = require('fs');
//const genderize = require('genderize'); // todo: use genderize
//const reorder = require('csv-reorder');
//const split = require('split');
const puppeteer = require('puppeteer');
const util = require('util');
const utils = require('ella-utils');

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


const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

// TODO: conventionalize var name to column title line value
// proposed rule: encounter each capital letter; splice before first letter and insert spaces in other cases
// fDehungarianize(sVariableName) => Variable Name
const arrTableColumnKeys = Object.keys(oTitleLine);
const sFirstNameCacheFile = './first-name-cache.json';
const sOrderedOutputFilePath = './ordered-output.csv';

const sRootUrl = 'https://profiles.udacity.com/u/';
//const sResultDir = __dirname + '/results';
const sInputCsvLocation = __dirname + '/subsample-test.csv';
const sOutputFileLocation = __dirname + '/output.csv';

let browser;
let iCurrentInputRecord = 0;
let iTotalInputRecords = 0;
let sResultToWrite;
let wsGotSome;
let wsErrorLog;

main();

async function main() {
    let sInputCsv;
    let arrsInputRows;

    /*
    //await utils.fpWait(5000); // only needed to give debugger time to attach
    fsRecordToCsvLine(oTitleLine);

    if (typeof oFirstNameCache == 'object') { // don't waste time or genderize requests if there's a problem
        fParseTxt();
    } else {
        console.log('error obtaining oFirstNameCache');
    }
    */

    browser = await puppeteer.launch();

    /*
    if (!fs.existsSync(sResultDir)) {
        fs.mkdirSync(sResultDir);
    }
    */

    //fSetWriters();

    sInputCsv = await fpReadFile(sInputCsvLocation, 'utf8');
    arrsInputRows = sInputCsv.split(EOL);

    /** for testing only, shorten rows **/
    //arrsInputRows = arrsInputRows.slice(0, 5);
    arrsInputRows.shift()
    iTotalInputRecords = arrsInputRows.length;
    console.log('early count, iTotalInputRecords = ' + iTotalInputRecords);

    //arrsInputRows = arrsKnownValidNames

    // array pattern, doesn't work for streams
    // TODO await utils.forEachReverseAsyncPhased(arrsInputRows, fpHandleData) ?
    await utils.forEachReverseAsyncPhased(arrsInputRows, function(sInputRecord, i) {
        return fpHandleData(sInputRecord);
    });

    console.log('writing result file.');
    sResultToWrite = fsScrapedDataToResult(oTitleLine) + EOL + sResultToWrite;
    await fpWriteFile(sOutputFileLocation, sResultToWrite);
    fEndProgram();
}

/*
function init() {
  async.map(arrsKnownValidNames, fScrapeUdacityUserSync, function(err, arroUserObjects) {
    if (err) console.log('async.map callback ERROR',  err);
    let sTextToWrite = fsObjectsToCSV(arroUserObjects[0]);                        // there's an extra array layer somewhere... maybe bc i want udacity then linkedin the w/e?
    streamOutFile.write(sTextToWrite, null, console.log('Done.')); 
    process.exit(0);      // i don't think we should exit here. I think this callback is just for one promise chain, not Promise.all()
  //  async.map(arrNames, fScrapeUdacityUserSync, function(err, arroUserObjects) {
  //    console.log('arrNames is done.');
  //    process.exit(0);
  //  });
  });
}
*/

// don't write the title line as it appears many times
// we will append just once manually
// also, don't write empty lines
// TODO: click go to next button and get more stages
function fpHandleData(sInputRecord) {
    const arrsCells = sInputRecord.split(',');
    let oRecord = {
        sFirstName: arrsCells[0],
        sLastName: arrsCells[1]
    }

    oRecord.sUrl = sRootUrl + oRecord.sFirstName;

    return fpScrapeInputRecord(oRecord.sUrl)
        .then(function (oScraped) {
            const oFullData = Object.assign(oScraped, oRecord);

            iCurrentInputRecord++;
            console.log('scraped input record #: '
                        + iCurrentInputRecord
                        + '/' + iTotalInputRecords
                        + EOL);

            sResultToWrite += (fsScrapedDataToResult(oFullData) + EOL);
            return Promise.resolve();
        })
        .catch(function (reason) {
            console.log('fpHandleData err: ', reason);
        });

    iTotalInputRecords--;
    return Promise.resolve();
}

function fsRecordToCsvLine(oRecord) {
    utils.fsRecordToCsvLine(oRecord, arrTableColumnKeys, wsWriteStream);
}

/*
function fEndProgram() {
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
*/

function fEndProgram() {
    browser.close();
    console.log('Processes completed.');
    process.exit();
}

/*** end boilerplate pretty much ***/
