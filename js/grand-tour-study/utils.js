// https://stackoverflow.com/questions/37132031/nodejs-plans-to-support-import-export-es6-es2015-modules
// TODO: give each function a depends on identifier and allow tree shaking
'use strict';

const Bluebird = require('bluebird');
const EOL = require('os').EOL;
const fs = require('fs');
const Promise = require('bluebird');

const DELIMITER = '<<<***DEL***>>>';

let _utils = {};

// turn in array into batches of iBatchSize
// like _.chunk, ref: https://lodash.com/docs/4.17.4#chunk
_utils.chunk = function (arr, iBatchSize) {
    const iInputArrLength = arr.length;
    const iNumberOfBatches = Math.ceil(iInputArrLength / iBatchSize);
    let arrResult = new Array(iNumberOfBatches);
    let iResultIndex = 0;
    let iCurrentItem = 0;

    while (iCurrentItem < iInputArrLength) {
        arrResult[iResultIndex++] = arr.slice(iCurrentItem, (iCurrentItem += iBatchSize));
    }

    return arrResult;
}

//  convention for converting arbitrary string into a
//  class name for css or w/e
//  only letters and dashes
_utils.classify = function (sString) {
    var sClassName = '';

    for (var i = 0; i < sString.length; i++) {
        if (isNaN(sString[i])) sClassName += sString[i];
    }

    return sString.toLowerCase().replace(/[ ]/g, '-').replace(/[^a-z-]/g, '');
}

/**
 *  desc:
 *  a utility method to ensure a variable called vProperty exists.
 *  ensure() recursively references or creates needed ancestors
 *  after ensuring vProperty exists, the value will be set to vValue which is a variant type.
 *  given that vProperty already exists and has some value, the value will be
 *  overwritten with a value of vValue iff bYield.
 *
 *  oOptions = {
 *      vValue:         // set the value of the final object
 *      oAncestor:      // the ancestor of the final object.
 *                      //      By default it is this or BaseController
 *      bYield:         // pass true if you do not want vValue to override an existing value
 *  }
 *
 *  TODO: non-variant typing?
 */
_utils.ensure = function (sProperty, oOptions) {
    var i = 0,
        oRoot = oOptions.oAncestor || this,
        oWorking = oRoot,
        arrsDescendents = sProperty.split('.');

    for (i; i < arrsDescendents.length - 1; i++) {
        if (!oWorking[arrsDescendents[i]]) oWorking[arrsDescendents[i]] = {};
        oWorking = oWorking[arrsDescendents[i]];
    }

    oWorking[arrsDescendents[i]] = oOptions.vValue;
}

//  TODO: desc
//  f can optionally return a promise...I think ?
_utils.executeAfterKSeconds = function (k, x, f) {
    let iMils = k * 1000;

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(f(x));
        }, iMils);
    });
}

//  like [].forEach() but faster
//  reverse fors can also transform an array in-place without messing up the index
//  https://jsperf.com/foreach-vs-api-call
_utils.forEachReverse = function (arr, f) {
    for (var i = arr.length; i--;) {
        f(arr[i], i);
    }
}

//  _utils.forEachReverse as async function
//  fp must return a promise
//  allows all items in the array to execute in parallel
//  ideal for performance
//  TODO: implement Promise(...).reflect() here or elsewhere for no-failure promise arrays
_utils.forEachReverseAsyncParallel = async function (arr, fp) {
    let arrp = [];

    for (var i = arr.length; i--;) {
        arrp.push(fp(arr[i], i));
    }

    return await Promise.all(arrp);
}

//  based on http://bluebirdjs.com/docs/api/reflect.html
//  applies fp returning a Promise to each item in array arrp, where items are also promises
//  assumes fp takes only a single param, which is the item from array, eg defined as `function fp(_p) { /* do stuff */}` || _p === arrp[i]
//  be sure you attach a .catch() to fp. Or maybe I should implement a default catch
//  TODO: optionally overwrite .each()
_utils.settleAll = async function (arrp, fp) {
    let arrSettled;

    // fp mutates the promise result
    // if not provided, just return the unmutated promise
    fp = fp || function(p){
        return p;
    };

    let arrInspections = await Promise.all(
        arrp.map(function (_p) {
            return Bluebird.resolve(fp(_p)).reflect(); // ensure fp(_p) is a Bluebird in order to .reflect();
        })
    );

    arrSettled = arrInspections.map(function (inspection) {
        let _err;

        try {
            if (inspection.isFulfilled()) return inspection.value()
            return inspection.reason();
        } catch (e) {
            _err = e;
        }

        return {
            'error': {
                'message': 'unexpected result: promise neither fulfilled nor rejected',
                'data': (_err || null)
            }
        };
    });

    return arrSettled; // return here not above to ensure .each() ran
}

//  _utils.forEachReverse as async function
//  fp must return a promise
//  forces each async function to complete in order (phased async pattern)
//  phased is useful for throttling or dependencies
//
//  note: phased is muuuuuuch more reliable when scraping; parallel will drop data
_utils.forEachReverseAsyncPhased = async function (arr, fp) {
    let arrOutputs = [];

    for (var i = arr.length; i--;) {
        arrOutputs.push(await fp(arr[i], i));
    }

    return arrOutputs;
}

//  f is applied to each element in arr. As in `function f(el){ /* do stuff */ }`
//  f is applied every iSeconds
//  this function returns a promise. it's thenable and awaitable.
_utils.forEachThrottledAsync = async function (iSeconds, arr, f) {
    return _utils.forEachReverseAsyncPhased(arr, async function (el) {
        return _utils.executeAfterKSeconds(iSeconds, el, f);
    });
}

//  TODO: refactor so this function adopts a different strategy compared to forEachThrottledAsync()
//  this one should ensure all functions inside the batch have completed before continuing
//  even if that causes it to wait longer than iSeconds.
//  the other method should be 'fire and forget'
_utils.forEachPatientlyThrottledAsync = async function (iSeconds, arr, f) {
    return _utils.forEachReverseAsyncPhased(arr, async function (el) {
        return _utils.executeAfterKSeconds(iSeconds, el, f);
    });
}

//  interpolate an object like fsSupplant('this/{is-an}/example', {'is-an': 'apple-tastes-delicious-for'});
//  ref: https://stackoverflow.com/questions/1408289/how-can-i-do-string-interpolation-in-javascript
_utils.fsSupplant = function (sInterpolee, oOptions) {
    return sInterpolee.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = oOptions[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
}

// TODO: description
_utils.getMatches = function (arr, sKey, vMatch) {
    if (vMatch instanceof RegExp) {
        return arr.filter(function (oEl) {
            return oEl[sKey] && oEl[sKey].match(vMatch);
        });
    }

    return arr.filter(function (oEl) {
        return oEl[sKey] === vMatch;
    });
}

_utils.log = function (console) {
    let _foriginalLog = console.log;
    let _futilsLog = function (_sMessage) {
        fs.appendFile(__dirname + '\\utils-log.txt', '\r\n\r\n' + JSON.stringify(_sMessage), function (err) {
            if (err) console.log(err);
        });
    }

    return function (logMessage) {
        _foriginalLog(logMessage);
        _futilsLog(logMessage);
    }
}

//  use for all sorts of data to pipe it into whatever writestream
//  ensure message gets line breaks
//  add standard delimeter for later parsing
_utils.fStandardWriter = function (vData, ws, bDontWrap) {
    if (typeof vData !== 'string') vData = JSON.stringify(vData);
    if (!bDontWrap) vData = EOL + DELIMITER + EOL + vData;
    ws.write(vData);
}

// ref: https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
_utils.flatten = function (arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? _utils.flatten(toFlatten) : toFlatten);
    }, []);
}

// like String.trim()
// but, removes commas and quotes too (outer or interior)
_utils.fsTrimMore = function (s) {
    return s && s.replace(/[,"]/g, '').trim();
}

// ref: https://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
_utils.standardDeviation = function (arri) {
    var avg = _utils.mean(arri);

    var squareDiffs = arri.map(function (value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });

    var avgSquareDiff = _utils.mean(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}

_utils.average = function (arri) {
    return _utils.mean(arri);
}

_utils.mean = function (arri) {
    var sum = arri.reduce(function (sum, value) {
        return sum + value;
    }, 0);

    var avg = sum / arri.length;
    return avg;
}

// ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max
_utils.max = function (v, i) {
    if (Array.isArray(v)) {
        return Math.max(...v)
    } else if(Number.isInteger(i)) {
        return Math.max(v, i);
    }
}

_utils.min = function (v, i) {
    if (Array.isArray(v)) {
        return Math.min(...v)
    } else if(Number.isInteger(i)) {
        return Math.min(v, i);
    }
}

// ref: https://stackoverflow.com/questions/25305640/find-median-values-from-array-in-javascript-8-values-or-9-values
_utils.median = function (arri) {

    // extract the .values field and sort the resulting array
    var m = arri.map(function(v) {
        return v.values;
    }).sort(function(a, b) {
        return a - b;
    });

    var middle = Math.floor((m.length - 1) / 2); // NB: operator precedence
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
}

// ref: https://github.com/Vandivier/data-science-practice/tree/master/js/charm-scraper
_utils.fpWait = function (ms) {
    ms = ms || 10000;
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ref: https://github.com/Vandivier/data-science-practice/tree/master/js/charm-scraper
// ref: https://stackoverflow.com/questions/30505960/use-promise-to-wait-until-polled-condition-is-satisfied
_utils.fpWaitForFunction = function (ms, fb) {
    return new Promise(function (resolve) {
        (function _fpWaitLoop() {
            if (fb()) return resolve();
            setTimeout(_fpWaitLoop, ms);
        })();
    });
}

module.exports = _utils;