lbvis.dl = (function (args) {
    var LBVIS = args.vis;
    _options = {
        indicator: args.indicator,
        year: args.year         || null,
        target: args.target     || '#download'
    };
    _el = {
        year: $(_options.target + ' select[name="year"]')
    };
    _data = {
        query: null,
        url: null,
        years: []
    };
    _url = function (type) {
        return LBVIS.DATA.sparqlURL(_data.query).replace('=json', '='+type);
    };
    _updateBtn = function () {
        var btn = $(_options.target + ' a[class~="btn"]');
        btn.each(function (k, v) {
            //console.log(btn[k]);
            $(btn[k]).attr('disabled', false);
            btn[k].href = _url(v.name);
        });
    };

    // Init
    LBVIS.getIndicatorDetails(_options.indicator).done(function () {
        //LBVIS.debug(); 
        LBVIS.setMetadata('.metadata span', _options.indicator);
      
        _data.years = LBV.cache('years')[_options.indicator];
        if (!_options.year) {
            _options.year = Math.max.apply(Math, _data.years);
            $(_options.target + ' .metadata span[name="year"]').html('(' + _options.year + ')');
        }
        _el.year.prop('disabled', false);
        _el.year.html('<option data-localize="inputs.syear">Select a year...</option>' + LBV.generateOptions(_data.years, _options.year));
        _data.query = LBVIS.DATA.queries.indicatorValues(_options.indicator, _options.year);
        _updateBtn();
    });
    // bindUI
    $(_options.target).delegate('select[name="year"]', "change", function(e) {
        _options.year = e.target.value;
        _data.query = LBVIS.DATA.queries.indicatorValues(
            _options.indicator, _options.year
        );
        _updateBtn();
    });
    $(_options.target).delegate('input[type="checkbox"]', "change", function(e) {
        _el.year.attr('disabled', e.target.checked);
        _options.year = (e.target.checked ? null : _el.year.val());
        _data.query = LBVIS.DATA.queries.indicatorValues(
            _options.indicator, _options.year
        );
        _updateBtn();
    });
    // Public methods
    return {
        debug: function () { console.log(_options, _data); },
    };
});


jQuery(document).ready(function () {
    LBV.ready().done(function () {
        var defaultParams = {
            vis: LBV,
            indicator: "WB-SP.RUR.TOTL.ZS"
        };
        dl = new lbvis.dl(defaultParams);


    });
});
