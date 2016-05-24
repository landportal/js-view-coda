	//Smoth scroll to anchor
	$(function() {
		$('a[href*="#"]:not([href="#"])').click(function() {
		    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
		      var target = $(this.hash);
		      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
		      if (target.length) {
		        $('html, body').animate({
		          scrollTop: target.offset().top
		        }, 1000);
		        return false;
		      }
		    }
		});
	});
	

	//Funcion para recoger las variables de la URL
	function getUrlVars() {
    	var vars = {};
    	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        	vars[key] = value;
    	});
    	return vars;
	}

	var country = getUrlVars()["country"];
	var lang = getUrlVars()["lang"];

	var country = "TZ";


	//Generamos colores al azar con la librería d3
	var color = d3.scale.category10();
	var anumber = Math.floor((Math.random() * 10) + 1);

	//##Inicializamos todas las graficas

	//## MAP LOCATION CHART
	// var jsonCountries = 'json/countries.json'
	// $.ajax({
	//       async: false,
	//       type: "GET",
	//       url: jsonCountries,
	//       dataType: "json",
	//       success : function(data) {
	//           data.id = data.code;
	//           window.countries = data;
	//     }
	// });

	$.getJSON('json/countries.json', function(data) {
	 
	  // var data = [{
	  //   "color": "#a3c642",
	  //   "code": "ES"
	  // }];
	  
	  $.each(data, function() {
	    this.id = this.code;
	    console.log(this.code);
	  });


	  $('#wrapper-map-location').highcharts('Map', {
	    chart: {
	      backgroundColor: '#ffffff',
	      margin: 0
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
	      min: 1,
	      max: 1000,
	      minorTickLength: 0,
	      type: 'logarithmic',
	      maxColor: "#bbd6d8",
	      minColor: "#bbd6d8"
	    },

	    series: [{
	      data: data,
	      //id: window.countries.code,
	      allowPointSelect: true,
	      nullColor: '#bbd6d8',
	      borderColor: 'white',
	      mapData: Highcharts.maps['custom/world'],
	      joinBy: ['iso-a2', 'code'],
	      name: 'Country',
	      states: {
	        hover: {
	          color: '#BADA55'
	        },
	        select: {
	          color: '#A3C642',
	          //borderColor: '#F5A623',
	          //borderWidth: 2
	        }
	      },
	      tooltip: {
	        pointFormat: '{point.name}',
	        //valueSuffix: '/km²'
	      }
	    }]
	  });

	  $('#wrapper-map-location').highcharts().get(country).zoomTo();
	  $('#wrapper-map-location').highcharts().get(country).select();
	  $('#wrapper-map-location').highcharts().mapZoom(3);
	
	});


	//## LINE CHART
	var lineChart_init;
	var $divIgraphics = $('#wrapper-igraphics');
	var CharLineOp = {
	  chart: {
	      backgroundColor: "transparent",
	      renderTo: $divIgraphics[0],
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
	        categories: ['2004', '2005', '2006', '2007', '2008', '2009',
	            '2010', '2011', '2012', '2013', '2014', '2015']
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
	    series: [{
	        name: country,
	        data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
	        color : color(0) //randomColor({luminosity: 'dark',hue:'random'}) //d3.scale.category20b()
	    }, {
	        name: 'Colombia',
	        data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5],
	        color : color(1) //randomColor({luminosity: 'dark',hue:'random'})
	    }, {
	        name: 'Kenya',
	        data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0],
	        color : color(2)//randomColor({luminosity: 'dark',hue:'random'})
	    }, {
	        name: 'Uganda',
	        data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8],
	        color : color(3) //randomColor({luminosity: 'dark',hue:'random'})
	    }]
	}

	lineChart_init = new Highcharts.Chart(CharLineOp);


	//#Mapping graph
	$.getJSON('json/countries.json', function(data) {
	  // var data = [{
	  //   "color": "#a3c642",
	  //   "code": "ES"
	  // }];

	  $.each(data, function() {
	    this.id = this.code;
	  });

	  $('#wrapper-mapping').highcharts('Map', {
	    chart: {
	      backgroundColor: '#ffffff',
	      margin: 0,

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
	      min: 1,
	      max: 1000,
	      minorTickLength: 0,
	      type: 'logarithmic',
	      maxColor: "#B1D748",
	      minColor: "#D9ED7E"
	    },

	    series: [{
	      data: data,
	      allowPointSelect: true,
	      nullColor: '#bbd6d8',
	      borderColor: 'white',
	      mapData: Highcharts.maps['custom/world'],
	      joinBy: ['iso-a2', 'code'],
	      name: 'Country',
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
	        pointFormat: '{point.name}',
	        //valueSuffix: '/km²'
	      }
	    }]

	  });

	  $('#wrapper-mapping').highcharts().get(country).select();
	  $('#wrapper-mapping').highcharts().get(country).zoomTo();
	  $('#wrapper-mapping').highcharts().mapZoom(12);

	});



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
        title: {
            text: '<div class="txt-m displayb txt-c">Total land area: 2183 min ha <span class="displayb c-g40">2015</span></div>',
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
            data: [{
                name: 'No data',
                y: 56.33,
                color : color(0)
            }, {
                name: 'High inequality',
                y: 24.03,
                selected: true,
                sliced: true,
                color : color(1)
            }, {
                name: 'Mid inequality',
                y: 10.38,
                color : color(2)
            }, {
                name: 'Low inequality',
                y: 4.77,
                color : color(3)
            }]
        }]
    };

	pieChart_init = new Highcharts.Chart(CharPieOp);


    //#Spider chart
    var spiderChart_init;
	var $divSpider = $('#wrapper-spiderchart');
	var CharSpiderOp = {
        chart: {
            polar: true,
            type: 'line',
            renderTo: $divSpider[0],
            backgroundColor: 'transparent'
        },

        title: {
            text: '<div class="txt-m displayb txt-c">Main Index Ranking <span class="displayb c-g40">2015</span></div>',
            useHTML: true
        },

        pane: {
            size: '80%'
        },

        xAxis: {
            categories: ['SIGI', 'GINI Index', 'HDI',
                    'GHI'],
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
            pointFormat: '<span style="color:{series.color}">{series.name}: <b>${point.y:,.0f}</b><br/>'
        },

        legend: {
           // align: 'right',
            //verticalAlign: 'top',
            //y: 70,
            //layout: 'vertical'
        },

        series: [{
            name: 'Tanzania',
            data: [1, 84, 1, 58],
            pointPlacement: 'on'
        }]
    };

    spiderChart_init = new Highcharts.Chart(CharSpiderOp);
