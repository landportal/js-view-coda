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
        legend: false,
        loadMain: true,         // This will prevent loading main ind. value from LOD
        indicators: {           // Default to the original FAO Land Use pie chart
            main: args.main     || 'FAO-6601-5110',
            chart: args.indicators || ['FAO-6621-5110', 'FAO-6650-5110', 'FAO-6655-5110', 'FAO-6661-5110']
        },
        year: args.year         || '2014',
        colors: args.color      || ['#8c6d31', '#e7ba52', '#b5cf6b', '#637939', '#9c9ede']
    };

    var _data = {
        series: [],
        indicators: args.cache  || {}   // Indicators metadata cache
    };

    var chart_series = [];

    var _loadData = function () {
        var chart = _options.indicators.chart;
        // If we don't load main indicator data, remove it from the serie
        if (_options.loadMain) {
            chart.splice(chart.indexOf(_options.indicators.main), 1);
        }

        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'value', 'time'],
            { country: [_options.iso3], indicator: chart, time: [_options.year] }
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
                _data.indicators[lbid].value = d.value.value;
                _data.series.push(serie);
                console.log(d, i);
            });
            //console.log('GOTCHA', data.results.bindings);
        });
    };

    var _drawChart = function () {
        //console.log('Draw Pie', _data.series);
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
                text: _data.indicators[_options.indicators.main].label + ' ('+ _options.iso3 + ':' + _options.year +')',
                align: 'center'
            },
            subtitle: {
                text: _data.indicators[_options.indicators.main].value,
                align: 'center'
            },
            tooltip: {
                headerFormat: '<b>{point.key}: {point.y}</b><br/>',
                pointFormat: '{point.percentage:.1f}%</b>',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        // Carlos also want to show dataLabels directly... fancy ^^^
			format: '<b>{point.name}</b>: {point.y}', // TODO add ind. unit
			style: {
			    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
			}                        
                    },
                    showInLegend: _options.legend
                }
            },
            series: [{
                name: '[[Owners]] X)', //_data.indicators[''].name,
                colorByPoint: true,
                data: _data.series
            }]
        };
        if (_options.legend) {
            ChartPieOp.legend = {
                itemWidth: 300,
                labelFormat: '{name}',
            };
        }
        return new Highcharts.Chart(ChartPieOp);
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
