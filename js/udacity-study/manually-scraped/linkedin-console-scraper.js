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
    await _fpWait(2000); // time for expanders to work

    _oResult.iLinkedInConnections = $('.pv-top-card-section__connections .visually-hidden').text();
    _oResult.iLinkedInConnections = _oResult.iLinkedInConnections
        && _oResult.iLinkedInConnections.split(' ')[0]
        || $('.pv-top-card-v2-section__connections').text().trim().split(' ')[0]
        || 0;
    _oResult.sLinkedInFullName = $('.pv-top-card-section__name').text().trim();
    _oResult.sLinkedInPath = window.location.pathname.split('/')[2];
    _oResult.sLinkedInImageUrl = $('.pv-top-card-section__photo')[0]
        && $('.pv-top-card-section__photo')[0].style
        && $('.pv-top-card-section__photo')[0].style['background-image'];
    _oResult.sLinkedInImageUrl = _oResult.sLinkedInImageUrl
        && _oResult.sLinkedInImageUrl.slice(5,-2);
    _oResult.sPossibleLinkedInEmailAddress = fsExtractEmails($('body').text());

    let nodelist = document.querySelectorAll('.pv-accomplishments-block__count');

    _oResult.iLinkedInAccomplishments = Array.from(nodelist)
            .reduce((acc, $el) => {
                let s = $el.innerText.split('has ')[1]
                    && $el.innerText.split('has ')[1].split(' ')[0]
                    || '0';

                return parseInt(s) + acc;
            }, 0);

    let arrCertificationInfo = $('.pv-accomplishments-block__title:contains("Certifications")')
            .closest('.accordion-panel')
            .find('.pv-accomplishments-block__count')
            .text().trim().split(/\s/);

    _oResult.iCertifications = arrCertificationInfo
        && arrCertificationInfo[arrCertificationInfo.length - 1];

    _oResult.iLinkedInExperience = $('.experience-section .pv-profile-section__card-item').length;
    _oResult.iLinkedInEducation = $('.education-section .pv-profile-section__card-item').length;
    _oResult.bLinkedInCurrentlyEmployed = $('.experience-section .pv-entity__date-range')
            .first().text().toLowerCase().includes('present');

    _oResult.iFlatIronExperience = $('.pv-entity__secondary-title').filter(function(){ return $(this).text().toLowerCase().includes('flatiron')}).length;
    _oResult.iGeneralAssemblyExperience = $('.pv-entity__secondary-title').filter(function(){ return $(this).text().toLowerCase().includes('general assembly')}).length;
    _oResult.iUdacityExperience = $('.pv-entity__secondary-title').filter(function(){ return $(this).text().toLowerCase().includes('udacity')}).length;
    _oResult.iCourseraExperience = $('.pv-entity__secondary-title').filter(function(){ return $(this).text().toLowerCase().includes('coursera')}).length;
    _oResult.iUdemyExperience = $('.pv-entity__secondary-title').filter(function(){ return $(this).text().toLowerCase().includes('udemy')}).length;
    _oResult.iAppAcademyExperience = $('.pv-entity__secondary-title').filter(function(){ return $(this).text().toLowerCase().includes('app academy')}).length;

    _oResult.iFlatIronCredentials = $('.pv-entity__school-name').filter(function(){ return $(this).text().toLowerCase().includes('flatiron')}).length;
    _oResult.iGeneralAssemblyCredentials = $('.pv-entity__school-name').filter(function(){ return $(this).text().toLowerCase().includes('general assembly')}).length;
    _oResult.iUdacityCredentials = $('.pv-entity__school-name').filter(function(){ return $(this).text().toLowerCase().includes('udacity')}).length;
    _oResult.iCourseraCredentials = $('.pv-entity__school-name').filter(function(){ return $(this).text().toLowerCase().includes('coursera')}).length;
    _oResult.iUdemyCredentials = $('.pv-entity__school-name').filter(function(){ return $(this).text().toLowerCase().includes('udemy')}).length;
    _oResult.iAppAcademyCredentials = $('.pv-entity__school-name').filter(function(){ return $(this).text().toLowerCase().includes('app academy')}).length;

    /* This iAlternativeExperienceCount block misreferences underlying factors
       but, I will fix in process-manually...js instead of rescraping again */
    _oResult.iAlternativeExperienceCount = _oResult.iFlatIronExperiences
        + _oResult.iGeneralAssemblyExperiences
        + _oResult.iUdacityExperiences
        + _oResult.iCourseraExperiences
        + _oResult.iUdemyExperiences
        + _oResult.iAppAcademyExperiences;

    _oResult.iAlternativeCredentialCount = _oResult.iFlatIronCredentials
        + _oResult.iGeneralAssemblyCredentials
        + _oResult.iUdacityCredentials
        + _oResult.iCourseraCredentials
        + _oResult.iUdemyCredentials
        + _oResult.iAppAcademyCredentials;

    _oResult.bIsAlternativelyExperienced = (_oResult.iAlternativeExperienceCount > 0); // includes people who worked for a provider and people who claim alternative-education-as-experience, esp some bootcamp folks
    _oResult.bIsAlternativelyEducated = (_oResult.iAlternativeCredentialCount > 0);

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

    // ref: https://stackoverflow.com/questions/14440444/extract-all-email-addresses-from-bulk-text-using-jquery
    function fsExtractEmails(text) {
        let arrs = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

        return arrs
            && arrs.join(' ')
            || '';
    }
})();
