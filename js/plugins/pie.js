/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisPie = (function (LBV, args) {
    var LBVIS = LBV; // Main lbvis object

    var _options = {
        target:         '#wrapper-piechart',
        legend:         false,
        iso3:           '',
        colors:         ['#8c6d31', '#e7ba52', '#b5cf6b', '#637939', '#9c9ede'],
        // Default FAO pie chart
        main:           'FAO-6601-5110',
        loadMain:       true,
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

    var _loadData = function () {
        var chart = _options.indicators;
        // If we don't load main indicator data, remove it from the serie
        if (!_options.loadMain) {
            chart.splice(chart.indexOf(_options.main), 1);
        }

        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'time', 'value'], // 'year'
            { indicator: chart } //country: [_options.iso3], time: [_options.year] }
        );
        //console.log('G', qvalues);
        return $.getJSON(LBVIS.DATA.sparqlURL(qvalues), function (data) {
            //_data.series = ['yoyo'];
            data.results.bindings.forEach(function (d, i) {
                var lbid = d.indicator.value;
                if (!_data.cache[d.country.value]) _data.cache[d.country.value] = {};
                _data.cache[d.country.value][lbid] = d; //parseFloat(d.value.value);
            });
            //console.log('GOTCHA', data.results.bindings);
            _data.countries = Object.keys(_data.cache);
        });
    };
    var _drawChart = function () {
        //console.log('Draw Pie', _data.series);
        var title = (_options.cache[_options.main] ? _options.cache[_options.main].render : _options.main);
        var ChartPieOp = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                renderTo: $(_options.target)[0],
                plotShadow: false,
                type: 'pie',
                backgroundColor: 'transparent'
            },
            credits: { enabled: false },
            title: {
                useHTML: true,
                text: title,
                align: 'center'
            },
            subtitle: {
                //text: '('+ _options.iso3 + ':' + _options.year +')',
                align: 'center'
            },
            // tooltip: {
            //     headerFormat: '<b>{point.key}: {point.y}</b><br/>',
            //     pointFormat: '{point.percentage:.1f}%</b>',
            // },
            plotOptions: {
                pie: {
                    size: '75%',
                    allowPointSelect: true,
                    cursor: 'pointer',
                    // dataLabels: {
                    //     enabled: true,
                    //     // Carlos also want to show dataLabels directly... fancy ^^^
		    //     format: '<b>{point.name}</b>: {point.y}', // TODO add ind. unit
		    //     style: {
		    //         color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
		    //     }                        
                    // },
                    //showInLegend: _options.legend
                }
            },
            series: _data.series
        };
        if (_options.legend) {
            ChartPieOp.legend = {
                //itemWidth: 300,
                labelFormat: '{name}',
            };
        }
        $(_options.target + " .loading").addClass("hidden");
        _data.chart = new Highcharts.Chart(ChartPieOp);
        return _data.chart;
    };

    var TreeSerie = function () {
        $.each(_options.tree, function (main, inds) {
            //console.log("TREE " + main, inds);
            HCseries(main, inds);
        });
    }
    
    var HCseries = function(main, indicators) {
        //var cIso3 = _options.iso3 ? _options.iso3 : _data.countries[0];
        //console.log(main, indicators);
        Object.keys(_data.cache).forEach(function(iso3) {
            var serie = {
                type: 'pie',
                name: iso3 + '-' + main, // _options.cache[main].label + ' - ' + 
                data: [],
                //showInLegend: true,
                visible: (main == _options.main && iso3 == _options.iso3 ? true : false),
            };
            //console.log(iso3, _data.cache[iso3]);
            indicators.forEach(function (lbid) {
                //Object.keys(_data.cache[iso3]).forEach(function (lbid) {
                var dt = _data.cache[iso3][lbid];
                serie.data.push({
                    //id: lbid,
                    name: _options.cache[lbid].label,
                //desc: _options.cache[lbid].desc,
                //color: _options.colors[i],
                //cc: d.country.value,
                    y: parseFloat(dt.value.value),
                //console.log(i + ' ' + lbid, d);
                });
            });
            _data.series.push(serie);
        });
    };
    var _chartTitle = function  () {
        _options.iso3 + '-' + _options.main;
        _data.chart.setTitle({text: _options.cache[_options.main].label}, {text: _data.country[_options.iso3]});
    }

    var _bindUI = function () {
        $(_options.target + '-form').delegate("select", "change", function(e) {
            if (e.target.name == 'countries') _options.iso3 = e.target.value;
            if (e.target.name == 'observations') _options.main = e.target.value;
            var sid = _options.iso3 + '-' + _options.main;
            _data.chart.series.forEach(function(serie, id) {
                if (serie.name == sid) {
                    //console.log('show #' + id, serie.name);
                    serie.show();
                } else {
                    serie.hide();
                }
            });
            _chartTitle();
        });
    };
        
    // Public interfaces
    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            // Get main indicator info, then load Pie data
            // may not exists?
            // LBVIS.getIndicatorInfo(_options.main).done(function () {
            //     _data.indicator = LBVIS.cache('info')[_options.main][0];
            // });
            //console.log('FreeStyle options yeay!', _options);
            _loadData().done(function () {
                if (_options.tree) {
                    TreeSerie();
                } else {
                    HCseries(_options.main, _options.indicators);
                }
//                console.log('IND', _data.indicators);
//                console.log('CAC', _data.cache);
                if (_options.loadCountries) {
                    var cc = [];
                    LBVIS.cache('countries').forEach(function (c) {
                        if (_data.countries.indexOf(c.iso3) > 0) {
                            _data.country[c.iso3] = c.name;
                            cc.push({id: c.iso3, label: c.name});
                        }
                    });
                    var countr = LBVIS.generateOptions(cc, _options.iso3);
                    //console.log('LDC', _data.countries, countr);
                    $(_options.target + '-countries').html(countr);
                    // //Assesment based on first indicator with data
                    // LBVIS.getIndicatorCountries(_options.indicators[0]).done(function() {
                    //     console.log('GOT CC: ', LBVIS.cache('countriesByIndicator'));//[_options.indicators[0]]);
                    // });
                }
                _drawChart();
                _bindUI();
                _chartTitle();
            });
        }
    };
});
