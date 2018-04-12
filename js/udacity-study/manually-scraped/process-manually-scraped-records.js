
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

// TODO: github stars & commits
// TODO: linkedin stuff
// TODO: survey
const oTitleLine = {
    "sScrapedUserId": "User ID",
    "sProfileLastUpdate": "Months Since Last Profile Update",
    "sName": "Name",
    "bNameTruncated": "Name Truncated",
    "sState": "US State",
    "sCountry": "Country",
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
    "bShouldHaveKairos": "Has Kairos",
    "iKairosAge": "Kairos Age",
    "iKairosAsian": "Kairos Asian",
    "iKairosBlack": "Kairos Black",
    "iKairosMaleConfidence": "Kairos Male Confidence",
    "iKairosHispanic": "Kairos Hispanic",
    "iKairosOtherEthnicity": "Kairos Other Ethnicity",
    "iKairosWhite": "Kairos White",
};

const sOutFileLocation = __dirname + '/manually-scraped-results.csv';

let arrsCapturedProfilePictures = [];

main();

async function main() {
    const options = {};

    await fpGlob('manually-scraped/profile-pics/*.jpg', options)
    .then(arrsFiles => {
        arrsCapturedProfilePictures = arrsFiles.map(s => {
            let arrs = s.split('/');
            arrs = arrs[arrs.length - 1].split('.jpg');
            return arrs[0];
        });
    });

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
        oRecord.bShouldHaveKairos = true;
        await fpAddKairosData(oRecord);
    }

    oRecord.bNameTruncated = oRecord.sName.split(',').length > 1; // has `, Jr.`, etc
    oRecord.sName = oRecord.sName.split(',')[0]; // get rid of `, Jr.`, etc

    try {
        fGetLanguagesSpoken(oRecord);
        fFixExperienceCount(oRecord);
        fFixLocation(oRecord);
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

// previously, I assumed it's like city, state/country
// that's often but not always true
// sometimes it's just country
// rarely, it's state, country
// also, I need to provide United States as a country to capture national effects
function fFixLocation(oResult) {
    let arrsLocation = oResult.sLocation
        && oResult.sLocation.split(', ');
    let sStateCandidate;

    if (!arrsLocation) return;
    if (arrsLocation.length === 1) {
        sStateCandidate = arrsLocation[0];
    } else {
        sStateCandidate = arrsLocation[1];
    }

    if (sStateCandidate.length === 2) {
        oResult.sState = sStateCandidate;
        oResult.sCountry = 'United States';
    } else {
        oResult.sCountry = sStateCandidate;
    }
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

            if (_oKairosData) {
                oRecord.iKairosAge = _oKairosData.age;
                oRecord.iKairosAsian = _oKairosData.asian;
                oRecord.iKairosBlack = _oKairosData.black;
                oRecord.iKairosMaleConfidence = _oKairosData.gender.maleConfidence;
                oRecord.iKairosHispanic = _oKairosData.hispanic;
                oRecord.iKairosOtherEthnicity = _oKairosData.other;
                oRecord.iKairosWhite = _oKairosData.white;
            }

            if (response.data.Errors) {
                console.log('fpAddKairosData business error: ', response.data.Errors)
            }

            return Promise.resolve();
        })
        .catch(err => console.log('fpAddKairosData.axios.post error: ', err));
    }

    return Promise.resolve();
}
