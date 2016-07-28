'use strict';

var lbvisTable = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        target:   args.target || '#table-indicators',
        indicators: args.indicators || ["WB-SP.POP.TOTL", "WB-SP.RUR.TOTL.ZS", "WB-NY.GDP.PCAP.PP.KD", "FAO-6601-5110", "FAO-23045-6083", "DP-MOD-O-F", "DP-MOD-O-N", "FAO-LG.1FB"],
        selected: null,
        year: null
    };
    var _data = {
        years: [],
        indicators: []
    };
    // TODO: Borken all indicators hardcoded in query / awful performance / cleanup use options.indicators for default
    var _getIndicators = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.query_default_table_indicators(_options.indicators));
        return $.getJSON(query_url, function (data) {
            data.results.bindings.forEach(function (item) {
                var ind = {};
                for (var prop in item) {
                    ind[prop] = item[prop].value;
                }
                _data.indicators.push(ind);
            });
            //console.log('Table', _options, data);
        });
    };
    var _getIndicator = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.query_info_indicator_country_year(
            _options.selected, _options.year
        ));
        return $.getJSON(query_url, function (data) {
            data.results.bindings.forEach(function (item) {
                var ind = {'year': _options.year};
                for (var prop in item) {
                    ind[prop] = item[prop].value;
                }
                _data.indicators.push(ind);
            });
        });
    };
    var _getYearsIndicator = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.query_years_indicator_country(_options.selected));
        return $.getJSON(query_url, function (data) {
            _data.years = [];
	    data.results.bindings.forEach(function (item) {
                _data.years.push(item.year.value);
            });
            setOptionsYears();
        });
    };
    function setOptionsYears() {
        var str = '<option data-localize="inputs.years">Select year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
	    str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name=year]').html(str);
	$(_options.target + ' select[name=year]').prop( "disabled", false );
    };
    

    var _formatCol = function (col, ind) {
        var str = '',
            tdclass = '';
        switch(col) {
        // case 'value':
        //     tdclass = ' txt-ar';
            // In original code, WTF is it replacing?...
            // value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            // break;
        //case 'dataset':
            // TODO: re-merge with sourceOrg column?
        default:
            str = ind[col];
            if (ind[col+'URL']) {
                str = '<a href="'+ind[col+'URL']+'" target="_blank">' + ind[col] + '</a>';
            }
            if (ind[col+'Description']) {
                str += ' <span class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="top" title="' + ind[col+'Description'] + '"></span>';
            }
            break;
        }
        return '<td class="'+ col + tdclass +'" data-'+col+'="'+ind[col]+'">'+str+'</td>';
    };
    var _formatRow = function (ind) {
        var cols = ['indicator', 'year', 'value', 'unit', 'dataset', 'sourceOrg'];
        var row = '<tr>';
            cols.forEach(function (col) {
                row += _formatCol(col, ind);
            });
        // Add delete column 
        row += '<td><a href="#" class="delete"><img src="img/ico-trash.svg"></a></td></tr>';
        return row;
    };
    var _draw = function () {
        var tbody = '';
        _data.indicators.forEach(function (ind) {
            tbody += _formatRow(ind);
        });
        $(_options.target + ' table tbody').html(tbody);
	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
    };

    var _bindUI = function () {
        $(_options.target).delegate("select", "change", function(e) {
            if (e.target.name == 'indicator') {
                _options.selected = e.target.value;
                _getYearsIndicator();
            }
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                //_getIndicator().done(function () { _draw(); });
            }
        });
        // Add row
        $(_options.target).delegate('form [name="add"]', "click", function(e) {
	    e.preventDefault();
            // here we could also just add a row and call tooltip again...
            _getIndicator().done(function () { _draw(); });
        });
        // Delete row
        $(_options.target).delegate("td a.delete","click", function(e) {
	    e.preventDefault();
            console.log(e);
	    $(this).parents('tr').remove().fadeOut("fast");
        });
    };
    
    return {
        init: function () {
            LBVIS.defers.indicators.done(function () {
                var opts = LBVIS.getOptionsIndicators(_options.selected);
                $(_options.target + ' select[name="indicator"]').html(opts);
            });
            $(_options.target + ' .loading').removeClass('hidden');
            _getIndicators().done(function () {
                $(_options.target + ' .loading').addClass('hidden');
                _draw();
            });
            _bindUI();
        }
    };
});
