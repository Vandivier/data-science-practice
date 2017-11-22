// https://stackoverflow.com/questions/37132031/nodejs-plans-to-support-import-export-es6-es2015-modules
'use strict';

const Bluebird = require('bluebird')
const fs = require('fs')
const Promise = require('bluebird')
const OSEOL = require('os').EOL;
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
    if (!bDontWrap) vData = OSEOL + DELIMITER + OSEOL + vData;
    ws.write(vData);
}

module.exports = _utils;