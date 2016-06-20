//Funcion para recoger las variables de la URL
function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    	vars[key] = value;
	});
	return vars;
}

var lang = getUrlVars()["lang"];

if(lang ==undefined || lang=="") {
	lang = "es";
}

var jsonLGAF_values = 'json/LGAF_values.json'
$.ajax({
      async: false,
      type: "GET",
      url: jsonLGAF_values,
      dataType: "json",
      success : function(data) {
      		window.LGAF_values = data;
      }
});


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
var query_map_chart;
var default_table_indicators = new Array();
var indicators = new Array();
var years_indicator_country = new Array();
var info_indicator_country = new Array();
var info_all_indicators = new Array();
var info_country_indicators = new Array();
var info_countries_per_indicator = new Array();
var current_indicator_name = "Indicator not set";
var selected_indicator_id = "Indicator not set";



//VARIABLES DE FORMULARIOS
var table_selected_indicator;
//AÑO SELECCIONADO EN EL MAPA
var map_current_year;
//URL DEL INDICADOR SELECCIONADO EN EL MAPA
var map_selected_indicator_URL;
//PAISES COMPARADOS EN EL GRÁFICO DE LÍNEAS
var current_compared_countries_iso3 = [current_country_iso3];
//RANGO DE AÑOS COMPARADOS EN EL GRÁFICO DE LÍNEAS
var current_range_years_selected = new Array();
//URL DEL INDICADOR SELECCIONADO EN EL GRÁFICO DE LÍNEAS
var line_selected_indicator_URL;
//AÑO POR DEFECTO
var table_selected_year = 2011;
//FIN DE VARIABLES DE FORMULARIO
var global_select_indicators = '<option value="0" data-localize="inputs.sindicator">Select indicator ...</option>';





Array.prototype.containsIndicator = function(indicatorURL) {
    var i = this.length;
    while (i--) {
        if (this[i].url == indicatorURL) {
            return i;
        }
    }
    return -1;
}

//VALORES DE EJEMPLO (HAN DE CARGARSE DESDE LOS FORMULARIOS DE SELECIÓN
//table_selected_indicator = 'http://data.landportal.info/indicator/FAO-23045-6083';
//map_current_year = "2000";
current_compared_countries_iso3 = [current_country_iso3];
current_range_years_selected = [2000, 2008];//
map_selected_indicator_URL = 'http://data.landportal.info/indicator/FAO-23045-6083'; 
line_selected_indicator_URL = 'http://data.landportal.info/indicator/WB-SP.RUR.TOTL.ZS'; 
//FIN VALORES DE EJEMPLO

function setDataURLs(){
	//SPARQL Querys
	var query_prefix = 'PREFIX cex: <http://purl.org/weso/ontology/computex#> ' +
	'PREFIX time: <http://www.w3.org/2006/time#> ' +
	'PREFIX ex: <http://www.example.org/rdf#> ';

	var query_prefix_elgaf = 'PREFIX cex: <http://purl.org/weso/ontology/computex#> '+
	'PREFIX qb: <http://purl.org/linked-data/cube#>';

	query_all_indicators = query_prefix + 
	'SELECT * '+
	'FROM <http://data.landportal.info> '+
	'WHERE { '+
		'?indicatorUrl a cex:Indicator ; '+
		'ex:label ?label ; '+
		'ex:description ?description . '+
	'}'+
	'ORDER BY ?label';


	query_country_indicators = query_prefix + 
	'SELECT DISTINCT ?indicatorURL ?indicatorLabel '+
	'FROM <http://data.landportal.info> '+
	'WHERE { '+
		'?obs cex:ref-indicator ?indicatorURL ; '+
		'cex:ref-area <http://data.landportal.info/geo/'+ current_country_iso3 +'> ; ' +
		'cex:value ?value. '+
		'?indicatorURL ex:label ?indicatorLabel . '+
	'} '+
	'ORDER BY ?indicatorURL';



	query_coutries_per_indicator = query_prefix + 
	'SELECT DISTINCT ?countryURL ?countryISO3 ?countryLabel ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
		'?obs cex:ref-indicator <' + table_selected_indicator + '> ; ' +
		'cex:ref-area ?countryURL .' +
		'?countryURL ex:label ?countryLabel. ' +
		' BIND (REPLACE(STR(?countryURL), "http://data.landportal.info/geo/","") AS ?countryISO3) ' +
	'} ';



	query_elgaf_country_years = query_prefix_elgaf + 
	'SELECT DISTINCT ?dataset ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
		'?obs cex:ref-area <http://data.landportal.info/geo/' + current_country_iso3 + '> ; ' +
		'qb:dataSet ?dataset. ' +
		'VALUES ?dataset {<http://data.landportal.info/dataset/WB-LGAF2013> <http://data.landportal.info/dataset/WB-LGAF2016>} ' +
	'} ';


	query_elgaf_values = query_prefix_elgaf + 
	'SELECT ?indicatorURL (STR(?value) AS ?value) ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
		'?obs cex:ref-area <http://data.landportal.info/geo/' + current_country_iso3 + '> ; ' +
		'qb:dataSet <http://data.landportal.info/dataset/WB-LGAF' + current_elgaf_year + '> ; ' +
		'cex:ref-indicator ?indicatorURL ; ' +
		'cex:value ?value. ' +
	'} ORDER BY ?indicatorURL ';

	


	var query_default_table_indicators = query_prefix +
	'SELECT ?obs ?indicatorURL ?indicatorLabel ?indicatorDescription (year(?dateTime) as ?year) ?value ?unitLabel ?datasetURL ?datasetLabel ?sourceOrgURL ?sourceOrgLabel ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-indicator ?indicatorURL ; ' +
	'	 cex:ref-time ?time ; ' +
	'     cex:value ?value.     	  ' +
	'     ?indicatorURL ex:label ?indicatorLabel ; ' +
	'                   ex:description ?indicatorDescription ; ' +
	'				   ex:unit ?unitLabel ; ' +
	'				   ex:dataset ?datasetURL .	 ' +			   
	'	 ?datasetURL ex:label ?datasetLabel ; ' +
	'	             ex:org ?sourceOrgURL .	 ' +
	'	 ?sourceOrgURL ex:label ?sourceOrgLabel. ' +	 
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime ' +
	'  ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/WB-SP.POP.TOTL> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'}  ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/WB-SP.RUR.TOTL.ZS> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/WB-NY.GDP.PCAP.PP.KD> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/FAO-6601-5110> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/FAO-23045-6083> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/DP-MOD-O-F> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/DP-MOD-O-N> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'UNION ' +
	'{ ' +
	'SELECT ?obs  ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/FAO-LANDANDGENDER.1FB> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime } ' +
	'ORDER BY DESC(?dateTime) ' +
	'LIMIT 1 ' +
	'} ' +
	'}';
	
	query_years_indicator_country = query_prefix +
	'SELECT (year(?dateTime) as ?year) ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <' + table_selected_indicator + '> ; ' +
	'     cex:ref-time ?time . ' +
	'?time time:hasBeginning ?timeValue . ' +
	'?timeValue time:inXSDDateTime ?dateTime ' +
	'} ' +
	'ORDER BY DESC(?dateTime)';

	query_info_indicator_country_year = query_prefix +
	'SELECT ?value ?unitLabel ?datasetURL ?datasetLabel ?sourceOrgURL ?sourceOrgLabel ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { '+
		'?obs cex:ref-area <' + current_country_URL + '> ; ' +
		'cex:ref-indicator <' + table_selected_indicator + '> ; ' +
		'cex:value ?value ; ' +
		'cex:ref-time ?time . '+
		'?time time:hasBeginning ?timeValue . ' +
		'?timeValue time:inXSDDateTime "' + table_selected_year + '-01-01T00:00:00Z"^^xsd:dateTime . ' +
		'<' + table_selected_indicator + '> ex:unit ?unitLabel ; ' +
		'ex:dataset ?datasetURL . ' +
		'?datasetURL ex:label ?datasetLabel ; ' +
		'ex:org ?sourceOrgURL . ' +
		'?sourceOrgURL ex:label ?sourceOrgLabel. ' +
	'}';
	
	var query_pie_chart = query_prefix +
	'SELECT ?ArableLandPer ?PermanentCropsPer ?PermanentPasturesAndMedowsPer ?ForestLandPer ?OtherPer ?TotalLandHa (year(?maxdateTime) as ?year) ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs1 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6621-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:value ?ArableLandHa ; ' +
	'     cex:ref-time ?time . ' +
	'?obs2 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6650-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:value ?PermanentCropsHa ; ' +
	'     cex:ref-time ?time . ' +
	'?obs3 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6655-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:value ?PermanentPasturesAndMedowsHa; ' +
	'     cex:ref-time ?time . ' +
	'?obs4 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6661-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:value ?ForestLandHa; ' +
	'     cex:ref-time ?time . ' +
	'?obs5 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6601-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:value ?TotalLandHa; ' +
	'     cex:ref-time ?time . ' +
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?maxdateTime . ' +
	'BIND ((xsd:double(xsd:float(?ArableLandHa)*100/xsd:float(?TotalLandHa))) AS ?ArableLandPer) ' +
	'BIND ((xsd:double(xsd:float(?PermanentCropsHa)*100/xsd:float(?TotalLandHa))) AS ?PermanentCropsPer) ' +
	'BIND ((xsd:double(xsd:float(?PermanentPasturesAndMedowsHa)*100/xsd:float(?TotalLandHa))) AS ?PermanentPasturesAndMedowsPer) ' +
	'BIND ((xsd:double(xsd:float(?ForestLandHa)*100/xsd:float(?TotalLandHa))) AS ?ForestLandPer) ' +
	'BIND ((100 - ?ArableLandPer  - ?PermanentCropsPer - ?PermanentPasturesAndMedowsPer - ?ForestLandPer) AS ?OtherPer) ' +
	'{' +
	'SELECT DISTINCT max(?dateTime) as ?maxdateTime ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE{' +
	'?obs1 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6621-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '>; ' +
	'     cex:ref-time ?time . ' +
	'?obs2 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6650-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-time ?time . ' +
	'?obs3 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6655-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-time ?time . ' +
	'?obs4 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6661-5110> ; ' +
	'     cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-time ?time . ' +
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime .' +
	'}' +
	'}' +
	'}';

	query_map_chart =  query_prefix +
	'SELECT ?countryISO3 (year(?dateTime) as ?year) ?value ' + 
	'FROM <http://data.landportal.info>' +
	'WHERE {' +
	'?obs cex:ref-indicator ?indicatorURL ;' +
	'     cex:ref-area ?countryURL ;' +
	'     cex:ref-time ?time ;' +
	'     cex:value ?value.' +
	'?time time:hasBeginning ?timeValue .' +
	'?timeValue time:inXSDDateTime ?dateTime .' +
	'VALUES ?indicatorURL {<' + map_selected_indicator_URL + '>}' +
	'BIND (REPLACE(STR(?countryURL), "http://data.landportal.info/geo/","") AS ?countryISO3)' +	 
	'}' +
	'ORDER BY ?dateTime ?countryURL';


	var query_spider_chart = query_prefix +
	'SELECT  ?sigi ?sigiTo100 ?gini ?giniTo100 ?hdi ?hdiTo100  ?ghi ?ghiTo100 ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'OPTIONAL{ ' +
	'SELECT ?sigi ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/OECD-SIGI-0> ; ' +
	'     cex:ref-time ?time ; ' +
	'     cex:value ?sigi . ' +
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime . ' +
	'} ORDER BY DESC(?dateTime) ' +
	'  LIMIT 1 ' +
	'} ' +
	'OPTIONAL{ ' +
	'SELECT ?hdi ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/UNDP-HDI-INDEX> ; ' +
	'     cex:ref-time ?time ; ' +
	'     cex:value ?hdi . ' +
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime . ' +
	'} ORDER BY DESC(?dateTime) ' +
	'  LIMIT 1 ' +
	'} ' +
	'OPTIONAL{ ' +
	'SELECT ?gini ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/WB-SI.POV.GINI> ; ' +
	'     cex:ref-time ?time ; ' +
	'     cex:value ?gini . ' +
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime . ' +
	'} ORDER BY DESC(?dateTime) ' +
	'  LIMIT 1 ' +
	'} ' +
	'OPTIONAL{ ' +
	'SELECT ?ghi ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area <' + current_country_URL + '> ; ' +
	'     cex:ref-indicator <http://data.landportal.info/indicator/IFPRI-GHI> ; ' +
	'     cex:ref-time ?time ; ' +
	'     cex:value ?ghi . ' +
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime . ' +
	'} ORDER BY DESC(?dateTime) ' +
	'  LIMIT 1 ' +
	'} ' +
	'BIND ((xsd:float(100) - (?sigi)*100)  AS ?sigiTo100) . ' +
	'BIND ((xsd:float(100) - (?gini))  AS ?giniTo100) . ' +
	'BIND ((?hdi)*100 AS ?hdiTo100) . ' +
	'BIND ((xsd:float(100) - (?ghi))  AS ?ghiTo100) . ' +
	'}';


	var query_line_chart = query_prefix +
	'SELECT ?countryISO3 (year(?dateTime) as ?year) ?value ' + 
	'FROM <http://data.landportal.info> ' +
	'WHERE { ' +
	'?obs cex:ref-area ?countryURL ; ' +
	'     cex:ref-time ?time ; ' +
	'     cex:value ?value. ' +     	 
	'     ?time time:hasBeginning ?timeValue . ' +
	'     ?timeValue time:inXSDDateTime ?dateTime . ' +
	'     BIND (REPLACE(STR(?countryURL), "http://data.landportal.info/geo/","") AS ?countryISO3) ' +
	'{ ' +
	'SELECT ?obs ' +
	'FROM <http://data.landportal.info> ' +
	'WHERE{ ' +
	'  ?obs cex:ref-indicator <' + line_selected_indicator_URL + '> . ' +
	'  ?obs cex:ref-area ?country . ' +
	'  VALUES ?country { ' +
	'   <' + current_country_URL + '> ';
	for(i=0; i<current_compared_countries_iso3.length; i++){
		query_line_chart = query_line_chart + "<" + country_URL_root + current_compared_countries_iso3[i] + ">";
	}
	query_line_chart = query_line_chart + '  } ' +
	'} ' +
	'} ' +
	'} ORDER BY ?dateTime ?countryURL';

	//GENERACIÓN DE URLs
	URL_prefix = 'http://landportal.info/sparql?default-graph-uri=&query=';
	URL_suffix = '&should-sponge=&format=json&timeout=0&debug=on';
	
	//Consulta de los indicadores del pais cargado
	query_country_indicators_URL = URL_prefix + encodeURIComponent(query_country_indicators) + URL_suffix; 
	//Nos trae todos los indicadores - deshabilitado
	query_all_indicators_URL = URL_prefix + encodeURIComponent(query_all_indicators) + URL_suffix;
	//Consulta de indicadores que se precargan por defecto en la tabla indicadores
	query_default_table_indicators_URL = URL_prefix + encodeURIComponent(query_default_table_indicators) + URL_suffix;
	//Consulta de años disponibles por indicador del pais
	query_years_indicator_country_URL = URL_prefix + encodeURIComponent(query_years_indicator_country) + URL_suffix;
	//Información de la consulta dado un año y un indicador
	query_info_indicator_country_year_URL = URL_prefix + encodeURIComponent(query_info_indicator_country_year) + URL_suffix;
	//Consulta de indicadores por pais
	query_coutries_per_indicator_URL = URL_prefix + encodeURIComponent(query_coutries_per_indicator) + URL_suffix;
	//Consulta PIE chart
	query_pie_URL = URL_prefix + encodeURIComponent(query_pie_chart) + URL_suffix;
	//Consulta MAP chart
	query_map_URL = URL_prefix + encodeURIComponent(query_map_chart) + URL_suffix;
	//Consulta Spider chart
	query_spider_URL = URL_prefix + encodeURIComponent(query_spider_chart) + URL_suffix;
	//Consulta Line chart
	query_line_URL = URL_prefix + encodeURIComponent(query_line_chart) + URL_suffix;
	//Consulta ELGAF
	query_elgaf_country_years_URL = URL_prefix + encodeURIComponent(query_elgaf_country_years) + URL_suffix; 
	//Valores por año ELGAF
	query_elgaf_values_URL = URL_prefix + encodeURIComponent(query_elgaf_values) + URL_suffix; 

	//console.log(query_pie_URL);


}


setDataURLs();
//console.log(query_pie_URL);
//console.log(query_map_URL);
//console.log(query_spider_URL);
//console.log(query_line_URL);


//CARGA DE INDICADORES EN SELECTS
// function set_all_indicators() {

// 	var $selIndicator = $(".sindicator");
// 	$selIndicator.html('');

// 	$.getJSON(query_all_indicators_URL, function (data) {
// 		for(i=0; i < data.results.bindings.length; i++){
// 			//info_indicator_country.push(data.results.bindings[i].datasetLabel.value);
// 			//info_all_indicators.push(data.results.bindings[i].indicatorUrl.value);
// 			info_all_indicators.push({'name':data.results.bindings[i].label.value,'URL':data.results.bindings[i].indicatorUrl.value});
// 			global_select_indicators += '<option value="'+data.results.bindings[i].indicatorUrl.value+'">'+data.results.bindings[i].label.value+'</option>';
// 			//info_all_indicators.push();
// 		}
// 	});

// 	$selIndicator.append(global_select_indicators);
// }

//set_all_indicators();


function set_country_indicators() {

	
	$.getJSON(query_country_indicators_URL, function (data) {
		for(i=0; i < data.results.bindings.length; i++){
			info_country_indicators.push({'name':data.results.bindings[i].indicatorLabel.value,'URL':data.results.bindings[i].indicatorURL.value});
			global_select_indicators += '<option value="'+data.results.bindings[i].indicatorURL.value+'">'+data.results.bindings[i].indicatorLabel.value+'</option>';
		}

		//Cargamos los indicadores (TODOS CUIDADO)
		var $selIndicator = $(".sindicator, .msindicator");
		$selIndicator.html('');
		$selIndicator.append(global_select_indicators);
	});

	
}

set_country_indicators();


//CARGA DE VARIABLES INDICADORES; AÑOS...
function loadDefaultTableIndicators(){
	$.getJSON(query_default_table_indicators_URL, function (data) {
		var newIndicator = new Object();
		var item_type;
		var indicatorIndex;
		for(j=0;j<data.results.bindings.length;j++){
			for(i=0;i<data.head.vars.length;i++){
				//indicatorIndex = default_table_indicators.containsIndicator(data.results.bindings[j].indicatorURL.value);
				//console.log("Indicator-index:" + indicatorIndex);
				item_type = data.head.vars[i];
				switch(item_type){
					case "obs": 						break;
					case "indicatorURL": 				newIndicator.url = data.results.bindings[j][item_type].value;
														break;
					case "indicatorLabel": 				newIndicator.name = data.results.bindings[j][item_type].value;
														break;
					case "indicatorDescription": 		newIndicator.description = data.results.bindings[j][item_type].value;
														break;
					case "year": 						/*if(indicatorIndex!=-1){
															indicators[indicatorIndex].years.push(data.results.bindings[j][item_type].value);
														}
														else{
															newIndicator.years = new Array();*/
															newIndicator.year = data.results.bindings[j][item_type].value;
														//}
														break;
					case "value": 						/*if(indicatorIndex!=-1){
															indicators[indicatorIndex].values.push(data.results.bindings[j][item_type].value);
														}
														else{*/
															newIndicator.value = data.results.bindings[j][item_type].value;
														//}
														break;
					case "unitLabel": 					newIndicator.unit_label = data.results.bindings[j][item_type].value;
														break;
					case "datasetURL": 					newIndicator.dataset_URL = data.results.bindings[j][item_type].value;
														break;
					case "datasetLabel": 				newIndicator.dataset_label = data.results.bindings[j][item_type].value;
														break;
					case "sourceOrgURL": 				newIndicator.source_URL = data.results.bindings[j][item_type].value;
														break;
					case "sourceOrgLabel": 				newIndicator.source_label = data.results.bindings[j][item_type].value;
														break;
					default:							break;
				}
			}
			//if(indicatorIndex==-1){
				default_table_indicators.push(newIndicator);
			//	}
				newIndicator = {};
		}

		$("table#tindicators tbody").html("");
		$.each(default_table_indicators, function( i, val ) {
			var row = ' <tr>\
                    <td class="t-td" data-id="'+default_table_indicators[i].url+'">'+default_table_indicators[i].name+'</td>\
                    <td class="t-td txt-c year" data-year="'+default_table_indicators[i].year+'">'+default_table_indicators[i].year+'</td>\
                    <td class="t-td txt-ar">'+default_table_indicators[i].value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</td>\
                    <td class="t-td">'+default_table_indicators[i].unit_label+'</td>\
                    <td class="t-td"><a href="'+default_table_indicators[i].source_URL+'" target="_blank">'+default_table_indicators[i].source_label+'</a></td>\
                    <td class="t-td txt-c"><a href="#" class="r-row del-row" data-ord=""><img src="img/ico-trash.svg" class="c-obj"></a></td>\
                  </tr>';

            $("table#tindicators tbody").append(row);
		});
	});
}

loadDefaultTableIndicators();

function loadELGAFyears() {
	
	$.getJSON(query_elgaf_country_years_URL, function (data) {

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

		//alert(egop);

	});

}

loadELGAFyears();

var LGAF_year_value = [];

function loadELGAFvalues() {
	var row = [];
	$(".quality-list").html("");
	$.getJSON(query_elgaf_values_URL, function (data) {

		for(i=0; i < data.results.bindings.length; i++){
			var RawData = data.results.bindings[i].indicatorURL.value;
			var iValue = data.results.bindings[i].value.value;
			var id =  RawData.split("/").pop(); // Extraigo el id tras la última barra "/"

			var subpanel = id.substr(0, id.lastIndexOf('.')); //Extraemos el valor antes del último "."
			
			if(subpanel == current_elgaf_subindicator) {
	
				var year = parseInt(current_elgaf_year);
				LGAF_year_value = LGAF_values[current_elgaf_year]["values"];

				$.each(LGAF_year_value, function( i, val ) {
		
					if(val.id == id) {
						console.log("Indicador: "+val.name+" Id: "+iValue);
						row += '<li class="item-q fos r-pos"><span class="cqdata cqdata-na"></span> '+val.name+' - '+iValue+'</li>'
					}
					
				});


			}
		}
		$(".quality-list").html(row);
	});

}



function loadYearsIndicatorCountry(){
	
	while(years_indicator_country.length > 0) {
	    years_indicator_country.pop();
	}
	
	$.getJSON(query_years_indicator_country_URL, function (data) {
		for(i=0; i < data.results.bindings.length; i++){
			years_indicator_country.push(data.results.bindings[i].year.value);
		}

		var iop = '<option value="0" data-localize="inputs.syear">Select year ...</option>';
		$.each(years_indicator_country, function( i, val ) {
			iop += '<option value="'+val+'">'+val+'</option>';
			//console.log(iop);
		});
		$("#isyear").append(iop);
		if(iop!="") {
			$("#isyear").removeClass("cinput-disabled");
			$("#isyear").prop( "disabled", false );
		}
	});
}



function loadYearsIndicatorMap(){
	
	years_indicator_country.length = 0;

	//alert(years_indicator_country)
	
	$.getJSON(query_years_indicator_country_URL, function (data) {
		for(i=0; i < data.results.bindings.length; i++){
			years_indicator_country.push(data.results.bindings[i].year.value);
		}

		var miop;
		$.each(years_indicator_country, function( i, val ) {
			miop += '<option value="'+val+'">'+val+'</option>';
			//console.log(iop);
		});
		$("#msyear").html('<option value="0" data-localize="inputs.syear">Select year ...</option>');
		$("#msyear").append(miop);
		if(miop!="") {
			$("#msyear").removeClass("cinput-disabled");
			$("#msyear").prop( "disabled", false );
		}
	});
}



function loadYearsIndicatorCountryCompare(){
	
	while(years_indicator_country.length > 0) {
	    years_indicator_country.pop();
	}
	
	$.getJSON(query_years_indicator_country_URL, function (data) {
		for(i=0; i < data.results.bindings.length; i++){
			years_indicator_country.push(data.results.bindings[i].year.value);
		}
		
		var iop; //'<option value="0" data-localize="inputs.syear">Select year ...</option>';
		$.each(years_indicator_country, function( i, val ) {
			iop += '<option value="'+val+'">'+val+'</option>';
			//console.log(iop);
		});
		$("#lsperiod_from").html('<option value="0" data-localize="inputs.speriodfrom">From date ...</option>');
		$("#lsperiod_to").html('<option value="0" data-localize="inputs.speriodto">To date ...</option>');
		$("#lsperiod_from, #lsperiod_to").append(iop);
	});
}



function loadCountryIndicatorInfo(){

	//Vaciamos el array
	info_indicator_country.length = 0;

	$.getJSON(query_info_indicator_country_year_URL, function (data) {
		for(i=0; i < data.results.bindings.length; i++){
			info_indicator_country.push(data.results.bindings[i].datasetLabel.value);
			info_indicator_country.push(table_selected_year);
			info_indicator_country.push(data.results.bindings[i].value.value);
			info_indicator_country.push(data.results.bindings[i].unitLabel.value);
			info_indicator_country.push(data.results.bindings[i].sourceOrgLabel.value);
			info_indicator_country.push(data.results.bindings[i].datasetURL.value);
			info_indicator_country.push(data.results.bindings[i].sourceOrgURL.value);	
		}

		var addrow = '<tr>\
			<td class="t-td" data-id="'+selected_indicator_id+'">'+current_indicator_name+'</td>\
		    <td class="t-td txt-c year" data-year="'+info_indicator_country["1"]+'">'+info_indicator_country["1"]+'</td>\
		    <td class="t-td txt-ar">'+info_indicator_country["2"].replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'</td>\
		    <td class="t-td">'+info_indicator_country["3"]+'</td>\
		    <td class="t-td"><a href="'+info_indicator_country["5"]+'" target="_blank">'+info_indicator_country["4"]+'</a></td>\
		    <td class="t-td txt-c"><a href="#" class="r-row del-row" data-ord=""><img src="img/ico-trash.svg" class="c-obj"></a></td>\
		    </tr>';
		$("table#tindicators tbody").append(addrow);
	});

}



function loadCountriesPerIndicators(){

	//Vaciamos el array
	info_countries_per_indicator.length = 0;

	$.getJSON(query_coutries_per_indicator_URL, function (data) {
		var iop = '<option value="0" data-localize="inputs.scountry">Select country ...</option>';
		for(i=0; i < data.results.bindings.length; i++){
			
			iop += '<option value="'+data.results.bindings[i].countryISO3.value+'">'+data.results.bindings[i].countryLabel.value+'</option>';
			
			info_countries_per_indicator.push(data.results.bindings[i].countryISO3.value);
			info_countries_per_indicator.push(data.results.bindings[i].countryLabel.value);
		}

		$("#lscountry").append(iop);

		if(iop!="") {
			$("#lscountry").removeClass("cinput-disabled");
			$("#lscountry").prop( "disabled", false );
		}

	});

}


//console.log(default_table_indicators);
//GENERACIÓN DE GRÁFICAS

function loadPieChart(){
	//PIE CHART
	$.getJSON(query_pie_URL, function (data) {
		//console.log(data);


	var chart_series = new Array();
	var chart_series_labels = data.head.vars;
	var serie_name;
	var serie_color;
	for(i=0; i<chart_series_labels.length-2; i++){
		switch (chart_series_labels[i]){
			case "ArableLandPer": 					serie_name = "Arable Land";
													serie_color = "#8c6d31";
													break;
			case "PermanentCropsPer": 				serie_name = "Permanent crops";
													serie_color = "#e7ba52";
													break;
			case "PermanentPasturesAndMedowsPer": 	serie_name = "Permanent pastures and meadows";
													serie_color = "#b5cf6b";
													break;
			case "ForestLandPer": 					serie_name = "Forest Land";
													serie_color = "#637939";
													break;
			case "OtherPer": 						serie_name = "Other";
													serie_color = "#9c9ede";
													break;
			default:								serie_name = "UNKNOWN_SERIE_NAME_ERROR";
													serie_color = "#000000";
													break;
		}
		chart_series.push({name:serie_name, y:parseFloat(data.results.bindings[0][chart_series_labels[i]].value), color:serie_color});
	}
	var country_land_area = data.results.bindings[0][chart_series_labels[chart_series_labels.length-2]].value;
	var country_land_area_str = country_land_area.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	var datatime = new Date(data.results.bindings[0][chart_series_labels[chart_series_labels.length-1]].value);
	var data_year = datatime.getFullYear();
	//console.log(chart_series);

		//## Pie chart
		var pieChart_init;
		var $divPie = $('#wrapper-piechart');
		var CharPieOp = {
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: null,
				renderTo: $divPie[0],
				plotShadow: false,
				type: 'pie',
				backgroundColor: 'transparent'
			},
			credits:{
				enabled:false
			},
			title: {
				text: '<div class="txt-m displayb txt-c">Total land area: ' + country_land_area_str + ' ha <span class="displayb c-g40">' + data_year + '</span></div>',
				useHTML: true
			},
			tooltip: {
				pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			},
			plotOptions: {
				pie: {
					allowPointSelect: true,
					cursor: 'pointer',
					dataLabels: {
						enabled: false
					},
					showInLegend: true
				}
			},
			series: [{
				name: ' ',
				colorByPoint: true,
				data: chart_series
			}]
		};

		pieChart_init = new Highcharts.Chart(CharPieOp);
	});
}

function loadMapChart(){
	//#Mapping graph
	$("#maparea .pos_loader_data").removeClass("hddn");
	
	$.getJSON(query_map_URL, function (data) {

		//console.log(data.results.bindings[i].countryISO3.value);
		//console.log(data);
		var data_values = new Array();
		var data_value;
		var data_value_min;
		var data_value_max;
		for(i=0; i < data.results.bindings.length; i++){
			if(data.results.bindings[i].year.value == map_current_year){
				var data_value = parseFloat(data.results.bindings[i].value.value);
				if ((data_value>data_value_max)||(data_value_max == null)){
					data_value_max = data_value;
				}
				if ((data_value<data_value_min)||(data_value_min == null)){
					data_value_min = data_value;
				}
				data_values.push({code:data.results.bindings[i].countryISO3.value, value:data_value});
			}
		}
		//console.log(data_values);
		//console.log("Range: " + data_value_min + ", " + data_value_max);
	
	  // var data = [{
	  //   "color": "#a3c642",
	  //   "code": "ES"
	  // }];

	  /*$.each(data, function() {
	    this.id = this.code;
	  });
		*/
		
	  console.log("ok");
	  

	  $('#wrapper-mapping').highcharts('Map', {
	    chart: {
	      backgroundColor: '#ffffff',
	      margin: 0,

	    },
		
		credits:{
			enabled:false
		},
		  
	    title: {
	      text: ''
	    },

	    mapNavigation: {
	      enabled: true,
	      buttonOptions: {
	          theme: {
	              fill: 'white',
	              'stroke-width': 1,
	              stroke: 'silver',
	              r: 0,
	              states: {
	                  hover: {
	                      fill: '#79B042'
	                  },
	                  select: {
	                      stroke: '#039',
	                      fill: '#bada55'
	                  }
	              }
	          },
	          verticalAlign: 'top'
	      },
	      enableMouseWheelZoom: false,
	      enableDoubleClickZoom: false,
	      buttons: {
	          zoomIn: {
	              y: 20,
	              x: 20
	          },
	          zoomOut: {
	              y: 50,
	              x: 20
	          }
	      }
	    },

	    colorAxis: {
	      min: data_value_min,
	      max: data_value_max,
	      minorTickLength: 0,
	      //type: 'logarithmic',
	      maxColor: "#45551A",
	      minColor: "#D9ED7E"
	    },

	    series: [{
	      data: data_values,
	      allowPointSelect: true,
	      nullColor: '#bbd6d8',
	      borderColor: 'white',
	      mapData: map_data,//Highcharts.maps['custom/world'],
	      joinBy: ['id', 'code'],
	      name: current_indicator_name,
	      states: {
	        hover: {
	          color: '#F5A623'
	        },
	        select: {
	          color: '#F5A623',
	          //borderColor: '#F5A623',
	          //borderWidth: 2
	        }
	      },
	      tooltip: {
	        pointFormat: '{point.name} <b>' + '{point.value}'.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</b>',
	        //valueSuffix: '/km²'
	      }
	    }]

	  });

	  //$('#wrapper-mapping').highcharts().get(current_country_iso3).select();
	  //$('#wrapper-mapping').highcharts().get(country).zoomTo();
	  //$('#wrapper-mapping').highcharts().mapZoom(12);
	  $("#maparea .pos_loader_data").addClass("hddn");
	});

	
	//alert("go");
	//chart.redraw();
}


function loadSpiderChart(){
 //#Spider chart
	$.getJSON(query_spider_URL, function (data) {
		//console.log("Spider");
		//console.log(data);
		var chart_series = new Array();
		var chart_series_labels = data.head.vars;
		var serie_name;
		var serie_value;
		var categories_names = new Array();
		for(i=0; i<chart_series_labels.length; i++){
			switch (chart_series_labels[i]){
				case "sigiTo100":	serie_name = "SIGI";
									break;
				case "giniTo100": 	serie_name = "GINI Index";
									break;
				case "hdiTo100": 	serie_name = "HDI";
									break;
				case "ghiTo100": 	serie_name = "GHI";
									break;
				default:			serie_name = "notused";
									break;
			}
			if(serie_name!="notused"){
				categories_names.push(serie_name);
				if(data.results.bindings[0][chart_series_labels[i]]!=undefined){
					serie_value = data.results.bindings[0][chart_series_labels[i]].value;
				}
				else{
					serie_value = null;
				}
				if(data.results.bindings[0] != undefined){
					chart_series.push(parseFloat(serie_value));
				}
				else{
					console.log("pusheando null...");
					chart_series.push(null);
				}
			}
		}
		var spiderChart_init;
		var $divSpider = $('#wrapper-spiderchart');
		var CharSpiderOp = {
			chart: {
				polar: true,
				type: 'line',
				renderTo: $divSpider[0],
				backgroundColor: 'transparent'
			},

			credits:{
				enabled:false
			},

			title: {
				text: '<div class="txt-m displayb txt-c">Main Index Ranking <span class="displayb c-g40">2015</span></div>',
				useHTML: true
			},

			pane: {
				size: '80%'
			},

			xAxis: {
				categories: categories_names,
				tickmarkPlacement: 'on',
				lineWidth: 0
			},

			yAxis: {
				gridLineInterpolation: 'polygon',
				lineWidth: 0,
				min: 0
			},

			tooltip: {
				shared: true,
				pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.0f}</b><br/>'
			},

			legend: {
			   // align: 'right',
				//verticalAlign: 'top',
				//y: 70,
				//layout: 'vertical'
			},

			series: [{
				name: current_country_iso3,
				data: chart_series,
				pointPlacement: 'on'
			}]
		};

		spiderChart_init = new Highcharts.Chart(CharSpiderOp);
	});
}


function loadLineChart(){
//## LINE CHART
	
	$("#igraphics .pos_loader_data").removeClass("hddn");

	$.getJSON(query_line_URL, function (data) {
		//console.log("line_data =")
		//console.log(data);
		var serie_categories = new Array();
		var serie_values = new Array();
		var serie_value = new Object();
		var first_year = current_range_years_selected[0];
		var last_year = current_range_years_selected[1];
		var num_years = last_year - first_year + 1;
		var _iso3;
		var _value;
		var _year;
		var _source;
		var _sourcen;

		for(i=0; i<num_years; i++){
			serie_categories[i] = first_year + i;
		}
		//console.log(serie_categories);
		for(j=0; j<current_compared_countries_iso3.length; j++){
			//Para cada País, inicializo la serie a null, recorro valores y si pertenecen al país y están dentro del rango de años correspondiente, pongo el valor en su lugar.
			serie_value.name = current_compared_countries_iso3[j];
			serie_value.data = new Array();
			serie_value.color = series_color[j]
			for(k=0; k<num_years; k++){
				//inicializo todos los valores de esta serie a null
				serie_value.data[k] = null;
			}
			for(h=0; h<data.results.bindings.length; h++){
				_iso3 = data.results.bindings[h].countryISO3.value; 
				_year = parseFloat(data.results.bindings[h].year.value);

				if((_iso3 == serie_value.name)&&(_year <= last_year)&&(_year >= first_year)){
					serie_value.data[_year - first_year] = parseFloat(data.results.bindings[h].value.value);
				}
			}
			//console.log("serie_value " + j + " =");
			//console.log(serie_value);
			serie_values[j] = serie_value;
			serie_value = {};
		}



		var lineChart_init;
		var $divIgraphics = $('#wrapper-igraphics');
		var CharLineOp = {
		  chart: {
			  backgroundColor: "transparent",
			  renderTo: $divIgraphics[0],
			},

			credits:{
				enabled:false
			},

			title: {
				text: '',
				x: -20 //center
			},
			subtitle: {
				text: 'Source: '+current_indicator_name,
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
				//valueSuffix: '°C'
			},
			legend: {
				//layout: 'vertical',
				align: 'center',
				verticalAlign: 'bottom',
				borderWidth: 0
			},
			series: serie_values
		}

		lineChart_init = new Highcharts.Chart(CharLineOp);
		$("#igraphics .pos_loader_data").addClass("hddn");
	});
}

function loadAllCharts(){
	loadPieChart();
	loadMapChart();	
	loadSpiderChart();
	loadLineChart();
	$("[data-localize]").localize("lang/lp_labels", { language: lang });
}

loadAllCharts();