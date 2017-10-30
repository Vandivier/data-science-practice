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
const EOL = require('os').EOL;

const iChunkSize = 30;
const iThrottleInterval = 2;
const sRootSourceUrl = 'http://uci.ch/road/results/';

let browser;
var sSummary;
var arrsKeyVariables = ['sSummary'];

let oResultFileMapper = {
    sSummary,
};

/** executed process **/

console.log = utils.log(console);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', JSON.stringify(p), 'reason:', JSON.stringify(reason));
});

main();

/** definitions **/

async function foGetInstallationData(_oRename) {
    let _sUrl = utils.fsSupplant(sRootSourceUrl, {
        'TODO': _oRename.TODO
    });

    // download the CSV

    return Promise.resolve(_oRename);
}

//  _arr is an array of installations
//  Promise.reflect() ref: http://bluebirdjs.com/docs/api/reflect.html
async function fpCollectBatchInformation(_arr) {
    return await Promise.map(_arr, function (oRename) {
            return Promise
                .resolve(foGetInstallationData(oRename)
                    .catch(function (reason) {
                        return reason;
                    }))
                .reflect();
        })
        .each(function (inspection) {
            if (inspection.isFulfilled()) {
                return inspection.value();
            } else {
                arrErroredInstallationRequest.push(inspection.reason());
                return inspection.reason();
            }
        });
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
    let iBatch = 1;
    let throttleResult;

    browser = await puppeteer.launch();

    throttleResult = await utils.forEachThrottledAsync(iThrottleInterval, arrBatches, function (_arrBatch) {
        console.log('batch process for batch # ' + (iBatch++) + ' of ' + arrBatches.length)
        return fpCollectBatchInformation(_arrBatch);
    });

    //console.log(throttleResult)

    await fWriteResults();
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

async function fWriteResults() {
    let sResultFolder = __dirname + '\\results\\';

    sSummary = '';

    return await utils.forEachReverseAsyncParallel(arrsKeyVariables, function (sVariableName) {
        const sLocation = sResultFolder + sVariableName + '.txt';
        let _sMessage = oResultFileMapper[sVariableName];

        if (typeof _sMessage !== 'string') _sMessage = JSON.stringify(_sMessage);

        fs.truncateAsync(sLocation, 0)

        return fs.writeFileAsync(sLocation, _sMessage)
            .catch(function (reason) {
                console.log('writeFileAsync err: ', reason)
            })
    });
}
