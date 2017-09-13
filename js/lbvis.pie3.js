/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisPie3 = (function (args) {
    var LBVIS = args.vis;
    var _options = {
        target: args.target     || '#wrapper-piechart',
        iso3:   args.iso3,
        indicators: {
            // Default to the original FAO Land Use pie chart
            main: args.main     || 'FAO-6601-5110',
            chart: args.indicators || ['FAO-6621-5110', 'FAO-6650-5110', 'FAO-6655-5110', 'FAO-6661-5110']
        },
        year: args.year || '2014',
        colors: args.color || ['#8c6d31', '#e7ba52', '#b5cf6b', '#637939', '#9c9ede']
    };

    var _data = {
        //main: {},
        //indicator: { label: args.title || 'blabla', desc: args.desc || 'youpi desc' },
        series: [],
        indicators: args.cache || {}   // Indicators info cache
    };

    var chart_series = [];

    var _loadData = function () {
        //chart = chart.indexOf(_options.indicators.main);
        // TMP cheapo
        var chart = _options.indicators.chart.shift();
        console.log('BAD SHIFT ' + chart, _options.indicators.chart);

        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'value', 'time'],
            { country: [_options.iso3], indicator: _options.indicators.chart, time: [_options.year] }
        );
        //console.log('G', qvalues);
        return $.getJSON(LBVIS.DATA.sparqlURL(qvalues), function (data) {
            _data.series = [];
            var i = 0;
            data.results.bindings.forEach(function (d, i) {
                var lbid = d.indicator.value;
                var serie = {
                    id: lbid,
                    name: _data.indicators[lbid].label,
                    desc: _data.indicators[lbid].desc,
                    color: _options.colors[i],
                    y: parseFloat(d.value.value),
                };
                _data.series.push(serie);
                console.log(d, i);
            });
            //console.log('GOTCHA', data.results.bindings);
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
                text: _data.indicators[_options.indicators.main].label + ' ('+ _options.year +')',
                align: 'center'
            },
            subtitle: {
                text: _data.indicators[_options.indicators.main].desc,
                align: 'center'
            },
            legend: {
                itemWidth: 300,
                labelFormat: '{name}',
                //<span class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="top" title="{desc}"></span>'
            },
            plotOptions: {
                tooltip: {
                    headerFormat: '{point.name}',
                    pointFormat: '<b>{point.id}: {point.percentage:.1f}</b>'
                },
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        // Carlos prefers dataLabels, new pie style...
			format: '<b>{point.name}</b>: {point.y}',
			style: {
			    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
			}                        
                    },
                    showInLegend: true
                }
            },
            series: [{
                name: '[[Owners]] X)', //_data.indicators[''].name,
                colorByPoint: true,
                data: _data.series
            }]
        };
        return new Highcharts.Chart(CharPieOp);
    };

    // Public interfaces
    return {
        debug: function () {
            console.log(_options, _data, args);
        },
        init: function () {
            // Get main indicator info, then load Pie data
            // may not exists?
            // LBVIS.getIndicatorInfo(_options.indicators.main).done(function () {
            //     _data.indicator = LBVIS.cache('info')[_options.indicators.main][0];
            // });
            _loadData().done(function () {
                _drawChart();
            });
        }
    };
});
