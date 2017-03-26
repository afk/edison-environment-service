var map;
var bounds;
var infowindows = {};
var opened = [];
var series = {};

/**
 * Init google maps
 */
function initMap() {
    bounds = new google.maps.LatLngBounds();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 8,
        // disable the scrollwheel for now as it is annoying to scroll from the infowindow when one wants
        // to do something else
        scrollwheel: false
    });
}

/**
 * Create the markers and attach the infowindows
 *
 * @param data
 */
function createMarkers(data) {
    data.forEach(function (el) {
        var infowindow = new google.maps.InfoWindow({
            content: "<div id='" + el.deviceId + "' style='width: 600px; height: 350px; overflow-x: hidden'></div>",
            maxWidth: 660
        });

        var marker = new google.maps.Marker({
            position: {lat: el.loc[0], lng: el.loc[1]},
            map: map
        });

        marker.addListener('click', function () {
            infowindow.open(map, marker);

            // Keep a track of the open infowindow
            opened[el.deviceId] = true;

            // Create the chart in the marker
            highchart(el.deviceId);
        });

        // the infowindow is closed, set it as such in the opened array
        infowindow.addListener('closeclick', function () {
            opened[el.deviceId] = false;
        });

        infowindows[el.deviceId] = infowindow;

        //extend the bounds to include each marker's position
        bounds.extend(marker.position);
    })
}

// Center the map on our bounds
function centerMap() {
    map.fitBounds(bounds);
}

/**
 * Launch the magic!
 */
$(document).ready(function () {
    // Attach the datepicker
    $('input[name="daterange"]').daterangepicker({
        "startDate": moment().subtract(5, 'minutes').format('DD/MM/YYYY HH:mm:ss'),
        "endDate": moment().format('DD/MM/YYYY HH:mm:ss'),
        "timePicker": true,
        "timePicker24Hour": true,
        "timePickerSeconds": true,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        locale: {
            format: 'DD/MM/YYYY HH:mm:ss'
        }
    });

    // Get the list of devices for the select fields
    fetch('http://localhost:8082/devices')
        .then(function (response) {
            if (response.status >= 400 && response.status < 600) {
                throw new Error("Bad response from server");
            }
            return response.json();
        })
        .then(function (data) {
            // We can position our markers when we have the list of devices
            createMarkers(data);
            centerMap();

            var devices = data.map(function (device) {
                return {id: device.deviceId, name: device.name}
            });

            var components = [];
            data.forEach(function (el) {
                el.components.forEach(function (component) {
                    components.push({
                        id: component.cid,
                        name: component.name
                    });
                });
            });

            $('#devices').replaceWith(getDropDownList('devices', 'devices', devices));
            $('#components').replaceWith(getDropDownList('components', 'components', components));
        });

    // Let's fetch some data when people interact with the form
    $('#form').on('submit', function () {
        fetchData();
        return false;
    });

    // Fetch data for the first time
    fetchData();
});

/**
 * Helper to create a select element. Ah, vue.js would have been so much better here
 **/
function getDropDownList(name, id, optionList) {
    var combo = $("<select></select>").attr("id", id).attr("name", name).attr('class', 'form-control');

    combo.append("<option value=''>All</option>");

    $.each(optionList, function (i, el) {
        combo.append("<option value=" + el.id + ">" + el.name + "</option>");
    });

    return combo;
}


/**
 * Fetch the time series data from our proxy server
 */
function fetchData() {
    var daterange = $('input[name="daterange"]').data('daterangepicker');
    fetch('http://localhost:8082/data?' + $.param({
            start: moment(daterange.startDate).unix() * 1000,
            end: moment(daterange.endDate).unix() * 1000,
            component: $('#components').val(),
            devices: $('#devices').val()
        }), {
        method: 'GET',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    })
        .then(function (res) {
            return res.json()
        })
        .then(function (res) {
            series = {};

            // Create the series array
            res.series.forEach(function (el) {
                if (!series[el.deviceId]) {
                    series[el.deviceId] = [];
                }

                series[el.deviceId].push(el);
            });

            // In case that we have open infowindows - update their charts
            Object.keys(series).forEach(function (key) {
                if (typeof opened[key] !== "undefined" && opened[key] === true) {
                    highchart(key);
                }
            });
        });
}

/**
 * Create the components charts in the infowindow
 *
 * @param id
 */
function highchart(id) {
    var data = series[id];

    $('#' + id).empty();
    // Create every chart and attach it to the infowindow
    data.forEach(function (el) {
        $('<div class="chart">')
            .appendTo('#' + id)
            .highcharts({
                chart: {
                    type: 'line',
                    zoomType: 'x'
                },
                title: {
                    text: el.componentName
                },
                subtitle: {
                    text: el.deviceName
                },
                xAxis: {
                    categories: el.points.map(function (point) {
                        return moment(parseInt(point.ts)).format('DD/MM/YYYY HH:mm:ss')
                    })
                },
                yAxis: {
                    title: {
                        text: ''
                    }
                },
                plotOptions: {
                    line: {
                        dataLabels: {
                            enabled: true
                        },
                        enableMouseTracking: false
                    }
                },
                series: [{
                    name: el.componentName,
                    data: el.points.map(function (point) {
                        return parseFloat(point.value)
                    })
                }]
            });
    })

}
