(function ($) {
    'use strict';
    if ($("#chart-05").length) {
        var options = {
            chart: {

                type: 'bar',
            },
            colors: colors[0],
            plotOptions: {
                bar: {
                    horizontal: false,
                }
            },
            dataLabels: {
                enabled: false
            },
            series: [{
                data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380]
            }],
            xaxis: {
                categories: ['South Korea', 'Canada', 'United Kingdom', 'Netherlands', 'Italy', 'France', 'Japan', 'United States', 'China', 'Germany'],
            },
            yaxis: {},
            tooltip: {}
        };

        var chart = new ApexCharts(
            document.querySelector("#chart-05"),
            options
        );
        chart.render();
    }
    if ($("#chart-06").length) {

        var options = {
            colors: colors,
            chart: {

                type: 'bar',
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded',
                    columnWidth: '55%',
                },
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            series: [{
                name: 'Net Profit',
                data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
            }, {
                name: 'Revenue',
                data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
            }, {
                name: 'Free Cash Flow',
                data: [35, 41, 36, 26, 45, 48, 52, 53, 41]
            }],
            xaxis: {
                categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            },
            yaxis: {
                title: {
                    text: '$ (thousands)'
                }
            },
            fill: {
                opacity: 1

            },
            // legend: {
            //     floating: true
            // },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return "$ " + val + " thousands"
                    }
                }
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-06"),
            options
        );

        chart.render();
    }

    if ($("#chart-07").length) {


        /*
                // this function will generate output in this format
                // data = [
                    [timestamp, 23],
                    [timestamp, 33],
                    [timestamp, 12]
                    ...
                ]
                */


        var options = {
            chart: {

                type: 'heatmap',
            },
            dataLabels: {
                enabled: false
            },
            colors: ["#F3B415", "#F27036", "#663F59", "#6A6E94", "#4E88B4", "#00A7C6", "#18D8D8", '#A9D794',
                '#46AF78'
            ],
            series: [{
                name: 'Metric1',
                data: generateData(20, {
                    min: 0,
                    max: 90
                })
            },
                {
                    name: 'Metric2',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric3',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric4',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric5',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric6',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric7',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric8',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric9',
                    data: generateData(20, {
                        min: 0,
                        max: 90
                    })
                }
            ],
            xaxis: {
                type: 'category',
            },
            title: {
                text: 'HeatMap Chart (Different color shades for each series)'
            },

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-07"),
            options
        );

        chart.render();
    }

    if ($("#chart-08").length) {
        var options = {
            // colors: colors,
            chart: {

                type: 'line',
            },
            series: [{
                name: 'Website Blog',
                type: 'column',
                data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160]
            }, {
                name: 'Social Media',
                type: 'line',
                data: [23, 42, 35, 27, 43, 22, 17, 31, 22, 22, 12, 16]
            }],
            stroke: {
                width: [0, 4]
            },
            title: {
                text: 'Traffic Sources'
            },
            // labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            labels: ['01 Jan 2001', '02 Jan 2001', '03 Jan 2001', '04 Jan 2001', '05 Jan 2001', '06 Jan 2001', '07 Jan 2001', '08 Jan 2001', '09 Jan 2001', '10 Jan 2001', '11 Jan 2001', '12 Jan 2001'],
            xaxis: {
                type: 'datetime'
            },
            yaxis: [{
                title: {
                    text: 'Website Blog',
                },

            }, {
                opposite: true,
                title: {
                    text: 'Social Media'
                }
            }]

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-08"),
            options
        );

        chart.render();

    }

    function generateData(count, yrange) {
        var i = 0;
        var series = [];
        while (i < count) {
            var x = (i + 1).toString();
            var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

            series.push({
                x: x,
                y: y
            });
            i++;
        }
        return series;
    }
})(window.jQuery);

