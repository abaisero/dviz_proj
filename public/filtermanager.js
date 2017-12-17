// must be loaded after `dispatch`
(function (exports) {
    var uduration = 500;


    // Filter ID
    var fid_ = 0;
    function nextFid() {
        fid_ += 1;
        return 'Filter_' + fid_;
    }

    // Axis-related mappings
    var datadims = [
        'date',
        'length',
        'depth',
        'number',
        'latitude',
        'longitude',
    ];

    var datadims_axisorigin = {
        date: false,
        length: true,
        number: true,
        depth: true,
        latitude: false,
        longitude: false,
    };

    var dataunit = {
        date: '',
        length: ' [cm]',
        number: '',
        depth: ' [m]',
        latitude: ' [°]',
        longitude: ' [°]',
    }

    function getDDimUnit(ddim) {
        return ddim + dataunit[ddim];
    }

    var scaleTypes = {
        date: d3.scaleTime,
        // date: d3.scaleLinear,
        depth: d3.scaleLinear,
        length: d3.scaleLinear,
        number: d3.scaleLinear,
        latitude: d3.scaleLinear,
        longitude: d3.scaleLinear,
    };

    var tickFormats = {
        date: d3.timeFormat('%m/%d/%y'),
        depth: null,
        length: null,
        number: null,
        latitude: null,
        longitude: null,
    };

    // TODO instead of using an accessor.. just convert date!!
    var accessors = {
        date: d => new Date(d.date).getTime(),
        depth: d => d.depth,
        length: d => d.length,
        number: d => d.number,
        latitude: d => d.latitude,
        longitude: d => d.longitude,
    };

    var xdim = null,
        xacc = null,
        ydim = null,
        yacc = null;

    function getXDim() {
        return xdim;
    }

    function setXDim(xd) {
        xdim = xd;
        xacc = accessors[xdim];
        console.log('FilterManager.xdim changed:', xdim);
        dispatch.call('filter_xdim_changed', null, xdim);
    }

    function getYDim() {
        return ydim;
    }

    function setYDim(yd) {
        ydim = yd;
        yacc = accessors[ydim];
        console.log('FilterManager.ydim changed:', ydim);
        dispatch.call('filter_ydim_changed', null);
    }

    function setXYDim(xd, yd) {
        xdim = xd;
        ydim = yd;
        xacc = accessors[xdim];
        yacc = accessors[ydim];
        dispatch.call('filter_datadim_changed', null);
    }

    dispatch.on('filter_xdim_changed.xdim filter_ydim_changed.ydim', function() {
        console.log('FilterManager.datadim changed');
        dispatch.call('filter_datadim_changed', null);
    });

    setXDim('date');
    setYDim('length');

    // TODO this should be handled differently...?
    var colors = d3.scaleOrdinal(d3.schemeCategory10);

    function Filter(rectangle, filterOpts, pfilter) {
        this.rectangle = rectangle;
        this.filterOpts = Object.assign({}, filterOpts);
        console.log('pfilter', pfilter);
        this.pfilter = pfilter;

        var self = this;
        this.fid = nextFid();
        this.init();
        this.instances[this.fid] = this;
    }

    Filter.prototype.instances = {};

    Filter.prototype.closer = 10;

    // Filter.prototype.scatw = 300;
    // Filter.prototype.scath = 300;

    // Filter.prototype.hmapw = 10;
    // Filter.prototype.hmaph = 300;

    // Filter.prototype.kdew = 50;
    // Filter.prototype.kdeh = 300;

    // Filter.prototype.svgw = 360;
    // Filter.prototype.svgh = 300;

    Filter.prototype.scatw = 275;
    Filter.prototype.scath = 275;

    Filter.prototype.hmapw = 10;
    Filter.prototype.hmaph = 275;

    Filter.prototype.kdew = 50;
    Filter.prototype.kdeh = 275;

    Filter.prototype.svgw = 335;
    Filter.prototype.svgh = 275;
    Filter.prototype.svgm = {
        top: 15,
        bottom: 55,
        left: 55,
        right: 25,
        middle: 10,
    };

    Filter.prototype.init = function () {
        var self = this;

        this.xScale = null;
        this.yScale = null;
        this.xScalePix = null;
        this.yScalePix = null;

        this.xAxis = null;
        this.yAxis = null;
        this.hScale = null;

        this.color = colors(this.fid);

        this.rectangle.setOptions({
            strokeColor: this.color,
            fillColor: this.color,
        });

        var svgw = this.svgm.left + this.svgw + this.svgm.right,
            svgh = this.svgm.top + this.svgh + this.svgm.bottom

        // MAIN SVG

        this.svg = d3
            .select('#filters')
            .append('svg')
                .classed('filter', true)
                .attr('width', svgw)
                .attr('height', svgh);

        // BORDER

        this.border = this.svg.append('rect')
            .attr('width', svgw)
            .attr('height', svgh)
            .attr('stroke-width', 10)
            .attr('fill-opacity', 0)
            .attr('stroke', this.color)

        // this.close = this.svg.append('circle')
        //     .attr('r', this.closer)
        //     .attr('cx', this.closer)
        //     .attr('cy', this.closer)
        this.close = this.svg.append('rect')
            .attr('width', 2 * this.closer)
            .attr('height', 2 * this.closer)
            .attr('stroke', 'black')
            .attr('fill', 'black')
            // .attr('pointer-events', 'all')
            // .attr('visibility', 'hidden')
            // .on('mouseover', function() {
            //     d3.select(this).attr('visibility', 'visible');
            // })
            // .on('mouseout', function() {
            //     d3.select(this).attr('visibility', 'hidden');
            // })
            .on('click', function() {
                self.selfdestruct();
            });
        this.svg.append('line')
            .attr('x2', 2 * this.closer)
            .attr('y2', 2 * this.closer)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('pointer-events', 'none');
        this.svg.append('line')
            .attr('x1', 2 * this.closer)
            .attr('y2', 2 * this.closer)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('pointer-events', 'none');

        // SAMPLE PLOTS

        this.scat = this.svg.append('svg')
            .classed('scat', true)
            .attr('transform', 'translate(' + this.svgm.left + ',' + this.svgm.top + ')')
            // .attr('fill', 'red')
            .attr('width', this.scatw)
            .attr('height', this.scath)
        this.circles_u = null;
        this.domains = {};
        this.domains_avg = {};
        datadims.forEach(function(ddim) { self.domains_avg[ddim] = {}; });

        this.xAxisGroup = this.scat.append('g')
            .classed('axis', true)
            .classed('xaxis', true)
            .attr('transform', 'translate(0, ' + this.scath + ')');
        this.yAxisGroup = this.scat.append('g')
            .classed('axis', true)
            .classed('yaxis', true);

        // TODO put labels? maybe not..
        // this.xLabel = this.scat.append('text')
        //     .attr('transform', 'translate(' +
        //         (this.scatw / 2) + ' ,' +
        //         // (this.scath + this.svgm.top) +
        //         // (this.svgh - 10) +
        //         (this.svgh + 30) +
        //         ')')
        //     .style('text-anchor', 'middle')
        //     .text('Date')

        // this.yLabel = this.scat.append('text')
        //     .attr('transform', 'rotate(-90)')
        //     .attr('y', -this.svgm.left)
        //     .attr('x', -this.scath / 2 )
        //     .attr('dy', '1em')
        //     .style('text-anchor', 'middle')
        //     .text('Value')

        // HEATMAP-Y

        this.hmap_gradient = this.svg
            .append('defs')
                .append('linearGradient')
                    .attr('id', 'hmap_gradient_' + this.fid)
                    .attr('x1', '0')
                    .attr('y1', '1')
                    .attr('x2', '0')
                    .attr('y2', '0');

        this.hmap = this.svg.append('rect')
            .classed('hmap', true)
            .attr('width', this.hmapw + 'px')
            .attr('height', this.hmaph + 'px')
            .attr('transform', 'translate(' + (this.svgm.left + this.scatw + this.svgm.middle) + ',' + this.svgm.top + ')')
            .attr('stroke', 'black')
            .attr('fill', 'url(#hmap_gradient_' + this.fid + ')');

        // this.nbins_kde = 200;
        this.nbins_kde = 200;
        this.nbins_gp = 200;
        this.gRange = null;
        this.data_kde = null;

        this.kde = this.svg.append('svg')
            .classed('kde', true)
            .attr('transform', 'translate(' + (this.svgm.left + this.scatw + this.svgm.middle + this.hmapw) + ',' + this.svgm.top + ')')
            .attr('fill', 'red')
            .attr('width', this.kdew)
            .attr('height', this.kdeh);

        dispatch.on('filter_scat_changed.' + this.fid, () => self.onScatChanged());
        dispatch.on('filter_datadim_changed.' + this.fid, () => self.onDatadimChanged());
        dispatch.on('axisorigin_changed.' + this.fid, () => self.onAxisOriginChanged());
        dispatch.on('linkedviews_changed.' + this.fid, () => self.onLinkedViewsChanged());
        dispatch.on('dataavg_changed.' + this.fid, () => self.onDataAvgChanged());
        dispatch.on('kde_kernel_changed.' + this.fid, () => self.onKDEKernelChanged());
        dispatch.on('gp_kernel_changed.' + this.fid, () => self.onGPKernelChanged());
    };

    Filter.prototype.filters = function() {
        return Object.values(Filter.prototype.instances);
    };

    Filter.prototype.selfdestruct = function() {
        dispatch.on('filter_scat_changed.' + this.fid, null);
        dispatch.on('filter_datadim_changed.' + this.fid, null);
        dispatch.on('axisorigin_changed.' + this.fid, null);
        dispatch.on('linkedviews_changed.' + this.fid, null);
        dispatch.on('dataavg_changed.' + this.fid, null);
        dispatch.on('kde_kernel_changed.' + this.fid, null);
        dispatch.on('gp_kernel_changed.' + this.fid, null);

        delete this.instances[this.fid];
        this.rectangle.setMap(null);
        this.svg.remove();
    };

    // Filter.prototype.alldomains = function() {
    //     if (!linkedviews)
    //         return this.domains;

    //     var domains = {};
    //     var filters = this.filters();
    //     Object.keys(accessors).forEach(function(key) {
    //         domains[key] = d3.extent(
    //             [].concat.apply([], filters.map(filter => filter.domains[key]))
    //         );
    //     });
    //     return domains;
    // };

    // TODO only normalize all grange if a condition is met
    Filter.prototype.allgRange = function() {
        // this.filters().forEach(function(filter) {
        //     console.log('grange', filter.gRange);
        // });
        var allgRanges = this.filters().map(filter => filter.gRange);
        return d3.extent(d3.merge(allgRanges));
    };

    Filter.prototype.onAxisOriginChanged = function() {
        this.scatUpdate();
    };

    Filter.prototype.onLinkedViewsChanged = function() {
        this.scatUpdate();
    };

    Filter.prototype.onDataAvgChanged = function() {
        this.scatPlot(propagate=false);
    };

    Filter.prototype.onScatChanged = function() {
        this.scatUpdate();
    };

    Filter.prototype.onKDEKernelChanged = function() {
        this.hmapPlot();
    };

    Filter.prototype.onGPKernelChanged = function() {
        this.gpPlot();
    };

    Filter.prototype.onDatadimChanged = function() {
        this.scatUpdate();
    };

    Filter.prototype.getDomain_ = function(domainAccess, dname) {
        var domain;
        if (!linkedviews)
            domain = domainAccess(this)[dname].slice();
        else
            domain = d3.extent(d3.merge(
                this.filters().map(filter => domainAccess(filter)[dname])
            ));
        if (axisorigin && datadims_axisorigin[dname])
            domain[0] = 0;
        return domain;
    };

    Filter.prototype.getDomain = function(dname) {
        var domainAccess = davg? (f => f.domains_avg[xdim]): (f => f.domains)
        return this.getDomain_(domainAccess, dname);
    };

    Filter.prototype.dimsUpdate = function() {
        var xDomain = this.getDomain(xdim),
            yDomain = this.getDomain(ydim),
            xRangePix = [0, this.scatw],
            yRangePix = [this.scath, 0];

        this.xScale = scaleTypes[xdim]()
            .domain(xDomain);
        this.yScale = scaleTypes[ydim]()
            .domain(yDomain);

        this.xScalePix = this.xScale.copy()
            .range(xRangePix);
        this.yScalePix = this.yScale.copy()
            .range(yRangePix);

        var xTickFormat = tickFormats[xdim];
        var yTickFormat = tickFormats[ydim];

        this.xAxis = d3.axisBottom(this.xScalePix).tickFormat(xTickFormat);
        this.yAxis = d3.axisLeft(this.yScalePix).tickFormat(yTickFormat);
    };

    Filter.prototype.getX = function(d) {
        return this.xScale(xacc(d));
    };

    Filter.prototype.getXPix = function(d) {
        return this.xScalePix(xacc(d));
    };

    Filter.prototype.getY = function(d) {
        return this.yScale(yacc(d));
    };

    Filter.prototype.getYPix = function(d) {
        return this.yScalePix(yacc(d));
    };

    Filter.prototype.dataUpdate = function(data) {
        var self = this;

        // first apply the status filter
        this.data_ = data.filter(this.pfilter);

        var nbins = 100,  // this one can be pretty big
            range = d3.range(nbins);

        function davg_update_obj(obj, d, x) {
            if (!obj.hasOwnProperty(x)) {
                obj[x] = {
                    protected: d.protected,
                    ids: [],
                    ys: {},
                    cw: 0,
                }
                datadims.forEach(function(ydim) {
                    obj[x].ys[ydim] = 0;
                });
            }
            obj[x].ids.push(d.id);
            obj[x].cw += d.w;
            datadims.forEach(function(ydim) {
                obj[x].ys[ydim] += (accessors[ydim](d) - obj[x].ys[ydim]) * d.w / obj[x].cw;
            });
        }

        function davg_aggregate_obj(obj, xscale) {
            return Object.entries(obj).map(function(entry) {
                var key = +entry[0],
                    value = entry[1];

                var d = {
                    protected: value.protected,
                    id: d3.mean(xscale.invertExtent(key)),
                    ids: value.ids,
                    w: value.cw,
                };
                d = Object.assign(d, value.ys);
                // number should just be a normal sum
                d.number = value.cw;
                return d;
            });
        }

        this.data_avg = {};
        datadims.forEach(function(xdim) {
            var domain = d3.extent(self.data_, accessors[xdim]);
            var xscale = d3.scaleQuantize()
                            .domain(domain)
                            .range(range);

            var obj = { prot: {}, nprot: {}, all: {}, };
            self.data_.forEach(function(d) {
                var x = xscale(accessors[xdim](d));
                davg_update_obj(obj.all, d, x);
                davg_update_obj(d.protected? obj.prot: obj.nprot, d, x);
            });

            // concatenate stuff
            self.data_avg[xdim] = d3.merge([
                davg_aggregate_obj(obj.all, xscale),
                davg_aggregate_obj(obj.prot, xscale),
                davg_aggregate_obj(obj.nprot, xscale),
            ]);
        });

        Object.entries(accessors).forEach(function(entry) {
            var key = entry[0],
                accessor = entry[1];
            // self.domains[key] = d3.extent(self.data(), accessor);
            self.domains[key] = d3.extent(self.data_, accessor);
            datadims.forEach(function(ddim) {
                self.domains_avg[ddim][key] = d3.extent(self.data_avg[ddim], accessor);
            });
        });

        this.dimsUpdate();
    };

    // TODO (somewhere else)
    // change the transition of the line plots such that they don't just change
    // across the y axis!!!  yeah.. make a point actually move to its new
    // position?

    Filter.prototype.data = function() {
        return davg? this.data_avg[xdim]: this.data_;
    }

    Filter.prototype.plot = function(data) {
        this.dataUpdate(data);
        this.scatPlot(propagate=true);
    };

    // TODO KDE
    Filter.prototype.computeKDE = function() {
        var nbins = this.nbins_kde;

        var pd = this.getY.bind(this);
        var pbin = d3.scaleLinear().domain([0, nbins-1]);
        var z = (d, i) => pbin(i) - pd(d);
        var kernel = KDE.getKernel();

        // TODO check normalization..?  what about d.number?
        this.data_kde = d3.range(nbins).map(
            i => d3.mean(this.data(), d => d.w * kernel(z(d, i)))
        );
        this.data_kde = this.data_kde.map(d => d / nbins);
        // console.log('data_kde.sum:', d3.sum(this.data_kde));

        this.gRange = d3.extent(this.data_kde);
    };

    Filter.prototype.gpPlot = function() {
        console.log(this.fid + '.gpPlot()');

        var kperiod2 = select_gp_kperiod.value;
        console.log('GP', kperiod2);
        var kperiod = $('#gp_kperiod').val();
        console.log('GP', kperiod);


        var kernel_ = GP.getKernel();
        if (kernel_ == null) {
            this.scat.selectAll('line.gp')
                .attr('visibility', 'hidden')
            return;
        }
        else if (xdim == 'date' && GP.getKName().slice(-7) == 'eriodic' && select_gp_kperiod.value == 'none') {
            this.scat.selectAll('line.gp')
                .attr('visibility', 'hidden')
            return;
        }
        else
            this.scat.selectAll('line.gp')
                .attr('visibility', 'visible')

        var self = this;
        var nbins = this.nbins_gp;
        var iScale = d3.scaleLinear()
            .domain([0, nbins-1]);

        // periodic kernels
        if (xdim == 'date' && GP.getKName().slice(-7) == 'eriodic') {
            var p_year = this.xScale(new Date('01/01/2001')) - this.xScale(new Date('01/01/2000'));

            var p = p_year * +select_gp_kperiod.value / 12;
            kernel = (x, y) => kernel_(x, y, p);
        }
        else
            kernel = kernel_;

        // TODO maybe I don't need to do it with this average?
        var data = this.data_avg[xdim];
        console.log(this.fid + '.gp() before K creation:', new Date())
        console.log('data.length:', data.length);
        var I = new Matrix.identity(data.length);
            K = new Matrix(data.map(
            d1 => data.map(
                d2 => kernel(self.getX(d1), self.getX(d2))
            )
        ));
        console.log(this.fid + '.gp() after K creation:', new Date())

        var Y = new Matrix([data.map(d => this.getY(d))]).T;
        console.log(this.fid + '.gp() before K inversion:', new Date())
        // var KI = Matrix.add(K, Matrix.scale(I, .001)).inverse();
        var KI = Matrix.add(K, I).inverse();
        console.log(this.fid + '.gp() after K inversion:', new Date())
        var KIY = Matrix.multiply(KI, Y);

        // TODO better way to handle kernel scaling.. as it is, changing the
        // axes changes the covariance length-scale, which is not ideal at
        // all...
        // Some way to register length-scales?

        // TODO use yaxis weighted mean?

        // TODO actually I should do all of them at the same itme.. probably
        // quicker
        this.data_gp = d3.range(nbins).map(function(i) {
            var k = kernel(iScale(i), iScale(i)),
                Kx = new Matrix([data.map(d => kernel(self.getX(d), iScale(i)))]).T,
                KxT = Kx.T;

            return {
                x: iScale(i),
                m: Matrix.multiply(KxT, KIY).get(0, 0),
                s: Math.sqrt(k - Matrix.multiply(KxT, KI).multiply(Kx).get(0, 0)),
            };
        });

        var gp_xscale = d3.scaleLinear()
            .range([0, this.scatw]);

        var gp_yscale = d3.scaleLinear()
            .range([this.scath, 0])


        var gp_lines = d3.pairs(this.data_gp);
        var lines = this.scat.selectAll('line.gp.gp_m')
            .data(gp_lines, d => d[0].x);

        lines.exit()
            .remove();

        lines.enter()
            .append('line')
                .classed('gp', true)
                .classed('gp_m', true)
                .style('stroke', 'black')
                .style('stroke-width', 2)
            .merge(lines)
                .attr('x1', d => gp_xscale(d[0].x))
                .attr('x2', d => gp_xscale(d[1].x))
                .transition().duration(uduration)
                    .attr('y1', d => gp_yscale(d[0].m))
                    .attr('y2', d => gp_yscale(d[1].m));

        // // variance plus
        // lines = this.scat.selectAll('line.gp.gp_mps')
        //     .data(gp_lines, d => d[0].x);

        // lines.exit()
        //     .remove();

        // lines.enter()
        //     .append('line')
        //         .classed('gp', true)
        //         .classed('gp_mps', true)
        //         .style('stroke', 'red')
        //         .style('stroke-width', 2)
        //         // .style('stroke-dasharray', '5, 10')
        //     .merge(lines)
        //         .attr('x1', d => gp_xscale(d[0].x))
        //         .attr('x2', d => gp_xscale(d[1].x))
        //         .transition().duration(uduration)
        //             .attr('y1', d => gp_yscale(d[0].m + d[0].s))
        //             .attr('y2', d => gp_yscale(d[1].m + d[1].s));

        // // variance minus
        // lines = this.scat.selectAll('line.gp.gp_mms')
        //     .data(gp_lines, d => d[0].x);

        // lines.exit()
        //     .remove();

        // lines.enter()
        //     .append('line')
        //         .classed('gp', true)
        //         .classed('gp_mms', true)
        //         .style('stroke', 'red')
        //         .style('stroke-width', 2)
        //         // .style('stroke-dasharray', '5, 10')
        //     .merge(lines)
        //         .attr('x1', d => gp_xscale(d[0].x))
        //         .attr('x2', d => gp_xscale(d[1].x))
        //         .transition().duration(uduration)
        //             .attr('y1', d => gp_yscale(d[0].m - d[0].s))
        //             .attr('y2', d => gp_yscale(d[1].m - d[1].s));
    };

    Filter.prototype.scatPlot = function(propagate) {
        console.log(this.fid + '.scatPlot()');
        this.dimsUpdate();

        // data plot
        var circles = this.scat.selectAll('circle.scat').data(this.data(), d => d.id),
            circles_x = circles.exit();

        this.circles_e = circles.enter().append('circle').classed('scat', true);
        this.circles_u = this.circles_e.merge(circles);

        circles_x
            .transition().duration(uduration)
                .attr('cx', d => this.getXPix(d))
                .attr('cy', d => this.getYPix(d))
                .attr('r', 0)
                .remove();

        var self = this;
        this.circles_e
            .attr('cx', d => this.getXPix(d))
            .attr('cy', d => this.getYPix(d))
            .style('fill', d => d.protected? 'green': 'red')
            .on('mouseover', function(d) {
                if (davg)
                    dispatch.call('filter_markersavg_mouseover', null, d, self.filterOpts);
                else
                    dispatch.call('filter_marker_mouseover', null, d, self.filterOpts);
            })
            // .on('mousemove', function(d) {
            //     if (davg)
            //         dispatch.call('filter_markersavg_mousemove', null, d, self.filterOpts);
            //     else
            //         dispatch.call('filter_marker_mousemove', null, d, self.filterOpts);
            // })
            .on('mouseout', function(d) {
                if (davg)
                    dispatch.call('filter_markersavg_mouseout', null, d, self.filterOpts);
                else
                    dispatch.call('filter_marker_mouseout', null, d, self.filterOpts);
            });
            // .transition().duration(uduration)
            //     .attr('r', 3)

        // update all filters
        if (propagate && linkedviews)
            dispatch.call('filter_scat_changed');
        else
            this.onScatChanged();
    };

    Filter.prototype.scatUpdate = function() {
        console.log(this.fid + '.scatUpdate()');
        this.dimsUpdate();

        var self = this;
        this.circles_u
            .transition().duration(uduration)
                .attr('cx', d => this.getXPix(d))
                .attr('cy', d => this.getYPix(d))
                .attr('r', 5);
            // .on('end', function() {
            //     self.circles_e.attr('r', 3);
            //         // .transition().duration(uduration)
            //         //     .attr('r', 3);
            // });

        // TODO make transform and anchor stuff out-of-transition?
        this.xAxisGroup
            .transition().duration(uduration)
                .call(this.xAxis)
                .selectAll('text')
                    .style('text-anchor', 'end')
                    .attr('transform', 'rotate(-45) translate(-7, -3)')

        this.yAxisGroup
            .transition().duration(uduration)
                .call(this.yAxis)
                .selectAll('text')
                    .style('text-anchor', 'end')
                    .attr('transform', 'rotate(-45) translate(3, -10)');

        this.hmapPlot();
        this.gpPlot();
    };

    Filter.prototype.hmapPlot = function() {
        console.log(this.fid + '.hmapPlot()');
        this.computeKDE();

        var stops = this.hmap_gradient.selectAll('stop').data(this.data_kde);

        // stupid
        var pbin = d3.scaleLinear().domain([0, this.nbins_kde]);

        stops.exit()
            .remove();

        var allgRange = this.gRange;
        var gcolor = d3.scaleLinear().domain(allgRange).range(['white', 'blue']);
        // TODO the height should also be renormalized...

        stops.enter()
            .append('stop')
                .attr('offset', (d, i) => pbin(i))
            .merge(stops)
            .transition()
                .duration(uduration)
                .attr('stop-color', gcolor);

        // var allgRange = this.allgRange();
        // var gcolor = d3.scaleLinear().domain(allgRange).range(['white', 'red']);
        // // TODO the height should also be renormalized...
        // this.stops_u
        //     .transition()
        //         .duration(uduration)
        //         .attr('stop-color', d => gcolor(d));

        this.kdePlot();
    };

    Filter.prototype.kdePlot = function() {
        console.log(this.fid + '.kdePlot()');

        var kde_points = this.data_kde.map((v, i) => ({x:i, y:v})),
            kde_lines = d3.pairs(kde_points);

        var lines = this.kde.selectAll('line.kde')
            .data(kde_lines);

        var kde_xscale = d3.scaleLinear()
            .domain([0, this.nbins_kde-1])
            .range([this.kdeh, 0]);

        var kde_yscale = d3.scaleLinear()
            .domain([0, d3.max(this.data_kde)])
            .range([0, this.kdew]);

        lines.exit()
            .remove();

        lines.enter()
            .append('line')
                .classed('kde', true)
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
            .merge(lines)
                .attr('y1', d => kde_xscale(d[0].x))
                .attr('y2', d => kde_xscale(d[1].x))
                .transition()
                    .duration(uduration)
                    .attr('x1', d => kde_yscale(d[0].y))
                    .attr('x2', d => kde_yscale(d[1].y));
    }

    // Exported interface

    function newFilter(rectangle, filterOpts, pfilter) {
        return new Filter(rectangle, filterOpts, pfilter);
    }

    function getFromRect(rectangle) {
        console.log('Getting from Rect')
        // getting existing filter
        for(var filter in Filter.prototype.filters())
            if (filter.rectangle == rectangle)
                return filter;

        // creating new Filter
        return new Filter(rectangle);
    }

    function getFromFid(fid) {
        return Filter.prototype.instances[fid];
    }

    var axisorigin = false;
    function setAxisOrigin(ao) {
        axisorigin = ao;
        dispatch.call('axisorigin_changed');
    }

    function getAxisOrigin() {
        return axisorigin;
    }

    var linkedviews = false;
    function setLinkedViews(lv) {
        linkedviews = lv;
        dispatch.call('linkedviews_changed');
    }

    function getLinkedViews() {
        return linkedviews;
    }

    var davg = false;
    function setDataAvg(da) {
        davg = da;
        dispatch.call('dataavg_changed');
    }

    function getDataAvg() {
        return davg;
    }

    exports.FilterManager = {
        datadims,
        getXDim,
        setXDim,
        getYDim,
        setYDim,
        setXYDim,
        getDDimUnit,

        getAxisOrigin,
        setAxisOrigin,
        getLinkedViews,
        setLinkedViews,
        getDataAvg,
        setDataAvg,

        newFilter,
        getFromRect,
        getFromFid,
        filters: () => Object.values(Filter.prototype.instances),
    };
}(window));

d3.select('#xaxis').selectAll('option')
    .data(FilterManager.datadims)
    .enter()
        .append('option')
        .attr('value', ddim => ddim)
        .text(ddim => FilterManager.getDDimUnit(ddim));

var select_filter_xaxis = document.querySelector('#xaxis');
function select_xaxis_onchange() {
    FilterManager.setXDim(select_filter_xaxis.value);
}
select_filter_xaxis.value = FilterManager.getXDim();

d3.select('#yaxis').selectAll('option')
    .data(FilterManager.datadims)
    .enter()
        .append('option')
        .attr('value', ddim => ddim)
        .text(ddim => FilterManager.getDDimUnit(ddim));

var select_filter_yaxis = document.querySelector('#yaxis');
function select_yaxis_onchange() {
    FilterManager.setYDim(select_filter_yaxis.value);
}
select_filter_yaxis.value = FilterManager.getYDim();

$(document).ready(function() {
    $('#swaxes').click(button_switchaxes_onclick);
});

function button_switchaxes_onclick() {
    var xdim = select_filter_xaxis.value,
        ydim = select_filter_yaxis.value;

    $('#xaxis').selectpicker('val', ydim);
    $('#yaxis').selectpicker('val', xdim);
    FilterManager.setXYDim(ydim, xdim);
}

var input_filter_axis = document.querySelector('#origin');
function checkbox_axis_onchange() {
    FilterManager.setAxisOrigin(input_filter_axis.checked);
}
input_filter_axis.checked = FilterManager.getAxisOrigin();

var input_filter_link = document.querySelector('#linked');
function checkbox_link_onchange() {
    FilterManager.setLinkedViews(input_filter_link.checked);
}
input_filter_link.checked = FilterManager.getLinkedViews();

var input_filter_davg = document.querySelector('#davg');
function checkbox_davg_onchange() {
    FilterManager.setDataAvg(input_filter_davg.checked);
}
input_filter_davg.checked = FilterManager.getDataAvg();

// noUiSlider.onRealChange(function() {
//     DateRange
// });

var filterttip = d3.select('body').append('div')
    .classed('filter', true)
    .classed('tooltip', true)
    .style('opacity', 0);

filterttip.append('span');
filterttip.append('div').classed('triangle', true);

function filter_ttip_text(sel, d) {
    var tttext = 'this';

    sel.select('span').html(tttext);
}

dispatch.on('filter_marker_mouseover.filter', function(d) {
    // filterttip
    //     .call(filter_ttip_text, d)
    //     .transition().duration(200)
    //         .style('opacity', .9)
    dispatch.call('filter_marker_mousemove', null, d);
});

dispatch.on('filter_marker_mousemove.filter', function(d) {
    // filterttip
    //     .call(function(sel) {
    //         var bbox = sel.node().getBoundingClientRect(),
    //             x = d3.event.pageX - bbox.width,
    //             y = d3.event.pageY - bbox.height;

    //         sel.select('.triangle')
    //             .classed('left', x < 0)
    //             .classed('right', x >= 0)
    //             .classed('top', y < 0)
    //             .classed('bottom', y >= 0);

    //         sel.style('left', (x>=0? x: d3.event.pageX) + 'px');
    //         sel.style('top', (y>=0? y: d3.event.pageY) + 'px');
    //     });
});

dispatch.on('filter_marker_mouseout.filter', function(d) {
    // filterttip
    //     .transition()
    //         .duration(500)
    //         .style('opacity', 0);
});
