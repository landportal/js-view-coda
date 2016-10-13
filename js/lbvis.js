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

var lbvis = (function (args) {
    args = args || {};
    var _options = {
        //iso3: args.iso3 || null,
        loadIndicators: args.loadIndicators || true
    };
    var _defers = {
        info: {},
        indicatorsByCountry: {},
        years: {}
    }; // jQuery deferred
    // Internal cache
    var _cache = {
        'indicators': [],
        'countries':  [],
        'indicatorsByCountry': {},
        'info':  {},    // store by indicator id
        'years': {}     // store by indicator id
    };
    // Data lib
    var _DATA = args.data || new lbvisDATA(_options);

    // Get JSON data from a SPARQL query
    //  - store jQuery deferred in _defer by type
    //  - turn results into a hash (named after query SELECTed 'columns'),
    //    and store the data in _cache by type
    var _getSPARQL = function (query, type, id) {
        //console.log(type, query);
        if (id) _cache[type][id] = [];
        else _cache[type] = [];
        var url = _DATA.sparqlURL(query);
        var deferred = $.getJSON(url, function (data) {
            data.results.bindings.forEach(function (item) {
                var stuff = {};
                Object.keys(item).forEach(function (prop) {
                    var v = item[prop].value;
                    stuff[prop] = (parseFloat(v) ? parseFloat(v) : v);
                });
                if (id) _cache[type][id].push(stuff);
                else _cache[type].push(stuff);
            });
        });
        if (id) {
            _defers[type][id] = deferred;
        } else {
            _defers[type] = deferred;
        }
        return deferred;
    };
    
    // Get all countries
    var _getCountries = function () {
        if (_defers['countries']) {
            return _defers['countries'];
        }
        var q = _DATA.queries.countries;
        return _getSPARQL(q, 'countries');
    };
    // Get all available indicators
    var _getIndicators = function (iso3) {
        var def = 'indicators';
        var q = _DATA.queries.indicators;
        if (iso3) {
            def = 'indicatorsByCountry';
            if (_defers[def][iso3]) return _defers[def][iso3];
            q = _DATA.queries.countryIndicators(iso3);
        } else if (_defers[def]) {
            return _defers[def];
        }
        return _getSPARQL(q, def, iso3);
    };
    // Get an indicator metadata
    var _getIndicatorInfo = function (id) {
        if (_defers.info[id]) {
            return _defers.info[id];
        }
        var q = _DATA.queries.indicatorInfo(id);
        return _getSPARQL(q, 'info', id);
    };
    // Return valid years for an indicator
    var _getIndicatorYears = function (id) {
        if (_defers.years[id]) {
            return _defers.years[id];
        }
        var q = _DATA.queries.indicatorYears(id);
        //console.log('get years for', id, q);
        return _getSPARQL(q, 'years', id).done(function () {
            // Re-process cache for years
            var years = _cache['years'][id];
            _cache['years'][id] = [];
            $.each(years, function (key, value) {
                _cache['years'][id].push(value.year);
            });
        });
    };
    // getIndicator info + years
    // iso3 (FUTURE), narrow down the years for a given country
    var _getIndicatorDetails = function (id, iso3) {
        return $.when(
            _getIndicatorInfo(id),
            _getIndicatorYears(id)
        );
    };

    // MUST be called after _indicatorInfo completed!
    var _setMetadata = function (target, id) {
        var indicator = _cache['info'][id][0];
        $(target).each(function (n) {
            var name = $(this).attr('name');
            switch (name) {
            case 'indicator':
                name = 'label';
            case 'dataset':
            case 'source':
                $(this).html(indicator[name]);
                var p = $(this).parent();
                if (p[0].nodeName == 'A') p.attr('href', indicator[name + 'SeeAlso']);
                break;
            case 'unit':
            case 'year':
            case 'description':
                $(this).html(indicator[name]);
                break;
            // default:
            //     console.log(this);
            }
        });
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
        debug: function () { console.log(_options,  _cache, _defers); },
        countries: function () { return _cache['countries']; },
        indicators: function () { return _cache['indicators']; },

        setMetadata: function (target, id) { return _setMetadata(target, id); },
        getIndicatorInfo: function (indicator) { return _getIndicatorInfo(indicator); },
        getIndicatorYears: function (indicator) { return _getIndicatorYears(indicator); },
        getIndicatorDetails: function (indicator, iso3) { return _getIndicatorDetails(indicator, iso3); },
        getIndicators: function (indicator) { return _getIndicators(indicator); },

        ready: function () {
            if (_options.loadIndicators) {
                return $.when(_defers['countries'], _defers['indicators']);
            }
            return _defers['countries'];
        },

        // Helpers
        generateOptions: function (data, selected) {
            var options = '';
            data.forEach(function (item) {
                var id = (typeof item === 'object' ? item.id : item);
                var label = (typeof item === 'object' ? item.label : item);
                //console.log(item, id, label);
                options += '<option value="'+id+'"'
                    + (id === selected ? ' selected="selected"' : '')
                    + '>' + label + '</option>';
            });
            return options;
        },
        // Correct rounding to 2 decimal after floating point (RTFM http://floating-point-gui.de/
        // or http://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html (if you crave more details)
        round: function (num, precision) {
            precision = precision || 2;
            return +(Math.round(num + "e+"+precision)  + "e-"+precision);
        },
        // This method is used by mainstream libs (underscore...)
        // See: http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
        // http://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string (read through it)
        isString: function (s) {
            return Object.prototype.toString.call(s) == '[object String]';
        }
    };
});
