'use strict';

var lbvisTable = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#table',
        iso3:           null,
        indicators:     [],
        selected:       null,
        year:           null,
        allowAdd:       null
    };
    $.extend(true, _options, args); // true = deep merge

    var _data = {
        defers: [],
        years: [],
        indicators: [],
        indicatorValues: [],
        series: {},
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
                _data.series[ind.id] = ind;
//                console.log(ind);
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
        var str = '<option value>Select a year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
	    str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + '-form select[name="year"]').html(str);
	$(_options.target + '-form select[name="year"]').prop( "disabled", false );
    };
    var _setOptionsIndicators = function () {
        var el = $(_options.target + '-form select[name="indicator"]');
        el.html('<option value>Select an indicator...</option>');
        if (_options.iso3) {
            _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3];
        } else {
            _data.indicators = LBVIS.cache('indicators');
        }
        var opts = LBVIS.indicatorsSelect(_options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    var _header = function () {
        var cols;
	if (_options.iso3) {
	    cols = ['indicator', 'year', 'value'];//, 'unit', 'dataset', 'source'];
            if (_options.allowAdd) {
                cols.push('Remove');
            }
	} else {
	    cols = ['Indicator', 'First, Last years<br/>Coverage', 'Countries / Observations<br/>Missing values', 'Min/Max values']
            if (_options.allowAdd) {
                cols.push('Remove');
            }
	}
        return cols;
    }
    var _columns = function () {
        var cols;
	if (_options.iso3) {
	    cols = ['indicator', 'year', 'value'];//, 'unit', 'dataset', 'source'];
	} else {
	    cols = [
                ['indicator'], //, ' (', 'unit', ')', '<br/>', 'dataset', ' (', 'source', ')'],
                ['minYear', '-', 'maxYear', '<br/>', 'nYears', '&nbsp;', 'years covered'],
                ['nCountryWithValue', '/', 'nObs', '<br/>', 'perMissingValue'],
                ['minValue' , '/', 'maxValue']];
	}
        return cols;
    }

    var _formatCol = function (col, ind) {
        if (! ind[col]) {
            return col;
        }
        var str = '';
        if (col == 'indicator' && _options.cache[ind.id]) {
            str = _options.cache[ind.id].render;
            //console.log(ind, _options.cache[ind.id]);
        } else {
            str = ind[col];
        }
        // TODO : use cache render (from Drupal)
        // if (ind[col+'SeeAlso']) {
        //     str = '<a href="'+ind[col+'SeeAlso']+'" target="_blank">' + ind[col] + '</a>';
        // }
        // if (ind[col+'Description']) {
        //     var desc = $("<div/>").html(ind[col+'Description']).text();
        //     //console.log('description', desc);
        //     str += ' <span class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="top" title="' + desc + '"></span>';
        // }
        return '<span class="' +  col + '">' + str + '</span>';
    };

    var _formatRow = function (ind) {
        var cols = _columns();
        var row = '<tr id=' + _options.target + '-' + ind['id'] + '">';
        cols.forEach(function (col) {
            var str = '';
            if (typeof col === 'string') {
                str = _formatCol(col, ind);
            } else {
                col.forEach(function (cc) {
                    str += _formatCol(cc, ind);
                });
            }
            row += '<td>' + str + '</td>';
        });
        if (_options.allowAdd) {
            // Add delete column 
            row += '<td class="delete"><a href="#"><span class="glyphicon glyphicon-trash text-danger"></span></a></td></tr>';
        }
        return row;
    };
    var _draw = function () {
        var thead = '';
        var row = '<tr>';
        var cols = _header();
        cols.forEach(function (col) {
            var str = '';
            if (typeof col === 'string') {
                str = col;
            } else {
                col.forEach(function (cc) {
                    str += cc;
                });
            }
            row += '<th>' + str + '</th>';
        });
        $(_options.target + ' table thead').html(row);

        var tbody = '';
        _data.indicatorValues.forEach(function (ind) {
            tbody += _formatRow(ind);
        });
        $(_options.target + ' table tbody').html(tbody);
	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
    };

    var _bindUI = function () {
        $(_options.target + '-form').delegate("select", "change", function(e) {
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
        $(_options.target + '-form').delegate(' [name="add"]', "click", function(e) {
	    e.preventDefault();
            // TODO: add loading feedback
            _getIndicator(_options.selected, _options.year).done(function () {
                //console.log('add', _options, _data);
                var tr = _formatRow(_data.series[_options.selected]);
                $(_options.target + " table tbody").append(tr);
            });
        });

        // Delete row
        $(_options.target).delegate("td.delete a","click", function(e) {
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
