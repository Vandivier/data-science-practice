/**
 *  Description:
 *      Scrape data as defined in the readme from http://uci.ch/road/results/
 *
 *  At the time of writing, uci website has jQuery
 **/

'use strict';

const Bluebird = require('bluebird'); // required twice so I can sometimes be explicit
const cheerio = require('cheerio');
const fs = Bluebird.promisifyAll(require('fs'));
const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const EOL = require('os').EOL;
const Readable = require('stream').Readable;
const splitStream = require('split');

const utils = require('./utils.js');
const tableToCsv = require('./node-table-to-csv.js');

const iChunkSize = 30;
const iThrottleInterval = 2; // seconds between batch of requests
const sRootUrl = 'https://dataride.uci.ch/iframe/results/10';
const sResultDir = __dirname + '/results';

const iFirstSeason = 2009;
const iLastSeason = 2017;
const arrsRaceSubstrings = ['Giro', 'Italia', 'Tour de France', 'Vuelta', 'Espa']; // TODO: not restrictive enough
const sTitleLine = 'Date,Competition,Country,Class';

let wsMain;
let wsErrorLog;

let browser;
let iCurrentBatch = 1;

var arroRenames = [];
var arroSubtopics = [];
var arroErrors = [];

const arrMockBatches = [
                        [],
                        [],
                        []
                        ];

main();

async function fpoGetRenameData(_oRename) {
    let loggerMessage;

    // get csv or log as missing

    loggerMessage = _oRename.id + ', true, successfully got at least some data'
    _oRename.loggerMessage = loggerMessage;
    utils.fStandardWriter(_oRename, wsRenames);
    return Promise.resolve(loggerMessage);
}

//  _arr is an array of Renames
//  Promise.reflect() ref: http://bluebirdjs.com/docs/api/reflect.html
//  _oRename is a reflected Rename promise result.
//  Be sure you know what that means before messing with it.
async function fpCollectBatchInformation(_arr) {
    let arrBatchResult = await utils.settleAll(_arr, fpoGetRenameData);
    return arrBatchResult;
}

// returns a page which has been navigated to the specified season page
// note: this whole fucking method is a hack
// not generalizable or temporally reliable in case of a site refactor
// target site includes jQuery already. _$ is cheerio, $ is jQuery
async function fparrGetResultPagesBySeason(sUrl, iSeason) {
    const _page = await browser.newPage();
    let executionContext;
    let _$;
    let pageWorkingCompetitionPage;
    let scrapeResult;

    await _page.goto(sUrl, {
        'networkIdleTimeout': 5000,
        'waitUntil': 'networkidle',
        'timeout': 0
    }); // timeout ref: https://github.com/GoogleChrome/puppeteer/issues/782
    _$ = cheerio.load(await _page.content());

    _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

    executionContext = _page.mainFrame().executionContext();
    scrapeResult = await executionContext.evaluate((_iSeason) => {
        var arrPagesOfData = [];

        // give browser time to load async data
        // in-scope dup of async function fpWait()
        return _fpRecursivelyScrapeNextPage()
            .catch(function(err){
                console.log('recursive scrape outer err: ', err);
            });

        function _fpRecursivelyScrapeNextPage(bClickNextButton) {
                return _fpWait()
                    .then(function () {
                        let _$nextButton = $('.k-link.k-pager-nav[title="Go to the next page"]');

                        if (bClickNextButton) {
                            _$nextButton.click();
                        } else {
                            $('.uci-main-content .k-dropdown').last().click(); // open the seasons dropdown
                            $('#seasons_listbox li').filter(function () { // click the particular season
                                    return this.textContent === String(_iSeason);
                                })
                                .click();
                        }

                        return _fpWait();
                    })
                    .then(function () {
                        let $nextButton = $('.k-link.k-pager-nav[title="Go to the next page"]'),
                            oPageData = _foScrapeSinglePageOfData();

                        console.log('adding new data with pagination text: ' + JSON.stringify(oPageData.sPaginationText));

                        arrPagesOfData = arrPagesOfData.concat(oPageData);

                        if (!$nextButton.hasClass('k-state-disabled')
                            && arrPagesOfData.length > 0) { // return results. length check is to short circuit during DEV, not for real use
                            return _fpRecursivelyScrapeNextPage(true);
                        } else { // get the next page
                            return Promise.resolve(arrPagesOfData);
                        }
                    })
                    .catch(function(err){
                        console.log('recursive scrape inner err (_fpRecursivelyScrapeNextPage): ', err);
                    });
        }

        // larger time allows for slow site response
        // some times of day when it's responding fast u can get away
        // with smaller ms; suggested default of 12.5s
        function _fpWait() {
            let ms = 8000;
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function _foScrapeSinglePageOfData() {
            return {
                'sPaginationText': $('.uci-main-content .k-dropdown').last().text() + $('.k-pager-info.k-label').text(),
                'sTableParentHtml': $('table').parent().html() // 1 table per page
            }
        }
    }, iSeason);

    _page.close();
    return scrapeResult;

    function _fCleanLog(ConsoleMessage) {
        console.log(ConsoleMessage.text + EOL);
    }
}

// get each season page in parallel
// traverse each page under the season in parallel (~21)
// find strings of interest. open those pages. it's designed as SPA; may need to open new window
// if using a new window, url looks like https://dataride.uci.ch/iframe/CompetitionResults/46187?disciplineId=10
// for strings of interest, get general classification, points classification, and stage classification for each stage
// these are a bunch of csvs; maybe download instead of write file (actually, that's equivalent)
async function main() {
    let _arroPagesForThisSeason = [];
    let arrResultPages = [];
    let arrSettledResultPages = [];
    let arrFlatSettledPages = [];
    let sCsvTables;
    let i;
    let sCsv;

    browser = await puppeteer.launch();

    if (!fs.existsSync(sResultDir)) {
        fs.mkdirSync(sResultDir);
    }

    fSetWriters();

    // each season has multiple result pages
    // get an array of result pages per season
    // then concat and get all result pages
    for (i = iFirstSeason; i < (iLastSeason + 1); i++) {
        _arroPagesForThisSeason = fparrGetResultPagesBySeason(sRootUrl, i);
        arrResultPages = arrResultPages.concat(_arroPagesForThisSeason);
    }

    arrSettledResultPages = await utils.settleAll(arrResultPages);
    arrFlatSettledPages = utils.flatten(arrSettledResultPages);

    // TODO: I think you can do this inside settleAll,
    // but playing it safe and serial for now
    sCsvTables = arrFlatSettledPages.reduce(function(acc, oPageData){
        return acc + EOL + tableToCsv(oPageData.sTableParentHtml);
    }, '');

    fParseTxt(sCsvTables);
}

//  must ensure path exists before setting writers
function fSetWriters() {
    wsMain = fs.createWriteStream(sResultDir + '/main.csv');
    wsErrorLog = fs.createWriteStream(sResultDir + '/errors.txt');
}

// TODO: maybe wait on condition instead of time
// eg using page.mainFrame().waitForSelector
async function fpWait() {
    return new Promise((resolve) => setTimeout(() => resolve(undefined), 2));
}

// ref: https://stackoverflow.com/a/22085851/3931488
// also refer to earhart-fellows project
function fParseTxt(sText) {
    const regex = new RegExp(EOL);
    let rsReadStream = new Readable();

    rsReadStream._read = function noop() {};
    rsReadStream.push(sText);

    rsReadStream
        .pipe(splitStream(regex))
        .on('data', fHandleData)
        .on('end', fNotifyEndProgram); // TODO: fNotifyEndProgram not properly invoked. Kill manually with ctrl + C
}

// don't write the title line as it appears many times
// we will append just once manually
// also, don't write empty lines
function fHandleData(sLineOfText) {
    if (sLineOfText
        && sLineOfText !== sTitleLine)
    {
        wsMain.write(sLineOfText + EOL);
    }
}

function fNotifyEndProgram() {
    browser.close();
    console.log('Program completed.');
    process.exit();
}
