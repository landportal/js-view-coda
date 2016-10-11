'use strict';

var lbvisRanking = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        target:         args.target || '#ranking',
        indicator:      args.indicator || 'WB-SP.POP.TOTL',
        expand:         args.expand || 5,
        expandThreshold:args.expandThreshold || 20,
        theme:          null // future
    };
    var _data = {
        values: []
    };

    // TODO: this is for all indicators, if a theme is provided, filter them
    var _setOptionsIndicators = function () {
        var el = $(_options.target + ' select[name="indicator"]');
        el.html('<option data-localize="inputs.sindicators">Select an indicator...</option>');
        var opts = LBVIS.generateOptions(LBVIS.cache('indicators'), _options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };
    var _setOptionsYears = function () {
        var str = '<option data-localize="inputs.years">Year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
	    str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name=year]').html(str);
	$(_options.target + ' select[name=year]').prop( "disabled", false );
    };
    var _setMetadata = function () {
        $('.metadata span').each(function (n) {
            var name = $(this).attr('name');
            switch (name) {
            case 'indicator':
                name = 'label';
            case 'dataset':
            case 'source':
                $(this).html(_data.indicator[name]);
                var p = $(this).parent();
                if (p[0].nodeName == 'A') p.attr('href', _data.indicator[name + 'SeeAlso']);
                break;
            case 'unit':
            case 'year':
            case 'description':
                $(this).html(_data.indicator[name]);
                break;
            default:
                console.log(this);
            }
            //console.log('done '+name, $(this));
        });
    };

    var _getIndicator = function () {
        var query = LBVIS.DATA.queries.indicatorValues(
            _options.indicator, _options.year
        );
        _data.values = [];
        //console.log('get indicator', _options, query);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            // set year in info
            $('.metadata [name="year"]').html('('+_options.year+')');
            data.results.bindings.forEach(function (item) {
                var ind = {};
                Object.keys(item).forEach(function (prop) { ind[prop] = item[prop].value; });
                _data.values.push(ind);
            });
        });
    };

    var _getIndicatorDetails = function () {
        return LBVIS.getIndicatorDetails(_options.indicator).done(function () {
            _data.indicator = LBVIS.cache('info')[_options.indicator][0];
            _data.years = LBVIS.cache('years')[_options.indicator];
            _options.year = Math.max.apply(Math, _data.years);
            _setMetadata();
            _setOptionsYears();
        });
    };

    var _bindUI = function () {
        $(_options.target).delegate("select", "change", function(e) {
            if (e.target.name == 'indicator') {
                _options.indicator = e.target.value;
                _getIndicatorDetails().done(function () {
                    _getIndicator().done(function () {
                        _draw();
                    });
                });
            }
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                _getIndicator().done(function () { _draw(); });
            }
        });
    };
    var _formatRow = function (ind, pos, length) {
        var country = LBV.countries().find(function (v) { return v.iso3 == ind.iso3; });
        var flag = '<span class="rank">' + (pos + 1) + '</span>',
            rank = '<span class="flag flag-' + ind.iso3 + '">' + ind.iso3 + '</span>';
        //console.log('Row : ', ind, country);
        var rowClass = (_data.values.length > _options.expandThreshold && pos >= _options.expand && pos + _options.expand < length ? ' class="hidden"' : '');
        return '<li'+rowClass+'><div class="col-xs-8">' + flag + rank + (country ? country.name : ind.iso3) + '</div>'
            + '<div class="value col-xs-4 text-right"'
            + (parseFloat(ind.value) && ind.value.indexOf('.') > -1 ? ' title="'+ind.value+'"' : '') + '>'
            + (parseFloat(ind.value) ? LBVIS.round(ind.value, 2) : ind.value)
            + '</div></li>';
    };
    var _expandRow = function () {
        return '<li class="hidden-print text-center expand"><a name="show">Expand</a><a name="hide" class="hidden">Hide</a></li>';
    };
    var _draw = function () {
        var max = Math.max.apply(Math, _data.values.map(function (v) { return v.value; }));
        var html = '<li><div class="col-xs-4">Country</div>'
                 + '<div class="col-xs-8 text-right">Value in '+_data.indicator.unit+'<br/>out of '+max+'</div></li>';
        // Quickly test data values to see if numeric (should be provided by indicator.hascodedvalue property?)
        // If NaN, reverse array
        if (!parseFloat(_data.values[0].value)) _data.values = _data.values.reverse();
        _data.values.forEach(function (ind, pos) {
            if (pos == _options.expand && _data.values.length > _options.expandThreshold) html += _expandRow();
            html += _formatRow(ind, pos, _data.values.length);
        });
        $(_options.target + '-wrapper').html(html);
	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
        $(_options.target + '-wrapper .expand a').on('click', function(e) {
            e.preventDefault();
            //console.log('click expand', e);
            $(e.target.parentElement.children).toggleClass('hidden');
            if (e.target.name == 'show') {
                $(_options.target + '-wrapper li').removeClass('hidden');
            } else {
                $(_options.target + '-wrapper li:nth-child(n+8):nth-last-child(n+6)').addClass('hidden');
            }
        });
    };

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            _setOptionsIndicators();
            if (_options.indicator) {
                _getIndicatorDetails().done(function () {
                    _getIndicator().done(function () {
                        _draw();
                    });
                });
            }
            _bindUI();
        }
    };
});
