/*
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
 */

// TODO: some users have resumes, eg PDF, which has work history. Additional validation by checking for current employment via string '- present' || '- current' || '- 2017' || '-2017', etc
// TODO: they also have 'work experiences' on the page we can scrape and also education
// TODO: update package.json and such bc we can't use scrape-it on Udacity, pages are dynamic. http://stackoverflow.com/questions/28739098/how-can-i-scrape-pages-with-dynamic-content-using-node-js


// use `node --harmony-async-await udacity-employment`
// use `node --harmony udacity-employment`
const phantom = require('phantom');
const cheerio = require('cheerio');

const fsoNameSource = './process-names';
const sUdacityBaseUrl = 'https://profiles.udacity.com/u/';

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
  console.log(sUdacityBaseUrl + sUsername);

  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on("onResourceRequested", function(requestData) {
      //console.info('Requesting', requestData.url)
  });

  const status = await page.open(sUdacityBaseUrl + sUsername);
  //console.log(status);
  const dynamicContent = await ProcessPage(page);           //dynamic content. ref: http://phantomjs.org/quick-start.html
  const content = await page.property('content');           //static content
  let $ = cheerio.load(content);                            //does const work here
  console.log($('h1').html());

  fCallback();
}

const sUnrendered = '<div id="app"><noscript data-reactroot=""></noscript></div><script src="/js/manifest.cb664.js"></script><script src="/js/vendor.a4cb3.js"></script><script src="/js/app.05d50.js"></script>';

//ref: http://stackoverflow.com/questions/31963804/how-to-scroll-in-phantomjs-to-trigger-lazy-loads?noredirect=1&lq=1
// once each second, try to see if the body has rendered yet.
function ProcessPage(page) {
  return new Promise(resolve => {
    setTimeout(() => {
      const sContent = page.evaluate(function () { return document.body.innerHTML; });

      if (sContent !== null && sContent !== sUnrendered) {
        resolve(sContent);
        //return sContent;
      } else {
        console.log('still looking');
        ProcessPage(page);
      }

    }, 1000);
  });
}

fScrapeUdacityUser('john3', ()=>{
  console.log('Done.');
  process.exit(0);
});
