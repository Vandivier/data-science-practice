
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

main();

async function main() {
    const options = {};

    await fpGlob("manually-scraped/**/*.txt", options)
    .then(arrsFiles => utils.forEachReverseAsyncPhased(arrsFiles, fpProcessRecord))
    .catch(e => console.log('fpGlob error: ', e));

    console.log('Program completed.');
}

async function fpProcessRecord(sLocation) {
    let oRecord = await fpReadFile(sLocation)
        .then(sRecord => JSON.parse(sRecord))

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

    if (oRecord.sScrapedUserId === 'adam1') { // to limit API usage during development
        await fpAddKairosData(oRecord);
        console.log(oRecord.gender);
    }

    return fpWriteOutput(oRecord);
}

// TODO: I think this is broken because I don't return or await fpWriteFile
async function fpWriteOutput(oRecord) {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    fpWriteFile(oRecord.sOutputLocation, sBeautifiedData, 'utf8', err => {
        if (err) console.log('error', err);
        return Promise.resolve();
    })
    .catch(e => console.log('fpWriteOutput.fpWriteFile error: ', e));
}

// ref: https://www.kairos.com/docs/getting-started
async function fpAddKairosData(oRecord) {
    let oData = {
        image: oRecord.sImageUrl
    };
    let oOptions = {};

    if (oData.image) {
        /*
        const options = {
            body: JSON.stringify(oData),
            method: 'POST',
        };
        */

        return axios.post('http://api.kairos.com/detect', oData)
        .then(oKairosResponse => {
            let oAttributes = oKairosResponse
                && oKairosResponse.images
                && oKairosResponse.images.length
                && oKairosResponse.images[0].faces.length
                && oKairosResponse.images[0].faces[0].attributes;

            console.log('got kairos response!', oKairosResponse);
            oRecord = Object.assign(oRecord, oAttributes);
            return Promise.resolve();
        })
        .catch(err => console.log('fpAddKairosData.axios.post error: ', err));
    }

    return Promise.resolve();
}
