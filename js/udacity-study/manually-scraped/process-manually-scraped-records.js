
const axios = require('axios');
const beautify = require('js-beautify').js_beautify;
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const util = require('util');
const utils = require('ella-utils');

const fpGlob = util.promisify(glob);
const fpReadFile = util.promisify(fs.readFile);
const fpReadDir = util.promisify(fs.readdir);
const fpWriteFile = util.promisify(fs.writeFile);

const oKairosAuth = JSON.parse(fs.readFileSync(__dirname + '/../kairos-auth.json', 'utf8'));
const sImagePrefix = 'https://raw.githubusercontent.com/Vandivier/data-science-practice/master/js/udacity-study/manually-scraped/profile-pics/';

const oTitleLine = {
    "sScrapedUserId": "User ID",
    "sProfileLastUpdate": "Months Since Last Profile Update",
    "sName": "Name",
    "bNameTruncated": "Name Truncated",
    "sStateOrCountry": "State or Country",
    //"sImageUrl": "https://s3-us-west-2.amazonaws.com/udacity-profiles/production/photo/4635953505.jpg#1522551447733",
    // TODO: github stars & commits
    "iDetailCount": "Count of Udacity Information Details",
    "iCountOfNanodegrees": "Count of Udacity Nanodegrees",
    "iEducationCount": "Count of Udacity Education Entries",
    "iExperienceCount": "Count of Udacity Experience Entries",
    "bPresentlyEmployed": "Presently Employed",
    "iAgeEstimate": "Age Estimated by Education and Experience",
    "iLanguagesSpoken": "Count Languages Spoken",
    "bSpeaksEnglish": "Speaks English",
    "bSpeaksSpanish": "Speaks Spanish",
    "bSpeaksOther": "Speaks Other Language",
    "sInputBaseName": "Sample Group Name",
    "oKairosData": "Kairo Data" // TODO: break this up
};

const sOutFileLocation = __dirname + '/manually-scraped-results.csv';

const arrsCapturedProfilePictures = [
    ''
];

main();

async function main() {
    const options = {};

    await fpGlob('manually-scraped/**/*.txt', options)
    .then(arrsFiles => utils.forEachReverseAsyncPhased(arrsFiles, fpProcessRecord))
    .then(arroProcessedFiles => utils.fpObjectsToCSV(arroProcessedFiles, {
        oTitleLine,
        sOutFileLocation,
    }))
    .catch(e => console.log('fpGlob error: ', e));

    console.log('Program completed.');
}

async function fpProcessRecord(sLocation) {
    let oRecord = await fpReadFile(sLocation)
        .then(sRecord => JSON.parse(sRecord));

    oRecord.sImageOnGithubUrl = sImagePrefix
            + oRecord.sScrapedUserId
            + '.jpg';
    oRecord.sInputLocation = sLocation;
    oRecord.sInputBaseName = path.basename(path.dirname(sLocation)); // ref: https://stackoverflow.com/questions/42956127/get-parent-directory-name-in-node-js
    oRecord.sOutputDirectory = path.dirname(sLocation)
            + ' - processed';
    oRecord.sOutputLocation = oRecord.sOutputDirectory
            + '/'
            + oRecord.sScrapedUserId
            + '.json';

    if (!fs.existsSync(oRecord.sOutputDirectory)) { // TODO: add to ella-utils
        fs.mkdirSync(oRecord.sOutputDirectory);
    }

    //if (oRecord.sScrapedUserId === 'adam1') { // to limit API usage during development
    if (arrsCapturedProfilePictures.includes(oRecord.sScrapedUserId)) {
        await fpAddKairosData(oRecord);
        console.log(oRecord.oKairosData);
    }

    oRecord.bNameTruncated = oRecord.sName.split(',').length > 1; // has `, Jr.`, etc
    oRecord.sName = oRecord.sName.split(',')[0]; // get rid of `, Jr.`, etc

    try {
        fGetLanguagesSpoken(oRecord);
        fFixExperienceCount(oRecord);
    } catch (e) {
        console.log('late fpProcessRecord err: ', e);
    }

    return fpWriteOutput(oRecord);
}

// easily extend to include other languages if we find any significance
function fGetLanguagesSpoken(oRecord) {
    let arrLanguagesSpoken = oRecord.sLanguagesSpoken
        .split(',')
        .map(sLanguage => sLanguage.toLowerCase().trim());
    let bSpeaksEnglish = arrLanguagesSpoken.toLowerCase;
    let iKnownLanguages = 0;

    if (arrLanguagesSpoken.includes('none')) {
        oRecord.iLanguagesSpoken = 0;
    } else {
        oRecord.iLanguagesSpoken = arrLanguagesSpoken.length;
    }

    if (arrLanguagesSpoken.includes('english')) {
        oRecord.bSpeaksEnglish = true;
        iKnownLanguages++;
    } else {
        oRecord.bSpeaksEnglish = false;
    }

    if (arrLanguagesSpoken.includes('spanish')) {
        oRecord.bSpeaksSpanish = true;
        iKnownLanguages++;
    } else {
        oRecord.bSpeaksSpanish = false;
    }

    if (oRecord.iLanguagesSpoken > iKnownLanguages) {
        oRecord.bSpeaksOther = true;
    } else {
        oRecord.bSpeaksOther = false;
    }
}

// fix checked into console scraper on 4/11
// for earlier records, this treatment is equivalent so no need to re-scrape
// earlier scraper was improperly counting everyone as 0 experience
function fFixExperienceCount(oRecord) {
    oRecord.iExperienceCount = (oRecord.sExperienceHtml
                                && oRecord.sExperienceHtml.match(/index--work--/g)
                                || []
                               ).length;
}

async function fpWriteOutput(oRecord) {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    await fpWriteFile(oRecord.sOutputLocation, sBeautifiedData, 'utf8')
        .catch(e => console.log('fpWriteOutput.fpWriteFile error: ', e));
    return oRecord;
}

// ref: https://www.kairos.com/docs/getting-started
// get credentials from your free account at https://developer.kairos.com/admin
// copy fake-kairos-auth.json and fill in fields
// obviously, I .gitignore the real kairos-auth.json
async function fpAddKairosData(oRecord) {
    let oOptions = {
        data: {
            image: oRecord.sImageOnGithubUrl
        },
        headers: {
            app_id: oKairosAuth.appid,
            app_key: oKairosAuth.key,
        },
        method: 'POST',
        url: 'http://api.kairos.com/detect',
    };

    if (oRecord.sImageUrl) {
        return axios.request(oOptions)
        .then(response => {
            let _oKairosData = response
                && response.data
                && response.data.images
                && response.data.images.length
                && response.data.images[0].faces.length
                && response.data.images[0].faces[0].attributes;

            oRecord.oKairosData = _oKairosData;

            if (response.data.Errors) {
                console.log('fpAddKairosData business error: ', response.data.Errors)
            }

            return Promise.resolve();
        })
        .catch(err => console.log('fpAddKairosData.axios.post error: ', err));
    }

    return Promise.resolve();
}
