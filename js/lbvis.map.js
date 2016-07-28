'use strict';

/* LB vis map class/module
 *
 * Params:
 - type         # mandatory MUST be either 'local' or 'global'
 - vis          # mandatory MUST be a <lbvis> instance
 - indicator    # optional , default indicator
 * other global (bad) var used:
 - map_data     # mandatory MUST exist

 */
var lbvisMap = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        type: args.type, // global or local
        target: args.target || '#map-' + args.type,
        mapTarget: args.mapTarget || '#map-' + args.type + '-wrapper',
        selected: args.indicator || 'WB-SP.RUR.TOTL.ZS',
        year: args.year || 2014
    };
    var _data = {
        map: args.map_data || null,
        chart: null,
        min: 0,
        max: 0,
        years: [],
        indicator: {},
        indicators: {}
    };

    var _getYears = function () {
        _data.years = [];
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.query_years_indicator_country(_options.selected));
        return $.getJSON(query_url, function (data) {
            data.results.bindings.forEach(function (item) {
                _data.years.push(item.year.value);
            });
            setOptionsYears();
        });
    };

    var _getChartData = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.query_map_chart(_options.selected));
        return $.getJSON(query_url, function (data) {
            _data.chart = [];
            data.results.bindings.forEach(function (country_value) {
                if (country_value.year.value != _options.year) return;
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
        // 1) Indicators available for this country
        // Fill up select menu once indicators are loaded
        LBVIS.defers.indicators.done(function () {
            var opts = LBVIS.getOptionsIndicators(_options.selected);
            $(_options.target + ' select[name="indicator"]').html(opts);
        });
        // 2) Load selected indicator
        LBVIS.getIndicatorInfo(_options.selected, _data.indicators).done(function () {
            //console.log(_data);
            _data.indicator = _data.indicators[_options.selected];
        });

        // check defer LBVIS.defer.indicator_info
        _getYears();
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
                _options.selected = e.target.value;
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
            if (_options.type === 'global') {
                _initMapGlobal();
                _bindUI();
            } else {
                drawMapLocal(_options.mapTarget);
                $(_options.mapTarget).highcharts().get(LBVIS.ISO3).select();
                $(_options.mapTarget).highcharts().get(LBVIS.ISO3).zoomTo();
                $(_options.mapTarget).highcharts().mapZoom(3);
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
            data: data.chart,
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
