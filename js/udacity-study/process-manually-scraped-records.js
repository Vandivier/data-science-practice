
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

    console.log(oRecord.sOutputLocation);

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
