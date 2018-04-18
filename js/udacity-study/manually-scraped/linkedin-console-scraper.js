// ref: vandivier/github/udacity-apify/main.js

// TODO: you could also:
// 1 - scrape the languages they are working with from pinned or repo page
// 2 - scrape stars and issues on their repos
// 3 - scrape which repos are forked from * and discount those
// 4 - check if they have a website linked
// 5 - scrape location (maybe it's diff from udacity)
// 6 - scrape if they have an image
// 7 - make this thing automated - I don't think GitHub will burn us like Udacity did w automation blocks

var bDownloadTextResult = true; // if false just print result to web console.

(async function () {

    let _oResult = {};

    $('.experience-section .pv-profile-section__see-more-inline').click();
    $('.education-section .pv-profile-section__see-more-inline').click();

    _oResult.iLinkedInConnections = $('.pv-top-card-section__connections .visually-hidden').text();
    _oResult.iLinkedInConnections = _oResult.iLinkedInConnections
        && _oResult.iLinkedInConnections.split(' ')[0]
        || 0;
    _oResult.sLinkedInFullName = $('.pv-top-card-section__name').text();
    _oResult.sLinkedInPath = window.location.pathname.split('/')[2];
    _oResult.sLinkedInImageUrl = $('.pv-top-card-section__photo')[0]
        && $('.pv-top-card-section__photo')[0].style
        && $('.pv-top-card-section__photo')[0].style['background-image'];
    _oResult.sLinkedInImageUrl = _oResult.sLinkedInImageUrl
        && _oResult.sLinkedInImageUrl.slice(5,-2);

    let nodelist = document.querySelectorAll('.pv-accomplishments-block__count');
    //debugger
    _oResult.iLinkedInAccomplishments = Array.from(nodelist)
            .reduce((acc, $el) => {
                let s = $el.innerText.split('has ')[1]
                    && $el.innerText.split('has ')[1].split(' ')[0]
                    || '0';

                return parseInt(s) + acc;
            }, 0);

    _oResult.iLinkedInExperience = $('.experience-section .pv-profile-section__card-item').length;
    _oResult.iLinkedInEducation = $('.education-section .pv-profile-section__card-item').length;
    _oResult.bLinkedInCurrentlyEmployed = $('.experience-section .pv-entity__date-range')
            .first().text().toLowerCase().includes('present');

    if (bDownloadTextResult) {
        fDownloadText(_oResult.sLinkedInPath, JSON.stringify(_oResult));
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
