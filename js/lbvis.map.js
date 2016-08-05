'use strict';

/* LB vis map class/module
 *
 * Params:
 - type         # mandatory MUST be either 'local' or 'global'
 - vis          # mandatory MUST be a <lbvis> instance
 - map_data     # mandatory MUST contain display data for the highchart map

 * Options:
 - iso3         # country
 - showIndicators       # load indicators and fill up select menu
 - indicator    # Load this indicator
 - year         # Load this year (TODO: default to latest)
 */
var lbvisMap = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        type: args.type,                // map type: global or local
        iso3: args.iso3 || null,        // for local map, the iso3 of the country to zoom
        target: args.target || '#map-' + args.type,
        mapTarget: args.mapTarget || '#map-' + args.type + '-wrapper',
        // optional
        showIndicators: false,                  // indicators + year select form
        indicator: args.indicator || null       //'WB-SP.RUR.TOTL.ZS',
    };
    var _data = {
        map: args.map_data || map_data,
        chart: null,
        min: 0,
        max: 0,
        year: args.year || null,
        years: [],
        indicator: {},
        indicators: {}
    };

    var _getYears = function () {
        _data.years = [];
        var query = LBVIS.DATA.queries.indicatorYears(_options.indicator, _options.iso3);
        //console.log('Years', query);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            data.results.bindings.forEach(function (item) {
                _data.years.push(item.year.value);
            });
            setOptionsYears();
        });
    };

    var _getChartData = function () {
        var query = LBVIS.DATA.queries.indicatorValues(_options.indicator);
        console.log('Values', query);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            _data.chart = [];
            data.results.bindings.forEach(function (country_value) {
                var v = parseFloat(country_value.value.value);
                _data.chart.push({
                    code: country_value.countryISO3.value,
                    value: v
                });
                if (v > _data.max) _data.max = v;
                if (v < _data.min) _data.min = v;
            });
        });
    };

    // UI / build options for years selection
    var setOptionsYears = function () {
        var str = '';
        _data.years.forEach(function(year) {
            str += '<option value="'+year+'"'
                + (year == _options.year ? ' selected="selected"' : '')
                + '>'+year+'</option>';
        });
        // TODO: bad , separate UI
        $(_options.target + ' select[name="year"]').html('<option data-localize="inputs.syear">Select year ...</option>');
        if(str.length) {
            $(_options.target + ' select[name="year"]').append(str);
            $(_options.target + ' select[name="year"]').prop( "disabled", false );
        }
        return str;
    };

    var _initMapGlobal = function () {
        //console.log('Map init ' + _options.type, _options);

        // Fill up indicators select menu
        if (_options.showIndicators) {
            LBVIS.defers.indicators.done(function () {
                var opts = LBVIS.getOptionsIndicators(_options.indicator);
                $(_options.target + ' select[name="indicator"]').html(opts);
            });
        }

        // Load indicator Information
        if (_options.indicator) {
            var df = [];
            df[0] = LBVIS.getIndicatorInfo(_options.indicator, _data.indicators).done(function () {
                //console.log(_data);
                _data.indicator = _data.indicators[_options.indicator];
            });

            df[1] = _getYears();
            $.when(df).done(function () {
                console.log('all Deferred completed', this, df);
            });
        }
            
        $(_options.target + " .loading").removeClass("hidden");
        _getChartData().done(function () {
            drawMapGlobal(_options.mapTarget, _data);
            $(_options.target + " .loading").addClass("hidden");
        });
    };

    /*
     * Events
     */
    var _bindUI = function () {
        // Country Indicators select
        $(_options.target).delegate('select[name="indicator"]', "change", function(e) {
            e.preventDefault();
            if (e.target.value) {
                LBVIS.getIndicatorInfo(_options.indicatorID, _data.indicators);
                _options.indicator = e.target.value;
                $(_options.target + ' select[name="year"]').html("");
                _getYears();
                // } else {
                //     $(_options.target + ' select[name="year"]').val(0);
                //     $(_options.target + ' select[name="year"]').prop( "disabled", true );
            }
        });

        $(_options.target).delegate('select[name="year"]', "change", function(e){
            e.preventDefault();
            if (e.target.value) {
                _options.year = e.target.value;
                _initMapGlobal();
            }
        });
    };

    /*
     * Public methods
     */
    return {
        // TODO: remove OPTS once all fx in module
        OPTS: _options,
        DATA: _data,
        init: function () {
            //console.log('Map init', _options, LBVIS);
            if (_options.type === 'local') {
                drawMapLocal(_options.mapTarget);
                $(_options.mapTarget).highcharts().get(_options.iso3).select();
                $(_options.mapTarget).highcharts().get(_options.iso3).zoomTo();
                $(_options.mapTarget).highcharts().mapZoom(3);
            } else {
                _initMapGlobal();
                if (_options.showIndicators) {
                    _bindUI();
                }
            }
        }
    };
});



/******************************************
 * Drawing
 */
function drawMapGlobal(target, data) {
    $(target).highcharts('Map', {
        chart: {
            backgroundColor: '#ffffff',
            margin: 0
        },
        credits:{
            enabled:false
        },
        title: {
            text:'',
            useHTML: true
        },
        mapNavigation: {
            enabled: true,
            buttonOptions: {
                theme: {
                    fill: 'white',
                    'stroke-width': 1,
                    stroke: 'silver',
                    r: 0,
                    states: {
                        hover: {
                            fill: '#79B042'
                        },
                        select: {
                            stroke: '#039',
                            fill: '#bada55'
                        }
                    }
                },
                verticalAlign: 'top'
            },
            enableMouseWheelZoom: false,
            enableDoubleClickZoom: false,
            buttons: {
                zoomIn: {
                    y: 20,
                    x: 20
                },
                zoomOut: {
                    y: 50,
                    x: 20
                }
            }
        },
        colorAxis: {
            min: data.min,
            max: data.max,
            minorTickLength: 0,
            maxColor: "#45551A",
            minColor: "#D9ED7E"
        },
        series: [{
            data: data.chart[data.year],
            allowPointSelect: true,
            nullColor: '#bbd6d8',
            borderColor: 'white',
            mapData: data.map,
            joinBy: ['id', 'code'],
            name: data.indicator.label,
            states: {
                hover: {
                    color: '#F5A623'
                },
                select: {
                    color: '#F5A623'
                }
            },
            tooltip: {
                pointFormat: '{point.name} <b>' + '{point.value}'.replace(/\B(?=(\d{3})+(?!\d))/g, ",")+' ' + data.indicator.unit +'</b>'
            }
        }]
    });
}



function drawMapLocal(target) {
    //## Location map ##//
    $(target).highcharts('Map', {
        chart: {
            backgroundColor: '#ffffff',
            margin: 0
        },
        credits:        { enabled: false },
        title:          { text: '' },
        legend:         { enabled: false },
        mapNavigation: {
            enabled: true,
            buttonOptions: {
                theme: {
                    fill: 'white',
                    'stroke-width': 1,
                    stroke: 'silver',
                    r: 0,
                    states: {
                        hover: {
                            fill: '#79B042'
                        },
                        select: {
                            stroke: '#039',
                            fill: '#bada55'
                        }
                    }
                },
                verticalAlign: 'top'
            },
            enableMouseWheelZoom: false,
            enableDoubleClickZoom: false,
            buttons: {
                zoomIn: {
                    y: 20,
                    x: 20
                },
                zoomOut: {
                    y: 50,
                    x: 20
                }
            }
        },
        colorAxis: {
            minorTickLength: 0,
            maxColor: "#45551A",
            minColor: "#D9ED7E"
        },
        series: [{
            data: [],
            allowPointSelect: true,
            nullColor: '#bbd6d8',
            borderColor: 'white',
            mapData: map_data,
            joinBy: ['id', 'code'],
            name: '',
            states: {
                hover: {
                    color: '#BADA55'
                },
                select: {
                    color: '#B1D748'
                }
            },
            tooltip: {
                pointFormat: '{point.name} <b>' + '{point.value}'.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</b>'
            }
        }]
    });
}
