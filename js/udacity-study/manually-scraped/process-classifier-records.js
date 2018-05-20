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

const sImagePrefix = 'https://raw.githubusercontent.com/Vandivier/data-science-practice/tree/master/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-pictures/';
const sOutFileLocation = '/GitHub/data-science-practice/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-data/classifier-via-linkedin-pooled-and-processed.csv';

main();

async function main() {
    const options = {};

    //await utils.fpWait(5000); // for chrome debugger to attach

    /*
    await fpGlob('/d/github/data-science-practice/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-pictures/*.jpg', options)
    .then(arrsFiles => {
        arrsCapturedProfilePictures = arrsFiles.map(s => {
            let arrs = s.split('/');
            arrs = arrs[arrs.length - 1].split('.jpg');
            return arrs[0];
        });
    });
    */

    //await fpGlob('/d/github/data-science-practice/stata/udacity-exploratory-analysis/classifier-survey-data/linkedin-data/*.txt', options)
    await fpGlob('manually-scraped/profile-pics/*.jpg', options)
    .then(arrsFiles => {
        console.log(arrsFiles)
    });
/*
    .then(arrsFiles => {
        console.log(arrsFiles)
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
        */

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

    oRecord.sNameAsReported = oRecord.sName;
    oRecord.sNameWithoutSuffix = oRecord.sName.split(',')[0];           // get rid of `, Jr.`, etc
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
        console.log('getting kairos npm for ' + oRecord.sLinkedInPath);
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

/* example output for eth:
Jewish,0.0000
Nordic-Finland,0.0000
Nordic-Scandinavian-Denmark,0.0185
Nordic-Scandinavian-Sweden,0.0000
Nordic-Scandinavian-Norway,0.0092
Greek,0.0033
SouthAsian,0.0001
CelticEnglish,0.0223
Hispanic-Philippines,0.0022
Hispanic-Spanish,0.0016
Hispanic-Portuguese,0.0030
African-EastAfrican,0.0000
African-WestAfrican,0.0000
African-SouthAfrican,0.0001
EastAsian-Malay-Indonesia,0.0000
EastAsian-Indochina-Thailand,0.0000
EastAsian-Indochina-Vietnam,0.0000
EastAsian-Japan,0.0000
EastAsian-Chinese,0.0003
EastAsian-Malay-Malaysia,0.0002
EastAsian-South Korea,0.0000
EastAsian-Indochina-Cambodia,0.0000
EastAsian-Indochina-Myanmar,0.0000
Muslim-Persian,0.0000
Muslim-Maghreb,0.0000
Muslim-Turkic-CentralAsian,0.0000
Muslim-Pakistanis-Bangladesh,0.0000
Muslim-Nubian,0.0000
Muslim-Pakistanis-Pakistan,0.0000
Muslim-ArabianPeninsula,0.0000
Muslim-Turkic-Turkey,0.0000
European-SouthSlavs,0.0000
European-Italian-Italy,0.0000
European-Baltics,0.0002
European-Italian-Romania,0.0000
European-French,0.0029
European-Russian,0.0000
European-EastEuropean,0.0000
European-German,0.9360
*/
// see: Ye-et-al.-Unknown-Nationality-Classification-Using-Name-Embeddings.pdf
// note: be sure to check continous-to-boolean coercion during analysis; it may provide gains from sampling
async function fpGetNamePrismData(oRecord, sVariant) {
    let sVariantKey = 'iNamePrism' + sVariant;

    if (oRecord.oCachedData
        && oRecord.oCachedData[sVariantKey + 'TwoPrace'])
    {
        oRecord[sVariantKey + 'TwoPrace'] = oRecord.oCachedData[sVariantKey + 'TwoPrace'];
        oRecord[sVariantKey + 'Hispanic'] = oRecord.oCachedData[sVariantKey + 'Hispanic'];
        oRecord[sVariantKey + 'Api'] = oRecord.oCachedData[sVariantKey + 'Api'];
        oRecord[sVariantKey + 'Black'] = oRecord.oCachedData[sVariantKey + 'Black'];
        oRecord[sVariantKey + 'Asian'] = oRecord.oCachedData[sVariantKey + 'Asian'];
        oRecord[sVariantKey + 'White'] = oRecord.oCachedData[sVariantKey + 'White'];
    } else {
        await fpNewNamePrismEthnicityCall(oRecord, sVariantKey, sVariant);
    }

    if (oRecord.oCachedData
        && oRecord.oCachedData[sVariantKey + '-Jewish'])
    {
        oRecord[sVariantKey + '-Jewish'] = oRecord.oCachedData[sVariantKey + '-Jewish'];
        oRecord[sVariantKey + '-Nordic-Finland'] = oRecord.oCachedData[sVariantKey + '-Nordic-Finland'];
        oRecord[sVariantKey + '-Nordic-Scandinavian-Denmark'] = oRecord.oCachedData[sVariantKey + '-Nordic-Scandinavian-Denmark'];
        oRecord[sVariantKey + '-Nordic-Scandinavian-Sweden'] = oRecord.oCachedData[sVariantKey + '-Nordic-Scandinavian-Sweden'];
        oRecord[sVariantKey + '-Nordic-Scandinavian-Norway'] = oRecord.oCachedData[sVariantKey + '-Nordic-Scandinavian-Norway'];
        oRecord[sVariantKey + '-Nordic'] = oRecord.oCachedData[sVariantKey + '-Nordic'];

        oRecord[sVariantKey + '-Greek'] = oRecord.oCachedData[sVariantKey + '-Greek'];
        oRecord[sVariantKey + '-SouthAsian'] = oRecord.oCachedData[sVariantKey + '-SouthAsian'];
        oRecord[sVariantKey + '-CelticEnglish'] = oRecord.oCachedData[sVariantKey + '-CelticEnglish'];

        oRecord[sVariantKey + '-Hispanic-Philippines'] = oRecord.oCachedData[sVariantKey + '-Hispanic-Philippines'];
        oRecord[sVariantKey + '-Hispanic-Spanish'] = oRecord.oCachedData[sVariantKey + '-Hispanic-Spanish'];
        oRecord[sVariantKey + '-Hispanic-Portuguese'] = oRecord.oCachedData[sVariantKey + '-Hispanic-Portuguese'];
        oRecord[sVariantKey + '-Hispanic'] = oRecord.oCachedData[sVariantKey + '-Hispanic'];

        oRecord[sVariantKey + '-African-EastAfrican'] = oRecord.oCachedData[sVariantKey + '-African-EastAfrican'];
        oRecord[sVariantKey + '-African-WestAfrican'] = oRecord.oCachedData[sVariantKey + '-African-WestAfrican'];
        oRecord[sVariantKey + '-African-SouthAfrican'] = oRecord.oCachedData[sVariantKey + '-African-SouthAfrican'];
        oRecord[sVariantKey + '-African'] =  oRecord.oCachedData[sVariantKey + '-African'];

        oRecord[sVariantKey + '-EastAsian-Malay-Indonesia'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Malay-Indonesia'];
        oRecord[sVariantKey + '-EastAsian-Indochina-Thailand'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Indochina-Thailand'];
        oRecord[sVariantKey + '-EastAsian-Indochina-Vietnam'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Indochina-Vietnam'];
        oRecord[sVariantKey + '-EastAsian-Japan'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Japan'];
        oRecord[sVariantKey + '-EastAsian-Chinese'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Chinese'];
        oRecord[sVariantKey + '-EastAsian-Malay-Malaysia'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Malay-Malaysia'];
        oRecord[sVariantKey + '-EastAsian-South Korea'] = oRecord.oCachedData[sVariantKey + '-EastAsian-South Korea'];
        oRecord[sVariantKey + '-EastAsian-Indochina-Cambodi'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Indochina-Cambodi'];
        oRecord[sVariantKey + '-EastAsian-Indochina-Myanmar'] = oRecord.oCachedData[sVariantKey + '-EastAsian-Indochina-Myanmar'];
        oRecord[sVariantKey + '-EastAsian'] = oRecord.oCachedData[sVariantKey + '-EastAsian'];

        oRecord[sVariantKey + '-Muslim-Persian'] = oRecord.oCachedData[sVariantKey + '-Muslim-Persian'];
        oRecord[sVariantKey + '-Muslim-Maghreb'] = oRecord.oCachedData[sVariantKey + '-Muslim-Maghreb'];
        oRecord[sVariantKey + '-Muslim-Turkic-CentralAsian'] = oRecord.oCachedData[sVariantKey + '-Muslim-Turkic-CentralAsian'];
        oRecord[sVariantKey + '-Muslim-Pakistanis-Bangladesh'] = oRecord.oCachedData[sVariantKey + '-Muslim-Pakistanis-Bangladesh'];
        oRecord[sVariantKey + '-Muslim-Nubian'] = oRecord.oCachedData[sVariantKey + '-Muslim-Nubian'];
        oRecord[sVariantKey + '-Muslim-Pakistanis-Pakistan'] = oRecord.oCachedData[sVariantKey + '-Muslim-Pakistanis-Pakistan'];
        oRecord[sVariantKey + '-Muslim-ArabianPeninsula'] = oRecord.oCachedData[sVariantKey + '-Muslim-ArabianPeninsula'];
        oRecord[sVariantKey + '-Muslim-Turkic-Turkey'] = oRecord.oCachedData[sVariantKey + '-Muslim-Turkic-Turkey'];
        oRecord[sVariantKey + '-Muslim'] = oRecord.oCachedData[sVariantKey + '-Muslim'];

        oRecord[sVariantKey + '-European-SouthSlavs'] = oRecord.oCachedData[sVariantKey + '-European-SouthSlavs'];
        oRecord[sVariantKey + '-European-Italian-Italy'] = oRecord.oCachedData[sVariantKey + '-European-Italian-Italy'];
        oRecord[sVariantKey + '-European-Baltics'] = oRecord.oCachedData[sVariantKey + '-European-Baltics'];
        oRecord[sVariantKey + '-European-Italian-Romania'] = oRecord.oCachedData[sVariantKey + '-European-Italian-Romania'];
        oRecord[sVariantKey + '-European-French'] = oRecord.oCachedData[sVariantKey + '-European-French'];
        oRecord[sVariantKey + '-European-Russian'] = oRecord.oCachedData[sVariantKey + '-European-Russian'];
        oRecord[sVariantKey + '-European-EastEuropean'] = oRecord.oCachedData[sVariantKey + '-European-EastEuropean'];
        oRecord[sVariantKey + '-European-German'] = oRecord.oCachedData[sVariantKey + '-European-German'];
        oRecord[sVariantKey + '-European'] = oRecord.oCachedData[sVariantKey + '-European'];
    } else {
        await fpNewNamePrismNationalityCall(oRecord, sVariantKey, sVariant);
    }

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

async function fpNewNamePrismNationalityCall(oRecord, sVariantKey, sVariant) {
    let oOptions = {
        method: 'GET',
        url: 'http://www.name-prism.com/api_token/nat/json/' + oServiceAuth.name_prism_token + '/' + encodeURIComponent(oRecord.sNameAsReported),
    };

    console.log('fpNewNamePrismNationalityCall for: ' + oRecord.sLinkedInPath);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
    .then(response => {
        let _oResponseData = response &&
            response.data;

        if (response.data['Jewish']) {
            // replace commas in key names with dash
            // ref: https://stackoverflow.com/questions/37982805/javascript-how-to-loop-and-change-key-name
            Object.keys(response.data).forEach(function(sKey) {
              if (sKey.includes(',')) {
                  response.data[sKey.replace(',','-')] = response.data[sKey];
                  delete response.data[sKey];
              }
            });

            oRecord[sVariantKey + '-Jewish'] = _oResponseData['Jewish'];
            oRecord[sVariantKey + '-Nordic-Finland'] = _oResponseData['Nordic-Finland'];
            oRecord[sVariantKey + '-Nordic-Scandinavian-Denmark'] = _oResponseData['Nordic-Scandinavian-Denmark'];
            oRecord[sVariantKey + '-Nordic-Scandinavian-Sweden'] = _oResponseData['Nordic-Scandinavian-Sweden'];
            oRecord[sVariantKey + '-Nordic-Scandinavian-Norway'] = _oResponseData['Nordic-Scandinavian-Norway'];
            oRecord[sVariantKey + '-Nordic'] = _oResponseData['Nordic'];

            oRecord[sVariantKey + '-Greek'] = _oResponseData['Greek'];
            oRecord[sVariantKey + '-SouthAsian'] = _oResponseData['SouthAsian'];
            oRecord[sVariantKey + '-CelticEnglish'] = _oResponseData['CelticEnglish'];

            oRecord[sVariantKey + '-Hispanic-Philippines'] = _oResponseData['Hispanic-Philippines'];
            oRecord[sVariantKey + '-Hispanic-Spanish'] = _oResponseData['Hispanic-Spanish'];
            oRecord[sVariantKey + '-Hispanic-Portuguese'] = _oResponseData['Hispanic-Portuguese'];
            oRecord[sVariantKey + '-Hispanic'] = _oResponseData['Hispanic'];

            oRecord[sVariantKey + '-African-EastAfrican'] = _oResponseData['African-EastAfrican'];
            oRecord[sVariantKey + '-African-WestAfrican'] = _oResponseData['African-WestAfrican'];
            oRecord[sVariantKey + '-African-SouthAfrican'] = _oResponseData['African-SouthAfrican'];
            oRecord[sVariantKey + '-African'] =  _oResponseData['African'];

            oRecord[sVariantKey + '-EastAsian-Malay-Indonesia'] = _oResponseData['EastAsian-Malay-Indonesia'];
            oRecord[sVariantKey + '-EastAsian-Indochina-Thailand'] = _oResponseData['EastAsian-Indochina-Thailand'];
            oRecord[sVariantKey + '-EastAsian-Indochina-Vietnam'] = _oResponseData['EastAsian-Indochina-Vietnam'];
            oRecord[sVariantKey + '-EastAsian-Japan'] = _oResponseData['EastAsian-Japan'];
            oRecord[sVariantKey + '-EastAsian-Chinese'] = _oResponseData['EastAsian-Chinese'];
            oRecord[sVariantKey + '-EastAsian-Malay-Malaysia'] = _oResponseData['EastAsian-Malay-Malaysia'];
            oRecord[sVariantKey + '-EastAsian-South Korea'] = _oResponseData['EastAsian-South Korea'];
            oRecord[sVariantKey + '-EastAsian-Indochina-Cambodi'] = _oResponseData['EastAsian-Indochina-Cambodi'];
            oRecord[sVariantKey + '-EastAsian-Indochina-Myanmar'] = _oResponseData['EastAsian-Indochina-Myanmar'];
            oRecord[sVariantKey + '-EastAsian'] = _oResponseData['EastAsian'];

            oRecord[sVariantKey + '-Muslim-Persian'] = _oResponseData['Muslim-Persian'];
            oRecord[sVariantKey + '-Muslim-Maghreb'] = _oResponseData['Muslim-Maghreb'];
            oRecord[sVariantKey + '-Muslim-Turkic-CentralAsian'] = _oResponseData['Muslim-Turkic-CentralAsian'];
            oRecord[sVariantKey + '-Muslim-Pakistanis-Bangladesh'] = _oResponseData['Muslim-Pakistanis-Bangladesh'];
            oRecord[sVariantKey + '-Muslim-Nubian'] = _oResponseData['Muslim-Nubian'];
            oRecord[sVariantKey + '-Muslim-Pakistanis-Pakistan'] = _oResponseData['Muslim-Pakistanis-Pakistan'];
            oRecord[sVariantKey + '-Muslim-ArabianPeninsula'] = _oResponseData['Muslim-ArabianPeninsula'];
            oRecord[sVariantKey + '-Muslim-Turkic-Turkey'] = _oResponseData['Muslim-Turkic-Turkey'];
            oRecord[sVariantKey + '-Muslim'] = _oResponseData['Muslim'];

            oRecord[sVariantKey + '-European-SouthSlavs'] = _oResponseData['European-SouthSlavs'];
            oRecord[sVariantKey + '-European-Italian-Italy'] = _oResponseData['European-Italian-Italy'];
            oRecord[sVariantKey + '-European-Baltics'] = _oResponseData['European-Baltics'];
            oRecord[sVariantKey + '-European-Italian-Romania'] = _oResponseData['European-Italian-Romania'];
            oRecord[sVariantKey + '-European-French'] = _oResponseData['European-French'];
            oRecord[sVariantKey + '-European-Russian'] = _oResponseData['European-Russian'];
            oRecord[sVariantKey + '-European-EastEuropean'] = _oResponseData['European-EastEuropean'];
            oRecord[sVariantKey + '-European-German'] = _oResponseData['European-German'];
            oRecord[sVariantKey + '-European'] = _oResponseData['European'];
        } else {
            console.log('fpNewNamePrismNationalityCall invalid response data or error', response.data);
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewNamePrismNationalityCall.axios.post error: ', err));

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

async function fpNewNamsorGenderWithCountryCall(oRecord, sVariantKey, sUrl) {
    
}

async function fpNewNamsorOriginCall(oRecord, sVariantKey, sUrl) {
    let oOptions = {
        headers: {
            'X-Channel-Secret': oServiceAuth.namsor_secret,
            'X-Channel-User': oServiceAuth.namsor_user,
        },
        method: 'GET',
        url: sUrl,
    };

    console.log('fpNewNamsorOriginCall for: ' + sUrl);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
    .then(response => {
        let _oResponseData = response &&
            response.data;

        if (response.data['country']) {
            oRecord[sVariantKey + '-country'] = _oResponseData['country'];
            oGeneralCache[sUrl + '-country'] = _oResponseData['country'];
            oRecord[sVariantKey + '-countryAlt'] = _oResponseData['countryAlt'];
            oGeneralCache[sUrl + '-countryAlt'] = _oResponseData['countryAlt'];
            oRecord[sVariantKey + '-script'] = _oResponseData['script'];
            oGeneralCache[sUrl + '-script'] = _oResponseData['script'];
            oRecord[sVariantKey + '-countryFirstName'] = _oResponseData['countryFirstName'];
            oGeneralCache[sUrl + '-countryFirstName'] = _oResponseData['countryFirstName'];
            oRecord[sVariantKey + '-countryLastName'] = _oResponseData['countryLastName'];
            oGeneralCache[sUrl + '-countryLastName'] = _oResponseData['countryLastName'];
            oRecord[sVariantKey + '-subRegion'] = _oResponseData['subRegion'];
            oGeneralCache[sUrl + '-subRegion'] = _oResponseData['subRegion'];
            oRecord[sVariantKey + '-region'] = _oResponseData['region'];
            oGeneralCache[sUrl + '-region'] = _oResponseData['region'];
            oRecord[sVariantKey + '-topRegion'] = _oResponseData['topRegion'];
            oGeneralCache[sUrl + '-topRegion'] = _oResponseData['topRegion'];
            oRecord[sVariantKey + '-countryName'] = _oResponseData['countryName'];
            oGeneralCache[sUrl + '-countryName'] = _oResponseData['countryName'];
        } else {
            console.log('fpNewNamsorOriginCall invalid response data or error', response.data);
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewNamsorOriginCall.axios error: ', err));

    return Promise.resolve();
}

async function fpNewNamsorDiasporaCall(oRecord, sVariantKey, sUrl) {
    let oOptions = {
        headers: {
            'X-Channel-Secret': oServiceAuth.namsor_secret,
            'X-Channel-User': oServiceAuth.namsor_user,
        },
        method: 'GET',
        url: sUrl,
    };

    console.log('fpNewNamsorDiasporaCall for: ' + sUrl);

    await utils.fpWait(2000); // throttle a bit to be nice :)
    await axios.request(oOptions)
    .then(response => {
        let _oResponseData = response &&
            response.data;

        if (response.data['ethno']) {
            oRecord[sVariantKey + '-ethno'] = _oResponseData['ethno'];
            oGeneralCache[sUrl + '-ethno'] = _oResponseData['ethno'];
            oRecord[sVariantKey + '-ethnoAlt'] = _oResponseData['ethnoAlt'];
            oGeneralCache[sUrl + '-ethnoAlt'] = _oResponseData['ethnoAlt'];
            oRecord[sVariantKey + '-geoCountry'] = _oResponseData['geoCountry'];
            oGeneralCache[sUrl + '-geoCountry'] = _oResponseData['geoCountry'];
            oRecord[sVariantKey + '-geoCountryAlt'] = _oResponseData['geoCountryAlt'];
            oGeneralCache[sUrl + '-geoCountryAlt'] = _oResponseData['geoCountryAlt'];
        } else {
            console.log('fpNewNamsorDiasporaCall invalid response data or error', response.data);
        }

        return Promise.resolve();
    })
    .catch(err => console.log('fpNewNamsorDiasporaCall.axios error: ', err));

    return Promise.resolve();
}

async function fpNewNamsorDiasporaWithCountryCall(oRecord, sVariantKey, sUrl) {
    
}

async function fpWriteOutput(oRecord) {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    await fpWriteFile(oRecord.sOutputLocation, sBeautifiedData, 'utf8')
        .catch(e => console.log('fpWriteOutput.fpWriteFile error: ', e));
    return oRecord;
}
