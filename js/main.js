//Funcion para recoger las variables de la URL
function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    	vars[key] = value;
	});
	return vars;
}


function truncateString (string, limit, breakChar, rightPad) {
    if (string.length <= limit) return string;
    
    var substr = string.substr(0, limit);
    if ((breakPoint = substr.lastIndexOf(breakChar)) >= 0) {
        if (breakPoint < string.length -1) {
            return string.substr(0, breakPoint) + rightPad;
        }
    }
}


function setNameCountry(iso3) {
	for(var i = 0; i < countrieNameIso3.length; i++ ){
		if (countrieNameIso3[i].iso3 == iso3){
			return countrieNameIso3[i].name;
		}
	}
}


//##Inicializamos LGAF##//
function load_lgaf_defaults () {
	$(".egsyear").prop('selectedIndex', 1);
	var yearsel = $(".egsyear").prop('selectedIndex', 1).val();

	if(yearsel == undefined || yearsel == "") {
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
		setDataURLs();
		loadELGAFvalues();
	},1200);
}


//Inicializamos el mapa según el indicador por defecto facilitado: WB-SP.RUR.TOTL.ZS (Rural population)
function loadMapDefaults() {
	$("select#msindicator option").each(function(){
		//console.log("here");
		var indicatorID = $(this).val();
		var iID = indicatorID.split("/").pop();
		if(iID === "WB-SP.RUR.TOTL.ZS") {
			$(this).prop("selected",true);
			table_selected_indicator = $(this).val();
			map_selected_indicator_URL = $(this).val();
			setDataURLs();
			loadYearsIndicatorMap();
			setTimeout(function(){
				current_indicator_name = $("select#msindicator").find("option:selected").text();
				$("select#msyear").prop('selectedIndex', 1);
				map_current_year = $("select#msyear").val();
				setDataURLs();
				loadMapChart();
			},600);
		} 
	});
}


function loadLineDefaults() {
	//line_selected_indicator_URL;
	table_selected_indicator = line_selected_indicator_URL;
	setDataURLs();
	loadCountriesPerIndicators();
	loadYearsIndicatorCountryCompare();

	current_range_years_selected.length=0;

	$("#lsindicador").find("option[value='"+line_selected_indicator_URL+"']").prop("selected",true);

	setTimeout(function(){
		$("#lscountry").find("option[value='"+current_country_iso3+"']").prop("selected",true);
		var date_ini = years_indicator_country["0"];
		var date_end = years_indicator_country[years_indicator_country.length - 1];
		current_range_years_selected.push(parseInt(date_end),parseInt(date_ini));
		loadLineChart()
		//alert(date_end);
		//current_range_years_selected;
	},600);

}



