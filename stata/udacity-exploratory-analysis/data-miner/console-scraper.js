// ref: vandivier/github/udacity-apify/main.js

(async function (_iCurrentInputRecord) {
    const script = document.createElement('script') // inject jQuery
    script.src = 'https://code.jquery.com/jquery-3.3.1.js'; // inject jQuery
    document.getElementsByTagName('head')[0].appendChild(script); // inject jQuery
    console.log('scraping: ' + window.location.href);

    // toast message will disappear if you wait too long
    await _fpWait(1000);

    var arr$Affiliations = $('#affiliation-body a[name=subaffil]');
    var sarrAffiliations = '';
    var _oResult = {
        'bUserExists': $('[class*=profile-container]').length > 0,
        'bProfileIsPrivate': $('[class*="toast--message"]').html() === 'Profile is private',
        'bTooManyRequestsError': _fsSafeTrim($('[class*="toast--message"]').html()) === 'Too many requests'
    };

    // wait a bit longer for UI to render if it is a valid scrape target
    if (!_oResult.bProfileIsPrivate &&
        !_oResult.bTooManyRequestsError) {
        await _fpWait(4000);

        _oResult.sUserName = $('h1[class*="user--name"]').html();
        _oResult.sLocation = $('[alt="location marker"]').next().html();
        _oResult.sEmail = $('.emaillabel').parent().find('td span').text();
        _oResult.iEducationCount = $('div[class*="educations--section"] div[class*="index--education"]').length;
        _oResult.iExperienceCount = $('div[class*="works--section"] div[class*="_work--work"]').length;
        _oResult.sLinkedInUrl = $('a[title="LINKEDIN"]').attr('href');
        _oResult.sResumeUrl = $('a[title="Resume"]').attr('href');
        _oResult.bOtherError = false;
        _oResult.bPresentlyEmployed = $('div[class*="works--section"] div[class*="_work--work"] span[class*="_work--present"]').length > 0;
        _oResult.sProfileLastUpdate = $('div[class*="profile--updated"]').text();

        arr$Affiliations && arr$Affiliations.each(function (arr, el) {
            let sTrimmed = _fsSafeTrim(el.innerText.replace(/\s/g, ' '));
            _oResult.sarrAffiliations += ('~' + sTrimmed);
        });
    }

    //return Promise.resolve(_oResult);
    console.log(_oResult);

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
})();
