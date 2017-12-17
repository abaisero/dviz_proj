// must be loaded after `dispatch`
(function (exports) {

    function uniform(u) {
        if (u < -1 || u > 1)
            return 0;
        return .5;
    }

    function triangular(u) {
        if (u < -1 || u > 1)
            return 0;
        return 1 - Math.abs(u);
    }

    function triweight(u) {
        if (u < -1 || u > 1)
            return 0;
        var v = 1 - u * u;
        return v * v * v * 35 / 32;
    }

    function epanechikov(u) {
        if (u < -1 || u > 1)
            return 0;
        return (1 - u * u) * 3 / 4;
    }

    var SQRT1_2PI = Math.SQRT1_2 / Math.sqrt(Math.PI);
    function gaussian(u) {
        return SQRT1_2PI * Math.exp(- u * u / 2);
    }

    var kname = 'gaussian';
    function getKName() {
        return kname;
    }

    function setKName(kn) {
        kname = kn;
        console.log('KDE.kname changed:', kname);
        dispatch.call('kde_kname_changed', null);
    }

    var kscale = .03;
    function getKScale() {
        return kscale;
    }

    function setKScale(ks) {
        kscale = ks;
        console.log('KDE.kscale changed:', kscale);
        dispatch.call('kde_kscale_changed', null);
    }

    dispatch.on('kde_kname_changed.kde kde_kscale_changed.kde', function() {
        dispatch.call('kde_kernel_changed', null);
    });

    var kernels = {
        uniform,
        triangular,
        gaussian,
        triweight,
        epanechikov,
    }

    function getKernel() {
        return z => kernels[kname](z / kscale) / kscale;
    }

    exports.KDE = {
        kernels,
        getKName,
        setKName,
        getKScale,
        setKScale,
        getKernel,
    }

}(window));

// Setting up kname options
var select_kde_kname = document.querySelector('#kde_kname');

// d3.select(select_kde_kname).selectAll('option')
//     .data(d3.keys(KDE.kernels))
//     .enter()
//         .append('option')
//         .attr('value', kname => kname)
//         .text(kname => kname[0].toUpperCase() + kname.slice(1));
Object.keys(KDE.kernels).forEach(function(kname) {
    var option = document.createElement('option')
    option.text = kname[0].toUpperCase() + kname.slice(1);
    option.value = kname;
    select_kde_kname.appendChild(option);
})

function kde_kname_onchange() {
    KDE.setKName(select_kde_kname.value);
}
select_kde_kname.value = KDE.getKName();

var input_kde_kscale = document.querySelector('#kde_kscale');
function kde_kscale_onchange() {
    KDE.setKScale(input_kde_kscale.value);
}
input_kde_kscale.setAttribute('min', .01);
input_kde_kscale.setAttribute('max', .1);
input_kde_kscale.setAttribute('step', 'any');
input_kde_kscale.value = KDE.getKScale();
