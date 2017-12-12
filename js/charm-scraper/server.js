/**
 *  Description:
 *      scrape Charm ABM state
 **/

'use strict';

const cheerio = require('cheerio');
const EOL = require('os').EOL;
const fs = require('fs');
const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const util = require('util');

const utils = require('../grand-tour-study/utils.js');

const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

const sRootUrl = 'http://localhost:3000/';
const sResultDir = __dirname + '/results';
const sInputCsvLocation = __dirname + '/repec.csv';
const sOutputFileLocation = sResultDir + '/out-repec.csv';

/*
1. Did anything predict frequency of education?
2. Did frequency of education relate to total income or total consumption?
    - only gonna check terminal per capita iUtilityPerTick (operationalization of equilibrium per capita income, and thereby productivity)

... sanity check: share of educated population should increase per capita productivity

TODO: write out schema

*/

// TODO: maybe make function to populate properties
const oTitleLine = {
    'iCountAgents': 'agent count',
    'iMinCuriosity': 'min curiosity',
    'iMaxCuriosity': 'max curiosity',
    'iMeanCuriosity': 'mean curiosity',
    'iMedianCuriosity': 'median curiosity',
    'iStandardDeviationCuriosity': 'standard deviation curiosity',

    'iMinUtilityPerTick': 'min iUtilityPerTick',
    'iMaxUtilityPerTick': 'max iUtilityPerTick',
    'iMeanUtilityPerTick': 'mean iUtilityPerTick',
    'iMedianUtilityPerTick': 'median iUtilityPerTick',
    'iStandardDeviationUtilityPerTick': 'standard deviation iUtilityPerTick',

    'iMinMoney': 'min money',
    'iMaxMoney': 'max money',
    'iMeanMoney': 'mean money',
    'iMedianMoney': 'median money',
    'iStandardDeviationMoney': 'standard deviation money',

    'iMeanIsEducated': 'mean isEducated',
    'iMedianIsEducated': 'median isEducated',
    'iStandardDeviationIsEducated': 'standard deviation isEducated',

    'iCountJobs': 'job count',
    'iMinWages': 'min wages', // wages in the world or received by agents? in the world for now.
    'iMaxWages': 'max wages',
    'iMeanWages': 'mean wages',
    'iMedianWages': 'median wages',
    'iStandardDeviationWages': 'standard deviation wages',

    'iMinEducatedBonusWages': 'min educatedBonusWages',
    'iMaxEducatedBonusWages': 'max educatedBonusWages',
    'iMeanEducatedBonusWages': 'mean educatedBonusWages',
    'iMedianEducatedBonusWages': 'median educatedBonusWages',
    'iStandardDeviationEducatedBonusWages': 'standard deviation educatedBonusWages',

    'iMinReputation': 'min reputation',
    'iMaxReputation': 'max reputation',
    'iMeanReputation': 'mean reputation',
    'iMedianReputation': 'median reputation',
    'iStandardDeviationReputation': 'standard deviation reputation',

    'iCountSchools': 'school count',
    'iMinSchoolPrice': 'min school price',
    'iMaxSchoolPrice': 'max school price',
    'iMeanSchoolPrice': 'mean school price',
    'iMedianSchoolPrice': 'median school price',
    'iStandardDeviationSchoolPrice': 'standard deviation school price',

    'iMinSchoolReputation': 'min school reputation',
    'iMaxSchoolReputation': 'max school reputation',
    'iMeanSchoolReputation': 'mean school reputation',
    'iMedianSchoolReputation': 'median school reputation',
    'iStandardDeviationSchoolReputation': 'standard deviation school reputation',

    'iMinSchoolSuffering': 'min school suffering',
    'iMaxSchoolSuffering': 'max school suffering',
    'iMeanSchoolSuffering': 'mean school suffering',
    'iMedianSchoolSuffering': 'median school suffering',
    'iStandardDeviationSchoolSuffering': 'standard deviation school suffering',

    'iTerminalTickCount': 'terminal tick count',
    'iTicksPerSecond': 'ticks per second',
    'iBatchSize': 'batch size',
    'bBlindMode': 'blind mode'
};

let browser;
let iCurrentInputRecord = 0;
let iBatchSize = Math.floor(Math.random() * 20);
let sResultToWrite;
let wsGotSome;
let wsErrorLog;

main();

async function main() {
    browser = await puppeteer.launch();

    if (!fs.existsSync(sResultDir)) {
        fs.mkdirSync(sResultDir);
    }

    fSetWriters();
    console.log('early count, iBatchSize = ' + iBatchSize);

    // note: in some applications the parallel approach has seen data loss compared to phased
    await utils.forEachReverseAsyncParallel(arrsInputRows, function(sLineOfText, i) {
        return fpHandleData();
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
function fpHandleData() {
    return fpScrapeInputRecord(sRootUrl)
        .then(function (oScraped) {
            iCurrentInputRecord++;
            console.log('scraped input record #: ' +
                iCurrentInputRecord +
                '/' + iBatchSize +
                EOL);

            sResultToWrite += (fsScrapedDataToResult(oScraped) + EOL);
            return Promise.resolve();
        })
        .catch(function (reason) {
            console.log('fpHandleData err: ', reason);
        });
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
function fsScrapedDataToResult(oScraped) {
    let sToCsv = ''
                + '"' + oScraped.iCountAgents + '",'
                + '"' + oScraped.iMinCuriosity + '",'
                + '"' + oScraped.iMaxCuriosity + '",'
                + '"' + oScraped.iMeanCuriosity + '",'
                + '"' + oScraped.iMedianCuriosity + '",'
                + '"' + oScraped.iStandardDeviationCuriosity + '",'
                + '"' + oScraped.iMinUtilityPerTick + '",'
                + '"' + oScraped.iMaxUtilityPerTick + '",'
                + '"' + oScraped.iMeanUtilityPerTick + '",'
                + '"' + oScraped.iMedianUtilityPerTick + '",'
                + '"' + oScraped.iStandardDeviationUtilityPerTick + '",'
                + '"' + oScraped.iMinMoney + '",'
                + '"' + oScraped.iMaxMoney + '",'
                + '"' + oScraped.iMeanMoney + '",'
                + '"' + oScraped.iMedianMoney + '",'
                + '"' + oScraped.iStandardDeviationMoney + '",'
                + '"' + oScraped.iMeanIsEducated + '",'
                + '"' + oScraped.iMedianIsEducated + '",'
                + '"' + oScraped.iStandardDeviationIsEducated + '",'
                + '"' + oScraped.iCountJobs + '",'
                + '"' + oScraped.iMinWages + '",'
                + '"' + oScraped.iMaxWages + '",'
                + '"' + oScraped.iMeanWages + '",'
                + '"' + oScraped.iMedianWages + '",'
                + '"' + oScraped.iStandardDeviationWages + '",'
                + '"' + oScraped.iMinEducatedBonusWages + '",'
                + '"' + oScraped.iMaxEducatedBonusWages + '",'
                + '"' + oScraped.iMeanEducatedBonusWages + '",'
                + '"' + oScraped.iMedianEducatedBonusWages + '",'
                + '"' + oScraped.iStandardDeviationEducatedBonusWages + '",'
                + '"' + oScraped.iMinReputation + '",'
                + '"' + oScraped.iMaxReputation + '",'
                + '"' + oScraped.iMeanReputation + '",'
                + '"' + oScraped.iMedianReputation + '",'
                + '"' + oScraped.iStandardDeviationReputation + '",'
                + '"' + oScraped.iCountSchools + '",'
                + '"' + oScraped.iMinSchoolPrice + '",'
                + '"' + oScraped.iMaxSchoolPrice + '",'
                + '"' + oScraped.iMeanSchoolPrice + '",'
                + '"' + oScraped.iMedianSchoolPrice + '",'
                + '"' + oScraped.iStandardDeviationSchoolPrice + '",'
                + '"' + oScraped.iMinSchoolReputation + '",'
                + '"' + oScraped.iMaxSchoolReputation + '",'
                + '"' + oScraped.iMeanSchoolReputation + '",'
                + '"' + oScraped.iMedianSchoolReputation + '",'
                + '"' + oScraped.iStandardDeviationSchoolReputation + '",'
                + '"' + oScraped.iMinSchoolSuffering + '",'
                + '"' + oScraped.iMaxSchoolSuffering + '",'
                + '"' + oScraped.iMeanSchoolSuffering + '",'
                + '"' + oScraped.iMedianSchoolSuffering + '",'
                + '"' + oScraped.iStandardDeviationSchoolSuffering + '",'
                + '"' + oScraped.iTerminalTickCount + '",'
                + '"' + oScraped.iTicksPerSecond + '",'
                + '"' + oScraped.iBatchSize + '",'
                + '"' + oScraped.bBlindMode + '"'

    return sToCsv;
}
