//ref: https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');

const namesFolder = './names/';
const outstream = new stream;
let oKnownNames = {};

//useful? fs.stat says if file or directory
fs.readdir(namesFolder, (err, files) => {
  files.forEach(file => {
    fStreamNameFile(namesFolder + file);
  });
});

function fStreamNameFile(sPath) {
  const instream = fs.createReadStream(sPath);
  const _rl = readline.createInterface(instream, outstream);

  _rl.on('line', function(line) {
    // process line here
    // parse name and add to oKnownNames
  });

  _rl.on('close', function() {
    console.log('done with ' + sPath);
  });
}
