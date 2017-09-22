/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisPie2 = (function (args) {
    var LBVIS = args.vis;
    var _options = {
        target: args.target     || '#wrapper-piechart2',
        title:  args.title      || 'Land Use',
		subtitle: args.subtitle || 'The subtitle Land Use',
        iso3:   args.iso3,
        // (future) DO NOT work yet, all was hardcoded...
        indicators: args.indicators,
		//main: 'LA-PRI-III.OW',
        year: args.year || '2017', // NOT USED. TODO
        // FIX: This is all wrong, it depend on the # of indicators and should be generated
        //colors: args.colors || ['#7ED321', '#F8E71C', '#F6112D'] // default 3 colors (semaphore)
    };

    var _data = {
        main: {},
        series: [],
//        indicator: {},   // Main indicator info
        indicators: {}   // Indicators info cache
    };
    var chart_series = [];

	function _get_indicator_field(field, indicators, indicator_id){
		var result = $.grep(indicators, function(e){ return e.id == indicator_id; })[0];
		return result[field]
	}	

    var _loadData = function () {
		var indicators_ids = []
		$.each(_options.indicators, function(i, item) {
			indicators_ids.push(item["id"])
		});
		
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.pie2_chart(indicators_ids, _options.iso3));
        return $.getJSON(query_url, function (data) {
            _data.series = [];
            for (var ind in data.results.bindings) {
				var indicator_id = data.results.bindings[ind].indicator.value.replace("http://data.landportal.info/indicator/",'')
                var serie = {
                    id: data.results.bindings[ind],
                    // TODO get it from LOD! WTF
					//_options.indicators
					//name: _get_PRINDEX_label(data.results.bindings[ind].indicator.value), // TODO get label
					name: _get_indicator_field("label", _options.indicators, indicator_id),
                    color: _get_indicator_field("color", _options.indicators, indicator_id),
                    y: parseFloat(data.results.bindings[ind].value.value),
					sliced: true,
                };
                if (ind === 'year') {
                    _options.year = serie.y;
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
                text: "["+_options.iso3 + "] " + _options.title + ' ('+ _options.year +')', // Maybe add the country at th beginning. Waiting for Mike's wireframe
                align: 'center'
            },
            subtitle: {
                text: _options.subtitle,
                align: 'center'
            },
            tooltip: {
                pointFormat: '<b>{point.percentage:.1f}%</b>'
            },
            legend: {
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
						format: '<b>{point.name}</b>: {point.percentage:.1f} %',
						style: {
							color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
						}
                    },
                    //showInLegend: true
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
            // FIXME: OLD: Get main indicator info, then load Pie data
            //LBVIS.getIndicatorInfo(_options.main).done(function () {
                //_data.indicator = LBVIS.cache('info')[_options.main][0];
                _loadData().done(function () {
                    _drawChart();
                });
            //});
        }
    };
});
