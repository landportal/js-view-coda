'use strict';

var lbvisT = (function (args = {}) {
    return {
        indicators: [],
        current_indicator: {},
        selected_indicator: args.indicator || null,
        selected_year: args.year || 2011
    };
});

// var info_indicator_country = [];
// var default_table_indicators = [];

// Load and display 'default' indicators...
function loadDefaultTableIndicators() {
    var query_url = LBD.sparqlURL(LBD.query_default_table_indicators(LBT.indicadors));
    $.getJSON(query_url, function (data) {
	for(var j=0;j<data.results.bindings.length;j++){
            // FIX: This is mad / directly use original keys
	    var newIndicator = {};
	    for(var i=0;i<data.head.vars.length;i++){
		var item_type = data.head.vars[i];
		switch(item_type){
		case "obs":
		    break;
		case "indicatorURL":
		    newIndicator.url = data.results.bindings[j][item_type].value;
		    break;
		case "indicatorLabel":
		    newIndicator.name = data.results.bindings[j][item_type].value;
		    break;
		case "indicatorDescription":
                    newIndicator.description = data.results.bindings[j][item_type].value;
		    break;
		case "year":
		    newIndicator.year = data.results.bindings[j][item_type].value;
		    break;
		case "value":
		    newIndicator.value = data.results.bindings[j][item_type].value;
		    break;
		case "unitLabel":
		    newIndicator.unit_label = data.results.bindings[j][item_type].value;
		    break;
		case "datasetURL":
		    newIndicator.dataset_URL = data.results.bindings[j][item_type].value;
		    break;
		case "datasetLabel":
		    newIndicator.dataset_label = data.results.bindings[j][item_type].value;
		    break;
		case "sourceOrgURL":
		    newIndicator.source_URL = data.results.bindings[j][item_type].value;
		    break;
		case "sourceOrgLabel":
		    newIndicator.source_label = data.results.bindings[j][item_type].value;
		    break;
		default:
		    break;
		}
	    }
	    LBT.indicators.push(newIndicator);
	}

	$("table#tindicators tbody").html("");
	$.each(LBT.indicators, function( i, val ) {
	    var row = ' <tr>\
                <td class="t-td" data-id="'+LBT.indicators[i].url+'"><a href="'+LBT.indicators[i].url+'" target="_blank">'+LBT.indicators[i].name+'</a> <span class="info-bubble txt-s fright" data-toggle="tooltip" data-placement="top" title="'+LBT.indicators[i].description+'">i</span></td>\
                <td class="t-td txt-c year" data-year="'+LBT.indicators[i].year+'">'+LBT.indicators[i].year+'</td>\
                <td class="t-td txt-ar">'+LBT.indicators[i].value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</td>\
                <td class="t-td">'+LBT.indicators[i].unit_label+'</td>\
                <td class="t-td"><a href="'+LBT.indicators[i].dataset_URL+'" target="_blank">'+LBT.indicators[i].dataset_label+'</a> (<a href="'+LBT.indicators[i].source_URL+'" target="_blank">'+LBT.indicators[i].source_label+'</a>)</td>\
                <td class="t-td txt-c"><a href="#" class="r-row del-row" data-ord=""><img src="img/ico-trash.svg" class="c-obj"></a></td>\
            </tr>';
            $("table#tindicators tbody").append(row);
	});
	$(function () {
	    $('[data-toggle="tooltip"]').tooltip();
	});
    });
}

function loadYearsIndicatorCountry(){
    var years_indicator_country = [];
    // while(years_indicator_country.length > 0) {
    //     years_indicator_country.pop();
    // }
    var query_url = LBD.sparqlURL(LBD.query_years_indicator_country(LBT.selected_indicator));
    $.getJSON(query_url, function (data) {
	for(var i=0; i < data.results.bindings.length; i++){
	    years_indicator_country.push(data.results.bindings[i].year.value);
	}

	var iop = '<option value="0" data-localize="inputs.syear">Select year ...</option>';
	$.each(years_indicator_country, function( i, val ) {
	    iop += '<option value="'+val+'">'+val+'</option>';
	    //console.log(iop);
	});
	$("#isyear").append(iop);
	if(iop!="") {
	    $("#isyear").removeClass("cinput-disabled");
	    $("#isyear").prop( "disabled", false );
	}
    });
}



function loadCountryIndicatorInfo(){
    var info_indicator_country = [];

    var query_url = LBD.sparqlURL(LBD.query_info_indicator_country_year(
        LBT.selected_indicator, LBT.selected_year
    ));
    $.getJSON(query_url, function (data) {
	for(var i=0; i < data.results.bindings.length; i++){
	    info_indicator_country.push(LBT.selected_year);
	    info_indicator_country.push(data.results.bindings[i].datasetLabel.value);
	    info_indicator_country.push(data.results.bindings[i].value.value);
	    info_indicator_country.push(data.results.bindings[i].unitLabel.value);
	    info_indicator_country.push(data.results.bindings[i].sourceOrgLabel.value);
	    info_indicator_country.push(data.results.bindings[i].datasetURL.value);
	    info_indicator_country.push(data.results.bindings[i].sourceOrgURL.value);
	    info_indicator_country.push(data.results.bindings[i].indicatorDescription.value);
	    
	}
        console.log(LBT.selected_indicator, LBT.selected_year, info_indicator_country);
	var addrow = '<tr>\
	    <td class="t-td" data-id="'+LBT.current_indicator.id+'"><a href="'+LBT.current_indicator.id+'" target="_blank">'+LBT.current_indicator.name+'</a> <span class="info-bubble txt-s fright" data-toggle="tooltip" data-placement="top" title="'+info_indicator_country["7"]+'">i</span></td>\
	    <td class="t-td txt-c year" data-year="'+info_indicator_country["1"]+'">'+info_indicator_country["1"]+'</td>\
	    <td class="t-td txt-ar">'+info_indicator_country["2"].replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</td>\
	    <td class="t-td">'+info_indicator_country["3"]+'</td>\
	    <td class="t-td"><a href="'+info_indicator_country["5"]+'" target="_blank">'+info_indicator_country["0"]+'</a> (<a href="'+info_indicator_country["6"]+'" target="_blank">'+info_indicator_country["4"]+'</a>)</td>\
	    <td class="t-td txt-c"><a href="#" class="r-row del-row" data-ord=""><img src="img/ico-trash.svg" class="c-obj"></a></td>\
	</tr>';
	$("table#tindicators tbody").append(addrow);

	$(function () {
	    $('[data-toggle="tooltip"]').tooltip();
	});

    });
}



//###EVENTOS####//
//Borramos item de la tabla indicadores
$(document).ready(function() {

    $(document).delegate(".del-row","click", function(e) {
	e.preventDefault();
	$(this).parent().parent().remove().fadeOut("fast");
    });

    //Agregamos anos
    $(document).delegate("#isindicators", "change", function(){
	if($(this).val()!=0){
	    $("#isyear").html("");
	    $("#isyear").removeClass("cinput-disabled");
	    $("#isyear").prop( "disabled", false );
	    LBT.current_indicator.name = $(this).find("option:selected").text();
	    LBT.selected_indicator = $(this).val();
	    //setDataURLs();
	    loadYearsIndicatorCountry();
	}else{
	    $("#isyear").val(0);
	    $("#isyear").addClass("cinput-disabled");
	    $("#isyear").prop( "disabled", true );
	}

    });

    $(document).delegate("#isyear", "change", function(){
	LBT.selected_indicator = $("#isindicators").val();
    });

    //Agregamos indicador
    $(document).delegate(".cbtn-iadd-indicator", "click", function(e){	
	e.preventDefault();

	if(!$("#isyear").is('.cinput-disabled') && $("#isyear").val()!=0){

	    var exist = 0;
	    var indicatorsel = $("#isindicators").find("option:selected").val();
	    LBT.current_indicator.id = $("#isindicators").find("option:selected").val();
	    var yearsel = parseInt($("#isyear").find("option:selected").val());
	    //console.log(indicatorsel+"-");
	    $("#tindicators tbody tr").each(function(){
		var indicatorTable = $(this).find("td").attr("data-id");
		var yearTable = parseInt($(this).find("td.year").text());
		//console.log(yearsel+':'+indicatorsel+" - "+yearTable+':'+indicatorTable);
		if (indicatorTable == indicatorsel && yearTable == yearsel) {
		    exist ++;
		}
	    });

	    if(exist >0){
		alert("This indicator and year was added");
		return false;
	    }

	    //Get data	
	    LBT.selected_year = $("#isyear").val();
	    //console.log(table_selected_year);
	    //console.log($("#isyear").val());
	    //setDataURLs();
	    loadCountryIndicatorInfo();
	}else{
	    alert("Select indicator and year");
	}
        return true;
    });
    
});
