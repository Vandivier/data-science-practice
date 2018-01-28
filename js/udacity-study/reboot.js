// description: after installing Puppeteer v1+, redoing the whole scraper. might be merged back later.
// largely based on the earhart fellows pattern, but using logic from udacity-employment.js as well
// also based on email-append-repec
// earhart fellows follows a stream pattern, this doesnt
// TODO: compare subsample pattern vs working backwards from genderize available names

'use strict'

/*** boilerplate pretty much: TODO: extract to lib ***/

//const beautify = require('js-beautify').js_beautify;
const cheerio = require('cheerio');
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
    'sUserName': 'Username',
    'iEducationCount': 'Count of Education Entries',
    'sLinkedInUrl': 'LinkedIn Url',
    'sResumeUrl': 'Resume Url',
    'bUserExists': 'User Exists',
    'bKnownFail': 'User Known to have Inaccessible Profile',
    'bPresentlyEmployed': 'Presently Employed',
    'sProfileLastUpdate': 'Profile Last Updated Date',
    'iTriesRemaining': 'Tries Remaining'
};

/*
const oTitleLine = {
    'sEntryId': iUid,
    'sName': $('h1').html(),
    'sUserName': sUsername,
    'iEducationCount': $('div[class*="educations--section"] div[class*="_education--education"]').length,
    'sLinkedInUrl': $('a[title="LINKEDIN"]').attr('href'),
    'sResumeUrl': $('a[title="Resume"]').attr('href'),
    'bUserExists': $('[class*=profile-container]').length > 0,
    'bKnownFail': oResponse.knownFail,
    'bPresentlyEmployed': $('div[class*="works--section"] div[class*="_work--work"] span[class*="_work--present"]').length > 0,
    'sProfileLastUpdate': $('div[class*="profile--updated"]').text().split(': ')[1],
    'iTriesRemaining': oResponse.triesRemaining
};
*/

const arrTableColumnKeys = Object.keys(oTitleLine);
const sRootUrl = 'https://profiles.udacity.com/u/';

// TODO: conventionalize var name to column title line value
// proposed rule: encounter each capital letter; splice before first letter and insert spaces in other cases
// fDehungarianize(sVariableName) => Variable Name
//const sResultDir = __dirname + '/results';

const sFirstNameCacheFilePath = './first-name-cache.json';
const sOrderedOutputFilePath = './ordered-output.csv';
const sInputFilePath = __dirname + '/subsample-test.csv'; // TODO: use rsReadStream
const sOutputFilePath = __dirname + '/output.csv';

const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

//const rsReadStream = fs.createReadStream('./EarhartMergedNoBoxNoLines.txt');
const wsWriteStream = fs.createWriteStream(sOutputFilePath);

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

    fsRecordToCsvLine(oTitleLine);
    /*
    //await utils.fpWait(5000); // only needed to give debugger time to attach

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

    sInputCsv = await fpReadFile(sInputFilePath, 'utf8');
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

    //console.log('writing result file.');
    //sResultToWrite = fsScrapedDataToResult(oTitleLine) + EOL + sResultToWrite;
    //await fpWriteFile(sOutputFilePath, sResultToWrite);
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

            //sResultToWrite += (fsScrapedDataToResult(oFullData) + EOL);
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

    fs.writeFile(sFirstNameCacheFilePath, sBeautifiedData, 'utf8', (err) => {
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

// TODO: change. this is just copied from email-append-repec
// returns a page which has been navigated to the specified season page
// note: this whole fucking method is a hack
// not generalizable or temporally reliable in case of a site refactor
// target site includes jQuery already. _$ is cheerio, $ is jQuery
async function fpScrapeInputRecord(sUrl) {
    const _page = await browser.newPage();
    let _$;
    let pageWorkingCompetitionPage;
    let oScrapeResult;

    await _page.goto(sUrl, {
        'timeout': 0
    }); // timeout ref: https://github.com/GoogleChrome/puppeteer/issues/782

    _$ = cheerio.load(await _page.content());
    _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

    oScrapeResult = await _page.evaluate((_iCurrentInputRecord) => {
        return {};
        /*
        return _fpWait(900)
            .then(function () {
                let sEmail = $('.emaillabel').parent().find('td span').text();
                let sarrAffiliations = '';
                let arr$Affiliations = $('#affiliation-body a[name=subaffil]');

                arr$Affiliations.each(function (arr, el) {
                    sarrAffiliations += ('~' + el.innerText.replace(/\s/g, ' ').trim());
                });

                return Promise.resolve({
                    'email': sEmail,
                    'affiliations': sarrAffiliations
                });
            })
            .catch(function (err) {
                console.log('fpScrapeInputRecord err: ', err);
            });

        // larger time allows for slow site response
        // some times of day when it's responding fast u can get away
        // with smaller ms; suggested default of 12.5s
        function _fpWait(ms) {
            ms = ms || 10000;
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        */
    });

    _page.close();
    console.log(oScrapeResult);

    return oScrapeResult;

    function _fCleanLog(ConsoleMessage) {
        console.log(ConsoleMessage.text + EOL);
    }
}
