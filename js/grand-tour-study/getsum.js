/**
 *  Description:
 *      Scrape detailed competition data for certain competitions
 *      identified with getsum === 1 in markus.csv
 *
 *      Generates /results/gotsome.csv; see readme for some details
 *
 *      At the time of writing, uci website has jQuery
 **/

'use strict';

const Bluebird = require('bluebird'); // required twice so I can sometimes be explicit
const cheerio = require('cheerio');
const EOL = require('os').EOL;
const fs = Bluebird.promisifyAll(require('fs'));
const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const Readable = require('stream').Readable;
const splitStream = require('split');
const util = require('util');

const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

const tableToCsv = require('./node-table-to-csv.js');
const utils = require('./utils.js');

const iCurrentCompetition = 0;
const sRootUrl = 'https://dataride.uci.ch';
const sResultDir = __dirname + '/results';
const sMarkusCsvLocation = sResultDir + '/markus.csv';

let browser;
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

    sInputCsv = await fpReadFile(sMarkusCsvLocation, 'utf8');
    arrsInputRows = sInputCsv.split(EOL);
    await utils.forEachReverseAsyncParallel(arrsInputRows, function(sLineOfText, i) {
        return fpHandleData(sLineOfText);
    });

    console.log('writing result file.');
    await fpWriteFile(sResultToWrite);
    fEndProgram();
}

//  must ensure path exists before setting writers
function fSetWriters() {
    wsGotSome = fs.createWriteStream(sResultDir + '/gotsome.csv');
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
function fpHandleData(sLineOfText) {
    const arrsCellText = sLineOfText.split(',');
    const bGetCompetition = (arrsCellText[5] === '1'); // col 5 is a business/technical rule
    const sUrl = sRootUrl + arrsCellText[2];

    if (bGetCompetition) {
        return fpScrapeCompetitionDetails(sUrl)
            .then(function (oScrapeResult) {
                const arrsPageRows = tableToCsv(oPageData.sTableParentHtml)
                    .split(EOL);

                iCurrentCompetition++;
                console.log('scraped competition #: ' + iCurrentCompetition);

                utils.forEachReverse(arrsPageRows, function (sPageLine) {
                    sResultToWrite += (sPageLine + EOL);
                });

                return Promise.resolve();
            });
    }

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
async function fpScrapeCompetitionDetails(sUrl) {
    const _page = await browser.newPage();
    let executionContext;
    let _$;
    let pageWorkingCompetitionPage;
    let poScrapeResult;

    await _page.goto(sUrl, {
        'networkIdleTimeout': 5000,
        'waitUntil': 'networkidle',
        'timeout': 0
    }); // timeout ref: https://github.com/GoogleChrome/puppeteer/issues/782

    _$ = cheerio.load(await _page.content());
    _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

    executionContext = _page.mainFrame().executionContext();
    poScrapeResult = await executionContext.evaluate((_iCurrentCompetition) => {
        // TODO: _fpWait() maybe not needed
        return _fpWait()
            .then(function () {
                return _foScrapeSinglePageOfData();
            })
            .catch(function (err) {
                console.log('fpScrapeCompetitionDetails err: ', err);
            });

        // larger time allows for slow site response
        // some times of day when it's responding fast u can get away
        // with smaller ms; suggested default of 12.5s
        function _fpWait() {
            let ms = 8000;
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function _foScrapeSinglePageOfData() {
            return {
                'sTableParentHtml': $('table').parent().html() // 1 table per page
            }
        }
    });

    _page.close();
    return poScrapeResult;

    function _fCleanLog(ConsoleMessage) {
        console.log(ConsoleMessage.text + EOL);
    }
}

// ref: earhart-fellows
// TODO: may not be needed
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

    if (oRecord.bNonAdjacentSponsors) {
        iNonAdjacent++;
        wsNonAdjacent.write(sToCsv + OSEOL);
    } else {
        wsWriteStream.write(sToCsv + OSEOL);
    }
}
