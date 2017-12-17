var tour = new Tour({
    name: "dviz_tour",
    smartPlacement: true,
    autoscroll: true,
    steps: [ {
        element: "#taxatree",
        placement: "auto bottom",
        title: "Taxonomy View",
        content: "Use this to navigate the taxonomy tree and select a family, genus or species. \
        <hr/> \
        Commands: <br/> \
        <kbd>Hover</kbd> to view labels. <br/> \
        <kbd>Click</kbd> on a cell to expand it and navigate the tree. <br/> \
        <kbd>Ctrl</kbd>+<kbd>Click</kbd> to select a family/genus/species. \
        ",
    }, {
        element: "#map",
        placement: "bottom",
        title: "Geographic View",
        content: "<h4> Google Maps Controls </h4> \
        <hr/> \
        Zoom and pan as you normally do when using Google maps. <br/> \
        Green dots represent samples in locations with protection status. <br/> \
        Red dots represent samples in locations with no protection status. <br/> \
        <hr/> \
        <h4> Create Detail </h4> \
        <hr/> \
        <kbd>Click</kbd> on the square on top to start creating a detail. \
        ",
    }, {
        element: "#spatiotemporal_ctrls",
        placement: "left",
        title: "Spatiotemporal Controls & Info",
        content: "<h4> Spatiotemporal Controls </h4> \
        <hr/> \
        <dl> \
        <dt>Region</dt> \
        <dd>Pans automatically to selected region.</dd> \
        <dt>P.Status</dt> \
        <dd>Apply filter based on protection status of sample location.</dd> \
        <dt>Date Slider</dt> \
        <dd>Drag the slider to select date ranges.</dd> \
        </dl> \
        <hr/> \
        <h4> Spatiotemporal Info </h4> \
        <hr/> \
        <dl> \
        <dt>Taxa Filter</dt> \
        <dd>Taxonomy element is currently selected.</dd> \
        <dt>Num. Samples</dt> \
        <dd>Number of samples currently shown on map.</dd> \
        <dt>Num. Creatures</dt> \
        <dd>Number of total creatures in selected samples.</dd> \
        <dt>Detail View Hover Info</dt> \
        <dd>Contains detail view info upon hover action.</dd> \
        </dl> \
        ",
    }, {
        element: "#detail_ctrls",
        placement: "right",
        title: "Detail View Controls",
        content: "<h4> Data Dimension Controls </h4> \
        <hr/> \
        <dl> \
        <dt>X Axis</dt> \
        <dd>Data field associated with each detail's X axis.</dd> \
        <dt>Y Axis</dt> \
        <dd>Data field associated with each detail's Y axis.</dd> \
        <dt>Switch Axes</dt> \
        <dd>Swap the X and Y axes around.</dd> \
        </dl> \
        <hr/> \
        <h4> Kernel Density Estimation (KDE) Controls </h4> \
        <hr/> \
        <dl> \
        <dt>KDE Kernel</dt> \
        <dd>Shape of the kernel density function.</dd> \
        <dt>KDE Scale</dt> \
        <dd>Larger scales increase the range of influence of a single datapoint.</dd> \
        </dl> \
        <hr/> \
        <h4> Gaussian Process (GP) Controls </h4> \
        <hr/> \
        <dl> \
        <dt>GP Kernel</dt> \
        <dd>Regression covariance functions:  <br/> \
        The Gaussian kernel corresponds to standard notion of regression;  <br/> \
        The Periodic kernel assumes that the regression line is completely periodic;  <br/> \
        The Locally Periodic (Lperiodic) kernel is a mixture of the previous two options, which makes periodicity assumptions but also allows the regression line  to vary across long ranges of time.  <br/> \
        Periodic kernels are only available when the X-axis is the date field, and when a period is chosen.</dd> \
        <dt>GP Scale</dt> \
        <dd>Larger scales increase the range of influence of a single datapoint.</dd> \
        <dt>GP Period</dt> \
        <dd>Time-scale after which the regression line should start repeating itself. Only available for a (locally) periodic kernel.</dd> \
        </dl> \
        <hr/> \
        <h4> Axes Controls </h4> \
        <hr/> \
        <dl> \
        <dt>Axes-Origin</dt> \
        <dd>When checked, all axes (except location and date), include the origin.</dd> \
        <dt>Linked-Views</dt> \
        <dd>When checked, all detail views share the same axes.</dd> \
        <dt>Views-Average</dt> \
        <dd>When checkes, aggregate histograms are computed according to the current X-axis.</dd> \
        </dl> \
        ",
    }, {
        element: "#filters",
        placement: "top",
        title: "Detail Views",
        content: "<h4> Detail Views </h4> <br/> \
        Selecting the gray square on the Geographic View and drawing a rectangle results in the creation of a detail view.  <br/> \
        Each detail view is a scatter plot of the filtered data;  The X-axis and Y-axis drop-down menus determine which data-fields to use to scatter the data.  <br/> To the right of each view, two separate representations of the KDE on the Y-values are shown.  The heatmap is more useful to compare across different views, while the normal plot is more useful to compare densities of different Y-values within a single detail view. \
        ",
    } ]
});

// Initialize the tour
tour.init();
tour.start();

$(document).ready(function() {

    $("#tourBtn").click(function() {
        console.log('Tour Started');
        tour.start(true);
    });

});
