
const fs = require('fs');
const glob = require('glob');
const util = require('util');
const utils = require('ella-utils');

const fpReadFile = util.promisify(fs.readFile);
const fpReadDir = util.promisify(fs.readdir);
const fpWriteFile = util.promisify(fs.writeFile);

const sInputFilePath = __dirname + '/subsample-test.csv'; // TODO: use rsReadStream
const sOutputFilePath = __dirname + '/output.csv';

main();

async function main() {
    const options = {};

    glob("**/*.txt", options, function (er, arrsFiles) {
        console.log(arrsFiles);
      // files is an array of filenames.
      // If the `nonull` option is set, and nothing
      // was found, then files is ["**/*.js"]
      // er is an error object or null.
    });
}
/*
fs.readdir(testFolder, (err, files) => {
  files.forEach(file => {
    console.log(file);
  });
})
*/
async function fpWriteOutput() {
    let sBeautifiedData = JSON.stringify(oRecord);
    sBeautifiedData = beautify(sBeautifiedData, { indent_size: 4 });

    await fpWriteFile(sOutputPath, sBeautifiedData, 'utf8', err => {
        if (err) console.log('error', err);
        console.log('Program completed.');
    });

    return Promise.resolve();
}
