// ref: vandivier/github/udacity-apify/main.js

var bDownloadTextResult = true; // if false just print result to web console.

(async function () {
    const script = document.createElement('script') // inject jQuery
    script.src = 'https://code.jquery.com/jquery-3.3.1.js'; // inject jQuery
    document.getElementsByTagName('head')[0].appendChild(script); // inject jQuery
    console.log('scraping: ' + window.location.href);

    await _fpWait(1000);

    var _oResult = {
        'bUserExists': $('[class*=profile-container]').length > 0,
        'bProfileIsPrivate': $('[class*="toast--message"]').html() === 'Profile is private',
        'bTooManyRequestsError': _fsSafeTrim($('[class*="toast--message"]').html()) === 'Too many requests'
    };

    let elMoreEducation = document.querySelector('[class*="educations--more--"');
    elMoreEducation && elMoreEducation.click();
    let elMoreWork = document.querySelector('[class*="works--more--"');
    elMoreWork && elMoreWork.click();

    // wait a bit longer for UI to render if it is a valid scrape target
    if (!_oResult.bProfileIsPrivate &&
        !_oResult.bTooManyRequestsError) {

        _oResult.sScrapedUrl = window.location.href;
        _oResult.sScrapedUserId = window.location.href.split('/')[window.location.href.split('/').length - 1];

        _oResult.sProfileLastUpdate = $('div[class*="profile--updated"]').text();
        _oResult.sName = $('h1[class*="user--name"]').html();
        _oResult.sLocation = $('[alt="location marker"]').next().html();
        _oResult.sEmail = $('[alt="email"]').parent().text();
        _oResult.sStateOrCountry = _oResult.sLocation
            && _oResult.sLocation.split(', ').length > 1
            && _oResult.sLocation.split(', ')[1];

        _oResult.sImageUrl = $('[class*=user--photo--]')[0].src;
        _oResult.sLinkedInUrl = $('a[title="LINKEDIN"]').attr('href');
        _oResult.sGitHubUrl = $('a[title="GITHUB"]').attr('href');
        _oResult.sTwitterUrl = $('a[title="TWITTER"]').attr('href');
        _oResult.sResumeUrl = $('a[title="Resume"]').attr('href');

        _oResult.sExperienceHtml = $('[class*=works--section--]').html();
        _oResult.sEducationHtml = $('[class*=educations--section--]').html();
        _oResult.iCountOfNanodegrees = $('[class*=_degree--nanodegree]').length;
        _oResult.iEducationCount = $('div[class*="educations--section"] div[class*="index--education"]').length;
        _oResult.iExperienceCount = $('div[class*="works--section"] div[class*="_work--work"]').length;
        _oResult.bPresentlyEmployed = $('div[class*="works--section"] span[class*="date--present"]').length > 0;
        _oResult.iAgeEstimate = fEstimateAge($('[class*=educations--section] [class*=_date--date]'),
                                     $('[class*=works--section] [class*=_date--date]'));

        _oResult.sLanguagesSpoken = $('[class*=work-preferences--language--]').text();
    }

    if (bDownloadTextResult) {
        fDownloadText(_oResult.sScrapedUserId, JSON.stringify(_oResult));
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

    function fEstimateAge(collEd, collWork) {
        const iCurrentYear = (new Date().getFullYear());
        let iSchoolBasedAge = 23 + (iCurrentYear - fiOldestYear(collEd));
        let iWorkBasedAge = 16 + (iCurrentYear - fiOldestYear(collWork));

        if (!collEd.length
            && !collWork.length) {
            return null;
        }
        else {
            return Math.min(iSchoolBasedAge, iWorkBasedAge);
        }

        function fiOldestYear(coll) {
            let iOldestYear = (new Date().getFullYear());

            coll.each(function(i, el){
                let sEarlierYear = el.innerText.split(' ')[1];
                let iCandidateYear = parseInt(sEarlierYear);
                iOldestYear = Math.min(iOldestYear, iCandidateYear);
            });

            return iOldestYear;
        }
    }
})();
