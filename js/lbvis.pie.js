/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisPie = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        target: args.target     || '#wrapper-piechart',
        title:  args.title      || 'Land Use',
        iso3:   args.iso3,
        // (future) DO NOT work yet, all was hardcoded...
        indicators: {
            main: 'FAO-6601-5110',      // TotalLandHA
            chart: ['FAO-6621-5110', 'FAO-6650-5110', 'FAO-6655-5110', 'FAO-6661-5110']
        },
        year: args.target || '2014',
        // FIX: This is all wrong, it depend on the # of indicators and should be generated
        colors: args.color || ['#8c6d31', '#e7ba52', '#b5cf6b', '#637939', '#9c9ede']
    };

    var _data = {
        main: {},
        series: [],
        indicator: {},   // Main indicator info
        indicators: {}   // Indicators info cache
    };
    var chart_series = [];
    // TODO: fix me BADBADBAD
    var STATIC_INDICATOR_NAME = {
        'ArableLandPer':        'Arable Land',
        'PermanentCropsPer':    'Permanent crops',
        'PermanentPasturesAndMedowsPer': 'Permanent pastures and meadows',
        'ForestLandPer':        'Forest Land'
    };

    var _loadData = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.pie_chart(_options.iso3));
        return $.getJSON(query_url, function (data) {
            _data.series = [];
            for (var ind in data.results.bindings[0]) {
                var serie = {
                    id: ind,
                    // TODO get it from LOD! WTF
                    name: (ind == 'other' ? 'Other' : STATIC_INDICATOR_NAME[ind]),
                    color: _options.colors[_data.series.length],
                    y: parseFloat(data.results.bindings[0][ind].value)
                };
                if (ind === 'year') {
                    _options.year = serie.y;
                    continue;
                }
                if (ind === 'mainInd') {
                    _data.main = {
                        name: _options.indicators.main,
                        value: serie.y
                    };
                    continue;
                }
                _data.series.push(serie);
            }
        });
    };

    var _drawChart = function () {
        //console.log('Draw Pie', _data.series);
        var CharPieOp = {
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
                text: _options.title + ' ('+ _options.year +')',
                align: 'center'
            },
            subtitle: {
                text: _data.indicator.label + ': ' + _data.main.value + ' ('+ _data.indicator.unit +')',
                align: 'center'
            },
            tooltip: {
                pointFormat: '<b>{point.percentage:.1f}%</b>'
            },
            legend: {
                itemWidth: 300
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true
                }
            },
            series: [{
                //name: _data.indicator.name,
                colorByPoint: true,
                data: _data.series
            }]
        };
        return new Highcharts.Chart(CharPieOp);
    };

    // Public interfaces
    return {
        init: function () {
            // Get main indicator info, then load Pie data
            LBVIS.getIndicatorInfo(_options.indicators.main).done(function () {
                _data.indicator = LBVIS.cache(_options.indicators.main)[0];
                _loadData().done(function () {
                    _drawChart();
                });
            });
        }
    };
});
