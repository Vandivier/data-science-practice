// description: after installing Puppeteer v1+, redoing the whole scraper. might be merged back later.
// largely based on the earhart fellows pattern, but using logic from udacity-employment.js as well
// also based on email-append-repec
// earhart fellows follows a stream pattern, this doesnt
// TODO: compare subsample pattern vs working backwards from genderize available names
// TODO: only get sUrl if valid data is not in the cache
//      valid data includes not a private profile
// TODO: add other data to cache such as genderized name
// TODO: get more data like linkedIn stuff

'use strict'

/*** boilerplate pretty much: TODO: extract to lib ***/

const beautify = require('js-beautify').js_beautify;
const EOL = require('os').EOL;
const fs = require('fs');
//const genderize = require('genderize'); // todo: use genderize
const reorder = require('csv-reorder');
//const split = require('split');
const proxyFromCache = require('./proxyFromCache.js')
const puppeteer = require('puppeteer');
const SocksClient = require('socks').SocksClient;
const tr = require('tor-request');
const util = require('util');
const utils = require('ella-utils');

const oTitleLine = {
    'sId': 'Entry ID',
    'sName': 'Name',
    'sEmail': 'Email Address',
    'sUserName': 'Username',
    'iEducationCount': 'Count of Education Entries',
    'sLinkedInUrl': 'LinkedIn Url',
    'sResumeUrl': 'Resume Url',
    'bUserExists': 'User Exists',
    'bProfileIsPrivate': 'Profile is Private',
    'bTooManyRequestsError': 'Scrape Blocked for Too Many Requests',
    'bOtherError': 'Other Error',
    'bPresentlyEmployed': 'Presently Employed',
    'sProfileLastUpdate': 'Profile Last Updated Date',
    'iTriesRemaining': 'Tries Remaining',
    'sUrl': 'Url Source'
};

const arrTableColumnKeys = Object.keys(oTitleLine);
const sRootUrl = 'https://profiles.udacity.com/u/';

// TODO: conventionalize var name to column title line value
// proposed rule: encounter each capital letter; splice before first letter and insert spaces in other cases
// fDehungarianize(sVariableName) => Variable Name
//const sResultDir = __dirname + '/results';

const sCacheFilePath = './cache.json';
const sOrderedOutputFilePath = './ordered-output.csv';
const sInputFilePath = __dirname + '/subsample-test.csv'; // TODO: use rsReadStream
const sOutputFilePath = __dirname + '/output.csv';

const fpReadFile = util.promisify(fs.readFile);
const fpWriteFile = util.promisify(fs.writeFile);

let oCache = JSON.parse(fs.readFileSync(sCacheFilePath, 'utf8'));

//const rsReadStream = fs.createReadStream('./EarhartMergedNoBoxNoLines.txt');
const wsWriteStream = fs.createWriteStream(sOutputFilePath);

let browser;
let iCurrentInputRecord = 0;
let iTotalInputRecords = 0;
let sResultToWrite;
let wsGotSome;
let wsErrorLog;

//main();
fConfigureSocks();

async function main() {
    let sInputCsv;
    let arrsInputRows;

    fsRecordToCsvLine(oTitleLine);
    //await utils.fpWait(5000); // only needed to give debugger time to attach
    sInputCsv = await fpReadFile(sInputFilePath, 'utf8');
    arrsInputRows = sInputCsv.split(EOL).filter(sLine => sLine); // drop title line and empty trailing lines

    /** for testing only, shorten rows **/
    //arrsInputRows = arrsInputRows.slice(0, 5);
    arrsInputRows.shift();
    iTotalInputRecords = arrsInputRows.length;

    if (typeof oCache !== 'object'
        || !iTotalInputRecords)
    { // don't waste time or requests if there's a problem
        console.log('error obtaining oFirstNameCache');
        fpEndProgram();
    }

    console.log('early count, iTotalInputRecords = ' + iTotalInputRecords);
    browser = await puppeteer.launch();
    // array pattern, doesn't work for streams
    // TODO await utils.forEachReverseAsyncPhased(arrsInputRows, fpHandleData) ?
    await utils.forEachReverseAsyncPhased(arrsInputRows, function(_sInputRecord, i) {
        return fpHandleData({
            'sInputRecord': _sInputRecord
        });
    });

    fpEndProgram();
}

async function fpHandleData(oRecord) {
    const arrsCells = oRecord.sInputRecord.split(',');
    let oModifiedRecord;

    if (oRecord.iModifiedIncrement === undefined) { // called normally from main(), forEachReverseAsyncPhased 
        oRecord.sFirstName = arrsCells[0];
        oRecord.sLastName = arrsCells[1];
        oRecord.iModifiedIncrement = 0;
    } else {
        // fpHandleData called recursively
        // increment username and try again; udacity business rule
        // TODO: not just first name, but try firstlast and maybe last too
        oRecord.iModifiedIncrement += 1;
    }

    oRecord.sId = oRecord.sFirstName
        + (oRecord.iModifiedIncrement || '');

    oRecord.sUrl = sRootUrl
        + oRecord.sId;

    oRecord = await fpScrapeInputRecord(oRecord);
    if (oRecord.bUserExists) await fpHandleData(oRecord); // deceptively simple, dangerously recursive

    iCurrentInputRecord++;
    console.log('scraped input record #: ' +
        iCurrentInputRecord +
        '/' + iTotalInputRecords +
        EOL);

    return Promise.resolve();
}

function fsRecordToCsvLine(oRecord) {
    utils.fsRecordToCsvLine(oRecord, arrTableColumnKeys, wsWriteStream);
}

async function fpEndProgram() {
    browser.close();
    await fpWriteCache();
    process.exit();
}

async function fpWriteCache() {
    let sBeautifiedData = JSON.stringify(oCache);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    console.log('beautified data', sBeautifiedData);

    await fpWriteFile(sCacheFilePath, sBeautifiedData, 'utf8', err => {
        reorder({
            input: sOutputFilePath, // too bad input can't be sBeautifiedData
            output: sOrderedOutputFilePath,
            sort: 'Entry ID'
        })
        .then(metadata => {
            console.log('Program completed.');
        })
        .catch(error => {
            console.log('Program completed with error.', error);
        });
    });

    return Promise.resolve();
}

/*** end boilerplate pretty much ***/

// not generalizable or temporally reliable in case of a site refactor
async function fpScrapeInputRecord(oRecord) {
    const _page = await browser.newPage();
    let oScrapeResult;

    await _page.goto(oRecord.sUrl, {
        'timeout': 0
    });

    if (oRecord.bUserExists !== false) { // yes, an exact check is needed.
        await _page.content()
        _page.on('console', _fCleanLog); // ref: https://stackoverflow.com/a/47460782/3931488

        oScrapeResult = await _page.evaluate((_iCurrentInputRecord) => {
            const script = document.createElement('script') // inject jQuery
            script.src = 'https://code.jquery.com/jquery-3.3.1.js'; // inject jQuery
            document.getElementsByTagName('head')[0].appendChild(script); // inject jQuery
            console.log('scraping: ' + window.location.href);

            return _fpWait(3000)
                .then(function () {
                    let arr$Affiliations = $('#affiliation-body a[name=subaffil]');
                    let sarrAffiliations = '';
                    let _oResult = {
                        'sName':  $('h1[class*="user--name"]').html(),
                        'sEmail': $('.emaillabel').parent().find('td span').text(),
                        'sUserName': '', //sUsername
                        'iEducationCount': $('div[class*="educations--section"] div[class*="_education--education"]').length,
                        'sLinkedInUrl': $('a[title="LINKEDIN"]').attr('href'),
                        'sResumeUrl': $('a[title="Resume"]').attr('href'),
                        'bUserExists': $('[class*=profile-container]').length > 0,
                        'bProfileIsPrivate': $('[class*="toast--message"]').html().trim() === 'Profile is private',
                        'bTooManyRequestsError': $('[class*="toast--message"]').html().trim() === 'Too many requests',
                        'bOtherError': false,
                        'bPresentlyEmployed': $('div[class*="works--section"] div[class*="_work--work"] span[class*="_work--present"]').length > 0,
                        'sProfileLastUpdate': $('div[class*="profile--updated"]').text().split(': ')[1],
                        'iTriesRemaining': '' //oResponse.triesRemaining
                    };

                    arr$Affiliations && arr$Affiliations.each(function (arr, el) {
                        _oResult.sarrAffiliations += ('~' + el.innerText.replace(/\s/g, ' ').trim());
                    });

                    return Promise.resolve(_oResult);
                })
                .catch(function (err) {
                    console.log('fpScrapeInputRecord err: ', err);
                    return err;
                });

            // larger time allows for slow site response
            // some times of day when it's responding fast u can get away
            // with smaller ms; suggested default of 12.5s
            function _fpWait(ms) {
                ms = ms || 10000;
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        })
        .catch(function (error) {

            if (error.message.includes('Execution context was destroyed')) {
                // context was destroyed by http redirect to 404 bc user doesn't exist.
                // well, that's the usual scenario. One can imagine a host of other causes too.
                return {
                    'bUserExists': false
                }
            }

            console.log('unknown _page.evaluate err: ', error);

            return {
                'bOtherError': true
            };
        });

        _page.close();
        oRecord = Object.assign(oRecord, oScrapeResult);
    }

    oCache.people[oRecord.sId] = oRecord;
    fsRecordToCsvLine(oRecord);
    return Promise.resolve(oRecord);

    function _fCleanLog(ConsoleMessage) {
        if (ConsoleMessage.type() === 'log') {
            console.log(ConsoleMessage.text() + EOL);
        }
    }
}

// ref: https://www.socks-proxy.net/
// ref: gimmeproxy.com
// ref: https://www.socksproxychecker.com/
// ref: https://github.com/chimurai/http-proxy-middleware
// ref: https://github.com/webfp/tor-browser-selenium
// TODO: automated tor browser?
async function fConfigureSocks() {
    var url = require('url');
    var http = require('http');
    var SocksProxyAgent = require('socks-proxy-agent');

    var proxy = 'socks://' + proxyFromCache.fpGetIp(oCache);
    console.log('using proxy server %j', proxy);
    var endpoint = 'http://www.google.com/'; // testing
    console.log('attempting to GET %j', endpoint);
    var opts = url.parse(endpoint);

    // create an instance of the `SocksProxyAgent` class with the proxy server information
    var agent = new SocksProxyAgent(proxy);
    opts.agent = agent;

    http.get(opts, function (res) {
        console.log('"response" event!', res.headers);
        res.pipe(process.stdout);
    });
}

/*
async function fConfigureSocks() {
    const oSocksOptions = {
        proxy: {
            ipaddress: '99.194.10.190',
            port: 46605,
            type: 5 // Proxy version (4 or 5)
        },

        command: 'connect', // SOCKS command (createConnection factory function only supports the connect command)

        destination: {
            host: 'github.com',
            port: 80
        }
    };

    try {
        const info = await SocksClient.createConnection(oSocksOptions);

        console.log(info.socket);
        // <Socket ...>  (this is a raw net.Socket that is established to the destination host through the given proxy server)
    } catch (err) {
        console.log('fConfigureSocks err', err);
    }

    tr.request('https://api.ipify.org', function (err, res, body) {
        if (!err && res.statusCode == 200) {
            console.log("Your public (through Tor) IP is: " + body);
        }
    });
}
*/
