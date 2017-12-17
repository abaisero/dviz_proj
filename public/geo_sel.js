// must be loaded after `dispatch`

var filterOpts = null,
    filterOpts_d = null;
// filterOpts = {species_code: 'ACA BAHI'};
// filterOpts = {species_code: 'CAR BART'};
// filterOpts = {species: { family: 'Labridae' } };
// filterOpts = {species_code: 'ACA BAHI'};

var gduration = 500;

dispatch.on('taxa_click.geo', function(d) {
    console.log('taxa_click.geo: ctrlKey', d3.event.ctrlKey);
    if (d3.event.ctrlKey) {
        filterOpts_d = d.data;
        if (d.data.type() == 'species')
            filterOpts = {species_code: d.data._code};
        else
            filterOpts = {species: { [d.data.type()]: d.data.id() } };

        fetchNewSamples();
    }
});

// var filterOpts = {species: { family: 'Gobiidae' } };
// var filterOpts = {species: { family: 'Carcharhinidae' } };
// var filterOpts = {species: { species: 'ACA BAHI' } };

var colors = d3.scaleOrdinal(d3.schemeCategory10);
// var fid_ = 0;

// var geo_xscale = d3.scaleLinear().range([5, 95]);
// var geo_yscale = d3.scaleLinear().range([5, 95]);

var region_bounds = {
    'FLA KEYS': {
        latmi: +24.4313,
        lngmi: -82.0109,
        latma: +25.7526,
        lngma: -80.0872,
    },
    'DRY TORT': {
        latmi: +24.5420,
        lngmi: -83.1037,
        latma: +24.7364,
        lngma: -82.7703,
    },
    'SEFCRI': {
        latmi: +25.7624,
        lngmi: -80.1559,
        latma: +27.1897,
        lngma: -79.9938,
    },
};

var map, dm, svgoverlay;
var bounds;
var region_select, region_rectangles;


// var geottip = d3.select('body').append('div')
//     .classed('geo', true)
//     .classed('tooltip', true)
//     .style('opacity', 0);

// geottip.append('span');
// geottip.append('div').classed('triangle', true);

function initMap() {
    map = new google.maps.Map(d3.select('#map').node(), {
        zoom: 9,
        mapTypeId: 'terrain',
        disableDefaultUI: true,
        zoomControl: true,
        scaleControl: true,
        minZoom: 8,
        maxZoom: 14,
    });

    dm = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['rectangle'],
        },
        rectangleOptions: {
            strokeOpacity: 1,
            strokeWeight: 3,
            fillOpacity: .15,
            // clickable: true,
            draggable: true,
            editable: true,
            zIndex: 100,
        },
        map: map,
    });

    dm.addListener('rectanglecomplete', function(rectangle) {
        // var filter = FilterManager.getFromRect(rectangle);
        var filter = FilterManager.newFilter(rectangle, filterOpts, pfilter);

        // TODO dragend does not work because it doesn't account for rectangle
        // resize
        // rectangle.addListener('dragend', function(event) {
        // TODO how often to actually listen to rectangle movement?
        rectangle.addListener('bounds_changed', function(event) {
            dispatch.call('filter_changed', null, filter);
        });
        dispatch.call('filter_changed', null, filter);

        // TODO set variables.. only way to get over weird behaviours like
        // the mouse getting out during a drag...

        // rectangle.addListener('mouseover', function(event) {
        //     dispatch.call('rectangle_mouseover', null, fid);
        // });

        // rectangle.addListener('mouseout', function(event) {
        //     dispatch.call('rectangle_mouseout', null, fid);
        // });

        // rectangle.addListener('dragstart', function(event) {
        //     dispatch.call('rectangle_mouseover', null, fid);
        // });

        // rectangle.addListener('dragend', function(event) {
        //     dispatch.call('rectangle_mouseout', null, fid);
        // });

    });

    // creating regions
    region_rectangles = {};
    Object.entries(region_bounds).forEach(function (entry) {
        var k = entry[0],
            v = entry[1];

        var d = .1;
        var bounds = new google.maps.LatLngBounds()
        bounds.extend(new google.maps.LatLng(v.latmi-d, v.lngmi-d));
        bounds.extend(new google.maps.LatLng(v.latma+d, v.lngma+d));
        region_bounds[k] = bounds;

        // var color;
        // if (k == 'DRY TORT')
        //     color = '#F00';
        // else if (k == 'FLA KEYS')
        //     color = '#0F0';
        // else if (k == 'SEFCRI')
        //     color = '#00F';
        // color = '#888'
        var rectangle = new google.maps.Rectangle({
            strokeColor: '#888',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillOpacity: 0,
            map: map,
            bounds: bounds,
            clickable: false,
        });

        // rectangle.addListener('bounds_changed', function(event) {
        //     var bounds = rectangle.getBounds();

        //     API.setGeoBounds(
        //         bounds.getSouthWest().lat(),
        //         bounds.getNorthEast().lat(),
        //         bounds.getSouthWest().lng(),
        //         bounds.getNorthEast().lng(),
        //     );
        //     API.fetchSampleData({ species_code: species_code }, function(data) {
        //         console.log('here');
        //     });
        // });
        // region_rectangles[k] = rectangle;
    });

    // creating selection options
    $(document).ready(function() {
        region_select = document.querySelector('#region');
        Object.keys(region_bounds).forEach(function (k) {
            var option = document.createElement('option');
            option.text = k;
            region_select.add(option);
        });
        $('#region').selectpicker('refresh');

        select_region_onchange();
    });
    // var region = region_select.value;
    // bounds = region_bounds[region];
    // map.fitBounds(bounds);

    // TODO this was not all that useful in the end
    // // TODO screen always within bounds
    // var boundlimits = {
    //     maxlat: bounds.getNorthEast().lat(),
    //     maxlng: bounds.getNorthEast().lng(),
    //     minlat: bounds.getSouthWest().lat(),
    //     minlng: bounds.getSouthWest().lng(),
    // };

    // var lastcenter = map.getCenter();
    // var newlat, newlng;
    // google.maps.event.addListener(map, 'center_changed', function() {
    //     center = map.getCenter();
    //     if (bounds.contains(center))
    //         lastcenter = center;
    //     else {
    //         if (boundlimits.minlat < center.lat() && center.lat() < boundlimits.maxlat)
    //             newlat = center.lat();
    //         else
    //             newlat = lastcenter.lat();

    //         if (boundlimits.minlng < center.lng() && center.lng() < boundlimits.maxlng)
    //             newlng = center.lng();
    //         else
    //             newlng = lastcenter.lng();

    //         map.panTo(new google.maps.LatLng(newlat, newlng));
    //     }
    // });

    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        API.setGeoBounds(
            bounds.getSouthWest().lat(),
            bounds.getNorthEast().lat(),
            bounds.getSouthWest().lng(),
            bounds.getNorthEast().lng(),
        );
    });

    google.maps.event.addListener(map, 'idle', function() {
        console.log('Map is idle');
        fetchNewSamples();
    });

    // SVG GMAP Overlay
    function SVGOverlay(map) {
        this.setMap(map);
        this.div = null
    }

    SVGOverlay.prototype = new google.maps.OverlayView();

    SVGOverlay.prototype.onAdd = function() {
        this.div = document.createElement('div');
        this.div.classList.add('samples');
        this.getPanes().overlayMouseTarget.appendChild(this.div);

        // makes clicks go through overlay?  (for rectangle)
        // var me = this;
        // google.maps.event.addDomListener(this.div, 'click', function() {
        //     google.maps.event.trigger(map, 'click');
        //     google.maps.event.trigger(me, 'click');
        // });

        // select_region_onchange(); ???
    }

    SVGOverlay.prototype.draw = function() {
        // var me = this;
        d3.select(this.div)
            .selectAll('svg')
            .each(transform_sample);

        // fetchNewSamples();
    };

    SVGOverlay.prototype.svgs = function() {
        return d3.select(this.div).selectAll('svg');
    };

    svgoverlay = new SVGOverlay(map);
}

function transform_sample(d) {
    d = new google.maps.LatLng(+d.latitude, +d.longitude);
    d = svgoverlay.getProjection().fromLatLngToDivPixel(d);
    return d3.select(this)
              .style('left', d.x + 'px')
              .style('top', d.y + 'px');
}


function on_rectangle_change(event) {
    rectangle.getBounds().getNorthEast();
    rectangle.getBounds().getSouthWest();
}

function select_region_onchange() {
    var region = $('#region').val();
    console.log('Region changed:', region);

    API.setRegion(region);
    map.fitBounds(region_bounds[region]);

    // fetchNewSamples();
}

var span_taxa = document.querySelector('span.filter.taxa')
var span_nsamples = document.querySelector('span.filter.nsamples')
var span_nfish = document.querySelector('span.filter.nfish')
function fetchNewSamples() {
    console.log('Calling fetchNewSamples.');
    if (filterOpts) {
        var taxastr = '';
        if (filterOpts_d._familyName)
            taxastr += filterOpts_d._familyName;
        else
            taxastr += '---';

        if (filterOpts_d._genusName)
            taxastr += ' / ' + filterOpts_d._genusName;
        else
            taxastr += ' / ---';

        if (filterOpts_d._speciesName)
            taxastr += ' / ' + filterOpts_d._speciesName;
        else
            taxastr += ' / ---';

        span_taxa.innerHTML = taxastr;
        span_nsamples.innerHTML = 'Loading...';
        span_nfish.innerHTML = 'Loading...';

        // API.fetchSpeciesSamples(species_code, function(data) {
        API.fetchSampleData(filterOpts, function(data) {
            var fdata = data.filter(pfilter);
            console.log('Number of samples: %d', fdata.length);
            span_nsamples.innerHTML = fdata.length;
            span_nfish.innerHTML = Math.round(d3.sum(fdata, d => d.number));
            dispatch.call('samples_loaded', null, data);
        });
    }
}

var oscale;
dispatch.on('samples_loaded.geo', function(data) {
    console.log('Callback samples_loaded.geo:', data.length);

    if (svgoverlay) {
        var numbers = data.map(d => d.number),
            nsum = d3.sum(numbers),
            numbers = data.map(d => d.number / nsum);
            nextent = d3.extent(data.map(d => d.number)),
            rscale = d3.scaleLinear()
                        .domain(nextent.reverse())
                        .range([10, 3]);
        oscale = d3.scaleLinear()
                        .domain(nextent.reverse())
                        .range([.9, .2]);

        var svgs = svgoverlay.svgs().data(data, d => d.id),
            svgsx = svgs.exit(),
            svgse = svgs.enter().append('svg'),
            svgsu = svgse.merge(svgs);

        // console.log('exist:', svgs.size());
        // console.log('exit:', svgsx.size());
        // console.log('enter:', svgs.enter().size());
        // console.log('exist + enter:', svgsu.size());

        svgsx.remove();
        // svgsx.select('circle')
        //     .transition().duration(gduration)
        //         .attr('r', 0)
        //         .on('end', function() {
        //             d3.select(this.parent).remove();
        //         });

        var ended = false;
        svgse
            .append('circle')
                .style('fill', d => d.protected? 'green': 'red')
                .style('opacity', d => pfilter(d)? oscale(d.number): 0)
                // .transition().duration(gduration)
                //     .delay(gduration)
                    .attr('r', d => rscale(d.number))
                // .on('end', function() {
                //     if (!ended) {
                //         ended = true;
                //         dispatch.call('samples_update', null);
                //     }
                // });

        circles = svgsu.selectAll('circle');

        svgsu
            .each(transform_sample)
            // .selectAll('circle')
            //     .each(transform_sample);
    }
});

var circles = null;
dispatch.on('samples_update.geo', function() {
    console.log('Callback samples_update.geo');

    if (circles) {
        console.log(circles.data().length, oscale);
        circles
            // .transition().duration(gduration)
                .style('opacity', d => pfilter(d)? oscale(d.number): 0)
        // span_nsamples.innerHTML = circles.data().filter(pfilter).length;

        var circles_filtered = circles.filter(pfilter);
        span_nsamples.innerHTML = circles_filtered.size();
        span_nfish.innerHTML = Math.round(d3.sum(circles_filtered.data(), d => d.number));
        }
});

// TODO focus stuff, not important right now

// dispatch.on('plot_mouseover.select', function(fid) {
//     dispatch.call('filter_focus', null, fid);
// });

// dispatch.on('plot_mouseout.select', function(fid) {
//     dispatch.call('filter_unfocus', null, fid);
// });

// dispatch.on('rectangle_mouseover.rect', function(fid) {
//     dispatch.call('filter_focus', null, fid);
// });

// dispatch.on('rectangle_mouseout.rect', function(fid) {
//     dispatch.call('filter_unfocus', null, fid);
// });

// dispatch.on('filter_focus.all', function(fid) {
//     var plot = plots[fid];
//     plot.classed('focus', true);

//     var rectangle = rectangles[fid];
//     rectangle.setOptions({strokeWeight: 5});
// });

// dispatch.on('filter_unfocus.all', function(fid) {
//     var plot = plots[fid];
//     plot.classed('focus', false);

//     var rectangle = rectangles[fid];
//     rectangle.setOptions({strokeWeight: 3});
// });

DateRange.onChange(function() {
    console.log('daterange_changed');
    dispatch.call('daterange_change')
});

dispatch.on('daterange_change.geo', function() {
    fetchNewSamples();
});

dispatch.on('daterange_change.filters', function() {
    FilterManager.filters().forEach(on_filter_changed);
});

function on_filter_changed(filter) {
    // TODO this is a temporary hack..
    var geobounds_tmp = API.getGeoBounds();
    
    var bounds = filter.rectangle.getBounds();
    API.setGeoBounds(
        bounds.getSouthWest().lat(),
        bounds.getNorthEast().lat(),
        bounds.getSouthWest().lng(),
        bounds.getNorthEast().lng(),
    );

    console.log('Data request made (' + (new Date().toLocaleTimeString()) + ')');

    API.fetchSampleData(filter.filterOpts, function(data) {

        console.log('Data fetched (' + (new Date().toLocaleTimeString()) + ') for filter:', data.length);
        dispatch.call('filter_loaded', null, filter, data);
    });
    // HACK
    API.setGeoBounds(
        geobounds_tmp.lat[0],
        geobounds_tmp.lat[1],
        geobounds_tmp.lon[0],
        geobounds_tmp.lon[1],
    );
}
// on_filter_changed = TimeWarp.timewarp(10000, on_filter_changed);
dispatch.on('filter_changed', on_filter_changed);

dispatch.on('filter_loaded.data', function(filter, data) {
    data.forEach(function(d) {
        d.w = d.number;
    });
    filter.plot(data);
});

function round(value, decimals) {
    return Number(Math.round(value + 'e'+decimals)+'e-'+decimals);
}

function geo_ttip_text(sel, d) {
    var tttext = [
        '<b>Family</b>: ', d.species.family, '<br>',
        '<b>Genus</b>: ', d.species.genus, '<br>',
        '<b>Species</b>: ', d.species.commonName, '<br>',
        '<b>Date</b>: ', new Date(d.date).toLocaleDateString('en-US'), '<br>',
        '<b>Length</b>: ', round(d.length, 2), '<br/>',
        '<b>Number</b>: ', round(d.number, 2), '<br/>',
        '<b>Depth</b>: ', round(d.depth, 2), '<br/>',
        '<b>Lat</b>: ', round(d.latitude, 2), '<br>',
        '<b>Lng</b>: ', round(d.longitude, 2), '<br>',
    ].join('');

    if (sel)
        sel.select('span').html(tttext);
    return tttext;
}

dispatch.on('filter_marker_mouseover.geo', function(d) {
    console.log('marker mouseover', d.id);

    // geottip
    //     .call(geo_ttip_text, d)
    //     .transition().duration(200)
    //         .style('opacity', .9)

    d3.select('#davg_info').html(geo_ttip_text(null, d));

    dispatch.call('filter_marker_mousemove', null, d);
});

dispatch.on('filter_marker_mousemove.geo', function(d) {
    // console.log('marker mousemove', d.id);

    var circle = svgoverlay.svgs()
            .selectAll('circle').filter(cd => cd.id == d.id);

    if (circle.size()) {
        var bbox = circle.node().getBoundingClientRect(),
            pageX = bbox.left + .5 * bbox.width;
            pageY = bbox.top + .5 * bbox.height + window.scrollY;

        // geottip
        //     .call(function(sel) {
        //         var bbox = sel.node().getBoundingClientRect(),
        //             x = pageX - bbox.width,
        //             y = pageY - bbox.height;

        //         sel.select('.triangle')
        //             .classed('left', x < 0)
        //             .classed('right', x >= 0)
        //             .classed('top', y < 0)
        //             .classed('bottom', y >= 0);

        //         sel.style('left', (x>=0? x: pageX) + 'px');
        //         sel.style('top', (y>=0? y: pageY) + 'px');
        //     });
    }

    update_arrows([d.id]);
});

dispatch.on('filter_marker_mouseout.geo', function(d) {
    console.log('marker mouseout', d.id);

    // geottip
    //     .transition().duration(500)
    //         .style('opacity', 0);

    d3.select('#davg_info').html('');

    update_arrows([]);
});

dispatch.on('filter_markersavg_mouseover.geo', function(d, fopts) {
    // console.log('avg markers mouseover', d.ids);
    console.log('avg markers mouseover', fopts);

    // svgoverlay.svgs().selectAll('circle')
    //     .filter(cd => d.ids.includes(cd.id))
    //     .call(function(sel) {
    //         var bbox = sel.node().getBoundingClientRect(),
    //             x = bbox.left + .5 * bbox.width,
    //             y = bbox.top + .5 * bbox.height;

    //         d3.selection('body').
    //     });

    dispatch.call('filter_markersavg_mousemove', null, d, fopts);
});

dispatch.on('filter_markersavg_mousemove.geo', function(d, fopts) {

//     console.log('avg markers mousemove', d.ids);
    // console.log('avg markers mousemove', fopts);

    var taxatext;
    if (fopts.species_code)
        taxatext = '<b>Species Code</b>: ' + fopts.species_code;
    else if (fopts.species.genus)
        taxatext = '<b>Genus</b>: ' + fopts.species.genus;
    else if (fopts.species.family)
        taxatext = '<b>Family</b>: ' + fopts.species.family;

    var tttext = [
        // '<h3> <b> Data Weighted Average </b> </h3>',
        taxatext, '<br/>',
        '<b>Date</b>: ', new Date(d.date).toLocaleDateString('en-US'), '<br/>',
        '<b>Length</b>: ', round(d.length, 2), '<br/>',
        '<b>Number</b>: ', round(d.number, 2), '<br/>',
        '<b>Depth</b>: ', round(d.depth, 2), '<br/>',
        '<b>Lat</b>: ', round(d.latitude, 2), '<br/>',
        '<b>Lng</b>: ', round(d.longitude, 2), '<br/>',
    ].join('');

    d3.select('#davg_info').html(tttext);
    update_arrows(d.ids);
});

dispatch.on('filter_markersavg_mouseout.geo', function(d, fopts) {
    // console.log('avg markers mouseout', d.ids);
    console.log('avg markers mouseout', fopts);

    d3.select('#davg_info').html('');
    update_arrows([]);
});

function update_arrows(dids) {
    console.log('update_arrows:', dids.length);

    var circles = svgoverlay.svgs().selectAll('circle');

    var arrows = d3.select('body').selectAll('div.curvedarrow').data(dids, d => d);

    arrows
        .exit()
            .remove();

    arrows
        .enter().append('div').classed('curvedarrow', true)
        .merge(arrows)
            .each(function(d) {
                var circle = circles.filter(cd => cd.id == d).node();
                if (circle) {
                    var bbox = circle.getBoundingClientRect(),
                        x = bbox.left - 13;
                        y = bbox.top - 16 + window.scrollY;

                    d3.select(this)
                        .style('left', x + 'px')
                        .style('top', y + 'px');
                }
            });
}

pfilters = {
    both: d => true,
    prot: d => d.protected,
    nprot: d => !d.protected
}

var pstatus, pfilter
var select_geo_pstatus = document.querySelector('#pstatus');
function select_pstatus_onchange() {
    pstatus = select_geo_pstatus.value;
    console.log('Callback pstatus changed:', pstatus);
    pfilter = pfilters[pstatus];
    dispatch.call('samples_update', null);
}
select_pstatus_onchange();
