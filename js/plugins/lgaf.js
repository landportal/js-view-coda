'use strict';
var lbvisLGAF = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        iso3: args.iso3,
        year: args.year          || '2016',
        target: args.target             || '#lgaf',
        targetGraph: args.targetGraph   || (args.target ? args.target + '-wrapper' : '#lgaf-wrapper'),
        panel: args.panel        || 'WB-LGAF2016-1',
        subpanel: args.indicator || 'WB-LGAF2016-1.1',
        jsonPath: args.jsonPath  || window.location.href.split('/').slice(0, -1).join('/') + '/json'

    };
    var _defer = null;
    var _data = {
        years: [],  // Available years
        panels: {}, // LGAF structure panels > subpanels > indicators
        series: []  // Series / values
    };

    /* GET Data */
    function _getLGAFstructure () {
        $(_options.target + " .loading").removeClass("hidden");
        return $.getJSON(_options.jsonPath + '/LGAF_structure.json', function(data) {
            for (var y in data) {
                _data.panels[y] = data[y];
            }
            _data.years = Object.keys(_data.panels);
            $(_options.target + " .loading").addClass("hidden");
        });
    }
    function _lgaf_chart(iso3, year) {

        return LBVIS.DATA.query.prefix + " \
SELECT ?id (STR(?value) AS ?value) \
" + LBVIS.DATA.query.from + " \
WHERE { \
?obs cex:ref-area <" + LBVIS.DATA.lod.uri.country + iso3 + "> ; \
qb:dataSet <http://data.landportal.info/dataset/WB-LGAF" + year + "> ; \
cex:ref-indicator ?uri ; \
cex:value ?value. \
BIND (REPLACE(STR(?uri), '" + LBVIS.DATA.lod.uri.indicator + "','') AS ?id) \
} ORDER BY ?uri ";
    };

    function _getValues() {
        $(_options.target + " .loading").removeClass("hidden");
        var query = _lgaf_chart(_options.iso3, _options.year);
        var query_url = LBVIS.DATA.sparqlURL(query);
        _defer = $.getJSON(query_url, function (data) {
            data.results.bindings.forEach(function (item) {
                var i = {};
                Object.keys(item).forEach(function (prop) { i[prop] = item[prop].value; });
                _data.series.push(i);
            });
        });
        return _defer;
    }

    /* Build UI elements */
    function setOptionsYears() {
        var str = '<option value="" data-localize="inputs.years">Select year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
            str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name="year"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="year"]').html(str);
    }
    function setOptionsPanels() {
        var str = '<option value="" data-localize="inputs.panels">Select a panel...</option>';
        _data.panels[_options.year].forEach(function (item) {
            var selected = (_options.panel == item.id ? ' selected="selected"' : '');
            str += '<option value="' + item.id + '"'+selected+'>' + item.name + '</option>';
        });
        $(_options.target + ' select[name="panel"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="panel"]').html(str);
    }
    function setOptionsSubpanels() {
        var str = '<option value="" data-localize="inputs.subpanels">Select a sub-panel...</option>';
        var panel = _data.panels[_options.year].filter(function(p) {
            return (p.id == _options.panel ? p : null);
        })[0];
        if (panel) {
            panel.subpanels.forEach(function (item) {
                var selected = (_options.subpanel == item.id ? ' selected="selected"' : '');
                str += '<option value="' + item.id + '"'+selected+'>' + item.name + '</option>';
            });
        }
        $(_options.target + ' select[name="subpanel"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="subpanel"]').html(str);
    }

    function _lgafValueSpan(indicator) {
        // Indicator Value span
        var ival = _data.series.filter(function(v) { return v.id == indicator.id; })[0];
        var value = (ival ? ival.value.toLowerCase() : 'na');
        var vspan = value.split('-').map(function (v) {
            return '<span class="value-' + v + '"></span>';
        }).join('');
        return vspan;
    }
    function updateInfo() {
        if (!_options.panel || !_options.subpanel) {
            //console.log('Need pan', _options.panel, _options.subpanel);
            $(_options.targetGraph).empty();
            $(_options.target + " .empty").removeClass("hidden");
            return false;
        }
        _defer.done(function () {
            // SUCCESS
            var row = '';
            var subpanel = _data.panels[_options.year]
                    .filter(function (p) { return p.id == _options.panel; })[0]
                .subpanels.filter(function(s) { return s.id == _options.subpanel; })[0];
            // Get all subpanel indicators detail
            $(_options.targetGraph).empty();
            //console.log('LGAF got values ', _options, _data, subpanel);
            subpanel.indicators.forEach(function (indicator) {
                //LBVIS.getIndicator(indicator.id).done(function () {
                var details = LBVIS.cache('indicators').find(i => i.id == indicator.id);
                // Display panels
                var row = _lgafValueSpan(indicator)
                    + details.render;
                $(_options.targetGraph).append('<li>' + row + '</li>');
                $(_options.target + " .loading").addClass("hidden");
                $(_options.target + " .empty").addClass("hidden");
            });
            //$(_options.target + " .loading").addClass("hidden");
            //$(_options.targetGraph).html(row);
        }).fail(function () {
            // ERROR
            console.error('LGAF values', _options, _data);
        });
    }
    
    function _bindUI () {
        $(_options.target).delegate("select", "change", function(e) {
            // there isn't really anything to 'prevent' here, this is a select...
            e.preventDefault();
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                _options.panel = null;
                _options.subpanel = null;
                // TODO: clear/disable panel & subpanel select
                _getValues().done(function () {
                    setOptionsPanels();
                });
            }
            if (e.target.name == 'panel') {
                _options.panel = e.target.value;
                _options.subpanel = null;
                setOptionsSubpanels();
            }
            if (e.target.name == 'subpanel') {
                _options.subpanel = e.target.value;
                updateInfo();
            }
            //console.log('EVENT ' + e.target.name + ' = '+e.target.value);
            //$(_options.target + " .quality-list").html('<li class="item-q fos r-pos txt-c c-g40">Please, select year and panels to show the info.</li>');
        });
    }
    
    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            // Load LGAF indicators
            _getLGAFstructure().done(function () {
                setOptionsYears();
                if (_options.year) {
                    // Load values & set panels
                    _getValues().done(function () {
                        setOptionsPanels();
                        setOptionsSubpanels();
                        updateInfo();
                    });
                }
            }).fail(function () {
                console.error('LGAF structure load', arguments);
            });
            _bindUI();
        }
    };
});
