// all data from boston_for_sale.csv
var data_for_sale = new Array();
// all data from boston_sold.csv
var data_sold = new Array();
// references which array the user is working with at any moment
var selected_array = new Array();

// the sum of all home prices for each zip code in our data set
var prices = new Array();
// the sum of all home zestimates for each zip code in our data set
var zestimates = new Array();
// the count of all home listings for each zip code in our data set
var counts = new Array();
// the max home price for each zip code in our data set
var maxes = new Array();
// the min home price for each zip code in our data set
var mins = new Array();

// our zip code lookup values in json format data set (includes geo coordinates)
var zips = "";

// contains the google maps circles to be overlaid on our map
var circles = new Array();

// google maps map container
var map = "";

// last selected bedroom checkbox
var last_bedroom_checked = "";

// last selected baths checkbox
var last_bath_checked = "";

/** creates the google map and calls for the circles to be created */
function drawMap() {
	// map options to initialize with
	var mapOptions = {
	// the terrain map is initially centered at boston with a zoom level of 13
	center: new google.maps.LatLng(42.3583, -71.0603),
	zoom: 13,
	mapTypeId: google.maps.MapTypeId.TERRAIN
	};
	
	// map references the corresponding div placeholder
	map = new google.maps.Map(document.getElementById("map-canvas"),
	mapOptions);
	
	// plot the intensity circles on the map
	layCircles();
}

/** sets the object of the last bedroom checkbox checked to a variable */
function lastBedroomChecked(checkbox) {
	last_bedroom_checked = checkbox;
}

/** sets the object of the last bathroom checkbox checked to a variable */
function lastBathroomChecked(checkbox) {
	last_bathroom_checked = checkbox;
}

/** filters the data based on selected controls and calls for a "redraw" of the map */
function filter() {
	// clear all output arrays
	clearBuckets();
	
	// get all checkboxes from our controls
	var checkboxes = document.getElementsByTagName("input");
	
	// numbers of bedrooms selected
	var bedrooms = new Array();
	// numbers of baths selected
	var baths = new Array();
	
	// value of minimum sqft entered by user
	var min_sqft = document.getElementById("min_sqft").value;
	// value of maximum sqft entered by user
	var max_sqft = document.getElementById("max_sqft").value;
	
	// value of minimum year entered by user
	var min_year = document.getElementById("min_year").value;
	// value of maximum year entered by user
	var max_year = document.getElementById("max_year").value;
	
	// references the "for sale" radio button
	var for_sale = document.getElementById("forsale");
	// references the "sold" radio button
	var sold = document.getElementById("sold");

	// selected_array will take a copy of either the "for sale" array or the "sold array" based on user input
	if (for_sale.checked == true) {
		selected_array = data_for_sale;
		} else if(sold.checked == true){
		selected_array = data_sold;
	}

	// sqft validation
	if (min_sqft >= max_sqft) {
		document.getElementById("min_sqft").value = max_sqft;
	} 
	if (min_sqft < 0) { 
		document.getElementById("min_sqft").value = 0; 
	}
	if (max_sqft < 0) { 
		document.getElementById("max_sqft").value = 0; 
	}

	// year built validation
	if (min_year >= max_year) {
		document.getElementById("min_year").value = max_year;
	} 
	if (min_year < 0) { 
		document.getElementById("min_year").value = 0; 
	}
	if (max_year < 0) { 
		document.getElementById("max_year").value = 0; 
	}

	var count = 0;
	
	// populate bedrooms array
	for(var i in checkboxes) {
		if(checkboxes[i].className == "bedrooms") { 
			if(checkboxes[i].checked) {
				bedrooms.push(checkboxes[i].value);
				count++;
			}
		}
	}
	
	// re-check last bedroom that was unchecked and apply filter again
	if(count == 0) {
		last_bedroom_checked.checked = true;
		filter();
	}

	count = 0;
	
	// populate baths array
	for(var i in checkboxes) {
		if(checkboxes[i].className == "baths") { 
			if(checkboxes[i].checked) {
				baths.push(checkboxes[i].value);
				count++;
			}
		}
	}
	
	// re-check last bathroom that was unchecked and apply filter again
	if(count == 0) {
		last_bathroom_checked.checked = true;
		filter();
	}

	// populate output arrays based on filter variables
	loadBuckets(selected_array,bedrooms,baths,min_sqft,max_sqft,min_year,max_year);
	
	// draw circles on map
	layCircles();
	
	// clear out details on demand div
	document.getElementById("details").innerHTML = "";
	
	// clear out bullet graph
	document.getElementById("bullet").innerHTML = "";
}

/** draws the circles onto the google map */
function layCircles() {
	// removes existing circles (if any) off the map
	clearCircles();
	
	// based on our zip code lookup data set
	for(i=0;i<zips.values.length;i++) {
		// create a google latlng object for selected zip code
		var latlng = new google.maps.LatLng(parseFloat(zips.values[i].lat),parseFloat(zips.values[i].lng));
		// set the radius of the circle based on the selected control
		var radius = getRadius(zips.values[i].zip);
		// create a new google maps circle object with given geo coordinates and radius
		var circle = new google.maps.Circle({
						  center: latlng,
						  map: map,
						  radius:radius,
						  fillColor:"#E34A33",
						  strokeColor:"black",
						  fillOpacity:0.65,
						  strokeWeight:1.5
		});

		// add an event listener to each circle to enable details on demand
		google.maps.event.addListener(circle,'click', selectZip(circle,zips.values[i].zip,circles));
		
		// add the newly created circle to an array, so that we can later track it and manipulate it
		circles.push(circle);
	}
}

/** 
	callback function when clicking on a google map circle (i.e. zip code) 
	colors the selected circle and maintains the same color for the other circles on the map
*/
function selectZip(circle,zip,circles) {
	// the anonymous function was needed to have the callback work with the event listener
	return function() {
		// remove all google map circles off our map, change their color, and then add them back to the map
		for(var i in circles) {
		circles[i].setMap(null);
		circles[i].fillColor = "#E34A33";
		circles[i].setMap(map);
	}
	
	// remove selected circle off the map
	circle.setMap(null);
	// change the color of the selected circle
	circle.fillColor = "blue";
	// put the circle back on the map
	circle.setMap(map);
	
	// output details on demand in designated div
	showDetails(zip);
	
	// create bullet graph
	bulletGraph(zip);
	
	//PASS THE ZIP CODE TO SCATTER PLOT BELOW
	//mikesFunction(zip);
	}
}

/** loads the details of the zip code into the designated div */
function showDetails(zip) {
	document.getElementById("details").innerHTML = getDetails(zip);
}

/** 
	return dollar amounts to contain commas 
	Borrowed from: http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
*/
function withCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** returns html markup for details on demand, based on user input */
function getDetails(zip) {
	var text = "<span class='label'>Zip Code: </span><span class='value'>" + zip + "</span>";
	if(document.getElementById("count").checked) {
		var num_listings = text + "<br />" + "<span class='label'>Number of listings:</span> " + "<span class='value'>" + counts[zip] + "</span>";
		return num_listings;
	} else if (document.getElementById("average").checked) {
		var average = text + "<br /><span class='label'>" + "Average price:</span> " + "<span class='value'>$" + withCommas(parseInt(prices[zip]/counts[zip])) + "</span>";
		return average;
	} else if (document.getElementById("max").checked) {
		var maximum = text + "<br /><span class='label'>" + "Maximum price:</span> " + "<span class='value'>$" + withCommas(maxes[zip]) + "</span>";
		return maximum;
	} else if (document.getElementById("min").checked) {
		var minimum = text + "<br /><span class='label'>" + "Minimum price:</span> " + "<span class='value'>$" + withCommas(mins[zip]) + "</span>";
		return minimum;
	}
}

/** returns radius length to be applied to each circle on the google map */
function getRadius(zip) {
	// note that here, we tried d3 scaling; the results were off - hence our decision to manually scale the radii of the circles
	
	if(document.getElementById("count").checked) {
		var num_listings = counts[zip];
		return num_listings;
	} else if (document.getElementById("average").checked) {
		// we multiply all price figures by 100 so that the circles are visible to the user with given zoom level
		var average = ((prices[zip]/counts[zip])/1000000) * 100;
		return average;
	} else if (document.getElementById("max").checked) {
		// we multiply all price figures by 100 so that the circles are visible to the user with given zoom level
		var maximum = ((maxes[zip]/counts[zip])/1000000) * 100;
		return maximum;
	} else if (document.getElementById("min").checked) {
		// we multiply all price figures by 100 so that the circles are visible to the user with given zoom level
		var minimum = ((mins[zip]/counts[zip])/1000000) * 100;
		return minimum;
	}
}

/** clears all the google map circles off the map */
function clearCircles() {
	for(var circle in circles) {
		// remove circle off map
		circles[circle].setMap(null);
	}
	
	// reset circles array so that we can repopulate it
	circles = new Array();
}

/** loads all of our content from 2 csv files */
function initialize() {
	d3.csv("boston_for_sale.csv", function(d) {
		// populate the zips from the json object in our hidden text area
		zips = JSON.parse(document.getElementById("zips").value);
		// populate "homes for sale" array
		data_for_sale = d;
		// calls for map to be drawn, since this is our default option
		drawMap();
		// calls all filters to be applied to newly created map
		filter();
	});

	d3.csv("boston_sold.csv", function(d) {
		// populate "homes sold" array
		data_sold = d;
	});
}

/** clears all of our output arrays */
function clearBuckets() {
	prices = [];
	zestimates = [];
	counts = [];
	maxes = [];
	mins = [];		
}

/** load a given home listing into the corresponding output arrays */
function loadListing(zip,price,zestimate) {
	// if the zip code for this home has not been registered yet
	if(prices[zip] == null) {
		prices[zip] = 0;
		zestimates[zip] = 0;
		counts[zip] = 0;
		maxes[zip] = 0;
		mins[zip] = 100000000;
		prices[zip] = parseInt(prices[zip]) + parseInt(price);
		zestimates[zip] = parseInt(zestimates[zip]) + parseInt(zestimate);
		counts[zip]++;
		if(mins[zip] >= parseInt(price)) {
			mins[zip] = parseInt(price);
		}
		if(maxes[zip] <= parseInt(price)) {
			maxes[zip] = parseInt(price);
		}
	// if this zip code for this home already exists in our arrays
	} else {
		prices[zip] = parseInt(prices[zip]) + parseInt(price);
		zestimates[zip] = parseInt(zestimates[zip]) + parseInt(zestimate);
		counts[zip]++;
		if(mins[zip] >= parseInt(price)) {
			mins[zip] = parseInt(price);
		}
		if(maxes[zip] <= parseInt(price)) {
			maxes[zip] = parseInt(price);
		}
	}		
}

/** populates our output arrays given the set of filters selected by user */
function loadBuckets(d,beds,baths,min_sqft,max_sqft,min_year,max_year) {
	// flags if at least 1 bedroom has been selected
	var bed_criterion = 0;
	// flags if at least 1 bathroom has been selected
	var bath_criterion = 0;
	// flags if squared footage has been selected
	var sqft_criterion = 0;
	// flags if at least 1 year has been selected
	var year_criterion = 0;

	// for each home listing in the selected array
	for (var listing in selected_array) {
		// check how many bedrooms were selected
		for (var bed in beds) {
			if(parseInt(beds[bed]) == parseInt(selected_array[listing].beds)) {
				bed_criterion = 1;
			} else if(parseInt(beds[bed]) == "5+" && parseInt(selected_array[listing].beds) >= 6) {
				bed_criterion = 1;
			} 
		}
		
		// check how many baths were selected
		for (var bath in baths) {
			if(parseInt(baths[bath]) == Math.floor(parseInt(selected_array[listing].baths))) {
				bath_criterion = 1;
			} else if(parseInt(baths[bath]) == "5+" && parseInt(selected_array[listing].baths) >= 6) {
				bath_criterion = 1;
			} 
		}

		// check if home listing falls within selected squared footage range
		if (parseInt(selected_array[listing].sqft) >= parseInt(min_sqft) && parseInt(selected_array[listing].sqft) <= parseInt(max_sqft)) {
			sqft_criterion = 1;
		}

		// check if home listing falls within selected year built range
		if (parseInt(selected_array[listing].yearbuilt) >= parseInt(min_year) && parseInt(selected_array[listing].yearbuilt) <= parseInt(max_year)) {
			year_criterion = 1;
		}

		// check if the necessary filters were selected to cause a meaningful query
		if (bed_criterion == 1 && bath_criterion == 1 && sqft_criterion == 1 && year_criterion == 1) {
			loadListing(selected_array[listing].zip,selected_array[listing].price,selected_array[listing].zestimate);
		} 

		// reset criteria flags
		bed_criterion = 0;
		bath_criterion = 0;
		sqft_criterion = 0;
		year_criterion = 0;
	}
}

/** create a bullet graph of actual versus project price based on selected zip code */
function bulletGraph(zip) {
	// remove the "actual" bar
	d3.select(".actual").remove();
	// remove the "zestimate" bar
	d3.select(".zestimate").remove();
	// remove the "max" bar
	d3.select(".max").remove();
	// scale our range to maximum price of selected zip, and the range to the width of the bullet graph
	var scale =	d3.scale.linear().domain([0,maxes[zip]]).range([0,400]);
	// scale actual price amount
	price = scale(parseInt(parseInt(prices[zip])/parseInt(counts[zip])));
	// scale max value per selected zip
	max = scale(parseInt(maxes[zip]));
	// scale zestimate amount
	zestimate = scale(parseInt(parseInt(zestimates[zip])/parseInt(counts[zip])));
	// price data array to be passed to d3
	price = [price];
	// zestimate data array to be passed to d3
	zestimate = [zestimate];
	// max data array to be passed to d3
	max = [max];
	// add animated bars to bullet graph with set parameters
	d3.select("#bullet").selectAll("div").data(zestimate).enter().append("div").attr("class","actual").transition().duration(600).style("width",function(d){return d+"px"}).text("actual");
	d3.select("#bullet").data(price).append("div").attr("class","zestimate").transition().duration(1000).style("width",function(d){return d+"px"}).text("zestimate");
	d3.select("#bullet").data(max).append("div").attr("class","max").transition().duration(1300).style("width",function(d){return d+"px"}).text("max");
	
}