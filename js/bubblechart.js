// Execute script when window is loaded
window.onload = function(){
    
    // SVG dimension variables
    var w = 900, h = 500;

    // Container block
    var container = d3.select("body") // Get the <body> element from the DOM
        .append("svg") // Put a new svg in the body
        .attr("width", w) // Assign the width
        .attr("height", h) // Assign the height
        .attr("class", "container") // Always assign a class (as the block name) for styling and future selection
        .style("background-color", "rgba(0,0,0,0.2)"); // Only put a semicolon at the end of the block
    
    // InnerRect block
    var innerRect = container.append("rect") // Put a new rect in the svg
        .datum(400) // A single value is a datum
        .attr("width", function(d){ // Rectangle width
            return d * 2; //400 * 2 = 800
        }) 
        .attr("height", function(d){ // Rectangle height
            return d; //400
        })
        .attr("class", "innerRect") // Class name
        .attr("x", 50) // Position from left on the x (horizontal) axis
        .attr("y", 50) // Position from top on the y (vertical) axis
        .style("fill", "#FFFFFF"); // Fill color
    
    var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];
    
    var x = d3.scaleLinear() // Create the scale
        .range([90, 740]) // Output min and max
        .domain([0, 3]); // Input min and max
    
    // Find the minimum value of the array
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    // Find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

    // Scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50]) 
        .domain([0, 700000]); 
    
    // Color scale generator 
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop, 
            maxPop
        ]);
    
    // Create y axis generator
    var yAxis = d3.axisLeft(y);
    
    // Create axis g element and add axis
    var axis = container.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50, 0)")
        .call(yAxis);
    
    // Create a text element and add the title
    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");
    
    // Create circle labels
    var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            // Vertical position centered on each circle
            return y(d.population);
        });

    // First line of label
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            // Horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .text(function(d){
            return d.city;
        });

    // Create format generator
    var format = d3.format(",");

    // Second line of label
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 5;
        })
        .attr("dy", "15") // Vertical offset
        .text(function(d){
            return "Pop. " + format(d.population); // Use format generator to format numbers
        });
    
    // Create circles
    var circles = container.selectAll(".circles") // Create an empty selection
        .data(cityPop) // Here we feed in an array
        .enter() // One of the great mysteries of the universe
        .append("circle") // Inspect the HTML--holy crap, there's some circles there
        .attr("class", "circles")
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){
            // Calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){
            // Use the index to place each circle horizontally
            return x(i);
        })
        .attr("cy", function(d){
            // Use the y scale to map the population values to the appropriate y coordinate
            return y(d.population);
        })
        .style("fill", function(d, i){ // Add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000"); // Black circle stroke
    
};
