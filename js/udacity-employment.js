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
 *  ref: http://stackoverflow.com/questions/28739098/how-can-i-scrape-pages-with-dynamic-content-using-node-js
 */

// TODO: check pdf resume for additional validation of current employment via string '- present' || '- current' || '- 2017' || '-2017', etc

const phantom = require('phantom');
const cheerio = require('cheerio');
const async = require('async');

const fsoNameSource = './process-names';
const sUdacityBaseUrl = 'https://profiles.udacity.com/u/';

const arrNames = ['john3', 'sara', 'sarah'];      // TODO: read from file. These names are seeds for usernames.

/*  Test cases:
 *  /john3 is public with LinkedIn
 *  /johnsmith2 404
 *  /john is private
 *  /john11 is public with no linkedin
 *
 *  eg https://profiles.udacity.com/u/john3
 */

//ref: http://stackoverflow.com/questions/9836151/what-is-this-css-selector-class-span
async function fScrapeUdacityUser(sUsername, fCallback) {
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

  const oUserObject = {
    'name': $('h1').html(),
    'linkedInUrl': $('a[title="LINKEDIN"]').attr('href'),
    'resumeUrl': $('a[title="Resume"]').attr('href'),
    'presentlyEmployed': $('div[class*="works--section"] div[class*="_work--work"] span[class*="_work--present"]').length > 0,
    'profileLastUpdated': $('div[class*="profile--updated"]').text().split(': ')[1],
    'educationCount': $('div[class*="educations--section"] div[class*="_education--education"]').length
  };

  return fCallback(null, oUserObject);     // TODO: error handling. null means no error
}

// needed to bridge async.map with fScrapeUdacityUser
function fScrapeUdacityUserSync(sUsername, fCallback) {
  return new Promise(function(resolve, reject) {
      resolve(fScrapeUdacityUser(sUsername, fCallback));
  });
}

//ref: http://stackoverflow.com/questions/31963804/how-to-scroll-in-phantomjs-to-trigger-lazy-loads?noredirect=1&lq=1
// once each second, try to see if the body has rendered yet.
function getDynamicContentUdacity(page) {
  return new Promise(resolve => {
    setTimeout(() => {
      const sContent = page.evaluate(function () { return document.body.innerHTML; });
      if (sContent !== null && sContent !== sUnrendered) resolve(sContent);
    }, 1000);
  });
}

// http://caolan.github.io/async/docs.html#map
async.map(arrNames, fScrapeUdacityUserSync, function(err, arroUserObjects) {
  console.log(arroUserObjects);
});
