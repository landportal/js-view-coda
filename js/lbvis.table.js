'use strict';

var lbvisTable = (function (args) {
    var LBVIS = args.vis;
    var _options = {
        target:         args.target     || '#table-indicators',
        iso3:           args.iso3       || null,
        indicators:     args.indicators || [], // Default indicators for the table
        selected: null,
        year: null
    };
    var _data = {
        defers: [],
        years: [],
        indicators: [],
        indicatorValues: []
    };
    // Indicators are now loaded 1 by 1
    var _getIndicators = function () {
        _data.defers = [];
        _options.indicators.forEach(function (item) {
            _data.defers.push(_getIndicator(item));
        });
        return $.when.apply($, _data.defers);
    };
    var _getIndicator = function (id) {
        var query;
        if (_options.iso3) {
            query = LBVIS.DATA.queries.countryIndicatorValues(
                _options.iso3, id, _options.year
            );
        } else {
            query = LBVIS.DATA.queries.indicatorDetails(id);
        }
        //console.log('get indicator', id, _options.year, query);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            data.results.bindings.forEach(function (item) {
                var ind = {};
                Object.keys(item).forEach(function (prop) { ind[prop] = item[prop].value; });
                _data.indicatorValues.push(ind);
            });
        });
    };
    var _getIndicatorYears = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.indicatorYears(_options.selected, _options.iso3));
        return $.getJSON(query_url, function (data) {
            _data.years = [];
	    data.results.bindings.forEach(function (item) {
                _data.years.push(item.year.value);
            });
            _setOptionsYears();
        });
    };

    var _setOptionsYears = function () {
        var str = '<option data-localize="inputs.years">Select year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
	    str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name=year]').html(str);
	$(_options.target + ' select[name=year]').prop( "disabled", false );
    };
    var _setOptionsIndicators = function () {
        var el = $(_options.target + ' select[name="indicator"]');
        el.html('<option data-localize="inputs.sindicators">Select an indicator...</option>');
        if (_options.iso3) {
            _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3];
        } else {
            _data.indicators = LBVIS.cache('indicators');
        }
        var opts = LBVIS.generateOptions(_data.indicators, _options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    var _formatCol = function (col, ind) {
        var tdclass = '';
        var str = ind[col];
        if (ind[col+'SeeAlso']) {
            str = '<a href="'+ind[col+'SeeAlso']+'" target="_blank">' + ind[col] + '</a>';
        }
        if (ind[col+'Description']) {
            var desc = $("<div/>").html(ind[col+'Description']).text();
            //console.log('description', desc);
            str += ' <span class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="top" title="' + desc + '"></span>';
        }
        return '<td class="lb-'+ col + tdclass +'" data-'+col+'="'+ind[col]+'">'+str+'</td>';
    };
    var _formatRow = function (ind) {
        var cols;
		if (_options.iso3) {
			cols = ['indicator', 'year', 'value', 'unit', 'dataset', 'source'];
		} else {
			cols = ['indicator', 'minYear', 'maxYear', 'unit', 'nObs', 'nYears', 'nCountryWithValue', 'perMissingValue', 'minValue' , 'maxValue', 'dataset', 'source'];
		}
        var row = '<tr>';
        cols.forEach(function (col) {
            row += _formatCol(col, ind);
        });
        // Add delete column 
        row += '<td class="text-center"><a href="#" class="delete"><span class="glyphicon glyphicon-trash text-danger"></span></a></td></tr>';
        return row;
    };
    var _draw = function () {
        var tbody = '';
        _data.indicatorValues.forEach(function (ind) {
            tbody += _formatRow(ind);
        });
        var t = $(_options.target + ' table tbody');
        //console.log('draw', t);
        t.html(tbody);
	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
    };

    var _bindUI = function () {
        $(_options.target).delegate("select", "change", function(e) {
            if (e.target.name == 'indicator') {
                _options.selected = e.target.value;
                _getIndicatorYears();
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
            _getIndicator(_options.selected, _options.year).done(function () {
                //console.log('add', _options, _data);
                _draw();
            });
        });
        // Delete row
        $(_options.target).delegate("td a.delete","click", function(e) {
	    e.preventDefault();
	    $(this).parents('tr').remove().fadeOut("fast");
        });
    };

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            LBVIS.getIndicators(_options.iso3).done(function () {
                _setOptionsIndicators();
            });
            //console.log('Table indicators', _options, _data);
            if (_options.indicators.length) {
                $(_options.target + ' .loading').removeClass('hidden');
                _getIndicators().done(function () {
                    $(_options.target + ' .loading').addClass('hidden');
                    _draw();
                });
            }
            _bindUI();
        }
    };
});
