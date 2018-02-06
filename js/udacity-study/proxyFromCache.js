let _module = {};

// randomly select a cached ip, but not one of the last 120 used
// test it works or get a new one
// rinse and repeat
_module.fpGetIp = async function(oCache) {
    let arrProxies = oCache.proxies;
    let sRandomProxy = arrProxies[Math.floor(Math.random() * arrProxies.length)];

    return sRandomProxy;
}

module.exports = _module;