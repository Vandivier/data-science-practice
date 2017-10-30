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

let wsSubtopics;
let wsRenames;
let wsRenameErrors;
let wsSubtopicErrors;
let wsMetaLog;

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

    arroRenames = await fGetDataByUrl(sRenameListUrl);
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
    wsSubtopics = fs.createWriteStream(sResultDir + '/subtopics.txt'); // can it be a const?
    wsRenames = fs.createWriteStream(sResultDir + '/Renames.txt'); // can it be a const?
    wsRenameErrors = fs.createWriteStream(sResultDir + '/Rename-errors.txt'); // can it be a const?
    wsSubtopicErrors = fs.createWriteStream(sResultDir + '/subtopic-errors.txt'); // can it be a const?
    wsMetaLog = fs.createWriteStream(sResultDir + '/meta.txt'); // can it be a const?
}
