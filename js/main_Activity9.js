// Begin script when window loads
window.onload = setMap();

// Set up choropleth map
function setMap(){
    
    // Map frame dimensions
    var width = 960,
        height = 460;

    // Create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    // Create equal area projection centered on US
    var projection = d3.geoAzimuthalEqualArea()
        .center([-3, 39])
        .rotate([104, -10, 0])
        .scale(452)
        .translate([width/2, height/2]);

    // Create a path generator
    var path = d3.geoPath()
        .projection(projection);

    // Use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/MentalDistress_65orOlder.csv")); // Load attributes from csv    
    promises.push(d3.json("data/US_States.topojson")); // Load spatial data    
    Promise.all(promises).then(callback);

    // Callback function
    function callback(data) {
        
        var csvData = data[0],
            states = data[1];
        
        var US_States = topojson.feature(states, states.objects.US_States).features;

        // Create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); // Place graticule lines every 5 degrees of longitude and latitude

        // Create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) // Bind graticule background
            .attr("class", "gratBackground") // Assign class for styling
            .attr("d", path) // Project graticule

        // Create graticule lines
        var gratLines = map.selectAll(".gratLines") // Select graticule elements that will be created
            .data(graticule.lines()) // Bind graticule lines to each element to be created
            .enter() // Create an element for each datum
            .append("path") // Append each element to the svg as a path element
            .attr("class", "gratLines") // Assign class for styling
            .attr("d", path); // Project graticule lines

        // Add US region to map
        var regions = map.selectAll(".states")
            .data(US_States)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.NAME;
            })
            .attr("d", path);


    };
}