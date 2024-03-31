// Wrap everything in a self-executing anonymous function to move to local scope
(function() {
    
    // Variables for data join
    var attrArray = ["2015", "2016", "2017", "2018", "2019", "2020", "2021"];
    
    // Initial attribute to be displayed
    var expressed = attrArray[0];
    
    // Dimensions for the chart
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460,
        leftPadding = 30,
        rightPadding = 3,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    // Create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([460, 0]) // Mapping data values to pixel values within the chart height
        .domain([0, 13]); // Data range for the y-axis

    // Begin script when window loads
    window.onload = setMap;

    
    // Set up choropleth map
    function setMap(){

        // Map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;

        // Create new svg container for the map
        var map = d3.select(".mapContainer")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        // Create equal area projection centered on US
        var projection = d3.geoAlbersUsa()
            .scale(800)
            .translate([width/2, height/2]);

        // Create the path generator
        var path = d3.geoPath()
            .projection(projection);

        // Use Promise.all to parallelize asynchronous data loading
        var promises = [    
            d3.csv("data/MentalDistress_65orOlder.csv"), // Load attributes from csv    
            d3.json("data/US_States.topojson") // Load spatial data
        ];
        Promise.all(promises).then(callback);

        
        // Callback function to handle data once it's loaded
        function callback(data) {
            var csvData = data[0], // CSV data with attribute values
            stateData = data[1]; // TopoJSON data for state boundaries

            // Converting TopoJSON data to GeoJSON format
            var us_States = topojson.feature(stateData, stateData.objects.US_States).features;

            // Joining CSV data with GeoJSON data
            us_States = joinData(us_States, csvData);

            // Creating a color scale for mapping attribute values to colors
            var colorScale = makeColorScale(csvData);

            // Setting up the map with colored enumeration units
            setEnumerationUnits(us_States, map, path, colorScale);

            // Creating and setting up the chart based on CSV data and color scale
            setChart(csvData, colorScale);
            
            // Creating a dropdown menu for attribute selection
            createDropdown(csvData);
        }
    }

    
    // Function to create a color scale based on attribute values
    function makeColorScale(data) {
        
        // Array of color classes for the map legend
        var colorClasses = [
            "#f1eef6",
            "#bdc9e1",
            "#74a9cf",
            "#2b8cbe",
            "#045a8d"
        ];

        // Creating a quantile scale to map attribute values to colors
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        // Creating an array of attribute values from the data
        var domainArray = data.map(item => parseFloat(item[expressed]));

        // Setting the domain of the color scale based on attribute values
        colorScale.domain(domainArray);

        // Returning the color scale
        return colorScale;
    }

    
    // Function to join CSV data with GeoJSON data based on a common key
    function joinData(us_States, csvData) {
        
        for (var i = 0; i < csvData.length; i++) {
            var csvState = csvData[i];
            var csvKey = csvState.NAME;

            for (var a = 0; a < us_States.length; a++) {
                var geojsonProps = us_States[a].properties;
                var geojsonKey = geojsonProps.NAME;

                // Matching the common key between CSV and GeoJSON data
                if (geojsonKey == csvKey) {
                    // Loop through each attribute in the attribute array
                    attrArray.forEach(function(attr) {
                        var val = parseFloat(csvState[attr]);
                        geojsonProps[attr] = val;
                    });
                }
            }
        }
        return us_States; // Returning the joined data
    }

    
    // Function to set up the map enumeration units
    function setEnumerationUnits(us_States, map, path, colorScale) {
        
        // Selecting all paths representing states and binding GeoJSON data
        var states = map.selectAll(".state")
            .data(us_States)
            .enter()
            .append("path") // Setting the path using the projection
            .attr("class", function(d){return "state " + d.properties.NAME;})
            .attr("d", path)
            .style("fill", function(d) {
                var value = d.properties[expressed];
                
                if(value >= 0) {return colorScale(d.properties[expressed]);}
                    else {return "#ccc";} // Filling with color based on attribute value
            })
            .on("mouseover", function(event, d) {
                highlight(d); // Highlight state on mouseover
            })
            .on("mouseout", function(event, d){
                dehighlight(d); // Remove highlight on mouseout
             })
        .on("mousemove", moveLabel); // Move data label on mousemove
    }        

    
    // Function to set up the chart based on CSV data and color scale
    function setChart(csvData, colorScale) {
        // Creating an SVG element to hold the chart
        var chart = d3.select(".chartContainer")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        // Creating and styling bars for the chart
        var bars = chart.selectAll(".bar")
            .data(csvData)
            .enter()
            .append("rect")
            .sort((a, b) => b[expressed] - a[expressed]) // Sorting bars in descending order
            .attr("class", d => "bar id-" + d.NAME) // Assigning classes for styling and identification
            .attr("width", chartInnerWidth / csvData.length-3)
            .attr("x", (d, i) => i * (chartInnerWidth / csvData.length) + leftPadding) // Positioning bars horizontally
            .attr("height", d => chartInnerHeight - yScale(parseFloat(d[expressed]))) // Setting bar heights
            .attr("y", d => yScale(parseFloat(d[expressed])) + topBottomPadding) // Positioning bars vertically
            .style("fill", d => colorScale(d[expressed])) // Filling bars with color based on attribute value
            .on("mouseover", function(event, d){
                highlight(d); // Highlight associated map feature on mouseover
            })
            .on("mouseout", function(event, d){
                dehighlight(d); // Remove highlight on mouseout
            })
            .on("mousemove", moveLabel); // Move data label on mousemove

        // Creating and adding the y-axis to the chart
        var yAxis = d3.axisLeft()
            .scale(yScale);

        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        // Adding a frame around the chart
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("transform", translate);

        // Adding a title to the chart
        var chartTitle = chart.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", 30)
            .attr("class", "chartTitle")
            .attr("text-anchor", "middle")
            .text("2015");
    }

    
    // Function to create a dropdown menu for attribute selection
    function createDropdown(csvData) {
        
        var dropdown = d3.select(".dropdownContainer")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function() {
                changeAttribute(this.value, csvData); // Call function on attribute change
            });

        // Adding an option for selecting attributes
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Year");

        // Adding options for each attribute in the attribute array
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);
    }

    
    // Function to change the displayed attribute and update the chart
    function changeAttribute(attribute, csvData) {
        
        expressed = attribute; // Update the currently displayed attribute
        var colorScale = makeColorScale(csvData); // Recreate the color scale based on new attribute
        yScale.domain([0,13]); // Update the y-scale domain

        // Transition to update map state colors based on the current attribute
        d3.selectAll(".states")
            .transition()
            .duration(1000)
            .style("fill", d => {
                var value = d.properties[expressed];
                return value ? colorScale(value) : "#ccc";
            });

        // Transition to update and sort bars in the chart
        d3.selectAll(".bar")
            .sort((a, b) => b[expressed] - a[expressed])
            .transition()
            .delay((d, i) => i * 20)
            .duration(1000)
            .attr("x", (d, i) => i * (chartInnerWidth / csvData.length) + leftPadding)
            .attr("height", d => chartInnerHeight - yScale(parseFloat(d[expressed])))
            .attr("y", d => yScale(parseFloat(d[expressed])) + topBottomPadding)
            .style("fill", d => colorScale(d[expressed]));

        // Updating the y-axis with transitions
        var yAxis = d3.axisLeft()
            .scale(yScale);

        d3.selectAll(".axis")
            .call(yAxis);

        // Updating the chart title with the current displayed attribute
        var chartTitle = d3.select(".chartTitle")
        .text(expressed); // Update the chart title text
    }

    
    // Function to highlight a map feature and its corresponding bar
    function highlight(d) {
        
        // Get the right properties object based on the data structure
        var props = d.properties ? d.properties : d;
      
        // Highlight the state on the map using class selection
        d3.selectAll(".state." + props.NAME)
            .style("stroke", "red")
            .style("stroke-width", "2");

        // Highlight the corresponding bar using class selection
        d3.selectAll(".bar.id-" + props.NAME)
            .style("stroke", "red")
            .style("stroke-width", "2");

        setLabel(props);
    }


    // Function to remove the highlight from a map feature and its corresponding bar
    function dehighlight(d) {
        
        // Get the right properties object based on the data structure
        var props = d.properties ? d.properties : d;
        var name = props.NAME;

        if (name) {
            // Reset the state outlines to default
            d3.selectAll("." + props.NAME)
                .style("stroke", null) 
                .style("stroke-width", null);

            // Reset the bar outlines to default
            d3.selectAll(".bar.id-" + props.NAME)
                .style("stroke", null) 
                .style("stroke-width", null);
        }

        // Remove the info label
        d3.select(".infolabel").remove();
    }

    
    // Function to create dynamic label
    function setLabel(props){
        
        // Label content based on the selected attribute
        var labelAttribute = "<h1>" + props[expressed] + "%";

        // Create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.NAME + "_label")
            .html(labelAttribute);

        // Adding the state name to the label
        var stateName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.NAME);
    }

    
    // Function to move info label with mouse
    function moveLabel(){
        
        // Get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        // Use coordinates of mousemove event to set label coordinates
        var x1 = event.clientX + 10,
            y1 = event.clientY - 75,
            x2 = event.clientX - labelWidth - 10,
            y2 = event.clientY + 25;

        // Horizontal label coordinate, testing for overflow
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        
        // Vertical label coordinate, testing for overflow
        var y = event.clientY < 75 ? y2 : y1; 

        // Move the info label to the calculated coordinates
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    }
    
})();
