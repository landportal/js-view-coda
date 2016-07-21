'use strict';

function truncateString(string, limit, breakChar, rightPad) {
    if (string.length <= limit) { return string; }
    var substr = string.substr(0, limit),
        breakPoint = substr.lastIndexOf(breakChar);
    if (breakPoint >= 0) {
        if (breakPoint < string.length - 1) {
            return string.substr(0, breakPoint) + rightPad;
        }
    }
}

function setNameCountry(iso3) {
    for (var i = 0; i < LBV.countries.length; i++) {
        if (LBV.countries[i].iso3 === iso3) {
            return LBV.countries[i].name;
        }
    }
    return false;
}
