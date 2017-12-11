/**
 *  Description:
 *      given an repec URL, get email address.
 *
 *  approach based on grand-tour-study, getsum.js
 *  repec site assumed to have jQuery
 **/

'use strict';

//const Bluebird = require('bluebird'); // required twice so I can sometimes be explicit
const cheerio = require('cheerio');
const EOL = require('os').EOL;
//const fs = Bluebird.promisifyAll(require('fs'));
const fs = require('fs');
//const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const util = require('util');

const utils = require('../grand-tour-study/utils.js');

const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

const sRootUrl = 'https://dataride.uci.ch';
const sResultDir = __dirname + '/results';
const sInputCsvLocation = __dirname + '/repec.csv';
const sOutputFileLocation = sResultDir + '/out-repec.csv';

const oTitleLine = {
    '_stack': '_stack',
    'name': 'name',
    'web': 'web',
    'count': 'count',
    'email': 'email',
    'affiliations': 'affiliations'
};

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

    browser = await puppeteer.launch();

    if (!fs.existsSync(sResultDir)) {
        fs.mkdirSync(sResultDir);
    }

    fSetWriters();

    sInputCsv = await fpReadFile(sInputCsvLocation, 'utf8');
    arrsInputRows = sInputCsv.split(EOL);

    /** for testing only, shorten rows **/
    arrsInputRows = arrsInputRows.slice(0, 5);
    arrsInputRows.shift()
    iTotalInputRecords = arrsInputRows.length;
    console.log('early count, iTotalInputRecords = ' + iTotalInputRecords);
    console.log('early count is typically overstated by a factor of ~20');
    console.log('iTotalInputRecords / 20 = ' + (iTotalInputRecords / 20));
    console.log('allow up to ~30s per scrape' + EOL);

    await utils.forEachReverseAsyncPhased(arrsInputRows, function(sLineOfText, i) {
        return fpHandleData(sLineOfText);
    });

    console.log('writing result file.');
    sResultToWrite = fsScrapedDataToResult(oTitleLine) + EOL + sResultToWrite;
    await fpWriteFile(sOutputFileLocation, sResultToWrite);
    fEndProgram();
}

//  must ensure path exists before setting writers
function fSetWriters() {
    wsGotSome = fs.createWriteStream(sOutputFileLocation);
    wsErrorLog = fs.createWriteStream(sResultDir + '/errors.txt');
}

// TODO: maybe wait on condition instead of time
// eg using page.mainFrame().waitForSelector
async function fpWait() {
    return new Promise((resolve) => setTimeout(() => resolve(undefined), 2));
}

// don't write the title line as it appears many times
// we will append just once manually
// also, don't write empty lines
// TODO: click go to next button and get more stages
function fpHandleData(sLineOfText) {
    const arrsCellText = sLineOfText.replace(', ', '~').split(',');
    const oOriginalData = {
        _stack: arrsCellText[0],
        name: fsTrimMore(arrsCellText[1]),
        web: arrsCellText[2],
        count: arrsCellText[3],
    }

    if (oOriginalData.web) {
        return fpScrapeInputRecord(oOriginalData.web)
            .then(function (oScraped) {
                let oFullData = Object.assign(oScraped, oOriginalData);

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
    }

    iTotalInputRecords--;
    return Promise.resolve();
}

function fEndProgram() {
    browser.close();
    console.log('Processes completed.');
    process.exit();
}

// returns a page which has been navigated to the specified season page
// note: this whole fucking method is a hack
// not generalizable or temporally reliable in case of a site refactor
// target site includes jQuery already. _$ is cheerio, $ is jQuery
async function fpScrapeInputRecord(sUrl) {
    const _page = await browser.newPage();
    let executionContext;
    let _$;
    let pageWorkingCompetitionPage;
    let poScrapeResult;

    await _page.goto(sUrl, {
        'timeout': 0
    }); // timeout ref: https://github.com/GoogleChrome/puppeteer/issues/782

    _$ = cheerio.load(await _page.content());
    _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

    executionContext = _page.mainFrame().executionContext();
    poScrapeResult = await executionContext.evaluate((_iCurrentInputRecord) => {
        return _fpWait(900)
            .then(function () {
                let _sEmail = $('.emaillabel').parent().find('td span').text();
                let _arroAffiliations = [];

                return Promise.resolve({
                    'email': _sEmail,
                    'affiliations': _arroAffiliations
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
    });

    _page.close();
    return poScrapeResult;

    function _fCleanLog(ConsoleMessage) {
        console.log(ConsoleMessage.text + EOL);
    }
}

// like String.trim()
// but, removes commas and quotes too (outer or interior)
function fsTrimMore(s) {
    return s && s.replace(/[,"]/g, '').trim();
}

// ref: earhart-fellows, fsRecordToCsvLine
// TODO: generic object-to-csv-row
function fsScrapedDataToResult(oStageData) {
    let sToCsv = ''
                + '"' + oStageData._stack + '",'
                + '"' + oStageData.name + '",'
                + '"' + oStageData.web + '",'
                + '"' + oStageData.count + '",'
                + '"' + oStageData.email + '",'
                + '"' + oStageData.affiliations + '"'

    return sToCsv;
}
