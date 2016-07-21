var current_elgaf_subindicator;
var current_elgaf_year;
var elgaf_values = new Array();
var elgaf_years = new Array();

var LGAF_year_value = [];
var jsonLGAF_values = 'json/LGAF_values.json';

var ELGAF_indicators = new Array();


//##Inicializamos LGAF##//
function load_lgaf_defaults () {
    $(".egsyear").prop('selectedIndex', 1);
    var yearsel = $(".egsyear").prop('selectedIndex', 1).val();

    if(yearsel == undefined || yearsel == "") {
	$(".LGAF_area").addClass("hddn");
	return false;
    }else{
	$(".LGAF_area").removeClass("hddn");
    }

    setTimeout(function() {
	selectSetPanels(yearsel);
    },300);
    setTimeout(function() {
	$(".egspanel").prop('selectedIndex', 1);
	$(".egspanel").removeClass("cinput-disabled");
	$(".egspanel").prop( "disabled", false );
    },600);

    setTimeout(function() {
	selectSetIndicators($(".egspanel option:selected").val());
	$(".egsindicator").removeClass("cinput-disabled");
	$(".egsindicator").prop( "disabled", false );
    },900);

    setTimeout(function() {
	$(".egsindicator").prop('selectedIndex', 1);
	current_elgaf_subindicator = $(".egsindicator option:selected").val();
	current_elgaf_year = yearsel;
	$("#quality-info .pos_loader_data").removeClass("hddn");
	//setDataURLs();
	loadELGAFvalues();
    },1200);
}

function get_ELGAF_values () {
    $.ajax({
        async: false,
        type: "GET",
        url: jsonLGAF_values,
        dataType: "json",
        success : function(data) {
      	    window.LGAF_values = data;
        }
    });
}

function loadELGAFyears() {
    get_ELGAF_values();
    var query_url = LBD.sparqlURL(LBD.queries.elgaf_country_years);
    $.getJSON(query_url, function (data) {

	for(i=0; i < data.results.bindings.length; i++){
	    elgaf_years.push(data.results.bindings[i].dataset.value);
	}

	$(".egsyear").html("");
	var egop = '<option value="0" data-localize="inputs.syears" selected="selected">Select year ...</option>';
	$.each(elgaf_years, function( i, val ) {
	    egop += '<option value="'+val.substr(val.length - 4)+'">'+val.substr(val.length - 4)+'</option>';
	});
	
	if(egop != "") {
	    $(".egsyear").html(egop);
	}

	setTimeout(function(){
	    load_lgaf_defaults();
	},750);
	//alert(egop);

    });

}

function loadELGAFvalues() {
    var row = [];
    $(".quality-list").html("");
    
    var query_url = LBD.sparqlURL(LBD.query_elgaf_values(current_elgaf_year));
    $.getJSON(query_url, function (data) {

	var LGAF_year_value = LGAF_values[current_elgaf_year]["values"];
	var indicatorsTotal = new Array();
	var indicatorsValues = new Array();
	
	for(var j = 0; j < LGAF_year_value.length; j++) {	
	    
	    var jsonIDraw = LGAF_year_value[j].id;
	    var JsonID = jsonIDraw.substr(0, jsonIDraw.lastIndexOf('.')); //Extraemos el valor antes del ultimo "."
	    
	    if(JsonID == current_elgaf_subindicator){

		var title = LGAF_year_value[j].name;
		indicatorsTotal.push({
		    id:  JsonID,
		    name: title
		});

		for(var i = 0; i < data.results.bindings.length; i++){

		    var indicatorURL = data.results.bindings[i].indicatorURL.value;
		    var iURL = indicatorURL.split("/").pop();
		    var indicatorRoot = iURL.substr(0, iURL.lastIndexOf('.'));

		    //console.log(indicatorRoot+"--"+JsonID);

		    if(indicatorRoot === JsonID) {
			if(iURL == jsonIDraw){
			    indicatorsValues.push({
				id: iURL, 
				value: data.results.bindings[i].value.value
			    });
			    //console.log(LGAF_year_value[j].name+" ID: "+data.results.bindings[i].value.value)
			}
		    }
		}
	    }

	}

	for(var i = 0; i < indicatorsTotal.length; i ++) {
	    if(indicatorsValues[i]!=undefined){
		//console.log(indicatorsTotal[i].name+"-"+indicatorsValues[i].value);
		if(indicatorsValues[i].value.length <= 1) {
		    row += '<li class="item-q fos r-pos"><span class="txt-s cqdata cqdata-'+indicatorsValues[i].value.toLowerCase()+'"></span> '+indicatorsTotal[i].name+'</li>';
		}else{
		    var split = indicatorsValues[i].value.split("-");
		    row += '<li class="item-q fos r-pos"><span class="txt-s cqdata-il-sml cqdata-'+split[0].toLowerCase()+'"></span><span class="txt-s cqdata-il-smr cqdata-'+split[1].toLowerCase()+'"></span> '+indicatorsTotal[i].name+'</li>';
		}
	    }else{
		row += '<li class="item-q fos r-pos"><span class="txt-s cqdata cqdata-na"></span> '+indicatorsTotal[i].name+'</li>';
		//console.log(indicatorsTotal[i].name);
	    }
	}

	$("#quality-info .pos_loader_data").addClass("hddn");
	$(".quality-list").html(row);

    });

}




function selectSetPanels(year) {
    var $selPanels = $(".egspanel");
    $.getJSON("json/LGAF_panels.json",function(data){
	$selPanels.html('');
	$selPanels.append('<option value="0">Select panel ...</option>');
	$.each(data[year].panels, function(key,val){
	    $selPanels.append('<option value="'+val.id+'" name="'+val.name+'">'+val.name+'</option>');
	});
    });
}

function selectSetIndicators(id) {

    var $selIndEG = $(".egsindicator");
    $.getJSON("json/LGAF_indicators.json",function(data){
	$selIndEG.html('');
	$selIndEG.append('<option value="0">Select Sub-panel ...</option>');
	$.each(data[id].indicators, function(key,val){
	    $selIndEG.append('<option value="'+val.id+'" name="'+val.name+'">'+val.name+'</option>');
	    ELGAF_indicators.push(val.id);
	});
    });
    
}



$(document).ready(function() {


    //##LGAF EVENTS
    $(document).delegate(".egsyear", "change", function(e){
	e.preventDefault();
	if($(this).val()!=0) {
	    selectSetPanels($(this).val());
	    $(".egspanel").removeClass("cinput-disabled");
	    $(".egspanel").prop( "disabled", false );
	    $(".egspanel").eq(0).text("Loading ...");
	}else{
	    $(".egspanel").val(0);
	    $(".egspanel").addClass("cinput-disabled");
	    $(".egspanel").prop( "disabled", true );

	    $(".egsindicator").val(0);
	    $(".egsindicator").addClass("cinput-disabled");
	    $(".egsindicator").prop( "disabled", true );

	    $(".quality-list").html("");
	    $(".quality-list").append('<li class="item-q fos r-pos txt-c c-g40">Please, select year and panels to show the info.</li>');

	}
    });



    $(document).delegate(".egspanel", "change", function(e){
	e.preventDefault();
	if($(this).val()!=0) {
	    selectSetIndicators($(this).val());
	    $(".egsindicator").removeClass("cinput-disabled");
	    $(".egsindicator").prop( "disabled", false );
	}else{
	    $(".egsindicator").val(0);
	    $(".egsindicator").addClass("cinput-disabled");
	    $(".egsindicator").prop( "disabled", true );
	}
    });



    $(document).delegate(".egsindicator", "change", function(e){
	if($(this).val()!=0) {
	    current_elgaf_subindicator = $(this).val();
	    current_elgaf_year = $(".egsyear").val();
	    $("#quality-info .pos_loader_data").removeClass("hddn");
	    //setDataURLs();
	    loadELGAFvalues();
	}
    });

});
