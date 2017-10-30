/**
 *  Description:
 *      Scrape data as defined in the readme from http://uci.ch/road/results/
 **/

'use strict';

const Bluebird = require('bluebird'); // required twice so I can sometimes be explicit
const cheerio = require('cheerio');
const fs = Bluebird.promisifyAll(require('fs'));
const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const utils = require('./utils.js');

const iChunkSize = 30;
const iThrottleInterval = 2;
const sCommonBaseUrl = 'http://uci.ch/';
const sRootUrl = sCommonBaseUrl + 'road/results/';
const sResultDir = __dirname + '/results';

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

async function fGetDataByUrl(sUrl) {
    const page = await browser.newPage();
    let _$;

    await page.goto(sUrl);
    _$ = cheerio.load(await page.content());

    page.close()
    return _$('pre').text();
}

async function main() {
    browser = await puppeteer.launch();

    if (!fs.existsSync(sResultDir)) {
        fs.mkdirSync(sResultDir);
    }

    fSetWriters();

    // get each season page in parallel
    // traverse each page under the season in parallel (~21)
    // find strings of interest. open those pages. it's designed as SPA; may need to open new window
    // if using a new window, url looks like https://dataride.uci.ch/iframe/CompetitionResults/46187?disciplineId=10
    // for strings of interest, get general classification, points classification, and stage classification for each stage
    // these are a bunch of csvs; maybe download instead of write file (actually, that's equivalent)

    arroRenames = await fGetDataByUrl(sRootUrl);
    arroRenames = JSON.parse(arroRenames);
    //console.log('Rename check: ' + arroRenames.length);
    let arrBatches = utils.chunk(arroRenames, iChunkSize);
    //console.log('batch check: ' + arrBatches.length, arrBatches[0])
    //arrBatches = [arrBatches.pop(),[]];// testing with a subset
    //let arrBatches = arrMockBatches;

    await utils.forEachThrottledAsync(iThrottleInterval, arrBatches, function (_arrBatch) {
        console.log('batch process for batch # ' + (iCurrentBatch++) + ' of ' + arrBatches.length)
        return fpCollectBatchInformation(_arrBatch);
    });

    browser.close();
    process.exit();
}

// returns true when a string has content after rendering.
// returns false on invalid html. For example '</p>' is just a closing tag and will return false.
function fRenderableContent(sCandidateHtml) {
    let bValidEnough = false;

    try {
        bValidEnough = cheerio.load(sCandidateHtml).text().trim().length > 0;
    } catch (e) {}

    return bValidEnough;
}

//  must ensure path exists before setting writers
function fSetWriters() {
    wsMain = fs.createWriteStream(sResultDir + '/main.txt'); // TODO: can it be a const?
    wsErrorLog = fs.createWriteStream(sResultDir + '/errors.txt'); // TODO: can it be a const?
}
