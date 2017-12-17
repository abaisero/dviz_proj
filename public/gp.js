// must be loaded after `dispatch`
(function (exports) {

    function gaussian(x, y) {
        var u = (x - y) / kscale;
        return Math.exp(- u * u / 2 );
    }

    function periodic(x, y, kperiod) {
        var u = Math.sin(Math.PI * Math.abs(x - y) / kperiod) / kscale;
        return Math.exp(-2 * u * u);
    }

    function lperiodic(x, y, kperiod) {
        return gaussian(x, y) * periodic(x, y, kperiod);
    }

    // var kname = 'gaussian';
    var kname = 'none';
    function getKName() {
        return kname;
    }

    function setKName(kn) {
        kname = kn;
        console.log('GP.kname changed:', kname);
        dispatch.call('gp_kname_changed', null);
    }

    var kscale = 1;
    function getKScale() {
        return kscale;
    }

    function setKScale(ks) {
        kscale = ks;
        console.log('GP.kscale changed:', kscale);
        dispatch.call('gp_kscale_changed', null);
    }

    // var kperiod = .3;
    // function getKPeriod() {
    //     return kperiod; 
    // }

    // function setKPeriod(kp) {
    //     kperiod = kp;
    //     console.log('GP.kperiod changed:', kperiod);
    //     dispatch.call('gp_kperiod_changed', null);
    // }

    dispatch.on('gp_kname_changed.gp gp_kscale_changed.gp gp_kperiod_changed.gp', function() {
        dispatch.call('gp_kernel_changed', null);
    });

    var kernels = {
        none: null,
        gaussian,
        periodic,
        lperiodic,
    }

    function getKernel() {
        return kernels[kname];
    }

    exports.GP = {
        kernels,
        getKName,
        setKName,
        getKScale,
        setKScale,
        getKernel,
    }
}(window));

// Setting up kname options
var select_gp_kname = document.querySelector('#gp_kname');
var input_gp_kscale = document.querySelector('#gp_kscale');
var select_gp_kperiod = document.querySelector('#gp_kperiod');

Object.keys(GP.kernels).forEach(function(kname) {
    var option = document.createElement('option')
    option.text = kname[0].toUpperCase() + kname.slice(1);
    option.value = kname;
    select_gp_kname.appendChild(option);
})

function gp_kname_onchange() {
    input_gp_kscale.disabled = (select_gp_kname.value == 'none');
    if (select_gp_kname.value.slice(-7) != 'eriodic') {
        $('#gp_kperiod').selectpicker('val', 'none');
        $('#gp_kperiod').prop('disabled', true);
    }
    else {
        $('#gp_kperiod').prop('disabled', false);
    }
    $('#gp_kperiod').selectpicker('refresh');
    GP.setKName(select_gp_kname.value);
}
select_gp_kname.value = GP.getKName();

function gp_kscale_onchange() {
    GP.setKScale(input_gp_kscale.value);
}
input_gp_kscale.setAttribute('min', .01);
input_gp_kscale.setAttribute('max', 1);
input_gp_kscale.setAttribute('step', 'any');
input_gp_kscale.value = GP.getKScale();

function gp_kperiod_onchange() {
    // GP.setKPeriod(select_gp_kperiod.value);
    dispatch.call('gp_kperiod_changed', null);
}

input_gp_kscale.disabled = (select_gp_kname.value == 'none');
$(document).ready(function() {
    $('#gp_kperiod').selectpicker('val', 'none');
    $('#gp_kperiod').prop('disabled', select_gp_kname.value.slice(-7) != 'eriodic');
    $('#gp_kperiod').selectpicker('refresh');
    $('#gp_kperiod').on('changed.bs.select', function() {
        gp_kperiod_onchange();
    });

    dispatch.on('filter_xdim_changed.gp', function(xdim) {
        if (xdim != 'date') {
            if ($('#gp_kname').selectpicker('val').slice(-7) == 'eriodic') {
                $('#gp_kname').selectpicker('val', 'none');
                $('#gp_kperiod').selectpicker('val', 'none');
                gp_kname_onchange();
            }
        }
    });
});
