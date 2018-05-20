// based on data-science-practice/js/udacity-study/process-manually-scraped-records.js
// nameprism done by hand; this script is for kairos and namsor

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

let arrsCapturedProfilePictures = [];
let arrsNamSorNameVariants = ['sNameWithoutInitials', 'sNameWithoutInitialsLowerCased'];
let sGeneralCacheLocation = __dirname + '/general-cache.json';

var bForceAllKairosAttempts = true;

const oGeneralCache = JSON.parse(fs.readFileSync(sGeneralCacheLocation, 'utf8'));
let oGitHubIds = {};
let oLinkedInIds = {};
const oServiceAuth = JSON.parse(fs.readFileSync(__dirname + '/service-auth.json', 'utf8'));

// TODO: CSV sorts alpha on the key name, not on the value; maybe change that or make it configable
// TODO: false is coerced to empty string; it's fine if properly interpreted, but maybe change that so 'unobserved' !== false
// TODO: survey
const oTitleLine = {
    "sLinkedInUrliKairosAge": "sLinkedInUrliKairosAge",
    "sLinkedInUrliKairosAsian": "sLinkedInUrliKairosAsian",
    "sLinkedInUrliKairosBlack": "sLinkedInUrliKairosBlack",
    "sLinkedInUrliKairosMaleConfidence": "sLinkedInUrliKairosMaleConfidence",
    "sLinkedInUrliKairosHispanic": "sLinkedInUrliKairosHispanic",
    "sLinkedInUrliKairosOtherEthnicity": "sLinkedInUrliKairosOtherEthnicity",
    "sLinkedInUrliKairosWhite": "sLinkedInUrliKairosWhite",
    "NamsorsNameWithoutInitialsLowerCased-gender": "NamsorsNameWithoutInitialsLowerCased-gender",
    "NamsorsNameWithoutInitialsLowerCased-country": "NamsorsNameWithoutInitialsLowerCased-country",
    "NamsorsNameWithoutInitialsLowerCased-countryAlt": "NamsorsNameWithoutInitialsLowerCased-countryAlt",
    "NamsorsNameWithoutInitialsLowerCased-script": "NamsorsNameWithoutInitialsLowerCased-script",
    "NamsorsNameWithoutInitialsLowerCased-countryFirstName": "NamsorsNameWithoutInitialsLowerCased-countryFirstName",
    "NamsorsNameWithoutInitialsLowerCased-countryLastName": "NamsorsNameWithoutInitialsLowerCased-countryLastName",
    "NamsorsNameWithoutInitialsLowerCased-subRegion": "NamsorsNameWithoutInitialsLowerCased-subRegion",
    "NamsorsNameWithoutInitialsLowerCased-region": "NamsorsNameWithoutInitialsLowerCased-region",
    "NamsorsNameWithoutInitialsLowerCased-topRegion": "NamsorsNameWithoutInitialsLowerCased-topRegion",
    "NamsorsNameWithoutInitialsLowerCased-countryName": "NamsorsNameWithoutInitialsLowerCased-countryName",
    "NamsorsNameWithoutInitialsLowerCased-ethno": "NamsorsNameWithoutInitialsLowerCased-ethno",
    "NamsorsNameWithoutInitialsLowerCased-ethnoAlt": "NamsorsNameWithoutInitialsLowerCased-ethnoAlt",
    "NamsorsNameWithoutInitialsLowerCased-geoCountry": "NamsorsNameWithoutInitialsLowerCased-geoCountry",
    "NamsorsNameWithoutInitialsLowerCased-geoCountryAlt": "NamsorsNameWithoutInitialsLowerCased-geoCountryAlt",
};

const sImagePrefix = 'https://raw.githubusercontent.com/Vandivier/data-science-practice/master/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-pictures/';
const sOutFileLocation = '/GitHub/data-science-practice/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-data/classifier-via-linkedin-pooled-and-processed.csv';

main();

async function main() {
    const options = {};

    //await utils.fpWait(5000); // for chrome debugger to attach

    await fpGlob('../../../../data-science-practice/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-pictures/*.jpg', options)
    .then(arrsFiles => {
        arrsCapturedProfilePictures = arrsFiles.map(s => {
            let arrs = s.split('/');
            arrs = arrs[arrs.length - 1].split('.jpg');
            return arrs[0];
        });
    });

    await fpGlob('../../../../data-science-practice/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-data/*.txt', options)
    .then(arrsFiles => {
        arrsFiles.map(s => {
            let arrs = s.split('/');
            arrs = arrs[arrs.length - 1].split('.txt');
            oLinkedInIds[arrs[0].toLowerCase()] = s;
            return;
        });

        return utils.forEachReverseAsyncPhased(arrsFiles, fpProcessRecord);
    })
    .then(arroProcessedFiles => arroProcessedFiles
            .filter(oProcessedFile => oProcessedFile.sLinkedInPath)
         )
    .then(arroProcessedFiles => {
        utils.fpObjectsToCSV(arroProcessedFiles, {
            oTitleLine,
            sOutFileLocation,
        })
    })
    .catch(e => console.log('fpGlob error: ', e));

    await fpWriteFile(sGeneralCacheLocation, JSON.stringify(oGeneralCache), 'utf8')
        .catch(e => console.log('oGeneralCache fpWriteFile error: ', e));

    console.log('Program completed.');
}

async function fpProcessRecord(sLocation) {
    let oRecord = await fpReadFile(sLocation)
        .then(sRecord => JSON.parse(sRecord));

    if (!oRecord.sLinkedInPath) {
        return Promise.resolve({});                 // return empty obj which will get filtered before csv writing
    }

    oRecord.sImageOnGithubUrl = sImagePrefix
            + oRecord.sLinkedInPath
            + '.jpg';
    oRecord.sOutputDirectory = path.dirname(sLocation)
            + ' - processed';
    oRecord.sOutputLocation = oRecord.sOutputDirectory
            + '/'
            + oRecord.sLinkedInPath
            + '.json';

    if (!fs.existsSync(oRecord.sOutputDirectory)) {                     // TODO: add to ella-utils
        fs.mkdirSync(oRecord.sOutputDirectory);
    }

    oRecord.sNameAsReported = oRecord.sLinkedInFullName;
    oRecord.sNameWithoutSuffix = oRecord.sLinkedInFullName.split(',')[0];           // get rid of `, Jr.`, etc
    oRecord.sNameWithoutInitials = oRecord.sNameWithoutSuffix
        .replace('.', '')
        .split(' ')
        .filter(s => s.length > 1)
        .filter((s, i, arr) => {
            let bFirstName = (i === 0);
            let bLastName = (i === arr.length - 1);
            return bFirstName || bLastName;
        })
        .join(' ')
        .replace(/\s/g, ' ');                                           // good to remove middle initials, maybe improving augmentor data, bad for people with initials-as-name.
    oRecord.sNameWithoutInitialsLowerCased = oRecord.sNameWithoutInitials.toLowerCase();
    oRecord.sNameFirst = oRecord.sNameWithoutInitials
        .split(' ')[0];                                                 // because sometimes it's all you have. And maybe that's good for females who marry another ethnicity?
    oRecord.sNameFirstLowercased = oRecord.sNameFirst.toLowerCase();

    await fpGetRecordCache(oRecord);

    if (arrsCapturedProfilePictures.includes(oRecord.sLinkedInPath)) {
        oRecord.bKairosImageSubmitted = true;
        console.log('getting kairos data for ' + oRecord.sLinkedInPath);
        await fpGetKairosData(oRecord);
    }

    try {
        await fpGetLinkedInData(oRecord);

        for (let iNameVariant in arrsNamSorNameVariants) {
            await fpGetNamsorData(oRecord, arrsNamSorNameVariants[iNameVariant]);
        }
    } catch (e) {
        console.log('late fpProcessRecord err: ', e);
    }

    if (oRecord.oCachedData
        && oRecord.oCachedData.oCachedData) // only ever cache 1 level deep
    {
        delete oRecord.oCachedData.oCachedData;
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

function fFixAlternativeExperienceCount(oRecord) {
    oRecord.iAlternativeExperienceCount = oRecord.iFlatIronExperience
        + oRecord.iGeneralAssemblyExperience
        + oRecord.iUdacityExperience
        + oRecord.iCourseraExperience
        + oRecord.iUdemyExperience
        + oRecord.iAppAcademyExperience;

    oRecord.bIsAlternativelyExperienced = (oRecord.iAlternativeExperienceCount > 0); // includes people who worked for a provider and people who claim alternative-education-as-experience, esp some bootcamp folks
}

async function fpGetRecordCache(oRecord) {
    try {
        let oOldData = await fpReadFile(oRecord.sOutputLocation)
            .then(sRecord => JSON.parse(sRecord));

        oRecord.oCachedData = oOldData;
    } catch (e) {
        // just let oCachedDate be null
    }
}

// ref: https://www.kairos.com/docs/getting-started
// get credentials from your free account at https://developer.kairos.com/admin
// copy fake-service-auth.json and fill in fields
// obviously, I .gitignore the real service-auth.json
async function fpGetKairosData(oRecord) {
    if (oRecord.sLinkedInImageUrl) {
        /* temporarily ignore cache
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
                   || (oRecord.oCachedData.bKairosImageRejected && oRecord.oCachedData.bForceNewKairosAttempt)
                   || bForceAllKairosAttempts)
        {
            await fpNewKairosCall(oRecord);
        } else {
            oRecord.bKairosImageRejected = true;
        }
    } else {
        */
        await fpNewKairosCall(oRecord);
    }

    return Promise.resolve();
}

// ref: https://www.kairos.com/docs/getting-started
// get credentials from your free account at https://developer.kairos.com/admin
// copy fake-service-auth.json and fill in fields
// obviously, I .gitignore the real service-auth.json
async function fpGetKairosVariant(oRecord, sVariant) {
    if (oRecord[sVariant]) {
        if (oRecord.oCachedData) {
            if (oRecord.oCachedData[sVariant + 'iKairosAge']) {
                oRecord[sVariant + 'iKairosAge'] = oRecord.oCachedData[sVariant + 'iKairosAge'];
                oRecord[sVariant + 'iKairosAsian'] = oRecord.oCachedData[sVariant + 'iKairosAsian'];
                oRecord[sVariant + 'iKairosBlack'] = oRecord.oCachedData[sVariant + 'iKairosBlack'];
                oRecord[sVariant + 'iKairosMaleConfidence'] = oRecord.oCachedData[sVariant + 'iKairosMaleConfidence'];
                oRecord[sVariant + 'iKairosHispanic'] = oRecord.oCachedData[sVariant + 'iKairosHispanic'];
                oRecord[sVariant + 'iKairosOtherEthnicity'] = oRecord.oCachedData[sVariant + 'iKairosOtherEthnicity'];
                oRecord[sVariant + 'iKairosWhite'] = oRecord.oCachedData[sVariant + 'iKairosWhite'];
            }
            else if (!oRecord.oCachedData[sVariant + 'bKairosImageRejected']
                     || (oRecord.oCachedData[sVariant + 'bKairosImageRejected'] && oRecord.oCachedData[sVariant + 'bForceNewKairosAttempt']))
            {
                await fpNewKairosCallVariant(oRecord, 'sLinkedInImageUrl');
            } else {
                oRecord[sVariant + 'bKairosImageRejected'] = true;
            }
        } else {
            await fpNewKairosCallVariant(oRecord, 'sLinkedInImageUrl');
        }
    }

    return Promise.resolve();
}

async function fpGetLinkedInData(oRecord) {
    let oLinkedInData;
    let sLinkedInDataLocation;
    let sLinkedInId = oRecord.sLinkedInUrl
        && oRecord.sLinkedInUrl.split('linkedin.com/in/')[1];

    sLinkedInId = sLinkedInId && sLinkedInId.split('/')[0].toLowerCase();

    if (sLinkedInId) {
        oRecord.bLinkedInAccountClaimed = true;
        sLinkedInDataLocation = oLinkedInIds[sLinkedInId]
            || oLinkedInIds[sLinkedInId.replace('-', '')];

        if (sLinkedInDataLocation) {
            oLinkedInData = await fpReadFile(sLinkedInDataLocation)
                .then(sRecord => JSON.parse(sRecord));

            oRecord.bLinkedInAccountFound = true;
            oRecord.sLinkedInFullName = oLinkedInData.sLinkedInFullName;
            oRecord.sLinkedInPath = oLinkedInData.sLinkedInPath;
            oRecord.sLinkedInImageUrl = oLinkedInData.sLinkedInImageUrl;
            oRecord.sPossibleLinkedInEmailAddress = oLinkedInData.sPossibleLinkedInEmailAddress;

            if (oLinkedInData.iLinkedInConnections.includes('500+')) {
                oRecord.bManyLinkedInConnections = true;
            } else {
                oRecord.iLinkedInConnections = oLinkedInData.iLinkedInConnections;
            }

            oRecord.iLinkedInAccomplishments = oLinkedInData.iLinkedInAccomplishments;
            oRecord.iCertifications = oLinkedInData.iCertifications;
            oRecord.iLinkedInExperience = oLinkedInData.iLinkedInExperience;
            oRecord.iLinkedInEducation = oLinkedInData.iLinkedInEducation;
            oRecord.bLinkedInCurrentlyEmployed = oLinkedInData.bLinkedInCurrentlyEmployed;

            oRecord.bLinkedInCurrentlyEmployed = oLinkedInData.bLinkedInCurrentlyEmployed;

            oRecord.iFlatIronExperience = oLinkedInData.iFlatIronExperience;
            oRecord.iGeneralAssemblyExperience = oLinkedInData.iGeneralAssemblyExperience;
            oRecord.iUdacityExperience = oLinkedInData.iUdacityExperience;
            oRecord.iCourseraExperience = oLinkedInData.iCourseraExperience;
            oRecord.iUdemyExperience = oLinkedInData.iUdemyExperience;
            oRecord.iAppAcademyExperience = oLinkedInData.iAppAcademyExperience;

            oRecord.iFlatIronCredentials = oLinkedInData.iFlatIronCredentials;
            oRecord.iGeneralAssemblyCredentials = oLinkedInData.iGeneralAssemblyCredentials;
            oRecord.iUdacityCredentials = oLinkedInData.iUdacityCredentials;
            oRecord.iCourseraCredentials = oLinkedInData.iCourseraCredentials;
            oRecord.iUdemyCredentials = oLinkedInData.iUdemyCredentials;
            oRecord.iAppAcademyCredentials = oLinkedInData.iAppAcademyCredentials;

            oRecord.iAlternativeCredentialCount = oLinkedInData.iAlternativeCredentialCount;
            oRecord.bIsAlternativelyEducated = oLinkedInData.bIsAlternativelyEducated

            fFixAlternativeExperienceCount(oRecord);
        } else {
            oRecord.bLinkedInAccountFound = false;
        }
    } else {
        oRecord.bLinkedInAccountClaimed = false;
        oRecord.bLinkedInAccountFound = false;
    }

    if (oRecord.sLinkedInImageUrl) await fpGetKairosVariant(oRecord, 'sLinkedInImageUrl');

    return Promise.resolve();
}

async function fpGetNamsorData(oRecord, sVariant) {
    let arrs = [];
    let sVariantKey = 'Namsor' + sVariant;
    let sNamSorUriComponent = oRecord[sVariant]
        && oRecord[sVariant].trim();
    let sUrl = '';

    if (!sNamSorUriComponent.includes(' ')) return;     // it's not a proper full name
    arrs = sNamSorUriComponent.split(' ');
    if (!arrs.length === 2)  return;                    // it's not a proper full name
    sNamSorUriComponent = arrs.join('/');

    sUrl = 'https://api.namsor.com/onomastics/api/json/gender/' + sNamSorUriComponent;

    if (oRecord.oCachedData
        && oRecord.oCachedData[sVariantKey + '-gender']
        || oGeneralCache[sUrl + '-gender'])
    {
        oRecord[sVariantKey + '-gender'] = oRecord.oCachedData[sVariantKey + '-gender']
            || oGeneralCache[sUrl + '-gender'];
    } else {
        await fpNewNamsorGenderCall(oRecord, sVariantKey, sUrl);
    }

    sUrl = 'https://api.namsor.com/onomastics/api/json/origin/' + sNamSorUriComponent;

    if (oRecord.oCachedData
        && oRecord.oCachedData[sVariantKey + '-country']
        || oGeneralCache[sUrl + '-country'])
    {
            oRecord[sVariantKey + '-country'] = oRecord.oCachedData['country']
                || oGeneralCache[sUrl + '-country'];
            oRecord[sVariantKey + '-countryAlt'] = oRecord.oCachedData['countryAlt']
                || oGeneralCache[sUrl + '-countryAlt'];
            oRecord[sVariantKey + '-script'] = oRecord.oCachedData['script']
                || oGeneralCache[sUrl + '-script'];
            oRecord[sVariantKey + '-countryFirstName'] = oRecord.oCachedData['countryFirstName']
                || oGeneralCache[sUrl + '-countryFirstName'];
            oRecord[sVariantKey + '-countryLastName'] = oRecord.oCachedData['countryLastName']
                || oGeneralCache[sUrl + '-countryLastName'];
            oRecord[sVariantKey + '-subRegion'] = oRecord.oCachedData['subRegion']
                || oGeneralCache[sUrl + '-subRegion'];
            oRecord[sVariantKey + '-region'] = oRecord.oCachedData['region']
                || oGeneralCache[sUrl + '-region'];
            oRecord[sVariantKey + '-topRegion'] = oRecord.oCachedData['topRegion']
                || oGeneralCache[sUrl + '-topRegion'];
            oRecord[sVariantKey + '-countryName'] = oRecord.oCachedData['countryName']
                || oGeneralCache[sUrl + '-countryName'];
    } else {
        await fpNewNamsorOriginCall(oRecord, sVariantKey, sUrl);
    }

    sUrl = 'https://api.namsor.com/onomastics/api/json/diaspora/' + sNamSorUriComponent;

    if (oRecord.oCachedData
        && oRecord.oCachedData[sVariantKey + '-ethno']
        || oGeneralCache[sUrl + '-ethno'])
    {
        oRecord[sVariantKey + '-ethno'] = oRecord.oCachedData['ethno']
            || oGeneralCache[sUrl + '-ethno'];
        oRecord[sVariantKey + '-ethnoAlt'] = oRecord.oCachedData['ethnoAlt']
            || oGeneralCache[sUrl + '-ethnoAlt'];
        oRecord[sVariantKey + '-geoCountry'] = oRecord.oCachedData['geoCountry']
            || oGeneralCache[sUrl + '-geoCountry'];
        oRecord[sVariantKey + '-geoCountryAlt'] = oRecord.oCachedData['geoCountryAlt']
            || oGeneralCache[sUrl + '-geoCountryAlt'];
    } else {
        await fpNewNamsorDiasporaCall(oRecord, sVariantKey, sUrl);
    }

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

    console.log('Trying to get kairos data for: ' + oRecord.sLinkedInPath);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
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

async function fpNewKairosCallVariant(oRecord, sVariant) {
    let oOptions = {
        data: {
            image: oRecord[sVariant]
        },
        headers: {
            app_id: oServiceAuth.appid,
            app_key: oServiceAuth.key,
        },
        method: 'POST',
        url: 'http://api.kairos.com/detect',
    };

    console.log('Trying to get variant kairos data for: ' + oRecord[sVariant]);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
    .then(response => {
        let _oKairosData = response &&
            response.data &&
            response.data.images &&
            response.data.images.length &&
            response.data.images[0].faces.length &&
            response.data.images[0].faces[0].attributes;

        if (response.data.Errors) {
            oRecord[sVariant + 'bKairosImageRejected'] = true;
            console.log('fpNewKairosCallVariant business error: ', response.data.Errors)
        } else {
            oRecord[sVariant + 'bKairosImageRejected'] = false;
            oRecord[sVariant + 'iKairosAge'] = _oKairosData.age;
            oRecord[sVariant + 'iKairosAsian'] = _oKairosData.asian;
            oRecord[sVariant + 'iKairosBlack'] = _oKairosData.black;
            oRecord[sVariant + 'iKairosMaleConfidence'] = _oKairosData.gender.maleConfidence;
            oRecord[sVariant + 'iKairosHispanic'] = _oKairosData.hispanic;
            oRecord[sVariant + 'iKairosOtherEthnicity'] = _oKairosData.other;
            oRecord[sVariant + 'iKairosWhite'] = _oKairosData.white;
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewKairosCallVariant.axios.post error: ', err));

    return Promise.resolve();
}

// TODO: repeat using each name variant
async function fpNewNamePrismEthnicityCall(oRecord, sVariantKey, sVariant) {
    let oOptions = {
        method: 'GET',
        url: 'http://www.name-prism.com/api_token/eth/json/' + oServiceAuth.name_prism_token + '/' + encodeURIComponent(oRecord.sNameAsReported),
    };

    console.log('fpNewNamePrismEthnicityCall for: ' + oRecord.sLinkedInPath);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
    .then(response => {
        let _oResponseData = response &&
            response.data;

        if (response.data['2PRACE']) {
            oRecord[sVariantKey + 'TwoPrace'] = _oResponseData['2PRACE'];
            oRecord[sVariantKey + 'Hispanic'] = _oResponseData['Hispanic'];
            oRecord[sVariantKey + 'Api'] = _oResponseData['API'];
            oRecord[sVariantKey + 'Black'] = _oResponseData['Black'];
            oRecord[sVariantKey + 'Asian'] = _oResponseData['AIAN'];
            oRecord[sVariantKey + 'White'] = _oResponseData['White'];
        } else {
            console.log('fpNewNamePrismEthnicityCall invalid response data or error', response.data);
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewNamePrismEthnicityCall.axios.post error: ', err));

    return Promise.resolve();
}

async function fpNewNamsorGenderCall(oRecord, sVariantKey, sUrl) {
    let oOptions = {
        headers: {
            'X-Channel-Secret': oServiceAuth.namsor_secret,
            'X-Channel-User': oServiceAuth.namsor_user,
        },
        method: 'GET',
        url: sUrl,
    };

    console.log('fpNewNamsorGenderCall for: ' + sUrl);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
    .then(response => {
        let _oResponseData = response &&
            response.data;

        if (response.data['gender']) {
            oRecord[sVariantKey + '-gender'] = _oResponseData['gender'];
            oGeneralCache[sUrl + '-gender'] = _oResponseData['gender'];
        } else {
            console.log('fpNewNamsorGenderCall invalid response data or error', response.data);
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewNamsorGenderCall.axios error: ', err));

    return Promise.resolve();
}

async function fpWriteOutput(oRecord) {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    await fpWriteFile(oRecord.sOutputLocation, sBeautifiedData, 'utf8')
        .catch(e => console.log('fpWriteOutput.fpWriteFile error: ', e));
    return oRecord;
}
