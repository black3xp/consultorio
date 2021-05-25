(function ($) {
    'use strict';
    google.charts.load('current', {packages: ['corechart', 'bar', 'calendar']});
    google.charts.setOnLoadCallback(initGoogleCharts);

    $(document).on("click", "#pin-sidebar", function (e) {
        initGoogleCharts()

    });
    window.addEventListener("resize", initGoogleCharts);

    function initGoogleCharts() {
        if ($("#gchart-01").length) {

            var data = new google.visualization.DataTable();
            data.addColumn('timeofday', 'Time of Day');
            data.addColumn('number', 'Motivation Level');

            data.addRows([
                [{v: [8, 0, 0], f: '8 am'}, 1],
                [{v: [9, 0, 0], f: '9 am'}, 2],
                [{v: [10, 0, 0], f: '10 am'}, 3],
                [{v: [11, 0, 0], f: '11 am'}, 4],
                [{v: [12, 0, 0], f: '12 pm'}, 5],
                [{v: [13, 0, 0], f: '1 pm'}, 6],
                [{v: [14, 0, 0], f: '2 pm'}, 7],
                [{v: [15, 0, 0], f: '3 pm'}, 8],
                [{v: [16, 0, 0], f: '4 pm'}, 9],
                [{v: [17, 0, 0], f: '5 pm'}, 10],
            ]);

            var options = {
                title: 'Motivation Level Throughout the Day',
                hAxis: {
                    title: 'Time of Day',
                    format: 'h:mm a',
                    viewWindow: {
                        min: [7, 30, 0],
                        max: [17, 30, 0]
                    }
                },
                vAxis: {
                    title: 'Rating (scale of 1-10)'
                },
                height: 400
            };

            var chart = new google.visualization.ColumnChart(
                document.getElementById('gchart-01'));

            chart.draw(data, options);
        }

        if ($("#gchart-02").length) {
            var data = google.visualization.arrayToDataTable([
                ['City', '2010 Population',],
                ['New York City, NY', 8175000],
                ['Los Angeles, CA', 3792000],
                ['Chicago, IL', 2695000],
                ['Houston, TX', 2099000],
                ['Philadelphia, PA', 1526000]
            ]);

            var options = {
                height: 400,
                title: 'Population of Largest U.S. Cities',
                chartArea: {width: '50%'},
                hAxis: {
                    title: 'Total Population',
                    minValue: 0
                },
                vAxis: {
                    title: 'City'
                }
            };

            var chart = new google.visualization.BarChart(document.getElementById('gchart-02'));

            chart.draw(data, options);
        }
        if ($("#gchart-03").length) {
            var data = google.visualization.arrayToDataTable([
                ['Task', 'Hours per Day'],
                ['Work', 11],
                ['Eat', 2],
                ['Commute', 2],
                ['Watch TV', 2],
                ['Sleep', 7]
            ]);

            var options = {
                height: 400,
                title: 'My Daily Activities',
                pieHole: 0.4,
            };

            var chart = new google.visualization.PieChart(document.getElementById('gchart-03'));
            chart.draw(data, options);
        }
        if ($("#gchart-04").length) {
            var data = google.visualization.arrayToDataTable([
                ['Year', 'Sales', 'Expenses'],
                ['2013', 1000, 400],
                ['2014', 1170, 460],
                ['2015', 660, 1120],
                ['2016', 1030, 540]
            ]);

            var options = {
                height: 400,
                title: 'Company Performance',
                hAxis: {title: 'Year', titleTextStyle: {color: '#333'}},
                vAxis: {minValue: 0}
            };

            var chart = new google.visualization.AreaChart(document.getElementById('gchart-04'));
            chart.draw(data, options);
        }
        if ($("#gchart-05").length) {
            var dataTable = new google.visualization.DataTable();
            dataTable.addColumn({type: 'date', id: 'Date'});
            dataTable.addColumn({type: 'number', id: 'Won/Loss'});
            dataTable.addRows([
                [new Date(2012, 3, 13), 37032],
                [new Date(2012, 3, 14), 38024],
                [new Date(2012, 3, 15), 38024],
                [new Date(2012, 3, 16), 38108],
                [new Date(2012, 3, 17), 38229],
                // Many rows omitted for brevity.
                [new Date(2013, 9, 4), 38177],
                [new Date(2013, 9, 5), 38705],
                [new Date(2013, 9, 12), 38210],
                [new Date(2013, 9, 13), 38029],
                [new Date(2013, 9, 19), 38823],
                [new Date(2013, 9, 23), 38345],
                [new Date(2013, 9, 24), 38436],
                [new Date(2013, 9, 30), 38447]
            ]);

            var chart = new google.visualization.Calendar(document.getElementById('gchart-05'));

            var options = {
                title: "Red Sox Attendance",
                height: 400,
            };

            chart.draw(dataTable, options);
        }
        if ($("#gchart-06").length) {
            var data = google.visualization.arrayToDataTable([
                ['Year', 'Sales', 'Expenses'],
                ['2004', 1000, 400],
                ['2005', 1170, 460],
                ['2006', 660, 1120],
                ['2007', 1030, 540]
            ]);

            var options = {
                height: 400,
                title: 'Company Performance',
                curveType: 'function',
                legend: {position: 'bottom'}
            };

            var chart = new google.visualization.LineChart(document.getElementById('gchart-06'));

            chart.draw(data, options);
        }

    }

})(window.jQuery);

