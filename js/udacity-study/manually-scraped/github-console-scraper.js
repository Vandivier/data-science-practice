// ref: vandivier/github/udacity-apify/main.js

var bDownloadTextResult = true; // if false just print result to web console.

(async function () {

    let _oResult = {};

    _oResult.sGithubUserName = window.location.pathname.slice(1);

    _oResult.sGithubEmail = $('[itemprop="email"]') && $('[itemprop="email"]').innerText;
    _oResult.sGithubAnnualCommits = $('.js-contribution-graph h2').innerText.split(' ')[0];

    let arrsGithubRepos = $('[title="Repositories"]').innerText.split(' ');
    _oResult.sGithubRepos = arrsGithubRepos[arrsGithubRepos.length - 1];
    let arrsGithubFollowers = $('[title="Followers"]').innerText.split(' ');
    _oResult.sGithubFollowers = arrsGithubFollowers[arrsGithubFollowers.length - 1];

    if (bDownloadTextResult) {
        fDownloadText(_oResult.sGithubUserName, JSON.stringify(_oResult));
    }
    else {
        console.log(_oResult);
    }

    // larger time allows for slow site response
    // some times of day when it's responding fast u can get away
    // with smaller ms; suggested default of 12.5s
    async function _fpWait(ms) {
        ms = ms || 10000;
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function _fsSafeTrim(s) {
        return s && s.replace(/[,"]/g, '').trim();
    }

    // ref: https://stackoverflow.com/a/20194533/3931488
    function fDownloadText(sFileName, sContent) {
        var a = window.document.createElement('a');
        a.href = window.URL.createObjectURL(new Blob([sContent], {type: 'text/plain'}));
        a.download = sFileName + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
})();
