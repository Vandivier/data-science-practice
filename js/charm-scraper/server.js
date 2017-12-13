/**
 *  Description:
 *      scrape Charm ABM state
 *
 *   TODO:
 *      1 - Do we care about median values?
 *      2 - Declarative and organized schema
 *      3 - sanity check: share of educated population should increase per capita productivity
 *      4 - function to take param and gen min, max, mean, skew, sd, w/e
 **/

/*
1. Did anything predict frequency of education?
2. Did frequency of education relate to total income or total consumption?
    - only gonna check terminal per capita iUtilityPerTick (operationalization of equilibrium per capita income, and thereby productivity)

*/

'use strict';

const cheerio = require('cheerio');
const EOL = require('os').EOL;
const fs = require('fs');
const Promise = require('bluebird');
const puppeteer = require('puppeteer');
const skewness = require('compute-skewness');
const util = require('util');

const utils = require('../grand-tour-study/utils.js');

const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

const sRootUrl = 'http://localhost:3000/';
const sResultDir = __dirname + '/results';
const sOutputFileLocation = sResultDir + '/result.csv';

const oTitleLine = {
    'iTotalUtilityPerTick': 'world utility per tick',

    'iCountAgents': 'agent count',
    'iMinCuriosity': 'min curiosity',
    'iMaxCuriosity': 'max curiosity',
    'iMeanCuriosity': 'mean curiosity',
    'iSkewnessCuriosity': 'Skewness curiosity',
    'iStandardDeviationCuriosity': 'standard deviation curiosity',

    'iMinUtilityPerTick': 'min iUtilityPerTick',
    'iMaxUtilityPerTick': 'max iUtilityPerTick',
    'iMeanUtilityPerTick': 'mean iUtilityPerTick',
    'iSkewnessUtilityPerTick': 'Skewness iUtilityPerTick',
    'iStandardDeviationUtilityPerTick': 'standard deviation iUtilityPerTick',

    'iMinMoney': 'min money',
    'iMaxMoney': 'max money',
    'iMeanMoney': 'mean money',
    'iSkewnessMoney': 'Skewness money',
    'iStandardDeviationMoney': 'standard deviation money',

    'iMeanIsEducated': 'mean isEducated',
    'iSkewnessIsEducated': 'Skewness isEducated',
    'iStandardDeviationIsEducated': 'standard deviation isEducated',

    'iCountJobs': 'job count',
    'iMinWages': 'min wages', // wages in the world or received by agents? in the world for now.
    'iMaxWages': 'max wages',
    'iMeanWages': 'mean wages',
    'iSkewnessWages': 'Skewness wages',
    'iStandardDeviationWages': 'standard deviation wages',

    'iMinEducatedBonusWages': 'min educatedBonusWages',
    'iMaxEducatedBonusWages': 'max educatedBonusWages',
    'iMeanEducatedBonusWages': 'mean educatedBonusWages',
    'iSkewnessEducatedBonusWages': 'Skewness educatedBonusWages',
    'iStandardDeviationEducatedBonusWages': 'standard deviation educatedBonusWages',

    'iMinReputation': 'min reputation',
    'iMaxReputation': 'max reputation',
    'iMeanReputation': 'mean reputation',
    'iSkewnessReputation': 'Skewness reputation',
    'iStandardDeviationReputation': 'standard deviation reputation',

    'iCountSchools': 'school count',
    'iMinSchoolPrice': 'min school price',
    'iMaxSchoolPrice': 'max school price',
    'iMeanSchoolPrice': 'mean school price',
    'iSkewnessSchoolPrice': 'Skewness school price',
    'iStandardDeviationSchoolPrice': 'standard deviation school price',

    'iMinSchoolReputation': 'min school reputation',
    'iMaxSchoolReputation': 'max school reputation',
    'iMeanSchoolReputation': 'mean school reputation',
    'iSkewnessSchoolReputation': 'Skewness school reputation',
    'iStandardDeviationSchoolReputation': 'standard deviation school reputation',

    'iMinSchoolSuffering': 'min school suffering',
    'iMaxSchoolSuffering': 'max school suffering',
    'iMeanSchoolSuffering': 'mean school suffering',
    'iSkewnessSchoolSuffering': 'Skewness school suffering',
    'iStandardDeviationSchoolSuffering': 'standard deviation school suffering',

    'iTerminalTickCount': 'terminal tick count',
    'iTicksPerSecond': 'ticks per second',
    'iBatchSize': 'batch size',
    'bForceTerminate': 'forced model termination',
    'bBlindMode': 'blind mode'
};

let browser;
let iCurrentInputRecord = 0;
let iBatchSize = Math.floor(Math.random() * 20);
let sResultToWrite = '';
let wsGotSome;
let wsErrorLog;

main();

async function main() {
    let arrsInputRows = new Array(iBatchSize);

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
        .then(function (oScraped) { // TODO: condense to function per parameter of interest
            let arrCuriosity            = oScraped.turtles.map(function(agent){ return agent.curiosity });
            let arrUtilityPerTick       = oScraped.turtles.map(function(agent){ return agent.iUtilityPerTick });
            let arrMoney                = oScraped.turtles.map(function(agent){ return agent.money });
            let arrIsEducated           = oScraped.turtles.map(function(agent){ return (agent.isEducated ? 1 : 0); });
            let arrWages                = oScraped.jobs.map(function(job){ return job.wages });
            let arrEducatedBonusWages   = oScraped.jobs.map(function(job){ return job.educatedBonusWages });
            let arrJobReputation        = oScraped.jobs.map(function(job){ return job.reputation });
            let arrSchoolPrice          = oScraped.schools.map(function(school){ return school.price });
            let arrSchoolReputation     = oScraped.schools.map(function(school){ return school.reputation });
            let arrSchoolSuffering      = oScraped.schools.map(function(school){ return school.suffering });

            oScraped.iCountAgents = oScraped.turtles.length;
            oScraped.iMinCuriosity = utils.min(arrCuriosity);
            oScraped.iMaxCuriosity = utils.max(arrCuriosity);
            oScraped.iMeanCuriosity = utils.mean(arrCuriosity);
            oScraped.iSkewnessCuriosity = skewness(arrCuriosity);
            oScraped.iStandardDeviationCuriosity = utils.standardDeviation(arrCuriosity);
            oScraped.iMinUtilityPerTick = utils.min(arrUtilityPerTick);
            oScraped.iMaxUtilityPerTick = utils.max(arrUtilityPerTick);
            oScraped.iMeanUtilityPerTick = utils.mean(arrUtilityPerTick);
            oScraped.iSkewnessUtilityPerTick = skewness(arrUtilityPerTick);
            oScraped.iStandardDeviationUtilityPerTick = utils.standardDeviation(arrUtilityPerTick);
            oScraped.iMinMoney = utils.min(arrMoney);
            oScraped.iMaxMoney = utils.max(arrMoney);
            oScraped.iMeanMoney = utils.mean(arrMoney);
            oScraped.iSkewnessMoney = skewness(arrMoney);
            oScraped.iStandardDeviationMoney = utils.standardDeviation(arrMoney);
            oScraped.iMeanIsEducated = utils.mean(arrIsEducated);
            oScraped.iSkewnessIsEducated = skewness(arrIsEducated);
            oScraped.iStandardDeviationIsEducated = utils.standardDeviation(arrIsEducated);
            oScraped.iCountJobs = oScraped.jobs.length;
            oScraped.iMinWages = utils.min(arrWages);
            oScraped.iMaxWages = utils.max(arrWages);
            oScraped.iMeanWages = utils.mean(arrWages);
            oScraped.iSkewnessWages = skewness(arrWages);
            oScraped.iStandardDeviationWages = utils.standardDeviation(arrWages);
            oScraped.iMinEducatedBonusWages = utils.min(arrEducatedBonusWages);
            oScraped.iMaxEducatedBonusWages = utils.max(arrEducatedBonusWages);
            oScraped.iMeanEducatedBonusWages = utils.mean(arrEducatedBonusWages);
            oScraped.iSkewnessEducatedBonusWages = skewness(arrEducatedBonusWages);
            oScraped.iStandardDeviationEducatedBonusWages = utils.standardDeviation(arrEducatedBonusWages);
            oScraped.iMinReputation = utils.min(arrJobReputation);
            oScraped.iMaxReputation = utils.max(arrJobReputation);
            oScraped.iMeanReputation = utils.mean(arrJobReputation);
            oScraped.iSkewnessReputation = skewness(arrJobReputation);
            oScraped.iStandardDeviationReputation = utils.standardDeviation(arrJobReputation);
            oScraped.iCountSchools = oScraped.schools.length;
            oScraped.iMinSchoolPrice = utils.min(arrSchoolPrice);
            oScraped.iMaxSchoolPrice = utils.max(arrSchoolPrice);
            oScraped.iMeanSchoolPrice = utils.mean(arrSchoolPrice);
            oScraped.iSkewnessSchoolPrice = skewness(arrSchoolPrice);
            oScraped.iStandardDeviationSchoolPrice = utils.standardDeviation(arrSchoolPrice);
            oScraped.iMinSchoolReputation = utils.min(arrSchoolReputation);
            oScraped.iMaxSchoolReputation = utils.max(arrSchoolReputation);
            oScraped.iMeanSchoolReputation = utils.mean(arrSchoolReputation);
            oScraped.iSkewnessSchoolReputation = skewness(arrSchoolReputation);
            oScraped.iStandardDeviationSchoolReputation = utils.standardDeviation(arrSchoolReputation);
            oScraped.iMinSchoolSuffering = utils.min(arrSchoolSuffering);
            oScraped.iMaxSchoolSuffering = utils.max(arrSchoolSuffering);
            oScraped.iMeanSchoolSuffering = utils.mean(arrSchoolSuffering);
            oScraped.iSkewnessSchoolSuffering = skewness(arrSchoolSuffering);
            oScraped.iStandardDeviationSchoolSuffering = skewness(arrSchoolSuffering);

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
    let poScrapeResult;

    await _page.goto(sUrl, {
        'timeout': 0
    }); // timeout ref: https://github.com/GoogleChrome/puppeteer/issues/782

    await _page.content()
    _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

    executionContext = _page.mainFrame().executionContext();
    poScrapeResult = await executionContext.evaluate((_iCurrentInputRecord) => {
        return _fpWait(500)
            .then(function () {
                document.querySelector('.button.start').click();

                return _fpWaitForFunction(500, _fbReady)
                    .then(function () {
                        return Promise.resolve({
                            'jobs': model.patches
                                        .filter(function(patch){ return patch.jobData })
                                        .map(function(patch) { return patch.jobData }),
                            'schools': model.patches
                                        .filter(function(patch){ return patch.schoolData })
                                        .map(function(patch) { return patch.schoolData }),
                            'turtles': model.turtles.map(function(_agent){
                                return {
                                    'age': _agent.age,
                                    'consumptionUtility': _agent.consumptionUtility,
                                    'curiosity': _agent.curiosity,
                                    'iLifetimeUtility': _agent.iLifetimeUtility,
                                    'iUtilityPerTick': _agent.iUtilityPerTick,
                                    'isEducated': _agent.isEducated,
                                    'leisureUtility': _agent.leisureUtility,
                                    'money': _agent.money,
                                    'productivity': _agent.productivity,
                                    'speed': _agent.speed,
                                    'timePreference': _agent.timePreference
                                }
                            }),
                            'iTotalUtilityPerTick': model.iTotalUtilityPerTick,
                            'iTerminalTickCount': model.anim.ticks,
                            'iTicksPerSecond': model.anim.ticksPerSec(),
                            'bForceTerminate': model.bForceTerminate || false,
                            'bBlindMode': model.bUseBlindAnim
                        });
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

        // ref: https://stackoverflow.com/questions/30505960/use-promise-to-wait-until-polled-condition-is-satisfied
        function _fpWaitForFunction(ms, fb) {
            return new Promise(function (resolve) {
                (function _fpWaitLoop() {
                    if (fb()) return resolve();
                    setTimeout(_fpWaitLoop, ms);
                })();
            });
        }

        function _fbReady(_resolve) {
            console.log(model.anim.ticks);
            if (model.anim.ticks > 500) {
                return true;
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
function fsScrapedDataToResult(oScraped) {
    let sToCsv = ''
                + _fWrap(oScraped.iTotalUtilityPerTick)
                + _fWrap(oScraped.iCountAgents)
                + _fWrap(oScraped.iMinCuriosity)
                + _fWrap(oScraped.iMaxCuriosity)
                + _fWrap(oScraped.iMeanCuriosity)
                + _fWrap(oScraped.iSkewnessCuriosity)
                + _fWrap(oScraped.iStandardDeviationCuriosity)
                + _fWrap(oScraped.iMinUtilityPerTick)
                + _fWrap(oScraped.iMaxUtilityPerTick)
                + _fWrap(oScraped.iMeanUtilityPerTick)
                + _fWrap(oScraped.iSkewnessUtilityPerTick)
                + _fWrap(oScraped.iStandardDeviationUtilityPerTick)
                + _fWrap(oScraped.iMinMoney)
                + _fWrap(oScraped.iMaxMoney)
                + _fWrap(oScraped.iMeanMoney)
                + _fWrap(oScraped.iSkewnessMoney)
                + _fWrap(oScraped.iStandardDeviationMoney)
                + _fWrap(oScraped.iMeanIsEducated)
                + _fWrap(oScraped.iSkewnessIsEducated)
                + _fWrap(oScraped.iStandardDeviationIsEducated)
                + _fWrap(oScraped.iCountJobs)
                + _fWrap(oScraped.iMinWages)
                + _fWrap(oScraped.iMaxWages)
                + _fWrap(oScraped.iMeanWages)
                + _fWrap(oScraped.iSkewnessWages)
                + _fWrap(oScraped.iStandardDeviationWages)
                + _fWrap(oScraped.iMinEducatedBonusWages)
                + _fWrap(oScraped.iMaxEducatedBonusWages)
                + _fWrap(oScraped.iMeanEducatedBonusWages)
                + _fWrap(oScraped.iSkewnessEducatedBonusWages)
                + _fWrap(oScraped.iStandardDeviationEducatedBonusWages)
                + _fWrap(oScraped.iMinReputation)
                + _fWrap(oScraped.iMaxReputation)
                + _fWrap(oScraped.iMeanReputation)
                + _fWrap(oScraped.iSkewnessReputation)
                + _fWrap(oScraped.iStandardDeviationReputation)
                + _fWrap(oScraped.iCountSchools)
                + _fWrap(oScraped.iMinSchoolPrice)
                + _fWrap(oScraped.iMaxSchoolPrice)
                + _fWrap(oScraped.iMeanSchoolPrice)
                + _fWrap(oScraped.iSkewnessSchoolPrice)
                + _fWrap(oScraped.iStandardDeviationSchoolPrice)
                + _fWrap(oScraped.iMinSchoolReputation)
                + _fWrap(oScraped.iMaxSchoolReputation)
                + _fWrap(oScraped.iMeanSchoolReputation)
                + _fWrap(oScraped.iSkewnessSchoolReputation)
                + _fWrap(oScraped.iStandardDeviationSchoolReputation)
                + _fWrap(oScraped.iMinSchoolSuffering)
                + _fWrap(oScraped.iMaxSchoolSuffering)
                + _fWrap(oScraped.iMeanSchoolSuffering)
                + _fWrap(oScraped.iSkewnessSchoolSuffering)
                + _fWrap(oScraped.iStandardDeviationSchoolSuffering)
                + _fWrap(oScraped.iTerminalTickCount)
                + _fWrap(oScraped.iTicksPerSecond)
                + _fWrap(oScraped.iBatchSize || iBatchSize)
                + _fWrap(oScraped.bForceTerminate)
                + _fWrap(oScraped.bBlindMode)

    return sToCsv.slice(0, -1); // slice off the extra comma

    function _fWrap(v) {
        let s = String(v);

        if (s === 'undefined') s = '';

        return '"' + s + '",';
    }
}
