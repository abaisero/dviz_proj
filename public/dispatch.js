var dispatch = d3.dispatch(
    'taxa_loaded',
    'taxa_mouseover',
    'taxa_mousemove',
    'taxa_mouseout',
    'taxa_click',

    'samples_loaded',
    'samples_update',

    'filter_loaded',
    'filter_plot',
    'plot_mouseover',
    'plot_mouseout',

    'rectangle_mouseover',
    'rectangle_mouseout',

    'selection_focus',
    'selection_unfocus',

    'filter_changed',
    'filter_data',
    'filter_marker_mouseover',
    'filter_marker_mousemove',
    'filter_marker_mouseout',
    'filter_markersavg_mouseover',
    'filter_markersavg_mousemove',
    'filter_markersavg_mouseout',

    'daterange_change',

    'geo_datum_focus',
    'geo_datum_unfocus',

    'filter_xdim_changed',
    'filter_ydim_changed',
    'filter_datadim_changed',
    'filter_scat_changed',

    'axisorigin_changed',
    'linkedviews_changed',
    'dataavg_changed',

    'kde_kernel_changed',
    'kde_kname_changed',
    'kde_kscale_changed',

    'gp_kernel_changed',
    'gp_kname_changed',
    'gp_kscale_changed',
    'gp_kperiod_changed',
);
