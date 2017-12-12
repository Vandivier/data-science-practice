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
2.	Economic variables: model, real world
a.	Standard data = Min, max, average, sd
b.	Standard for school price, education premium, curiosity, wages, leisure utility, ticks to terminate, population, frequency of education, consumption, total income or total consumption

terminal tick count
ticks per second
# concurrent processes (batch size)
blind mode

1. Did anything predict frequency of education?
2. Did frequency of education relate to total income or total consumption?
    - only gonna check terminal per capita iUtilityPerTick (operationalization of equilibrium per capita income, and thereby productivity)

... sanity check: share of educated population should increase per capita productivity

TODO: write out schema

age
consumptionUtility
curiosity*
iLifetimeUtility
isEducated*
iUtilityPerTick*
job
leisureUtility
money*
productivity
speed
timePreference

*/

const oTitleLine = {
    'iPopulationSize': 'agent count',
    'iPercentEducated': 'percent educated',

    'iPopulationSize': 'min curiosity',
    'iPopulationSize': 'max curiosity',
    'iPopulationSize': 'mean curiosity',
    'iPopulationSize': 'median curiosity',
    'iPopulationSize': 'standard deviation curiosity',

    'iPopulationSize': 'min iUtilityPerTick',
    'iPopulationSize': 'max iUtilityPerTick',
    'iPopulationSize': 'mean iUtilityPerTick',
    'iPopulationSize': 'median iUtilityPerTick',
    'iPopulationSize': 'standard deviation iUtilityPerTick',

    'iPopulationSize': 'min money',
    'iPopulationSize': 'max money',
    'iPopulationSize': 'mean money',
    'iPopulationSize': 'median money',
    'iPopulationSize': 'standard deviation money',

    'iPopulationSize': 'mean isEducated',
    'iPopulationSize': 'median isEducated',
    'iPopulationSize': 'standard deviation isEducated',

    'iPopulationSize': 'job count',
    'iPopulationSize': 'min wages', // wages in the world or received by agents? in the world for now.
    'iPopulationSize': 'max wages',
    'iPopulationSize': 'mean wages',
    'iPopulationSize': 'median wages',
    'iPopulationSize': 'standard deviation wages',

    'iPopulationSize': 'min educatedBonusWages',
    'iPopulationSize': 'max educatedBonusWages',
    'iPopulationSize': 'mean educatedBonusWages',
    'iPopulationSize': 'median educatedBonusWages',
    'iPopulationSize': 'standard deviation educatedBonusWages',

    'iPopulationSize': 'min reputation',
    'iPopulationSize': 'max reputation',
    'iPopulationSize': 'mean reputation',
    'iPopulationSize': 'median reputation',
    'iPopulationSize': 'standard deviation reputation',

    'iPopulationSize': 'school count',
    'iPopulationSize': 'min school price',
    'iPopulationSize': 'max school price',
    'iPopulationSize': 'mean school price',
    'iPopulationSize': 'median school price',
    'iPopulationSize': 'standard deviation school price',

    'iPopulationSize': 'min school reputation',
    'iPopulationSize': 'max school reputation',
    'iPopulationSize': 'mean school reputation',
    'iPopulationSize': 'median school reputation',
    'iPopulationSize': 'standard deviation school reputation',

    'iPopulationSize': 'min school suffering',
    'iPopulationSize': 'max school suffering',
    'iPopulationSize': 'mean school suffering',
    'iPopulationSize': 'median school suffering',
    'iPopulationSize': 'standard deviation school suffering',


    'iTerminalTickCount': 'terminal tick count',
    'iTicksPerSecond': 'ticks per second',
    'iBatchSize': 'batch size',
    'bBlindMode': 'blind mode'
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
    //arrsInputRows = arrsInputRows.slice(0, 5);
    arrsInputRows.shift()
    iTotalInputRecords = arrsInputRows.length;
    console.log('early count, iTotalInputRecords = ' + iTotalInputRecords);

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
                const oFullData = Object.assign(oScraped, oOriginalData);

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
                + '"' + oScraped._stack + '",'
                + '"' + oScraped.name + '",'
                + '"' + oScraped.web + '",'
                + '"' + oScraped.count + '",'
                + '"' + oScraped.email + '",'
                + '"' + oScraped.affiliations + '"'

    return sToCsv;
}
