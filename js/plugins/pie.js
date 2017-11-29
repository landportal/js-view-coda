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
 * Plugin: Pie chart
 *
 */

'use strict';

var lbvisPie = (function (LBV, args) {
    var LBVIS = LBV; // Main lbvis object

    var _options = {
        target:         '#wrapper-piechart',
        legend:         false,
        iso3:           '',
        colors:         ['#CA652D', '#13585D', '#9D9542', '#143D5D', '#E34A3A'],
        // Default FAO pie chart
        main:           'FAO-6601-5110',
        loadMain:       true,
        mainDelta:      false,
        indicators:     ['FAO-6621-5110', 'FAO-6650-5110', 'FAO-6655-5110', 'FAO-6661-5110'],
        year:           '2014',
    };
    $.extend(_options, args);

    var _data = {
        series: [],
        cache: {},
        countries: [],
        country: {},
        //indicators: args.cache  || {}   // Indicators metadata cache
    };



    // /*
    //  * Data & Series
    //  */
    // var _loadData = function () {
    //     // If we don't load main indicator data, remove it from the serie
    //     var filters = { indicator: _options.indicators };
    //     if (!_options.loadMain) {
    //         filters.indicators.splice(filters.indicators.indexOf(_options.main), 1);
    //     }
    //     if (_options.iso3 && !_options.loadCountries) filters.country = [ _options.iso3 ];
    //     if (_options.year) filters.time = [ _options.year ];

    //     var qvalues = LBVIS.DATA.obsValues(
    //         ['indicator', 'country', 'time', 'value'],
    //         filters
    //     );
    //     return $.getJSON(LBVIS.DATA.sparqlURL(qvalues), function (data) {
    //         data.results.bindings.forEach(function (d, i) {
    //             console(d);
    //             var lbid = d.indicator;
    //             if (!_data.cache[d.country]) _data.cache[d.country.value] = {};
    //             _data.cache[d.country][lbid] = d; //parseFloat(d.value);
    //         });
    //         //console.log('GOTCHA', data.results.bindings);
    //         _data.countries = Object.keys(_data.cache);
    //     });
    // };


    var _loadIndicator = function (lbid) {
        var ind = {
            id: lbid,
            label: lbid,
        };
        if (_options.cache[lbid]) {
            return _options.cache[lbid];
        } else {
            ind = LBVIS.indicators().find(i => i.id == lbid);
        }
        //console.log(lbid + ' info', ind);
        return ind;
    };

    var TreeSerie = function (tree=_options.tree) {
        $.each(tree, function (main, inds) {
            if (inds.constructor === Array) {
                //console.log("TREE " + main, inds);
                HCseries(main, inds);
            } else {
                TreeSerie(inds);
                //console.log("ELSE " + main, inds);
            }
        });
    }
    
    var HCseries = function(main, indicators) {
        if (_options.mainDelta) {
            indicators.splice(indicators.indexOf(_options.main), 1);
        }
        Object.keys(_data.cache).forEach(function(iso3) {
            var serie = {
                type: 'pie',
                name: (_options.cache[main] ? _options.cache[main].label : main),
                id: iso3 + '-' + main,
                data: [],
                visible: (main == _options.main && iso3 == _options.iso3 ? true : false),
                showInLegend: (_options.legend && main == _options.main && iso3 == _options.iso3 ? true : false),
            };
            serie.data = indicators.filter(lbid => _data.cache[iso3][lbid]).map(function(lbid) {
                return {
                    id: lbid,
                    name: (_options.cache[lbid] ? _options.cache[lbid].label : lbid),
                    y: parseFloat(_data.cache[iso3][lbid].value),
                };
            });
            //console.log(serie.data);
            // New that we have all data loaded, let's compute the overall diff
            if (_options.mainDelta) {
                serie.data.push(_pieMainDelta(_data.cache[iso3][_options.main], serie.data));
            }
            _data.series.push(serie);
        });
    };

    var _pieMainDelta = function (main, data) {
        var miss = data.map(function(d) { return d.y; });
        var other = parseFloat(main) - miss.reduce(function(a, b) { return a + b; }, 0);
        return {
            id: other,
            name: 'Other',
            y: LBVIS.round(other, 2),
        };
    };

    /*
     * Drawing & UI
     */
    var _drawChart = function () {
        var ChartPieOp = LBVIS.chartOptions(_options, {
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    size: '80%',
                    //minSize: '10',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    },
                    tooltip: {
                        headerFormat: '<span style="font-size: 10px">{series.name}</span><br/>',
                        pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y}</b><br/>',
                    }
                }
            },
            series: _data.series
        });
        _data.chart = new Highcharts.Chart(ChartPieOp);
        return _data.chart;
    };

    var _chartTitle = function  () {
        if (_options.hideTitle) return false;
        var title = { text: null };
        var subtitle = { text: null };
        if (_options.main && _options.cache[_options.main]) {
            title = {
                text: _options.cache[_options.main].render,
                useHTML: true, align: 'center'
            };
        }
        if (_options.iso3) {
            subtitle = {
                text: _data.countriesLabel[_options.iso3],
                useHTML: true, align: 'center'
            };
            if (_options.mainDelta) {
                var v = _data.cache[_options.iso3][_options.main];
                var i = _options.cache[_options.main];
                subtitle.text += ': ' + v.value + ' (' + i.unit + ')';
            }
        }
        if (title || subtitle) {
            _data.chart.setTitle(title, subtitle);
        }
    }

    var _bindUI = function () {
        $(_options.target + '-form .action').hide(true);
        $(_options.target + '-form').delegate("select", "change", function(e) {
            _data.chart.get(_options.iso3 + '-' + _options.main).hide();
            if (e.target.name == 'country') _options.iso3 = e.target.value;
            if (e.target.name == 'indicator') _options.main = e.target.value;
            //console.log('show: ' + _options.iso3 + '-' + _options.main);
            _data.chart.get(_options.iso3 + '-' + _options.main).show();
            _chartTitle();
        });
    };

    var _latestYear = function (data) {
        return data[Object.keys(data).sort().reverse()[0]][_options.iso3];
    }
        
    // Public interfaces
    return {
        debug: function () {
            return {options: _options, data: _data};
        },
        init: function () {
            _data.countriesLabel = {};
            LBVIS.countries().forEach(function (c) { _data.countriesLabel[c.iso3] = c.name; });

            // If we don't load main indicator data, remove it from the serie
            var inds = _options.indicators;
            if (!_options.loadMain) {
                inds.splice(inds.indexOf(_options.main), 1);
            }
            LBVIS.loadData(inds, [ _options.iso3 ]).done(function () {
                // Fill up pie cache
                // @TODO: check, may have collision?
                var tmp = LBVIS.cache('data');
                //console.log(tmp);
                _options.indicators.forEach(function (lbid) {
                    if (tmp[lbid]) {
                        var idata = _latestYear(tmp[lbid]);
                        if (!_data.cache[idata.country]) _data.cache[idata.country] = {};
                        _data.cache[idata.country][lbid] = idata;
                        _data.countries = Object.keys(_data.cache);
                    }
                });

                if (_options.tree) {
                    TreeSerie();
                } else {
                    HCseries(_options.main, _options.indicators);
                }
                if (_options.loadCountries) {
                    var countries = LBVIS.cache('countries').filter(function (c) {
                        return _data.countries.indexOf(c.iso3) > -1;
                    }).map(function (c) { return {id: c.iso3, label: c.name} });
                    var opts = LBVIS.generateSelect(countries);
                    var select = $(_options.target + '-country');
                    select.html(opts);
                    select.val(_options.iso3);
                }
                _drawChart();
                _bindUI();
                _chartTitle();
            });
        }
    };
});
