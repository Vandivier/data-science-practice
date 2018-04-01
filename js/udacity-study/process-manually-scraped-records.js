
const fs = require('fs');
const glob = require('glob');
const util = require('util');
const utils = require('ella-utils');

const fpGlob = util.promisify(glob);
const fpReadFile = util.promisify(fs.readFile);
const fpReadDir = util.promisify(fs.readdir);
const fpWriteFile = util.promisify(fs.writeFile);

const sInputFilePath = __dirname + '/subsample-test.csv'; // TODO: use rsReadStream
const sOutputFilePath = __dirname + '/output.csv';

main();

async function main() {
    const options = {};

    await fpGlob("**/*.txt", options)
    .then(arrsFiles => {
        console.log(arrsFiles);
    })
    .catch(e => console.log('fpGlob error: ', e))

    console.log('test');
}

async function fpWriteOutput() {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    await fpWriteFile(sOutputPath, sBeautifiedData, 'utf8', err => {
        if (err) console.log('error', err);
        console.log('Program completed.');
    });

    return Promise.resolve();
}
