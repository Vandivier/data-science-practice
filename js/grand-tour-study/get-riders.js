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
const sRidersDir = sResultDir + '/rider-pages';
const sInputFileLocation = sResultDir + '/gotsome.csv';
const sOutputFileLocation = sResultDir + '/rider-data.csv';

const oTitleLine = { // TODO: fix definition
    'sStageName': 'Stage Name',
    'sStageDate': 'Stage Date',
    'sStageCategory': 'Stage Category',
    'sGeneralClassificationUrl': 'General Classification Url',
    'sPointsClassificationUrl': 'Points Classification Url',
    'sStageClassificationUrl': 'Stage Classification Url',
    'sCompetitionDate': 'Competition Date',
    'sCompetitionName': 'Competition Name',
    'sCompetitionUrl': 'Competition Result Page Url',
    'sCountry': 'Country',
    'sClassCode': 'Class Code',
    'sGetSum': 'getsum',
};

let browser;
let iCurrentObservation = 0;
let iTotalObservations = 0;
let sResultToWrite;

main();

async function main() {
    let arrsInputRows = [];
    let arrRiderPages = [];
    let iSecondsBetweenBatches
    let sInputCsv;

    browser = await puppeteer.launch();

    if (!fs.existsSync(sResultDir)) {
        fs.mkdirSync(sResultDir);
    }

    if (!fs.existsSync(sRidersDir)) {
        fs.mkdirSync(sRidersDir);
    }

    sInputCsv = await fpReadFile(sInputFileLocation, 'utf8');
    arrsInputRows = sInputCsv.split(EOL);
    iTotalObservations = arrsInputRows.length;
    console.log('iTotalObservations = ' + iTotalObservations);
    sResultToWrite = fsObjectToCsvRow(oTitleLine);

    arrRiderPages = await utils.forEachReverseAsyncParallel(arrsInputRows, (sRow, i) => {
        const _sGeneralClassificationUrl = utils.fsTrimMore(sRow.split(',')[4]); // column # determined by business rule
        return fpoScrapeStageDetails(_sGeneralClassificationUrl);
    });

    // if the below takes to long, use commented file-by-file pattern
    utils.forEachReverse(arrRiderPages, (oPage, i) => {
        if (oPage && oPage.sTableHtml) {
            sResultToWrite += (tableToCsv(oPage.sTableHtml) + EOL); // TODO: idk if this is correct
        } else {
            console.log('utils.forEachReverse(arrRiderPages, err: no html' + EOL);
        }
    });

    await fpWriteFile(sOutputFileLocation, sResultToWrite);
    fEndProgram();
}

function fEndProgram() {
    browser.close();
    console.log('Processes completed.');
    process.exit();
}

// ref: getsum.js, fpScrapeCompetitionDetails()
function fpoScrapeStageDetails(sUrl) {
    let options = {
        'fpEvaluateInPage': function (_options) {
            console.log('hi');
            return Promise.resolve({
                'sTableHtml': 'hi'
            });
        },
        'hi': 'sup'
    }

    if (sUrl
        && sUrl.includes('http')) {
        return utils.scrapePage(sUrl, browser, options)
            .then(function (oResult) {
                iCurrentObservation++;
                console.log('scraped ' + iCurrentObservation + ' / ' + iTotalObservations);
                return oResult;
            });
    } else {
        iTotalObservations--;
        return Promise.resolve();
    }
}

// ref: earhart-fellows, fsRecordToCsvLine
// ref: getsum.js, fsRaceData
// TODO: generic object-to-csv-row
// TODO: is the col order reliable in the below? and it's not explicit which vals->cols
function fsObjectToCsvRow(oData) {
    let sCsvRow = '';

    for (const sKey in oData) {
        if (oData.hasOwnProperty(sKey)) { // don't write inherited stuff
            sCsvRow += '"' + oData[sKey] + '",';
        }
    }

    return (sCsvRow + EOL);
}
