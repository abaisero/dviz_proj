// must be loaded after `dispatch`
(function (exports) {
    function zoom(d) {
        var gs = taxag.transition().duration(1000)
            .tween('scale', function() {
                var xd = d3.interpolate(xScale.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(yScale.domain(), [d.y0, 1]),
                    yr = d3.interpolate(yScale.range(), [d.y0>0? 20: 0, 100]);
                return function(t) {
                    xScale.domain(xd(t));
                    yScale.domain(yd(t)).range(yr(t));
                };
            })

        gs.selectAll('rect')
            .attrTween('x', d => () => xScaleP(d.x0))
            .attrTween('y', d => () => yScaleP(d.y0))
            .attrTween('width', d => () => (xScale(d.x1) - xScale(d.x0)) + '%')
            .attrTween('height', d => () => (yScale(1) - yScale(d.y0)) + '%');

        gs.selectAll('text')
            .attrTween('x', d => () => xScaleP((d.x0 + d.x1)/2))
            .attrTween('y', d => () => .3 * yScale(d.y0) + .7 * yScale(d.y1) + '%')
            .attrTween('visibility', function(d) {
                var text = this,
                    rect = text.parentNode.querySelector('rect');
                return function(t) {
                    var tbox = text.getBBox(),
                        rbox = rect.getBBox(),
                    contained = (tbox.x > rbox.x && tbox.x + tbox.width < rbox.x + rbox.width);
                    return contained? 'visible': 'hidden';
                }
            });
    }

    var xScale = d3.scaleLinear().range([0, 100]),
        // yScale = d3.scalePow().exponent(1.5).range([0, 100]),
        yScale = d3.scaleLinear().range([0, 100]),
        xScaleP = x => xScale(x) + '%',
        yScaleP = y => yScale(y) + '%',
        // cScale = d3.scaleOrdinal(d3.schemeCategory20);
        // cScale = d3.scaleOrdinal(d3.schemeCategory20b);
        // cScale = d3.scaleOrdinal(d3.schemeCategory20c);
        // cScale = d3.scaleOrdinal(d3.schemeBlues[9]);
        // cScale = d3.scaleOrdinal(d3.schemeSet1);
        // cScale = d3.scaleOrdinal(d3.schemeGnBu[9]);
        // cScale = d3.scaleOrdinal(d3.schemeAccent);
        // cScale = d3.scaleOrdinal(d3.schemeSet2);
        cScale = d3.scaleOrdinal(d3.schemeSet3);
        // cScale = d3.scaleOrdinal(d3.schemeDark2);

    function taxa_ttip_text(sel, d) {
        if(d.depth == 0) {
            sel.select('span').html('<b> Root </b>');
            return;
        }

        var familyName = d.data._familyName,
            genusName = d.data._genusName,
            speciesName = d.data._speciesName;

        if (!genusName)
            familyName = '<b>' + familyName + '</b>';

        var tttext = 'Family: ' + familyName;

        if (genusName) {
            // if (!speciesName)
            genusName = '<b>' + genusName + '</b>';
            tttext += '<br/> Genus: ' + genusName;
        }

        if (speciesName) {
            speciesName = '<b>' + speciesName + '</b>';
            tttext += '<br/> Species: ' + speciesName;
        }

        sel.select('span').html(tttext);
    }
        
    function taxa_rect_color(d) {
        var c = d3.hsl(
            d.depth!=0?  cScale(d.data._familyName): 'steelblue'
        );
        c.s = 1;
        c.l = .875;

        if (d.depth != 0) {
            var dp = d.height == 0? d.parent.parent: d.parent,
                dc = (d.x0 + d.x1 - dp.x0 - dp.x1) / (dp.x1 - dp.x0);
                c.h += 35 * dc;
                c.l += .05 * dc;
                c.s -= .2 * dc;
        }
        return c;
    }

    function draw() {
        taxatree_ = d3.hierarchy(Taxonomy.root, function (d) {
            var children = d.children();
            if (children) {
                children = children.filter(child => child.isSelected());
                if (children.length)
                    return children;
            }
        });

        taxatree_.count()
        // taxatree_.sort((a,b) => b.height - a.height || b.value - a.value);
        // taxatree_.sort((a,b) => b.height - a.height || a.data.id.localeCompare(b.data.id));
        // taxatree_.sort((a,b) => a.height - b.height || a.data.id.localeCompare(b.data.id));
        taxatree_.sort((a,b) => a.data.id().localeCompare(b.data.id()));

        var nodes = d3.partition()(taxatree_).descendants();

        // var duration = 200;
        var duration = 0;
        
        var gs = taxag.selectAll('g').data(nodes, d => d.data.id());
        var gsx = gs.exit(),
            gse = gs.enter().append('g'),
            gsu = gse.merge(gs);

        // TODO redo extent stuff?  Mayb enot..

        // var minx0, maxx1, xf;

    //     var extent0 = d3.extent(nodes, d => d.x0);
    //     var extent1 = d3.extent(nodes, d => d.x1);
    //     xf = extent0[0] / (1 - maxx1 + minx0)

        // previous remove.. maybe it's better the way it is now
        // gsx.select('rect')
        //     .on('click', null)
        //     .each(function(d) {
        //         if (!minx0 || d.x0 < minx0)
        //             minx0 = d.x0
        //         if (!maxx1 || d.x1 > maxx1)
        //             maxx1 = d.x1
        //         xf = minx0 / (1 - maxx1 + minx0)
        //     })
        //     .transition()
        //         .duration(duration)
        //         .attr('x', d => xScaleP(xf))
        //         .attr('width', '0%')
        //         // .attr('y', d => yScale(1) + '%')
        //         // .attr('height', '0%')
        //     // .remove();  // TODO probably have to remove group...

        // gsx.transition()
        //     .remove();

        gsx.remove();

        gse.append('rect')
            .classed('taxa', true)
            .style('fill', taxa_rect_color)
            .on('mouseover', function(d) {
                dispatch.call('taxa_mouseover', null, d);
            })
            .on('mousemove', function(d) {
                dispatch.call('taxa_mousemove', null, d);
            })
            .on('mouseout', function(d) {
                dispatch.call('taxa_mouseout', null, d);
            })
            .on('click', function(d) {
                dispatch.call('taxa_click', null, d);
            });

        gse.append('text')
            .classed('taxa', true)
            .text(d => d.data.id());

        gsu.select('rect')
            // .transition()
            //     .duration(duration)
                .attr('x', d => xScaleP(d.x0))
                .attr('y', d => yScaleP(d.y0))
                .attr('width', d => xScaleP(d.x1 - d.x0))
                .attr('height', d => (yScale(1) - yScale(d.y0)) + '%');

        gsu.select('text')
            // .transition()
            //     .duration(duration)
                .attr('x', d => xScaleP((d.x0 + d.x1)/2))
                .attr('y', d => .3 * yScale(d.y0) + .7 * yScale(d.y1) + '%')

//         gsu.select('text')
            .attr('visibility', function() {
                var tbox = this.getBBox(),
                    rbox = this.parentNode.querySelector('rect').getBBox();

                // TODO buggy.. doesn't alwyas work.. it's because of the
                // transitions in the previous..
                return (tbox.x > rbox.x && tbox.x + tbox.width < rbox.x + rbox.width)?
                    'visible':
                    'hidden';
            })
    }

    dispatch.on('taxa_mouseover.taxatree', function(d) {
        taxattip
            .call(taxa_ttip_text, d)
            .transition()
                .duration(200)
                .style('opacity', .9);
        dispatch.call('taxa_mousemove', null, d);
    });

    dispatch.on('taxa_mousemove.taxatree', function(d) {
        taxattip
            .call(function(sel) {
                var bbox = sel.node().getBoundingClientRect(),
                    x = d3.event.pageX - bbox.width,
                    y = d3.event.pageY - bbox.height;

                sel.select('.triangle')
                    .classed('left', x < 0)
                    .classed('right', x >= 0)
                    .classed('top', y < 0)
                    .classed('bottom', y >= 0);

                sel.style('left', (x>=0? x: d3.event.pageX) + 'px');
                sel.style('top', (y>=0? y: d3.event.pageY) + 'px');
            });
    });

    dispatch.on('taxa_mouseout.taxatree', function() {
        taxattip
            .transition()
                .duration(500)
                .style('opacity', 0);
    });

    dispatch.on('taxa_click.taxatree', function(d) {
        console.log('taxa_click.taxatree: ctrlKey', d3.event.ctrlKey);
        if (!d3.event.ctrlKey)
            zoom(d);
    });

    // dispatch.on('taxa_click.taxatree', function(d) {
    //     // d.data.select(!d.data.isSelected());
    //     draw();

    //   // taxag
    //   //   .transition()
    //   //     .duration(750)
    //   //     .tween('scale', function() {
    //   //       var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
    //   //           yd = d3.interpolate(y.domain(), [d.y0, 1]),
    //   //           yr = d3.interpolate(y.range(), [d.y0>0? 20: 0, taxa_radius]);
    //   //       return function(t) {
    //   //         x.domain(xd(t));
    //   //         y.domain(yd(t)).range(yr(t));
    //   //       };
    //   //     })
    //   //   .selectAll('path')
    //   //     .attrTween('d', d => () => arc(d));
    // });

    exports.TaxaTree = {
        draw,
    }
}(window));
