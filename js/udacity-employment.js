/*
 *  run from cli like `node --harmony udacity-employment`
 *
 *  Extract Udacity profiles, augment w data about are they employed, regress alternative credential value
 *  Install the package then run it, or just run it in https://runkit.com/
 *  Generates name combinations and attempts to look up Udacity users this way
 *  Name sources:
 *    Census: http://stackoverflow.com/questions/1803628/raw-list-of-person-names
 *    SSA.gov: https://www.ssa.gov/OACT/babynames/limits.html
 *        By state
 *    This bro: http://mbejda.github.io/
 *        black-female-names.csv: https://gist.github.com/mbejda/9dc89056005a689a6456#file-black-female-names-csv
 *        black-male-names.csv:
 *
 *  Initial analysis just cares about names, not demographic data.
 *
 *  Extended analysis:
 *    Keep estimated gender, ethnicity, and state data, as available
 *    Augment with 2000s and 2010s: https://www2.census.gov/topics/genealogy/
 *
 *  If the scrapee tries to ban ur ip just spoof em http://stackoverflow.com/questions/20294190/send-http-request-from-different-ips-in-node-js
 *
 *  If I want a seeded (reproducible) random list for subsampling, sort alpha then https://www.npmjs.com/package/random-seed
 *
 *  ref: http://stackoverflow.com/questions/28739098/how-can-i-scrape-pages-with-dynamic-content-using-node-js
 *
 *  TODO: known users vs random users
 */

// TODO: check pdf resume for additional validation of current employment via string '- present' || '- current' || '- 2017' || '-2017', etc

const phantom = require('phantom');
const cheerio = require('cheerio');
const async = require('async');

const fsoNameSource = './process-names';
const sUdacityBaseUrl = 'https://profiles.udacity.com/u/';

//let arrKnownValidNames = ['john', 'sara', 'sarah'];
//let arrKnownValidNames = ['john'];
let arrKnownValidNames = ['sarah'];
//let arrNames = ['john', 'sara', 'sarah'];      // TODO: read from file. These names are seeds for usernames.

/*  Test cases:
 *  /john3 is public with LinkedIn
 *  /johnsmith2 404
 *  /john is private
 *  /john11 is public with no linkedin
 *
 *  eg https://profiles.udacity.com/u/john3
 */

//ref: http://stackoverflow.com/questions/9836151/what-is-this-css-selector-class-span
async function fScrapeUdacityUser(sUsername) {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on("onResourceRequested", function(requestData) {
      //console.info('Requesting', requestData.url)
  });

  console.log(sUdacityBaseUrl + sUsername);
  const status = await page.open(sUdacityBaseUrl + sUsername);
  //console.log(status);
  const dynamicContent = await getDynamicContentUdacity(page);            //dynamic content. ref: http://phantomjs.org/quick-start.html
  //const content = await page.property('content');                       //static content

  const $ = cheerio.load(dynamicContent);                                 //does const work here

  let oUserObject = {
    'name': $('h1').html(),
    'linkedInUrl': $('a[title="LINKEDIN"]').attr('href'),
    'resumeUrl': $('a[title="Resume"]').attr('href'),
    'presentlyEmployed': $('div[class*="works--section"] div[class*="_work--work"] span[class*="_work--present"]').length > 0,
    'profileLastUpdated': $('div[class*="profile--updated"]').text().split(': ')[1],
    'educationCount': $('div[class*="educations--section"] div[class*="_education--education"]').length,
    'userExists': $('[class*=profile-container]').length > 0
  };

  return oUserObject;
}

let arroAllUserObjects = [];
// needed to bridge async.map with fScrapeUdacityUser
//  return new Promise(function(resolve, reject) {
//      resolve(fScrapeUdacityUser(sUsername, fCallback));
function fScrapeUdacityUserSync(sUsername, fCallback) {

  return new Promise(function(resolve, reject) {
    resolve(fUdacityPromiseChain(sUsername, fCallback, 0)); //um, why do I pass callback?
  });
  //let pLinkedInScraped = Promise.resolve(); //stub

  //hack
//  pUdacityScraped.then(function(){
//    return fCallback(null, arroAllUserObjects);
//  });

  //Promise.all([pUdacityScraped, pLinkedInScraped]).then(fCallback(null, arroAllUserObjects));     // TODO: error handling. null means no error.
  //Promise.all([pUdacityScraped]).then(fCallback(null, arroAllUserObjects));     // TODO: error handling. null means no error.
}

async function fUdacityPromiseChain(sUsername, fCallback, iDuplicateUserNumber) {
  return new Promise(function(resolve, reject){
    fScrapeUdacityUser(sUsername).then((oThisUser) => {
      console.log(oThisUser);

      if (oThisUser.userExists) {       // if user exists, push and continue iterating
        let sNewUserName = iDuplicateUserNumber ? sUsername.slice(0, sUsername.length - 1) : sUsername;  //increment the username

        arroAllUserObjects.push(oThisUser);
        iDuplicateUserNumber++;

        sNewUserName += iDuplicateUserNumber;

        fUdacityPromiseChain(sNewUserName, fCallback, iDuplicateUserNumber);
      } else {
        //resolve();
        fCallback(null, arroAllUserObjects);
      }
    });
  });
}

//ref: http://stackoverflow.com/questions/31963804/how-to-scroll-in-phantomjs-to-trigger-lazy-loads?noredirect=1&lq=1
// once each second, try to see if the body has rendered yet.
function getDynamicContentUdacity(page) {
  return new Promise(resolve => {
    setTimeout(() => {
      const sContent = page.evaluate(function () { return document.body.innerHTML; });
      if (sContent !== null) resolve(sContent);
    }, 1000);
  });
}

// http://caolan.github.io/async/docs.html#map
async.map(arrKnownValidNames, fScrapeUdacityUserSync, function(err, arroUserObjects) {
  console.log('arrKnownValidNames is done.');
  console.log(arroUserObjects);
  process.exit(0);
//  async.map(arrNames, fScrapeUdacityUserSync, function(err, arroUserObjects) {
//    console.log('arrNames is done.');
//    process.exit(0);
//  });
});

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
