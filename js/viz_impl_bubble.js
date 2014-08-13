/**
 * Created by Kevin on 8/12/2014.
 */

// BUBBLE VISUALIZATION
function bubble_viz(cgipath, targetdiv, sizeParams){
    this.cgipath = cgipath;
    this.targetdiv = targetdiv;
    this.params = null;
    this.targetdivhash = "#" + targetdiv;

    // Set query parameters
    this.setParams = function(params){
        this.params = params;
    };

    // Clear all Appended Elements from the page
    this.removeAllElements = function(){
        $("#bubblehoverdetail").remove();
    };

    // Get Corridor list
    var corrnamelist = {};
    $.getJSON(this.cgipath + "?method=getcorridor", function(data) {
        $.each(data, function(k, v) {
             corrnamelist[v['name']] = 0;
        });
    });

    if(sizeParams != null){
        var w = sizeParams.width,
        h = sizeParams.height,
        r = sizeParams.radius,
        x = d3.scale.linear().range([0, r]),
        y = d3.scale.linear().range([0, r]),
        node,
        root;
    }
    else{
        var w = 1280,
        h = 800,
        r = 720,
        x = d3.scale.linear().range([0, r]),
        y = d3.scale.linear().range([0, r]),
        node,
        root;
    }

    this.h = h;
    this.r = r;
    this.w = w;
    this.x = x;
    this.y = y;

    var nodes = null;

    // Plot Generation process
    this.generate = function(){
        if(this.params == null){
            console.log("Call setParams first before calling generate function.");
        }

        loading_indicator_trigger();
        var time_start = this.params.TimeStart;
        var time_end = this.params.TimeEnd;
        var corridor = this.params.Corridor;
        var acisa = this.params.ACISA;
        var dir = this.params.Direction;
        var r = this.r;

        function zoom(d0, i) {
            var k = r / d0.r / 2;
            x.domain([d0.x - d0.r, d0.x + d0.r]);
            y.domain([d0.y - d0.r, d0.y + d0.r]);

            var t = vis.transition()
              .duration(d3.event && d3.event.altKey ? 7500 : 750);

            t.selectAll("circle")
              .attr("cx", function(d) { return x(d.x); })
              .attr("cy", function(d) { return y(d.y); })
              .attr("r", function(d) { return k * d.r; });

            var updateCounter = 0;
            t.selectAll("text")
              .style("opacity", 0)
              .attr("x", function(d) { return x(d.x); })
              .attr("y", function(d) { return y(d.y); })
            //          .style("opacity", function(d) { return k * d.r > 20 ? 1 : 0; })
              .each(function(d, i) { updateCounter++; })
              .each("end", function(d, i) {
                updateCounter--;
                if (updateCounter == 0) {
                    adjustLabels(k, d0); }
              });
            node = d0;
            if(d3.event) {
                d3.event.stopPropagation();
            }
        }

        function adjustLabels(k, d0) {
            vis.selectAll("text")
                .style("opacity", function(d) {
                    if (d.children && d.children.length == 1)
                        return 0;
                    else{
                        if(d0.depth == 0){ // at root level
                            if(d.depth == 1)
                                return 1;
                            else
                                return 0;
                        }
                        else {
                            if(d.children)
                                return k * d.r > 70 ? 1 : 0;
                            else
                                return k * d.r > 10 ? 1 : 0;
                        }
                    }
                })
                .text(function(d) {
                    return d.name;
                })
                .filter(function(d) {
                    d.tw = this.getComputedTextLength();
                    return (Math.PI*(k*d.r)/2) < d.tw;
                })
                .each(function(d) {
                    var proposedLabel = d.name.toString();
    //                console.log(d.name);
                    var proposedLabelArray = proposedLabel.split('');
                    while ((d.tw > (Math.PI*(k*d.r)/2) && proposedLabelArray.length)) {
                    // pull out 3 chars at a time to speed things up (one at a time is too slow)
                        proposedLabelArray.pop();proposedLabelArray.pop(); proposedLabelArray.pop();
                        if (proposedLabelArray.length===0) {
                            proposedLabel = "";
                        } else {
                            proposedLabel = proposedLabelArray.join('') + "..."; // manually truncate with ellipsis
                        }
                        d3.select(this).text(proposedLabel);
                        d.tw = this.getComputedTextLength();
                    }
                });
        }

        query = this.cgipath + "?method=query_by_time_region&target_plot=BBL&start_date=" + time_start + "&end_date=" + time_end + "&dir=" + dir;

        // clear div
        $(this.targetdivhash).empty();

        // Append pack
        var pack = d3.layout.pack()
            .size([r, r])
            .value(function(d) { return d.volume; });

        // Append SVG
        var vis = d3.select(this.targetdivhash).append("svg:svg", "h2")
            .attr("width", w)
            .attr("height", h)
          .append("svg:g")
            .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

        // Append Hover Detail Div
        var hoverDetailDiv = '<div id="bubblehoverdetail" style="visibility: hidden;background-color: #ffffff;border: 2px solid;border-radius: 5px;padding: 5px 5px 5px 5px;"></div>';
        $(hoverDetailDiv).appendTo(this.targetdivhash);

        // Get Data and plot SVG
        d3.json(query, function (data) {
            node = root = data;
            nodes = pack.nodes(root);
            vis.selectAll("circle")
                    .data(nodes)
                    .enter().append("svg:circle")
                    .attr("class", function (d) {
                        return d.children ? "parent" : "child";
                    })
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    })
                    .attr("r", function (d) {
                        return d.r;
                    })
                    .on("click", function (d) {
                        return zoom(node == d ? root : d);
                    });

            var updateCounter = 0;
            vis.selectAll("text")
                    .data(nodes)
                    .enter().append("svg:text")
                    .attr("class", function (d) {
                        return d.children ? "parent" : "child";
                    })
                    .attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    })
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .style("opacity", function(d) {
                        if (d.children && d.children.length == 1)
                            return 0;
                        else{
                             // at root level
                            if(d.depth == 1)
                                return d.r > 10 ? 1 : 0;
                            else
                                return 0;
                        }
                    })
                    .text(function (d) {
                        return d.name;
                    })
            d3.select(window).on("click", function () {
                zoom(root);
            });

            zoom(root);
            console.log("load finished.");
            loading_indicator_trigger();
        });
    }
}