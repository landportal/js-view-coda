/*
 * Land Portal visualizations for the Land Book
 *
 * The original prototype of those visualizations was produced by Simbiosys.
 * This is a first rewrite as a JS app rather than dirty script.
 *
 * Author: Jules Clement <jules@ker.bz>
 *
 * lbvis - main Object
 *
 * Prototype:
 *   new lbvis({arguments});
 *
 * Arguments:
 *      iso3    - MANDATORY - country iso 3 letters code
 * Example:

var VIS = new lbvis({iso3: 'VNM'});
VIS.init();

 */

'use strict';

var lbvis = (function (args = {}) {
    var _options = {
        iso3: args.iso3 || null
    };
    var _defers = { info: {} };           // AJAX Deferes
    var _cache = {};            // Internal cache
    var _DATA = args.data || new lbvisDATA(_options);

    var _getSPARQL = function (query, type) {
        _cache[type] = [];
        var url = _DATA.sparqlURL(query);
        _defers[type] = $.getJSON(url, function (data) {
            data.results.bindings.forEach(function (item) {
                var stuff = {};
                Object.keys(item).forEach(function (prop) { stuff[prop] = item[prop].value; });
                _cache[type].push(stuff);
            });
        });
        return _defers[type];
    };
    
    // This pre-load all countries in a hash
    var _loadCountries = function () {
        var q = _DATA.queries.countries;
        //console.log(q);
        return _getSPARQL(q, 'countries');
    };

    // Loads all available indicators
    var _loadIndicators = function () {
        var q = _DATA.queries.indicators;
        if (_options.iso3) {
            q = _DATA.queries.countryIndicators(_options.iso3);
        }
        //console.log(q);
        return _getSPARQL(q, 'indicators');
    };

    var _loadIndicatorInfo = function (id) {
        var q = _DATA.queries.indicatorInfo(id);
        //console.log(id, q);
        return _getSPARQL(q, 'infoTmp', id);
    };

    var _init = function () {
        _loadCountries();
        _loadIndicators();
    };
    _init();

    // Public methods
    return {
        // Public vars
        ISO3: args.iso3,
        DATA: _DATA,
        // Shared data / internal cache
        defers: function () { return _defers; },
        cache: function () { return _cache; },
        countries: function () { return _cache['countries']; },
        indicators: function () { return _cache['indicators']; },
        indicators_info: function () { return _cache['info']; },

        // Public methods
        init: function () {
            _init();
        },
        getIndicatorInfo: function (indicator, ptr) {
            console.log('FIX ME', indicator);
            if (!_defers.info[indicator]) {
                _defers.info[indicator] = _loadIndicatorInfo(indicator, ptr);
            }
            if (ptr) {
                _defers.info[indicator].done(function () {
                    ptr[indicator] = _cache['infoTmp'][0];
                });
            }
            return _defers.info[indicator];
        },
        getOptionsIndicators: function (id) {
            var options = '<option data-localize="inputs.indicators">Select an indicator...</option>';
            _cache['indicators'].forEach(function (indicator) {
                var selected = '';
                if (id && indicator.ID == id) selected = ' selected="selected"';
                options += '<option value="'+indicator.ID+'"'+selected+'>'
                    + indicator.indicatorLabel
                    +'</option>';
            });
            return options;
        }
    };
});
