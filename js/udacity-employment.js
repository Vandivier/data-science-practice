/*
 *  Extract Udacity profiles, augment w data about are they employed, regress alternative credential value
 *  Install the package then run it, or just run it in https://runkit.com/
 *  Generates name combinations and attempts to look up Udacity users this way
 *  Name sources:
 *    Census: http://stackoverflow.com/questions/1803628/raw-list-of-person-names
 *    SSA.gov: https://www.ssa.gov/OACT/babynames/limits.html
 *    This bro: http://mbejda.github.io/
 *
 *  Kept estimated gender and ethnicity on the object, if available
 */

const scrapeIt = require("scrape-it");

// Callback interface 
scrapeIt("http://ionicabizau.net", {
    pages: {
        listItem: "li.page"
      , name: "pages"
      , data: {
            title: "a"
          , url: {
                selector: "a"
              , attr: "href"
            }
        }
    }
  , title: ".header h1"
  , desc: ".header h2"
  , avatar: {
        selector: ".header img"
      , attr: "src"
    }
}, (err, page) => {
    console.log(err || page);
});
