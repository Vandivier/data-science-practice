//ref: https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
const fs = require('fs');
const readline = require('readline');
const stream = require('stream');

const namesFolder = './names/';
const outstream = new stream;
let oKnownNames = {};

/*
 * group 1 is by default. These files are csv with name in column 3
 * group 2 files are space delimited with name in column 1
 * group 3 files are csv with name in column 1
 */
fs.readdir(namesFolder, (err, files) => {
  files.forEach(file => {
    var sGroupId = file.split('-')[1];
    var fGroupHandler = groupHandler[sGroupId];
    var sPath = namesFolder + file;

    if (fGroupHandler) {
      fGroupHandler(sPath);
    } else {
      groupHandler['1'](sPath);
    }
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
    //console.log('done with ' + sPath);
  });
}

let groupHandler = {};

groupHandler['1'] = function(sPath) {
  fStreamNameFile(sPath);
}

groupHandler['2'] = function(sPath) {
  console.log('burp2');
}

groupHandler['3'] = function(sPath) {
  console.log('burp3');
}
