# earhart-fellows
Scrapes labor data from udacity.com and other places.

## Use

```
npm install
npm start
```

Then read ordered-output.csv

## Business Notes

Username selection is based on modifying common first and last names. I have two main sources for name selection:
    1. [SSO Top Names Over the Last 100 Years](https://www.ssa.gov/oact/babynames/decades/century.html)
    2. Random subsample process on a massive list of all known names.

## Technical Notes

The main file right now is called `reboot.js`. If things take off with scrapehub then `actor.js` may become the main file.

This project is superseded by an apify scraper found [here in it's own repo](https://github.com/Vandivier/udacity-apify).

## Feature Requests

Have a suggestion for this npm module? Submit an issue.

## TODO

See commends in code. reboot.js
