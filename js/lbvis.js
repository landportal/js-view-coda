// Main LB Visualization 
'use strict';

var lbvis = (function (args = {}) {

    var options = {
        lod: args.lod_url || 'data.landportal.info'
    };
    var lod = {
        country_url: options.lod + 'geo/'
    };
    return {
        // Public vars
        ISO3: args.iso3 || 'VNM',
        type: args.type || 'table',
        options: options,
        lod: lod,
        // Shared data / sort of internal cache
        indicator_info: [],
        
        
        // Public methods
        init: function () {
            console.log('init app');
        }
    };



});

// TODO : cleanup globals
var years_indicator_country = new Array();
var current_indicator_name = "Rural population"; //Rural population
var indicator_info = new Array();
var indicators = new Array();
var info_all_indicators = new Array();
var info_countries_per_indicator = new Array();
var info_country_indicators = new Array();
var selected_indicator_id = "Indicator not set";
var countrieNameIso3 = [];
var global_select_indicators = '<option value="0" data-localize="inputs.sindicator">Select indicator ...</option>';

function getIndicatorInfo(indicator) {
    // WTF?
    if(LBV.indicator_info.length>0){
	LBV.indicator_info.splice(0,LBV.indicator_info.length);
    }

    var query_get_indicator_info_URL = LBD.sparqlURL(LBD.query_get_indicator_info(indicator));
    console.log('getIndicatorInfo', indicator, query_get_indicator_info_URL);
    $.getJSON(query_get_indicator_info_URL, function (data) {
	for(var i=0; i < data.results.bindings.length; i++){
	    LBV.indicator_info.push({
		'name':data.results.bindings[i].indicatorLabel.value,
		'desc':data.results.bindings[i].indicatorDescription.value,
		'unit':data.results.bindings[i].indicatorUnit.value,
		'datasetURL':data.results.bindings[i].datasetURL.value,
		'datasetLabel':data.results.bindings[i].datasetLabel.value,
		'sourceOrgURL':data.results.bindings[i].sourceOrgURL.value,
		'sourceOrgLabel':data.results.bindings[i].sourceOrgLabel.value,
	    });
	}
        console.log(LBV.indicator_info);
    });
}


// TODO: global: countrieNameIso3
function loadCountriesIso3() {
    var query_countries_iso3_URL = LBD.sparqlURL(LBD.queries.countries_iso3);
    $.getJSON(query_countries_iso3_URL, function (data) {
	for(var i=0; i < data.results.bindings.length; i++){
	    countrieNameIso3.push({'name':data.results.bindings[i].countryLabel.value,'iso3':data.results.bindings[i].countryISO3.value,'url':data.results.bindings[i].countryURL.value});
	}
    });
}

// TODO globals:
// info_country_indicators
// global_select_indicators
// FIX: doing ui stuff here? / split up
function set_country_indicators() {
    var query_country_indicators_URL = LBD.sparqlURL(LBD.queries.country_indicators);
    console.log(query_country_indicators_URL);
    $.getJSON(query_country_indicators_URL, function (data) {
	for(var i=0; i < data.results.bindings.length; i++){
	    var indicator = data.results.bindings[i].indicatorLabel.value;
	    var searchfor = 'wb-lgaf';
	    if(indicator.toLowerCase().indexOf(searchfor) === -1){
		info_country_indicators.push({'name':data.results.bindings[i].indicatorLabel.value,'URL':data.results.bindings[i].indicatorURL.value});
                // That's likely wrong, the right way is to bind UI components
                //  to data models so they're always in sync
                // This should also probably be handled by style/UI
		global_select_indicators += '<option value="'+data.results.bindings[i].indicatorURL.value+'">'+truncateString(data.results.bindings[i].indicatorLabel.value, 40, ' ', '...')+'</option>';
	    }
	}
        // TODO: FIX / WTF
	//Cargamos los indicadores (TODOS CUIDADO)
	var $selIndicator = $(".sindicator, .msindicator");
	$selIndicator.html('');
	$selIndicator.append(global_select_indicators);
    });
}