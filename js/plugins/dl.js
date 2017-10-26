/*
 * JS View CODA Library
 *
 * A visualization library for the Land Portal Land Book / LOD
 *
 * MIT License
 * Copyright (c) 2016 - Land Portal Foundation - http://www.landportal.info
 * Copyright (c) 2016-2017 - Jules Clement <jules@ker.bz>
 *
 * Author: Jules Clement <jules@ker.bz>
 *
 * Plugin: Download
 */
lbvis.dl = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#wrapper',
        indicator:      null,
        dataset:        null,
        year:           null,
    };
    $.extend(_options, args);

    var _bindUI = function () {
    };
    
    // Public methods
    return {
        debug: function () { console.log(_options, _data); },
        init: function () {
            console.log('DL', _options, _data);
        }
    };
});
