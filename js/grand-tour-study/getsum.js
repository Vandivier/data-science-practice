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

const tableToCsv = require('./node-table-to-csv.js');
const utils = require('./utils.js');

const iChunkSize = 30;
const iThrottleInterval = 2; // seconds between batch of requests
const sRootUrl = 'https://dataride.uci.ch';
const sResultDir = __dirname + '/results';
const sMarkusCsvLocation = sResultDir + '/markus.csv';

let browser;
let wsGotSome;
let wsErrorLog;

main();

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

    fParseTxt(sMarkusCsvLocation);
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

// ref: https://stackoverflow.com/a/22085851/3931488
// ref: /server.js
// also refer to earhart-fellows project
function fParseTxt(sLocation) {
    const regex = new RegExp(EOL);
    let rsReadStream = fs.createReadStream(sLocation);

    rsReadStream
        .pipe(splitStream(regex))
        .on('data', fHandleData)
        .on('end', fNotifyEndProgram);
}

// don't write the title line as it appears many times
// we will append just once manually
// also, don't write empty lines
function fHandleData(sLineOfText) {
    const arrsCellText = sLineOfText.split(',');
    const bGetCompetition = (arrsCellText[5] === '1'); // col 5 is a business/technical rule

    if (bGetCompetition) {
        wsGotSome.write(sLineOfText + EOL);
    }
}

function fNotifyEndProgram() {
    browser.close();
    console.log('Program completed.');
    process.exit();
}
