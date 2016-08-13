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
        iso3: args.iso3 || null,
        loadIndicators: args.loadIndicators || true
    };
    var _defers = { info: {} }; // jQuery deferred
    var _cache = {};            // Internal cache
    // Data lib
    var _DATA = args.data || new lbvisDATA(_options);

    // Get JSON data from a SPARQL query
    //  - store jQuery deferred in _defer by type
    //  - turn results into a hash (named after query SELECTed 'columns'),
    //    and store the data in _cache by type
    var _getSPARQL = function (query, type) {
        //console.log(type, query);
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
    
    // Get all countries
    var _getCountries = function () {
        var q = _DATA.queries.countries;
        return _getSPARQL(q, 'countries');
    };
    // Get all available indicators
    var _getIndicators = function () {
        var q = _DATA.queries.indicators;
        if (_options.iso3) {
            q = _DATA.queries.countryIndicators(_options.iso3);
        }
        return _getSPARQL(q, 'indicators');
    };
    // Get an indicator detail
    var _getIndicatorInfo = function (id) {
        var q = _DATA.queries.indicatorInfo(id);
        return _getSPARQL(q, id);
    };

    var _init = function () {
        _getCountries();
        _getIndicators();
    };
    // Automatically initialize
    _init();

    // Public methods
    return {
        DATA: _DATA,
        defers: function (type) { return (type ? _defers[type] : _defers); },
        cache: function (type) { return (type ? _cache[type] : _cache); },
        countries: function () { return _cache['countries']; },
        indicators: function () { return _cache['indicators']; },
        //indicators_info: function () { return _cache['info']; },

        ready: function () {
            if (_options.loadIndicators) {
                return $.when(_defers['countries'], _defers['indicators']);
            }
            return _defers['countries'];
        },

        getIndicatorInfo: function (indicator) {
            //console.log('FIX ME', indicator);
            if (!_defers.info[indicator]) {
                _defers.info[indicator] = _getIndicatorInfo(indicator);
            }
            return _defers.info[indicator];
        },

        // kinda bad...
        generateOptions: function (data, id) {
            var options = '';
            data.forEach(function (item) {
                var selected = (item.id === id ? ' selected="selected"' : '');
                options += '<option value="'+item.id+'"'+selected+'>'
                    + item.label + '</option>';
            });
            return options;
        }
    };
});
