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
 * Main object
 *
 * Prototype:
 *   new lbvis({arguments});
 *
 * Arguments:

 * Example:

var VIS = new lbvis();
VIS.init();

 */

'use strict';

var lbvis = (function (args) {
    //args = args || {};
    var _options = {
        iso3: null,
        loadIndicators: true    // Wait for indicators list to preload
    };
    $.extend(_options, args);

    // jQuery deferred objects
    var _defers = {
        info: {},
        indicatorsByCountry: {},
        countriesByIndicator: {},
        years: {},
        dataset: {}, // DS data
    };
    // Internal cache
    var _cache = {
        'indicators': [],
        'datasets':   [],
        'countries':  [],
        'indicatorsByCountry': {},
        'countriesByIndicator': {},
        // 'info':         {},    // store by indicator id
        // 'years':        {},    // store by indicator id
        // 'period':       {},    // store by indicator id
        'data': {},
        'dataset': {}, // DS data
    };
    // Data lib
    var _DATA = args.data || new lbvisDATA(args);

    // New Method (> 1.2.x)
    // Load indicator-based obs/series
    var _loadData = function (indicators, iso3=null, year=null) {
        if (!indicators) {
            console.warn('No data to load');
            return null;
        }
        var filters = { indicator: indicators };
        if (iso3) filters.country = [ iso3 ];
        if (year) filters.time = [ year ];
        var qvalues = _DATA.obsValues(
            ['indicator', 'country', 'time', 'value'], // computex data obs
            filters
        );
        //console.log('G', qvalues);
        return $.getJSON(_DATA.sparqlURL(qvalues), function (data) {
            data.results.bindings.forEach(function (d, i) {
                var lbid = d.indicator.value;
                var time = d.time.value;
                var iso3 = d.country.value;
                if (!_cache.data[lbid]) _cache.data[lbid] = {};
                // only if year / time filter
                if (!_cache.data[lbid][time]) _cache.data[lbid][time] = {};
                var stuff = _marshallJSON(d);
                _cache.data[lbid][time][iso3] = stuff;
    //          _data.cache[d.country][lbid] = d; //parseFloat(d.value);
            });
            //console.log('GOTCHA', data.results.bindings);
        });
    };

    var _loadDataset = function (id) {
        if (_defers.dataset[id]) {
            return _defers.dataset[id];
        }
        return _getSPARQL(_DATA.queries.datasetData(id), 'dataset', id);
    };

    // Get all datasets
    var _getDatasets = function () {
        if (_defers['datasets']) {
            return _defers['datasets'];
        }
        return _getSPARQL(_DATA.queries.datasets, 'datasets');
    };

    //
    // Getter for JS View Coda plugins
    //
    // Get available indicators, can filter by country
    var _getIndicators = function (iso3=_options.iso3) {
        _getDatasets();
        var def = 'indicators';
        var q = _DATA.queries.indicators;
        if (iso3) {
            def = 'indicatorsByCountry';
            if (_defers[def][iso3]) return _defers[def][iso3];
            q = _DATA.queries.countryIndicators(iso3);
        } else if (_defers[def]) {
            return _defers[def];
        }
        return _getSPARQL(q, def, iso3).done(function () {
            _getDatasets().done(function () {
                if (iso3) {
                    _cache[def][iso3] = _cache[def][iso3].map(x => _formatIndicatorLabel(x));
                } else {
                    _cache[def] = _cache[def].map(x => _formatIndicatorLabel(x));
                }
            });
        });
    };

    // Get all countries
    // lbid is a LB indicators id
    //   it narrow down the list of countries to those with data for this indicator
    var _getCountries = function (lbid=null) {
        if (lbid) {
            if (_defers.countriesByIndicator[lbid]) {
                return _defers.countriesByIndicator[lbid];
            }
            var q = _DATA.queries.indicatorCountries(lbid);
            return _getSPARQL(q, 'countriesByIndicator', lbid);
        }
        if (_defers['countries']) {
            return _defers['countries'];
        }
        var q = _DATA.queries.countries;
        return _getSPARQL(q, 'countries');
    };

    // Get indicators Info
    var _getIndicatorsInfo = function () {
        if (_defers['indicatorsInfo']) {
            return _defers['indicatorsInfo'];
        }
        return _getSPARQL(_DATA.queries.indicatorsInfo, 'indicatorsInfo');
    };

    var _marshallJSON = function (item) {
        var stuff = {};
        Object.keys(item).forEach(function (prop) {
            var v = item[prop].value;
            stuff[prop] = (
                (item[prop].datatype == 'http://www.w3.org/2001/XMLSchema#integer')
                    ? parseFloat(v) : v);
        });
        return stuff;
    };

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
                var stuff = _marshallJSON(item);
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



    //
    //
    //
    var _formatIndicatorLabel = function (indicator) {
        var ds = _cache.datasets.find(d => d.id == indicator.dataset);
        indicator.render = '<span class="indicator"><a href="' + indicator.indicatorSeeAlso.replace(/.*\/\/landportal.info/, '') + '">' + indicator.label + '</a>'
            + ' <span class="glyphicon glyphicon-question-sign" data-toggle="tooltip" data-placement="top" title="'
            + indicator.description.replace(/"/g, "'") + '"></span>'
            + ' <span class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="top" title="'
            + 'Unit: ' + indicator.unit
            + "\nDataset: " + ds.label
            + "\nSource: " + ds.source
            + '"></span>'
            + '</span>';
        return indicator;
    };

    var _generateSelect = function (data, groupby=null, group=null) {
        var options = '';
        if (group) {
            options = group.map(function (g) {
                return '<optgroup label="' + g.label  + '">'
                    + data.filter(i => i[groupby] == g.id).map(function (d) {
                        return '<option value="' + d.id + '">' + d.label + '</option>'
                    }).join("\n")
                    + "</optgroup>\n";
            });
        } else {
            options = data.map(function (d) {
                var v = (d.constructor == Object ? d.id : d);
                var l = (d.constructor == Object ? d.label : d);
                return '<option value="' + v + '">' + l + '</option>';
            }).join("\n");
        }
        return options;
    };

    var _init = function () {
        console.log('LBVIS preload');
        _getCountries();
        _getIndicators();
    };
    // Automatically initialize
    _init();

    // Public methods
    return {
        info: { version: '1.2.0' },
        DATA: _DATA,
        defers: function (type) { return (type ? _defers[type] : _defers); },
        cache: function (type) { return (type ? _cache[type] : _cache); },
        debug: function () { return {options: _options, cache:  _cache, defers: _defers}; },
        // maybe map those my 'id' / code
        countries: function () { return _cache['countries']; },
        indicators: function () { return _cache['indicators']; },
        datasets: function () { return _cache['datasets']; },

        // Data / query
        loadData: _loadData,
        loadDataset: _loadDataset,
        getIndicators: _getIndicators,
        getIndicatorsInfo: _getIndicatorsInfo,
        getCountries: _getCountries,

        ready: function () {
            return $.when(_defers['countries'], _defers['indicators']);
        },

        // UI helpers
        generateSelect: _generateSelect,
        // HighCharts helpers
        chartOptions: function(options, chart) {
            return $.extend(true, {
                credits: { enabled: false },
                chart: {
                    renderTo: $(options.target)[0],
                    backgroundColor: 'transparent',
                },
                exporting: false,
                colors: options.colors,
                title: { text: null },
                subtitle: { text: null },
            }, chart);
        },
        // Update chart title
        setTitle: function (chart, title=null, subtitle=null, useHTML=true) {
            if (!chart) return false;
            title = {text: (title ? title : null)};
            subtitle = {text: (subtitle ? subtitle : null)};
            if (useHTML) {
                if (title.text) title.useHTML = true;
                if (subtitle.text) subtitle.useHTML = true;
            }
            if (title.text || subtitle.text) {
                //console.log('setTitle', title, subtitle);
                chart.setTitle(title, subtitle);
            }
        },

        // JS basics...
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
        },
    };
});
