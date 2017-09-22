/**
 * Require highcharts-more.js
 */
'use strict';

var lbvisSpider = (function (args) {
    //args.iso3
    var LBVIS = args.vis;
    var _options = {
        target: args.target || '#wrapper-spiderchart',
        title: args.title || 'Main indexes',
        iso3: args.iso3
    };
    var categories_names = [];
    var chart_series = [];

    var _loadData = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.spider_chart(_options.iso3));
        return $.getJSON(query_url, function (data) {
            // Un-cleaned , mad code to parse serie data
            // TODO: re-do :)
            var chart_series_labels = data.head.vars;
            var serie_value;
            var serie_year;
            for(var i=0; i<chart_series_labels.length; i++){
                var serie_name;
                switch (chart_series_labels[i]){
	        case "sigiTo100":	serie_name = "SIGI";
		    if(data.results.bindings[0][chart_series_labels[2]]!=undefined){
		        serie_name = serie_name	+ " ("+data.results.bindings[0][chart_series_labels[2]].value+")";
		    }
		    break;
	        case "giniTo100": 	serie_name = "GINI Index";
		    if(data.results.bindings[0][chart_series_labels[5]]!=undefined){
		        serie_name = serie_name	+ " ("+data.results.bindings[0][chart_series_labels[5]].value+")";
		    }
		    break;
	        case "hdiTo100": 	serie_name = "HDI";
		    if(data.results.bindings[0][chart_series_labels[8]]!=undefined){
		        serie_name = serie_name	+ " ("+data.results.bindings[0][chart_series_labels[8]].value+")";
		    }
		    break;
	        case "ghiTo100": 	serie_name = "GHI";
		    if(data.results.bindings[0][chart_series_labels[11]]!=undefined){
		        serie_name = serie_name	+ " ("+data.results.bindings[0][chart_series_labels[11]].value+")";
		    }
		    break;
	        default:			serie_name = "notused";
		    break;
	        }

                if(serie_name!="notused"){
                    categories_names.push(serie_name);
                    if(data.results.bindings[0][chart_series_labels[i]]!=undefined){
                        serie_value = data.results.bindings[0][chart_series_labels[i]].value;
                    }
                    else{
                        serie_value = null;
                    }
                    if(data.results.bindings[0] != undefined){
                        chart_series.push(parseFloat(serie_value));
                    }
                    else{
                        //console.log("pusheando null...");
                        chart_series.push(null);
                    }
                }
            }
            // /Uncleaned

        });
    };
    var drawSpider = function () {
        var CharSpiderOp = {
            chart: {
                polar: true,
                type: 'line',
                renderTo: $(_options.target)[0],
                backgroundColor: 'transparent'
            },
            credits: { enabled:false },
            title: {
                text: _options.title
            },
            subtitle: {
                text: LBVIS.countries().filter(
                    function (c) { return c.iso3 === _options.iso3; })[0].name
            },
            pane: {
                size: '80%'
            },
            xAxis: {
                categories: categories_names,
                tickmarkPlacement: 'on',
                lineWidth: 0
            },
            yAxis: {
                gridLineInterpolation: 'polygon',
                lineWidth: 0,
                min: 0
            },
            tooltip: {
                shared: true,
                pointFormat: '<b>{point.y:,.0f}</b> /100'
            },
            series: [{
                showInLegend:false,
                data: chart_series,
                pointPlacement: 'on'
            }]
        };
        return new Highcharts.Chart(CharSpiderOp);
    };

    // Public methods
    return {
        debug: function () {
            console.log(_options, LBVIS);
        },
        init: function () {
            _loadData().done(function () {
                drawSpider();
            });
        }
    };
});


