// must be loaded after `noUiSlider`
// must be loaded after `api.js`
(function (exports) {
    var slider = document.querySelector('#date-range'),

        timestamp = str => new Date(str).getTime(),
        formatTimestamp = ts => new Date(ts).toLocaleDateString('en-US', {
            month: 'short', year: 'numeric'
        }),

        year = timestamp('2001') - timestamp('2000'),

        formatter = { to: formatTimestamp, from: timestamp };

    function onChange(callback) {
        slider.noUiSlider.on('update', values => {
        // slider.noUiSlider.on('change', values => {
            callback(new Date(+values[0]), new Date(+values[1]));
        });
    }

    function onRealChange(callback) {
        slider.noUiSlider.on('change', values => {
            callback(new Date(+values[0]), new Date(+values[1]));
        });
    }

    noUiSlider.create(slider, {
        range: { min: timestamp('1999'), max: timestamp('2018') },
        step: year / 12, // step by month (roughly)
        start: [timestamp('2013'), timestamp('2016')],
        connect: [false, true, false],
        // limit: 10 * year, // limit to 10 year range
        limit: 20 * year, // limit to 10 year range
        behaviour: 'drag',
        orientation: 'vertical',
        tooltips: [formatter, formatter],
    });

    // TODO: This does not belong here
    onChange(API.setDateRange);
    // otherwise 'update' callback doesn't fire;
    noUiSlider.value = [timestamp('2013'), timestamp('2016')],

    exports.DateRange = {
        onChange,
        onRealChange,
    }
}(window));
