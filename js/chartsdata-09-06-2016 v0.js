//CURRENT COUNTRY ISO3 CODE
var current_country_iso3 = "TZA";//"CHN";//"BWA"; //Tanzania
var country_URL_root = "http://data.landportal.info/geo/";
var current_country_URL = country_URL_root + current_country_iso3;
var series_color = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];
var query_pie_URL;
var query_map_URL;
var query_spider_URL;
var query_line_URL;

//VARIABLES DE FORMULARIOS
//AÑO SELECCIONADO EN EL MAPA
var map_current_year;
//URL DEL INDICADOR SELECCIONADO EN EL MAPA
var map_selected_indicator_URL;
//PAISES COMPARADOS EN EL GRÁFICO DE LÍNEAS
var current_compared_countries_iso3 = new Array();
current_compared_countries_iso3 = [current_country_iso3];
//RANGO DE AÑOS COMPARADOS EN EL GRÁFICO DE LÍNEAS
var current_range_years_selected = new Array();
//URL DEL INDICADOR SELECCIONADO EN EL GRÁFICO DE LÍNEAS
var line_selected_indicator_URL;
//FIN DE VARIABLES DE FORMULARIO

//VALORES DE EJEMPLO (HAN DE CARGARSE DESDE LOS FORMULARIOS DE SELECIÓN
map_current_year = "2000";
//current_compared_countries_iso3 = ["TZA", "BWA", "CHN"];
current_range_years_selected = [2000, 2008];//
map_selected_indicator_URL = 'http://data.landportal.info/indicator/FAO-23045-6083'; 
line_selected_indicator_URL = 'http://data.landportal.info/indicator/FAO-23045-6083'; 
//FIN VALORES DE EJEMPLO

function setDataURLs(){
	//SPARQL Querys
	var query_prefix = 'PREFIX cex: <http://purl.org/weso/ontology/computex#> ' +
	'PREFIX time: <http://www.w3.org/2006/time#> ' +
	'PREFIX ex: <http://www.example.org/rdf#> ';

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

	var query_map_chart =  query_prefix +
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
	var URL_prefix = 'http://landportal.info/sparql?default-graph-uri=&query=';
	var URL_suffix = '&should-sponge=&format=json&timeout=0&debug=on';
	query_pie_URL = URL_prefix + encodeURIComponent(query_pie_chart) + URL_suffix;
	query_map_URL = URL_prefix + encodeURIComponent(query_map_chart) + URL_suffix;
	query_spider_URL = URL_prefix + encodeURIComponent(query_spider_chart) + URL_suffix;
	query_line_URL = URL_prefix + encodeURIComponent(query_line_chart) + URL_suffix;
}
setDataURLs();
//console.log(query_pie_URL);
//console.log(query_map_URL);
//console.log(query_spider_URL);
//console.log(query_line_URL);

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
	$.getJSON(query_map_URL, function (data) {
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
	      name: map_selected_indicator_URL,
	      states: {
	        hover: {
	          color: '#BADA55'
	        },
	        select: {
	          color: '#B1D748',
	          borderColor: '#F5A623',
	          borderWidth: 2
	        }
	      },
	      tooltip: {
	        pointFormat: '{point.name} <b>' + '{point.value}'.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</b>',
	        //valueSuffix: '/km²'
	      }
	    }]

	  });

	  $('#wrapper-mapping').highcharts().get(current_country_iso3).select();
	  //$('#wrapper-mapping').highcharts().get(country).zoomTo();
	  //$('#wrapper-mapping').highcharts().mapZoom(12);

	});
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
				case "sigiTo100":	serie_name = "SIG";
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
					//console.log("pusheando null...");
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
				text: 'Source: landportal.com',
				x: -20
			},
			xAxis: {
				categories: serie_categories
			},
			yAxis: {
				title: {
					text: 'Label yAxis'
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
	});
}

function loadAllCharts(){
	loadPieChart();
	loadMapChart();	
	loadSpiderChart();
	loadLineChart();
}

loadAllCharts();