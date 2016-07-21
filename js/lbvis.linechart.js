'use strict';

var lbvisLC = (function (args = {}) {
    return {
        series_color: args.colors || ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
        selected_indicator: args.indicator || 'WB-SP.RUR.TOTL.ZS',
        compared_countries: [args.iso3],
        range_years: []
    };
});


    Array.prototype.contains = function(obj) {
        var i = this.length;
        while (i--) {
	    if (this[i] == obj) {
	        return true;
	    }
        }
        return false;
    };

    //var line_selected_indicator_URL = 'http://data.landportal.info/indicator/WB-SP.RUR.TOTL.ZS'; 
    // var current_compared_countries_iso3 = [current_country_iso3];
    // var current_range_years_selected = [];


    function loadLineDefaults() {
	//setDataURLs();
	loadCountriesPerIndicators();
	loadYearsIndicatorCountryCompare();
	//LBLC.range_years.length=0; WTF?
	$("#lsindicador").find("option[value='"+LBLC.selected_indicator+"']").prop("selected",true);
	setTimeout(function(){
	    $("#lscountry").find("option[value='"+LBV.ISO3+"']").prop("selected",true);
	    var date_ini = years_indicator_country["0"];
	    var date_end = years_indicator_country[years_indicator_country.length - 1];
	    LBLC.range_years.push(parseInt(date_end),parseInt(date_ini));
	    loadLineChart();
	},600);

    }

    function loadYearsIndicatorCountryCompare(){
	// WTF? just empty the fucking array with [];
	// while(years_indicator_country.length > 0) {
	//     years_indicator_country.pop();
	// }
        years_indicator_country = [];

        // indicator? LBLV.selected_indicator?
        var query_url = LBD.sparqlURL(LBD.query_years_indicator_country(LBLC.selected_indicator));
        console.log('LBLC years indicator country', query_url);
	$.getJSON(query_url, function (data) {
	    for(var i=0; i < data.results.bindings.length; i++){
		years_indicator_country.push(data.results.bindings[i].year.value);
	    }
	    
	    var iop; //'<option value="0" data-localize="inputs.syear">Select year ...</option>';
	    $.each(years_indicator_country, function( i, val ) {
		iop += '<option value="'+val+'">'+val+'</option>';
		//console.log(iop);
	    });
	    $("#lsperiod_from").html('<option value="0" data-localize="inputs.speriodfrom">From year ...</option>');
	    $("#lsperiod_to").html('<option value="0" data-localize="inputs.speriodto">To year ...</option>');
	    $("#lsperiod_from, #lsperiod_to").append(iop);
	});
    }

    function loadCountriesPerIndicators(){

        var query_url = LBD.sparqlURL(LBD.query_years_indicator_country(LBLC.selected_indicator));

	//Vaciamos el array
	info_countries_per_indicator.length = 0;

	$.getJSON(query_url, function (data) {
            // TODO : FIX no UI here...
	    var iop = '<option value="0" data-localize="inputs.scountry">Select country ...</option>';
	    for(var i=0; i < data.results.bindings.length; i++){
		iop += '<option value="'+data.results.bindings[i].countryISO3.value+'">'+data.results.bindings[i].countryLabel.value+'</option>';
		info_countries_per_indicator.push(data.results.bindings[i].countryISO3.value);
		info_countries_per_indicator.push(data.results.bindings[i].countryLabel.value);
	    }
	    $("#lscountry").append(iop);
	    if(iop!="") {
		$("#lscountry").removeClass("cinput-disabled");
		$("#lscountry").prop( "disabled", false );
	    }

	});

    }

    function loadLineChart(){
	$("#igraphics .pos_loader_data").removeClass("hddn");
	
	// if (table_selected_indicator == "") {
	//     indicator_id_more_info = LBD.lod.indicator + LBLC.selected_indicator;
	// }else{
	//     indicator_id_more_info = table_selected_indicator;
	// }
	//setDataURLs();
	getIndicatorInfo(LBLC.selected_indicator);
        var query_line_URL = LBD.sparqlURL(LBD.query_years_indicator_country(
            LBLC.selected_indicator, LBLC.compared_countries
        ));

	$.getJSON(query_line_URL, function (data) {

            console.log('LBLC ', LBLC, LBV.indicator_info[0]);
            
	    var serie_categories = new Array();
	    var serie_values = new Array();
	    var serie_value = new Object();
	    var first_year = LBLC.range_years[0];
	    var last_year = LBLC.range_years[1];
	    var num_years = last_year - first_year + 1;
	    var _iso3;
	    var _value;
	    var _year;
	    var _source;
	    var _sourcen;

	    for(var i=0; i<num_years; i++){
		serie_categories[i] = first_year + i;
	    }
	    //console.log(serie_categories);
	    for(var j=0; j<LBLC.compared_countries.length; j++) {
		//Para cada Pais, inicializo la serie a null, recorro valores y si pertenecen al pais y estan dentro del rango de anos correspondiente, pongo el valor en su lugar.
		serie_value.name = setNameCountry(LBLC.compared_countries[j]);
		serie_value.niso3 = LBLC.compared_countries[j];
		serie_value.data = new Array();
                 // TODO / FIX? What happen here when you run out of series_color?
		serie_value.color = LBLC.series_color[j];
                for(var k=0; k<num_years; k++){
		    //inicializo todos los valores de esta serie a null
		    serie_value.data[k] = null;
		}
		for(var h=0; h<data.results.bindings.length; h++){
		    _iso3 = data.results.bindings[h].countryISO3.value; 
		    _year = parseFloat(data.results.bindings[h].year.value);

		    if((_iso3 == serie_value.niso3)&&(_year <= last_year)&&(_year >= first_year)){
			serie_value.data[_year - first_year] = parseFloat(data.results.bindings[h].value.value);
		    }
		}
		//console.log("serie_value " + j + " =");
		//console.log(serie_value);
		serie_values[j] = serie_value;
		serie_value = {};
	    }

	    var chart_type = "column";
	    if(serie_values[0].data.length != 1) chart_type = "line";

	    var lineChart_init;
	    var $divIgraphics = $('#wrapper-igraphics');
	    var CharLineOp = {
		chart: {
		    type: chart_type,
		    backgroundColor: "transparent",
		    renderTo: $divIgraphics[0],
		},

		credits:{
		    enabled:false
		},

		title: {
		    text: '<span class="m-s-top m-xs-bottom txt-sh-dark txt-l">'+LBV.indicator_info[0].name+'</span>',
		    useHTML: true,
		    x: -20 //center
		},
		subtitle: {
		    text: '<a href="'+LBV.indicator_info["0"].datasetURL+'" target="_blank" class="txt-l">'+LBV.indicator_info["0"].datasetLabel+'</a> (<a href="'+LBV.indicator_info["0"].sourceOrgURL+'" target="_blank" class="txt-l">'+LBV.indicator_info["0"].sourceOrgLabel+'</a>)',
		    useHTML: true,
		    x: -20
		},
		xAxis: {
		    categories: serie_categories
		},
		yAxis: {
		    title: {
			text: current_indicator_name
		    }
		    // plotLines: [{
		    //     value: 0,
		    //     width: 1,
		    //     color: '#A3C642'
		    // }]
		},
		tooltip: {
		    //valueSuffix: '?C'
		},
		legend: {
		    //layout: 'vertical',
		    align: 'center',
		    verticalAlign: 'bottom',
		    borderWidth: 0
		},
		series: serie_values
	    };

	    lineChart_init = new Highcharts.Chart(CharLineOp);
	    $("#igraphics .pos_loader_data").addClass("hddn");
	});
    }





// UI bindings

$(document).ready(function() {



    //Seccion compare
    $(document).delegate("#lsindicador", "change", function(){
	if($(this).val()!=0){
	    $("#lscountry").html("");
	    $("#lscountry").removeClass("cinput-disabled");
	    $("#lscountry").prop( "disabled", false );

	    $("#lscountry").val(0);
	    
	    $(".speriod").val(0);
	    $(".speriod").addClass("cinput-disabled");
	    $(".speriod").prop( "disabled", true );

	    //table_selected_indicator = $(this).val();
	    LBLC.selected_indicator = $(this).val();
	    //setDataURLs();
	    loadCountriesPerIndicators();
	    loadYearsIndicatorCountryCompare();

	}else{
	    $("#lscountry").val(0);
	    $("#lscountry").addClass("cinput-disabled");
	    $("#lscountry").prop( "disabled", true );

	    $(".speriod").val(0);
	    $(".speriod").addClass("cinput-disabled");
	    $(".speriod").prop( "disabled", true );

	}
    });



    $(document).delegate("#lscountry", "change", function(){

	if($(this).val()!=0){
	    $(".speriod").prop( "disabled", false );
	    $(".speriod").removeClass("cinput-disabled");
	}else{
	    $(".speriod").val(0);
	    $(".speriod").prop( "disabled", true );
	    $(".speriod").addClass("cinput-disabled");
	}
    });


    
    //Agregamos el comparador si todos los campos estan correctamente rellenados.
    $(document).delegate(".cbtn-ladd-compare", "click", function(e){
	e.preventDefault();

	if($("#lsperiod_from").val()!=0 && $("#lsperiod_to").val()!=0) {
	    //console.log("ok");
	    var newCountry = $("#lscountry").val();
	    var dateFrom = parseInt($("#lsperiod_from").val());
	    var dateTo = parseInt($("#lsperiod_to").val());

            console.log('Search ' + newCountry + ' in ', LBLC.compared_countries);
	    if(LBLC.compared_countries.contains(newCountry)) {
		alert("This country is already selected!");
		return false;
	    }

	    LBLC.range_years.length = 0;
	    current_indicator_name = $("#lsindicador").find("option:selected").text();
	    LBLC.compared_countries.push(newCountry);
	    
	    if(dateFrom > dateTo) {
		LBLC.range_years.push(dateTo);
		LBLC.range_years.push(dateFrom);
	    }else{
		LBLC.range_years.push(dateFrom);
		LBLC.range_years.push(dateTo);
	    }
	    
	    var label = '<span class="label-compare displayib fos txt-s">'+$("#lscountry option:selected").text()+' <a href="#" class="close-label" data-iso3="'+$("#lscountry option:selected").val()+'"><img src="img/close-label.svg"></a></span>';
	    $("#labels-compare").append(label)

	    if($("#labels-compare > span.label-compare").length > 0) {
		$("span.remove-text").removeClass("hddn");
	    }

	    setDataURLs();
	    loadLineChart();

	}else{
	    alert("Complete all data to load results");
	}
    });


    $(document).delegate(".close-label", "click", function(e){
	e.preventDefault();
	var stringToArray = LBLC.compared_countries;
	var removeItem = $(this).attr("data-iso3");
	stringToArray = jQuery.grep(stringToArray, function(value) {
	    return value != removeItem;
	});
	//Refrescamos el array existente donde se anaden
	$(this).parent().remove();

	if($("#labels-compare > span.label-compare").length == 0) {
	    $("span.remove-text").addClass("hddn");
	}

	LBLC.compared_countries = stringToArray;
	setDataURLs();
	loadLineChart();
    })


});

//})();


