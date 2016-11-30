'use strict';
var lbvisVGGT = (function (args) {
    var LBVIS = args.vis;
    var _options = {
        iso3: args.iso3,
        year: args.year          || '2016',
        target: args.target             || '#vggt',
        targetGraph: args.targetGraph   || (args.target ? args.target + '-wrapper' : '#vggt-wrapper'),
        panel: args.panel        || 'NKT-VGGT16-1',
        subpanel: args.indicator || 'NKT-VGGT16-1A'
//        jsonPath: args.jsonPath  || window.location.href.split('/').slice(0, -1).join('/') + '/json'

    };
    var _defer = null;
    var _data = {
        years: ['2016'],  // Until we can get proper struct/info from the LOD...
        panels: { 2016: [] },
        series: []  // Series / values
    };

    function _getStruct() {
        LBVIS.cache('indicators').forEach(function (item) {
            if (item.id.startsWith('NKT-VGGT')) {
                var id = item.id.substr(0, 12);
                var panel = _data.panels[2016].find(function (i) { return i.id == id; });
                if (!panel) {
                    // Init panel staticly
                    // TODO : FIX once we have proper data struct
                    var l = _data.panels[2016].push({
                        id: id,
                        year: 2016,
                        label: 'VGGT ' + item.id.substr(8, 4) + ' Indicators',
                        subpanels: []
                    });
                    panel = _data.panels[2016][l -1];
                    
                }
                panel.subpanels.push(item);
            }
        });
        //console.log(_data.panels);
    }

    function _getValues() {
        var query = LBVIS.DATA.ns + "SELECT ?id ?year (STR(?value) AS ?value) (STR(?comment) as ?comment) \
FROM <http://data.landportal.info> \
WHERE { \
    ?obs qb:dataSet <http://data.landportal.info/dataset/NKT-VGGT16> ; \
		cex:ref-indicator ?indicatorURL ; \
		cex:ref-area ?countryURL ; \
		cex:ref-time ?year ; \
		cex:value ?value . \
		OPTIONAL { ?obs rdfs:comment ?comment } \
	?indicatorURL skos:notation ?id ; \
				  ex:label ?indicatorLabel ; \
				  ex:description ?indicatorDescription . \
	VALUES ?countryURL {<http://data.landportal.info/geo/" + _options.iso3 + ">} \
} ORDER BY ?indicatorURL ?countryURL";
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
        var str = '<option data-localize="inputs.years">Select year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
            str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name="year"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="year"]').html(str);
    }
    function setOptionsPanels() {
        var str = '<option data-localize="inputs.panels">Select a panel...</option>';
        _data.panels[_options.year].forEach(function (item) {
            var selected = (_options.panel == item.id ? ' selected="selected"' : '');
            str += '<option value="' + item.id + '"'+selected+'>' + item.label + '</option>';
        });
        $(_options.target + ' select[name="panel"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="panel"]').html(str);
    }
    function setOptionsSubpanels() {
        var str = '<option data-localize="inputs.subpanels">Select a sub-panel...</option>';
        var panel = _data.panels[_options.year].filter(function(p) {
            return (p.id == _options.panel ? p : null);
        })[0];
        if (panel) {
            panel.subpanels.forEach(function (item) {
                var selected = (_options.subpanel == item.id ? ' selected="selected"' : '');
                str += '<option value="' + item.id + '"'+selected+'>' + item.label + '</option>';
            });
        }
        $(_options.target + ' select[name="subpanel"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="subpanel"]').html(str);
    }

    function updateInfo() {
            // SUCCESS
        var subpanel = _data.panels[_options.year]
                .filter(function (p) { return p.id == _options.panel; })[0]
                .subpanels.filter(function(s) { return s.id == _options.subpanel; })[0];
        //console.log('got values ', subpanel);
        // fill up some shit
        return LBVIS.getIndicatorInfo(subpanel.id).done(function () {
            _data.indicator = LBVIS.cache('info')[_options.subpanel][0];
            console.log(_data.series);
            var indi = _data.series.filter(function (s) {
                return s.id == _options.subpanel;// && s.year == _options.year;
            });
            console.log(_options.subpanel, indi);
            // Display anels
            var panelVal = '<div class="panel"><span class="value-'+indi[0].value.toLocaleLowerCase()+'">'+indi[0].value+'</span>'
                    + _data.indicator.description + '</div>';
            var panelInfo = '<div class="panel">'+indi[0].comment+'</div>';
            $(_options.targetGraph).html(panelVal + panelInfo);
        });
        //$(_options.targetGraph).html('hello VGGT');
    }
    
    function _bindUI () {
        $(_options.target).delegate("select", "change", function(e) {
            // there isn't really anything to 'prevent' here, this is a select...
            e.preventDefault();
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                _options.panel = null;
                _options.subpanel = null;
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
            // Load indicators
            _getStruct();//.done(function () {
            setOptionsYears();
            if (_options.year) {
                setOptionsPanels();
                if (_options.panel) {
                //     // Load values & set panels
                    _getValues().done(function () {
                        setOptionsSubpanels();
                        if (_options.subpanel)
                            updateInfo();
                    });
                }
            }
            _bindUI();
        }
    };
});
