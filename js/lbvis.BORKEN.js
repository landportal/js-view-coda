// BROKEN helper using a global

function setNameCountry(iso3) {
	for(var i = 0; i < countrieNameIso3.length; i++ ){
		if (countrieNameIso3[i].iso3 == iso3){
			return countrieNameIso3[i].name;
		}
	}
}


// BORKEN globals from chartsdata.js
var lang = getUrlVars()["lang"];

if(lang ==undefined || lang=="") {
	lang = "en";
}

//CURRENT COUNTRY ISO3 CODE
var current_country_iso3 = getUrlVars()["_country"]; //"TZA";//"CHN";//"BWA"; //Tanzania
var country_URL_root = "http://data.landportal.info/geo/";
var current_country_URL = country_URL_root + current_country_iso3;
var series_color = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];


var query_country_indicators;
var query_country_indicators_URL;
var query_all_indicators;
var query_all_indicators_URL;

var query_coutries_per_indicator;
var query_coutries_per_indicator_URL;

var query_elgaf_country_years;
var query_elgaf_country_years_URL;
var elgaf_years = new Array();


var query_get_indicator_info;
var query_get_indicator_info_URL;
var indicator_info = new Array();
var indicator_id_more_info;


var query_countries_iso3;
var query_countries_iso3_URL;
var countrieNameIso3 = new Array();


var current_elgaf_subindicator;
var current_elgaf_year;
var query_elgaf_values;
var query_elgaf_values_URL;
var elgaf_values = new Array();

// var query_indicator_per_year_mapping;
// var query_indicator_per_year_mapping_URL;

var query_indicators_URL;
var query_default_table_indicators_URL;
var query_years_indicator_country_URL;
var query_years_indicator_country;
var query_info_indicator_country_year;
var query_pie_URL;
var query_map_URL;
var query_spider_URL;
var query_line_URL;
var query_line_chart;
var query_map_chart;
var default_table_indicators = new Array();
var indicators = new Array();
var years_indicator_country = new Array();
var info_indicator_country = new Array();
var info_all_indicators = new Array();
var info_country_indicators = new Array();
var info_countries_per_indicator = new Array();
var current_indicator_name = "Rural population"; //Rural population
var selected_indicator_id = "Indicator not set";



//VARIABLES DE FORMULARIOS
var table_selected_indicator;
//ANO SELECCIONADO EN EL MAPA
var map_current_year;
//URL DEL INDICADOR SELECCIONADO EN EL MAPA
var map_selected_indicator_URL;
//PAISES COMPARADOS EN EL GRAFICO DE LINEAS
var current_compared_countries_iso3 = [current_country_iso3];
//RANGO DE ANOS COMPARADOS EN EL GRAFICO DE LINEAS
var current_range_years_selected = new Array();
//URL DEL INDICADOR SELECCIONADO EN EL GRAFICO DE LINEAS
var line_selected_indicator_URL;
//ANO POR DEFECTO
var table_selected_year = 2011;
//FIN DE VARIABLES DE FORMULARIO
var global_select_indicators = '<option value="0" data-localize="inputs.sindicator">Select indicator ...</option>';


//VALORES DE EJEMPLO (HAN DE CARGARSE DESDE LOS FORMULARIOS DE SELECION
//table_selected_indicator = 'http://data.landportal.info/indicator/FAO-23045-6083';
//map_current_year = "2000";
current_compared_countries_iso3 = [current_country_iso3];
//current_range_years_selected = [2000, 2008];//
map_selected_indicator_URL = 'http://data.landportal.info/indicator/FAO-23045-6083'; 
line_selected_indicator_URL = 'http://data.landportal.info/indicator/WB-SP.RUR.TOTL.ZS'; 
//FIN VALORES DE EJEMPLO
