
const axios = require('axios');
const beautify = require('js-beautify').js_beautify;
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const util = require('util');
const utils = require('ella-utils');

const fpAccess = util.promisify(fs.access);
const fpGlob = util.promisify(glob);
const fpReadFile = util.promisify(fs.readFile);
const fpReadDir = util.promisify(fs.readdir);
const fpWriteFile = util.promisify(fs.writeFile);

const oServiceAuth = JSON.parse(fs.readFileSync(__dirname + '/service-auth.json', 'utf8'));
const sImagePrefix = 'https://raw.githubusercontent.com/Vandivier/data-science-practice/master/js/udacity-study/manually-scraped/profile-pics/';

// TODO: CSV sorts alpha on the key name, not on the value; maybe change that or make it configable
// TODO: false is coerced to empty string; it's fine if properly interpreted, but maybe change that so 'unobserved' !== false
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
    "sScrapedUrl": "Udacity URL",
    "bKairosImageSubmitted": "Image Submitted to Kairos",
    "bKairosImageRejected": "Image Rejected by Kairos",
    "iKairosAge": "Kairos Age",
    "iKairosAsian": "Kairos Asian",
    "iKairosBlack": "Kairos Black",
    "iKairosMaleConfidence": "Kairos Male Confidence",
    "iKairosHispanic": "Kairos Hispanic",
    "iKairosOtherEthnicity": "Kairos Other Ethnicity",
    "iKairosWhite": "Kairos White",
    "bGithubAccountClaimed": "GitHub Account Claimed on Udacity Profile",
    "bGitHubAccountFound": "GitHub Account Found and Scraped",
    "sGitHubUrl": "GitHub URL",
    "sGithubUserName": "GitHub User Name",
    "sGithubAnnualCommits": "GitHub Annual Commits",
    "sGithubRepos": "GitHub Repo Count",
    "sGithubFollowers": "GitHub Follower Count",
    "sLinkedInUrl": "LinkedIn URL",
    "sLinkedInImageUrl": "LinkedIn Image URL",
    "iLinkedInConnections": "LinkedIn Connections",
    "iLinkedInAccomplishments": "LinkedIn Accomplishments",
    "iLinkedInExperience": "LinkedIn Experience",
    "iLinkedInEducation": "LinkedIn Education",
    "bLinkedInCurrentlyEmployed": "LinkedIn Currently Employed",
};

const sOutFileLocation = __dirname + '/manually-scraped-results.csv';

let arrsCapturedProfilePictures = [];
let oGitHubIds = {};

main();

async function main() {
    const options = {};

    await utils.fpWait(2000); // for chrom debugger to attach

    await fpGlob('manually-scraped/profile-pics/*.jpg', options)
    .then(arrsFiles => {
        arrsCapturedProfilePictures = arrsFiles.map(s => {
            let arrs = s.split('/');
            arrs = arrs[arrs.length - 1].split('.jpg');
            return arrs[0];
        });
    });

    await fpGlob('manually-scraped/github-*-sample/*.txt', options)
    .then(arrsFiles => {
        arrsFiles.map(s => {
            let arrs = s.split('/');
            arrs = arrs[arrs.length - 1].split('.txt');
            oGitHubIds[arrs[0]] = s;
            return; // TODO: do I want to return a Promise?
        });
    });

    // for each udacity file
    await fpGlob('manually-scraped/**/*.txt', options)
    .then(arrsFiles => utils.forEachReverseAsyncPhased(arrsFiles, fpProcessRecord))
    .then(arroProcessedFiles => arroProcessedFiles
            .filter(oProcessedFile => oProcessedFile.sScrapedUserId)
         )
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

    if (!oRecord.sScrapedUserId                     // it's not a Udacity data file. maybe should be called sUdacityUserId
        || oRecord.sScrapedUserId !== 'adam1')      // adam1 check to limit API usage during development
    {  
        return Promise.resolve({});                 // return empty obj which will get filtered before csv writing
    }

    oRecord.sImageOnGithubUrl = sImagePrefix
            + oRecord.sScrapedUserId
            + '.jpg';
    oRecord.sInputLocation = sLocation;
    oRecord.sInputBaseName = path.basename(path.dirname(sLocation));    // ref: https://stackoverflow.com/questions/42956127/get-parent-directory-name-in-node-js
    oRecord.sOutputDirectory = path.dirname(sLocation)
            + ' - processed';
    oRecord.sOutputLocation = oRecord.sOutputDirectory
            + '/'
            + oRecord.sScrapedUserId
            + '.json';

    if (!fs.existsSync(oRecord.sOutputDirectory)) {                     // TODO: add to ella-utils
        fs.mkdirSync(oRecord.sOutputDirectory);
    }

    oRecord.bNameTruncated = oRecord.sName.split(',').length > 1;       // has `, Jr.`, etc
    oRecord.sName = oRecord.sName.split(',')[0];                        // get rid of `, Jr.`, etc
    await fpGetCachedData(oRecord);

    if (arrsCapturedProfilePictures.includes(oRecord.sScrapedUserId)) {
        oRecord.bKairosImageSubmitted = true;
        console.log('getting kairos for ' + oRecord.sScrapedUserId);
        await fpGetKairosData(oRecord);
    }

    try {
        fGetLanguagesSpoken(oRecord);
        fFixExperienceCount(oRecord);
        fFixLocation(oRecord);
        await fpGetGithubData(oRecord);
        await fpGetLinkedInData(oRecord);
        await fpGetNamePrismData(oRecord);
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
function fFixLocation(oRecord) {
    let arrsLocation = oRecord.sLocation
        && oRecord.sLocation.split(', ');
    let sStateCandidate;

    if (!arrsLocation) return;
    if (arrsLocation.length === 1) {
        sStateCandidate = arrsLocation[0];
    } else {
        sStateCandidate = arrsLocation[1];
    }

    if (sStateCandidate.length === 2) {
        oRecord.sState = sStateCandidate;
        oRecord.sCountry = 'United States';
    } else {
        oRecord.sCountry = sStateCandidate;
    }
}

async function fpGetCachedData(oRecord) {
    try {
        let oOldData = await fpReadFile(oRecord.sOutputLocation)
            .then(sRecord => JSON.parse(sRecord));

        oRecord.oCachedData = oOldData;
    } catch (e) {
        // just let oCachedDate be null
    }
}

async function fpGetGithubData(oRecord) {
    let sGitHubId = oRecord.sGitHubUrl
        && oRecord.sGitHubUrl.split('github.com/')[1];
    let oGitHubData;
    let sGitHubDataLocation;

    sGitHubId = sGitHubId && sGitHubId.split('/')[0];
    sGitHubDataLocation = oGitHubIds[sGitHubId];

    if (sGitHubId) {
        oRecord.bGithubAccountClaimed = true;

        if (sGitHubDataLocation) {
            oGitHubData = await fpReadFile(sGitHubDataLocation)
                .then(sRecord => JSON.parse(sRecord));

            oRecord.sGithubUserName = oGitHubData.sGithubUserName;
            oRecord.sGithubEmail = oGitHubData.sGithubEmail;
            oRecord.sGithubAnnualCommits = oGitHubData.sGithubAnnualCommits.replace(',','');
            oRecord.sGithubRepos = oGitHubData.sGithubRepos.replace(',','');
            oRecord.sGithubFollowers = oGitHubData.sGithubFollowers.replace(',','');
            oRecord.bGitHubAccountFound = true;
        } else {
            oRecord.bGitHubAccountFound = false;
        }
    } else {
        oRecord.bGithubAccountClaimed = false;
        oRecord.bGitHubAccountFound = false;
    }

    return Promise.resolve();
}

// ref: https://www.kairos.com/docs/getting-started
// get credentials from your free account at https://developer.kairos.com/admin
// copy fake-service-auth.json and fill in fields
// obviously, I .gitignore the real service-auth.json
async function fpGetKairosData(oRecord) {
    if (oRecord.sImageUrl) {
        if (oRecord.oCachedData
            && oRecord.oCachedData.iKairosAge)
        {
            oRecord.iKairosAge = oRecord.oCachedData.iKairosAge;
            oRecord.iKairosAsian = oRecord.oCachedData.iKairosAsian;
            oRecord.iKairosBlack = oRecord.oCachedData.iKairosBlack;
            oRecord.iKairosMaleConfidence = oRecord.oCachedData.iKairosMaleConfidence;
            oRecord.iKairosHispanic = oRecord.oCachedData.iKairosHispanic;
            oRecord.iKairosOtherEthnicity = oRecord.oCachedData.iKairosOtherEthnicity;
            oRecord.iKairosWhite = oRecord.oCachedData.iKairosWhite;
        } else if (!oRecord.oCachedData.bKairosImageRejected
                   || (oRecord.oCachedData.bKairosImageRejected && oRecord.oCachedData.bForceNewKairosAttempt))
        {
            await fpNewKairosCall(oRecord);
        } else {
            oRecord.bKairosImageRejected = true;
        }
    } else {
        await fpNewKairosCall(oRecord);
    }

    return Promise.resolve();
}

async function fpGetLinkedInData(oRecord) {
    return Promise.resolve();
}

async function fpGetNamePrismData(oRecord) {
    //for sThingToGet = eth, nat, url = 'http://www.name-prism.com/api_token/' + sThingToGet + '/csv/' + oServiceAuth.name_prism_token + '/' + encoded_name)
    return Promise.resolve();
}

async function fpNewKairosCall(oRecord) {
    let oOptions = {
        data: {
            image: oRecord.sImageOnGithubUrl
        },
        headers: {
            app_id: oServiceAuth.appid,
            app_key: oServiceAuth.key,
        },
        method: 'POST',
        url: 'http://api.kairos.com/detect',
    };

    console.log('Trying to get kairos data for: ' + oRecord.sScrapedUserId);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    oRecord.oKairosData = await axios.request(oOptions)
    .then(response => {
        let _oKairosData = response &&
            response.data &&
            response.data.images &&
            response.data.images.length &&
            response.data.images[0].faces.length &&
            response.data.images[0].faces[0].attributes;

        if (response.data.Errors) {
            oRecord.bKairosImageRejected = true;
            console.log('fpNewKairosCall business error: ', response.data.Errors)
        } else {
            oRecord.bKairosImageRejected = false;
            oRecord.iKairosAge = _oKairosData.age;
            oRecord.iKairosAsian = _oKairosData.asian;
            oRecord.iKairosBlack = _oKairosData.black;
            oRecord.iKairosMaleConfidence = _oKairosData.gender.maleConfidence;
            oRecord.iKairosHispanic = _oKairosData.hispanic;
            oRecord.iKairosOtherEthnicity = _oKairosData.other;
            oRecord.iKairosWhite = _oKairosData.white;
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewKairosCall.axios.post error: ', err));

    return Promise.resolve();
}

async function fpWriteOutput(oRecord) {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    await fpWriteFile(oRecord.sOutputLocation, sBeautifiedData, 'utf8')
        .catch(e => console.log('fpWriteOutput.fpWriteFile error: ', e));
    return oRecord;
}
