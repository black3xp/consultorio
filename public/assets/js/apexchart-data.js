(function ($) {
    'use strict';
    if ($("#apexchart-01").length) {
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
            document.querySelector("#apexchart-01"),
            options
        );

        chart.render();

    }
    if ($("#apexchart-02").length) {
        var options = {
            chart: {

                type: 'bar',
            },
            colors: colors[8],
            plotOptions: {
                bar: {
                    horizontal: true,
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
            document.querySelector("#apexchart-02"),
            options
        );

        chart.render();

    }
    if ($("#apexchart-03").length) {
        var options = {
            colors: colors,
            chart: {

                type: 'bar',
                stacked: true,
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                },

            },
            stroke: {
                width: 1,
                colors: ['#fff']
            },
            series: [{
                name: 'Marine Sprite',
                data: [44, 55, 41, 37, 22, 43, 21]
            }, {
                name: 'Striking Calf',
                data: [53, 32, 33, 52, 13, 43, 32]
            }, {
                name: 'Tank Picture',
                data: [12, 17, 11, 9, 15, 11, 20]
            }, {
                name: 'Bucket Slope',
                data: [9, 7, 5, 8, 6, 9, 4]
            }, {
                name: 'Reborn Kid',
                data: [25, 12, 19, 32, 25, 24, 10]
            }],
            title: {
                text: 'Fiction Books Sales'
            },
            xaxis: {
                categories: [2008, 2009, 2010, 2011, 2012, 2013, 2014],
                labels: {
                    formatter: function (val) {
                        return val + "K"
                    }
                }
            },
            yaxis: {
                title: {
                    text: undefined
                },

            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val + "K"
                    }
                }
            },
            fill: {
                opacity: 1

            },

            legend: {
                position: 'top',
                horizontalAlign: 'left',
                offsetX: 40
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-03"),
            options
        );

        chart.render();

    }
    if ($("#apexchart-04").length) {

        var options = {
            colors: colors,
            chart: {

                type: 'bar',
                stacked: true,
                stackType: '100%'
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                },

            },
            stroke: {
                width: 1,
                colors: ['#fff']
            },
            series: [{
                name: 'Marine Sprite',
                data: [44, 55, 41, 37, 22, 43, 21]
            }, {
                name: 'Striking Calf',
                data: [53, 32, 33, 52, 13, 43, 32]
            }, {
                name: 'Tank Picture',
                data: [12, 17, 11, 9, 15, 11, 20]
            }, {
                name: 'Bucket Slope',
                data: [9, 7, 5, 8, 6, 9, 4]
            }, {
                name: 'Reborn Kid',
                data: [25, 12, 19, 32, 25, 24, 10]
            }],
            title: {
                text: '100% Stacked Bar'
            },
            xaxis: {
                categories: [2008, 2009, 2010, 2011, 2012, 2013, 2014],
            },

            tooltip: {
                y: {
                    formatter: function (val) {
                        return val + "K"
                    }
                }
            },
            fill: {
                opacity: 1

            },

            legend: {
                position: 'top',
                horizontalAlign: 'left',
                offsetX: 40
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-04"),
            options
        );

        chart.render();

    }
    if ($("#apexchart-05").length) {

        var options = {

            chart: {

                type: 'bar',
                stacked: true
            },
            colors: [colors[2], colors[6]],
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '80%',

                },
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 1,
                colors: ["#fff"]
            },
            series: [{
                name: 'Males',
                data: [0.4, 0.65, 0.76, 0.88, 1.5, 2.1, 2.9, 3.8]
            },
                {
                    name: 'Females',
                    data: [-0.8, -1.05, -1.06, -1.18, -1.4, -2.2, -2.85, -3.7]
                }],
            grid: {
                xaxis: {
                    showLines: false
                }
            },
            yaxis: {
                min: -5,
                max: 5,
                title: {
                    // text: 'Age',
                },
            },
            tooltip: {
                shared: false,
                x: {
                    formatter: function (val) {
                        return val
                    }
                },
                y: {
                    formatter: function (val) {
                        return Math.abs(val) + "%"
                    }
                }
            },
            title: {
                text: 'Mauritius population pyramid 2011'
            },
            xaxis: {
                categories: ['85+', '80-84', '75-79', '70-74', '65-69', '60-64', '55-59', '50-54'],
                title: {
                    text: 'Percent'
                },
                labels: {
                    formatter: function (val) {
                        return Math.abs(Math.round(val)) + "%"
                    }
                }
            },
        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-05"),
            options
        );

        chart.render();
    }
    if ($("#apexchart-06").length) {

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
            document.querySelector("#apexchart-06"),
            options
        );

        chart.render();
    }
    if ($("#apexchart-07").length) {


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
                data: generateHeatMapData(20, {
                    min: 0,
                    max: 90
                })
            },
                {
                    name: 'Metric2',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric3',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric4',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric5',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric6',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric7',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric8',
                    data: generateHeatMapData(20, {
                        min: 0,
                        max: 90
                    })
                },
                {
                    name: 'Metric9',
                    data: generateHeatMapData(20, {
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
            document.querySelector("#apexchart-07"),
            options
        );

        chart.render();
    }
    if ($("#apexchart-08").length) {

        var options = {
            colors: colors,
            chart: {

                type: 'area',
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            series: [{
                name: 'series1',
                data: [31, 40, 28, 51, 42, 109, 100]
            }, {
                name: 'series2',
                data: [11, 32, 45, 32, 34, 52, 41]
            }],

            xaxis: {
                categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
            },
            tooltip: {
                fixed: {
                    enabled: false,
                    position: 'topRight'
                }
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-08"),
            options
        );

        chart.render();

    }
    if ($("#apexchart-09").length) {


        var options = {
            colors: colors,
            chart: {
                width: 380,
                type: 'donut',
            },
            series: [44, 55, 41, 17, 15],


        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-09"),
            options
        );

        chart.render();
    }
    if ($("#apexchart-10").length) {
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
            document.querySelector("#apexchart-10"),
            options
        );

        chart.render();

    }
    if ($("#apexchart-11").length) {
        var options = {
            colors: [colors[0], colors[1], colors[4]],
            chart: {

                type: 'bar',
                stacked: true,
            },
            responsive: [{
                breakpoint: 700,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0
                    }
                }
            }],
            plotOptions: {
                bar: {
                    horizontal: false,
                },
            },
            series: [{
                name: 'PRODUCT A',
                data: [44, 55, 41, 67, 22, 43, 21, 49]
            }, {
                name: 'PRODUCT B',
                data: [13, 23, 20, 8, 13, 27, 33, 12]
            }, {
                name: 'PRODUCT C',
                data: [11, 17, 15, 15, 21, 14, 15, 13]
            }],
            xaxis: {
                categories: ['2011 Q1', '2011 Q2', '2011 Q3', '2011 Q4', '2012 Q1', '2012 Q2', '2012 Q3', '2012 Q4'],
            },
            fill: {
                opacity: 1
            },

            legend: {
                position: 'top',
                verticalAlign: 'top',
                offsetX: 0,
                offsetY: 50
            },
        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-11"),
            options
        );

        chart.render();
    }
    if ($("#apexchart-12").length) {


        var options = {
            chart: {
                height: 380,
                type: 'bubble',
            },
            colors: colors,
            dataLabels: {
                enabled: false
            },
            series: [{
                name: 'Bubble1',
                data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, {
                    min: 10,
                    max: 60
                })
            },
                {
                    name: 'Bubble2',
                    data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, {
                        min: 10,
                        max: 60
                    })
                },
                {
                    name: 'Bubble3',
                    data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, {
                        min: 10,
                        max: 60
                    })
                },
                {
                    name: 'Bubble4',
                    data: generateBubbleData(new Date('11 Feb 2017 GMT').getTime(), 20, {
                        min: 10,
                        max: 60
                    })
                }
            ],
            fill: {
                opacity: 0.8,
                gradient: {
                    enabled: false
                }
            },
            title: {
                text: 'Simple Bubble Chart'
            },
            xaxis: {
                tickAmount: 12,
                type: 'category',
            },
            yaxis: {
                max: 70
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#apexchart-12"),
            options
        );

        chart.render();

    }

    function generateBubbleData(baseval, count, yrange) {
        var i = 0;
        var series = [];
        while (i < count) {
            var x = Math.floor(Math.random() * (750 - 1 + 1)) + 1;
            ;
            var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
            var z = Math.floor(Math.random() * (75 - 15 + 1)) + 15;

            series.push([x, y, z]);
            baseval += 86400000;
            i++;
        }
        return series;
    }

    function generateHeatMapData(count, yrange) {
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
