on 3/30/18, I installed Data Scraper in Chrome: 
  1 - https://chrome.google.com/webstore/detail/data-scraper-easy-web-scr/nndknepjnldbdbepjfgmncbggmopgden?hl=en-US
  2 - https://data-miner.io/
  3 - potentially better unused alt: https://www.agenty.com/

This occured after the following:
  1 - i had substantially auto-scraped udacity, but had difficulty as i kept getting blocked
  2 - i was even getting blocked on manual site visits
  3 - i manually visited a profile mentioned in a udacity blog post
  4 - i was not blocked, and I noticed many new data points
  5 - i manually tested a bunch of new names, and tried search engine strategy site:profiles.udacity.com
    a. even trying Russian search engine Yandex and others
    b. i was still not getting blocked
  6 - i realized that if i was logged in i could see more data
  7 - realizing login with the scraper would be hard, and it might get blocked if i scrape using automation, i proceeded to collect round 3 by hand
  8 - this data miner tool really helps: you create a 'recipe' and hit a button, it will automatically scrape a currently opened browser page, which was automatically opened
    a. sites won't block for this kind of thing; they detect automatic opening, not scraping once opened
    b. it won't let you export/import a recipe, but i describe the columns used in the recipe section below
    c. each recipe consists of 5 steps:
      1. Choose List Page or Detail Page type (I chose detail page)
      2. Enter column definitions (See section II)
      3. Enter Action definitions (none used)
      4. Enter post-processing JS (none used within the tool; see point 10)
      5. Save with a scraper name (It's irrevant, but I named mine Udacity Scraper)
  9 - manual collection expanded the sample: I took a defensible sample and a broad sample; after-the-fact compared to see if there was a noticeable selection bias
  10- Data miner output is further refined by data-miner-cleaner.js because in some cases it couldn't parse certain html, etc

TODO: Kairos on image for age, gender, more: https://www.kairos.com/features
Genderize and Name Prims

II. Columns
    [
        {
         'Name': 'sImageUrl',
         'Extract': 'Image URL',
         'Selector': '[class*=user--photo--]',
        },
        {
         'Name': 'sUserDetailsHtml',
         'Extract': 'HTML',
         'Selector': '[class*=user--user--]',
        },
    ]

