/*
 *  Module Description:
 *    This module takes in data (CSV atm) and writes a subsample to file (memory is a simple extension)
 *
 */

const csv = require('csv');
const fs = require('fs');
//const mSort = require('sort-stream');   // cool package but not needed. If source is sorted so is the subsample.

const streamInFile = fs.createReadStream(__dirname + '/unique-names.csv');
const streamOutFile = fs.createWriteStream(__dirname + '/subsample.csv');

let iRecordCounter = -1;    // start at -1 to get title row
const iIncrement = 2500;    // get the title row and every 10000 after

const fParser = csv.parse({delimiter: ','}, function(err, data) {});
const fTransformer = csv.transform(function(record) {
  let iColumnCounter = 0;
  iRecordCounter++;
  if (iRecordCounter % iIncrement !== 0) return null;

  return record.map(function(value) {
    //iColumnCounter++
    //if (iColumnCounter % 2 === 0) return value.toUpperCase();
    return value.toLowerCase();
  });
});

streamInFile
  .pipe(fParser)
  .pipe(fTransformer)
  .pipe(csv.stringify())
  //.pipe(mSort())
  //.pipe(process.stdout);
  .pipe(streamOutFile);


streamOutFile.on('finish', () => {
  console.error('Done.');
  process.exit(0);
});
