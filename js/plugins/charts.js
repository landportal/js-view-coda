/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisCharts = (function (LBV, args) {
    var LBVIS = LBV; // Main lbvis object
    var _options = {
        target:         '#wrapper',
        legend:         false,
        iso3:           'PER', // dummy country , works for PRIndex
        year:           '2014',
        indicators:     [],
    };
    $.extend(_options, args);

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            console.log('hello charts');
        }
    };
});
