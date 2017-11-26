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

const sRootUrl = 'https://dataride.uci.ch';
const sResultDir = __dirname + '/results';
const sMarkusCsvLocation = sResultDir + '/markus.csv';
const sOutputFileLocation = sResultDir + '/gotsome.csv';

const arrsDesiredClassifications = ['General Classification'];
/*
const arrsDesiredClassifications = ['General Classification',
                                    'Points Classification',
                                    'Stage Classification'];
*/

let browser;
let iCurrentCompetition = 0;
let iTotalCompetitions = 0;
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

    /** for testing only, shorten rows **/
    arrsInputRows = arrsInputRows.slice(0, 50);

    iTotalCompetitions = arrsInputRows.length;
    console.log('early count, iTotalCompetitions = ' + iTotalCompetitions);
    console.log('early count is typically overstated by a factor of ~20');
    console.log('iTotalCompetitions / 20 = ' + (iTotalCompetitions / 20));
    console.log('allow up to ~30s per scrape' + EOL);

    await utils.forEachReverseAsyncParallel(arrsInputRows, function(sLineOfText, i) {
        return fpHandleData(sLineOfText);
    });

    console.log('writing result file.');
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
function fpHandleData(sLineOfText) {
    let arrsCellText = sLineOfText.split(',');
    const bGetCompetition = (arrsCellText[5] === '1'); // col 5 is a business/technical rule
    const sUrl = sRootUrl + fsTrimMore(arrsCellText[2]);
    let iStages; // TODO: click go to next button and get more stages
    let $treeGrid; // it's a table with child tables...awesome
    let $stageHeaders;
    let $stageTables;
    let arroStageData = [];
    let iStage = 0;

    arrsCellText[2] = sUrl;
    sLineOfText = arrsCellText.join(',');

    if (bGetCompetition) {
        return fpScrapeCompetitionDetails(sUrl)
            .then(function (arroStageData) {
                iCurrentCompetition++;
                console.log('scraped competition #: '
                            + iCurrentCompetition
                            + '/' + iTotalCompetitions
                            + EOL);

                utils.forEachReverse(arroStageData, function (_oStageData) {
                    sResultToWrite += (fsRaceData(_oStageData) + ',' + sLineOfText + EOL);
                });

                return Promise.resolve();
            })
            .catch(function (reason) {
                console.log('fpHandleData err: ', reason);
            });
    }

    iTotalCompetitions--;
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
        'timeout': 12000
    }); // timeout ref: https://github.com/GoogleChrome/puppeteer/issues/782

    _$ = cheerio.load(await _page.content());
    _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

    executionContext = _page.mainFrame().executionContext();
    poScrapeResult = await executionContext.evaluate((_iCurrentCompetition) => {
        $('a.k-icon.k-plus').click(); // expand all stages

        return _fpWait()
            .then(function () {
                let _arroStageData = [];
                $treegrid = $('table[role=treegrid]');
                $stageHeaders = $treegrid.find('.k-master-row[role=row]');
                $stageTables = $treegrid.find('table');

                $stageHeaders.each(function (i, elheaderRow) {
                    let $headerRow = $(elheaderRow);
                    let _$stageTable = $stageTables.eq(i);
                    let oStageData = {};

                    oStageData.sRaceDate = $headerRow.find('td').eq(2).text();
                    oStageData.sRaceName = $headerRow.find('td').eq(1).text();
                    oStageData.sRaceCategory = $headerRow.find('td').eq(3).text();

                    oStageData.sGeneralClassificationUrl = $stageTables
                        .find('a:contains("General classification")')
                        .attr('href') || '';
                    oStageData.sPointsClassificationUrl = $stageTables
                        .find('a:contains("Points Classification")')
                        .attr('href') || '';
                    oStageData.sStageClassificationUrl = $stageTables
                        .find('a:contains("Stage Classification")')
                        .attr('href') || '';

                    _arroStageData.push(oStageData);
                });

                return _arroStageData;
            })
            .catch(function (err) {
                console.log('fpScrapeCompetitionDetails err: ', err);
            });

        // larger time allows for slow site response
        // some times of day when it's responding fast u can get away
        // with smaller ms; suggested default of 12.5s
        function _fpWait(ms) {
            ms = ms || 8000;
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

// like String.trim()
// but, removes commas and quotes too (outer or interior)
function fsTrimMore(s) {
    return s && s.replace(/[,"]/g, '').trim();
}

// ref: earhart-fellows, fsRecordToCsvLine
// TODO: generic object-to-csv-row
function fsRaceData(oStageData) {
    let sToCsv = ''
                + '"' + oStageData.sRaceName + '",'
                + '"' + oStageData.sRaceDate + '",'
                + '"' + oStageData.sRaceCategory + '",'
                + '"' + oStageData.sGeneralClassificationUrl + '",'
                + '"' + oStageData.sPointsClassificationUrl + '",'
                + '"' + oStageData.sStageClassificationUrl + '"'

    return sToCsv;
}
