(function ($) {

    'use strict';

    if ($("#chart-widget-01").length) {
        var options = {
            colors: [colors[0]],
            chart: {
                height: 200,
                animations: {
                    enabled: false,
                },
                sparkline: {
                    enabled: true
                },
                type: 'bar',
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded',
                    columnWidth: '35%',
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
                name: 'Last Month',
                data: [10, 30, 45, 50, 61, 55, 45, 35, 10]
            },
                // {
                //     name: 'Last Month',
                //     data: [10 , 61, 55, 45, 30, 45, 50, 35, 10]
                // }
            ],
            xaxis: {
                categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
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
            document.querySelector("#chart-widget-01"),
            options
        );

        chart.render();
    }
    if ($("#chart-widget-02").length) {
        var options = {
            colors: colors[0],
            chart: {
                height: 350,
                type: 'radialBar',
            },
            plotOptions: {
                radialBar: {
                    startAngle: -135,
                    endAngle: 135,
                    dataLabels: {
                        name: {
                            fontSize: '16px',
                            color: undefined,
                            offsetY: 120
                        },
                        value: {
                            offsetY: 76,
                            fontSize: '22px',
                            color: undefined,
                            formatter: function (val) {
                                return val + "%";
                            }
                        }
                    }
                }
            },
            fill: {
                gradient: {
                    enabled: true,
                    shade: 'dark',
                    shadeIntensity: 0.15,
                    inverseColors: false,
                    opacityFrom: 1,
                    opacityTo: 1,
                    stops: [0, 50, 65, 91]
                },
            },
            stroke: {
                dashArray: 4
            },
            series: [67],
            labels: ['Funded'],

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-02"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-03").length) {
        var options = {
            colors: colors[19],
            chart: {
                height: 350,
                type: 'radialBar',
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        margin: 15,
                        size: '70%',
                        image: '../assets/img/icecream.png',
                        imageWidth: 100,
                        imageHeight: 100,
                        imageClipped: false
                    },
                    dataLabels: {
                        name: {
                            show: false,
                            color: '#fff'
                        },
                        value: {
                            show: true,
                            color: '#ddd',
                            offsetY: 80,
                            fontSize: '22px'

                        }
                    }
                }
            },

            series: [67],
            stroke: {
                lineCap: 'round'
            },
            labels: ['Volatility'],

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-03"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-04").length) {


        var options = {
            colors: [colors[15], colors[18], colors[19]],

            chart: {
                width: 240,
                type: 'donut',
            },
            series: [44, 55, 25],
            dataLabels: {
                enabled: false
            },
            legend: {
                position: 'bottom',
                show: false
            }

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-04"),
            options
        );

        chart.render();
    }
    if ($("#chart-widget-05").length) {
        var options = {
            colors: colors,
            chart: {
                height: 150,
                type: 'area',
                sparkline: {
                    enabled: true
                },
                animations: {
                    enabled: false,
                },

            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'straight'
            },
            series: [
                {
                    name: 'Bandwidth',
                    data: [{
                        x: 1996,
                        y: 322
                    },
                        {
                            x: 1997,
                            y: 324
                        },
                        {
                            x: 1998,
                            y: 329
                        },
                        {
                            x: 1999,
                            y: 342
                        },
                        {
                            x: 2000,
                            y: 348
                        },
                        {
                            x: 2001,
                            y: 334
                        },
                        {
                            x: 2002,
                            y: 325
                        },
                        {
                            x: 2003,
                            y: 316
                        },
                        {
                            x: 2004,
                            y: 318
                        },
                        {
                            x: 2005,
                            y: 330
                        },
                        {
                            x: 2006,
                            y: 355
                        },
                        {
                            x: 2007,
                            y: 366
                        },
                        {
                            x: 2008,
                            y: 337
                        },
                        {
                            x: 2009,
                            y: 352
                        },
                        {
                            x: 2010,
                            y: 377
                        },
                        {
                            x: 2011,
                            y: 383
                        },
                        {
                            x: 2012,
                            y: 344
                        },
                        {
                            x: 2013,
                            y: 366
                        },
                        {
                            x: 2014,
                            y: 389
                        },
                        {
                            x: 2015,
                            y: 334
                        }
                    ]
                }],

            xaxis: {
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },

            fill: {
                opacity: 0.5,
                gradient: {
                    enabled: false
                }
            },

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-05"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-06").length) {
        var options = {
            colors: [colors[1], colors[1]],
            chart: {
                height: 150,
                type: 'area',
                sparkline: {
                    enabled: true
                },
                animations: {
                    enabled: false,
                },

            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'straight'
            },
            series: [
                {
                    name: 'Bandwidth',
                    data: [{
                        x: 1996,
                        y: 322
                    },
                        {
                            x: 1997,
                            y: 324
                        },
                        {
                            x: 1998,
                            y: 329
                        },
                        {
                            x: 1999,
                            y: 342
                        },
                        {
                            x: 2000,
                            y: 348
                        },
                        {
                            x: 2001,
                            y: 334
                        },
                        {
                            x: 2002,
                            y: 325
                        },
                        {
                            x: 2003,
                            y: 316
                        },
                        {
                            x: 2004,
                            y: 318
                        },
                        {
                            x: 2005,
                            y: 330
                        },
                        {
                            x: 2006,
                            y: 355
                        },
                        {
                            x: 2007,
                            y: 366
                        },
                        {
                            x: 2008,
                            y: 337
                        },
                        {
                            x: 2009,
                            y: 352
                        },
                        {
                            x: 2010,
                            y: 377
                        },
                        {
                            x: 2011,
                            y: 383
                        },
                        {
                            x: 2012,
                            y: 344
                        },
                        {
                            x: 2013,
                            y: 366
                        },
                        {
                            x: 2014,
                            y: 389
                        },
                        {
                            x: 2015,
                            y: 334
                        }
                    ]
                }],

            xaxis: {
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },

            fill: {
                opacity: 0.5,
                gradient: {
                    enabled: false
                }
            },

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-06"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-07").length) {
        var options = {
            colors: [colors[2], colors[20],],
            chart: {

                height: 350,
                type: 'bar',
                stacked: true,
                toolbar: {
                    show: false
                },
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
                    dataLabels: {
                        enabled: false,

                    }
                },
            },
            series: [{
                name: 'Previous Year',
                data: [44, 55, 41, 67, 22, 43]
            }, {
                name: 'Current Year',
                data: [13, 23, 20, 8, 13, 27]
            }],
            xaxis: {
                type: 'datetime',
                categories: ['01/01/2011 GMT', '01/02/2011 GMT', '01/03/2011 GMT', '01/04/2011 GMT', '01/05/2011 GMT', '01/06/2011 GMT'],
            },
            fill: {
                opacity: 1
            },
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-07"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-08").length) {
        var options = {
            chart: {
                type: 'area',
                sparkline: {
                    enabled: true
                },
                animations: {
                    enabled: false,
                },
            },

            stroke: {
                curve: 'smooth',
                width: 0
            },
            fill: {
                opacity: 0.7,
                gradient: {
                    enabled: false
                }
            },
            series: [{
                data: [0, 68, 50, 98, 62, 25, 32, 68, 0]
            }],
            yaxis: {
                min: 0
            },
            colors: colors[12],

        }
        var chart = new ApexCharts(
            document.querySelector("#chart-widget-08"),
            options
        );

        chart.render();
    }
    if ($("#chart-widget-09").length) {
        var options = {
            colors: colors,
            chart: {
                height: 350,
                type: 'line',
                zoom: {
                    enabled: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            series: [{
                name: "Desktops",
                data: [30, 41, 35, 51, 49, 62, 69, 91, 126]
            }],
            title: {
                text: 'Product Trends by Month',
                align: 'left'
            },
            grid: {
                row: {
                    colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                    opacity: 0.5
                },
            },
            labels: ["13 Nov 2017", "14 Nov 2017", "15 Nov 2017", "16 Nov 2017", "17 Nov 2017", "20 Nov 2017", "21 Nov 2017", "22 Nov 2017", "23 Nov 2017", "24 Nov 2017", "27 Nov 2017", "28 Nov 2017", "29 Nov 2017", "30 Nov 2017", "01 Dec 2017", "04 Dec 2017", "05 Dec 2017", "06 Dec 2017", "07 Dec 2017", "08 Dec 2017"],
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
            },
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-09"),
            options
        );

        chart.render();


    }
    if ($("#chart-widget-10").length) {

        var options = {
            colors: colors,
            chart: {
                sparkline: {
                    enabled: true
                },
                height: 250,
                type: 'area',
                toolbar: {
                    show: false
                },
            },
            dataLabels: {
                enabled: false
            },
            fill: {
                opacity: 1,
                type: 'solid'
            },
            stroke: {
                curve: 'straight'
            },
            series: [{
                name: 'series1',
                data: [31, 40, 28, 51, 42, 60, 35]
            }, {
                name: 'series2',
                data: [50, 70, 45, 70, 90, 80, 90]
            }],

            xaxis: {
                type: 'datetime',
                categories: ["2018-09-19T00:00:00", "2018-09-19T01:30:00", "2018-09-19T02:30:00", "2018-09-19T03:30:00", "2018-09-19T04:30:00", "2018-09-19T05:30:00", "2018-09-19T06:30:00"],
            },
            tooltip: {
                x: {
                    format: 'dd/MM/yy HH:mm'
                },
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-10"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-11").length) {

        var options = {
            colors: colors[10],
            chart: {
                sparkline: {
                    enabled: true
                },
                height: 150,
                type: 'area',
                toolbar: {
                    show: false
                },
            },
            dataLabels: {
                enabled: false
            },
            fill: {
                opacity: 1,
                type: 'solid'
            },
            stroke: {
                curve: 'straight'
            },
            series: [{
                name: 'series1',
                data: [51, 42, 45, 31, 40, 28, 35]
            }],

            xaxis: {
                type: 'datetime',
                categories: ["2018-09-19T00:00:00", "2018-09-19T01:30:00", "2018-09-19T02:30:00", "2018-09-19T03:30:00", "2018-09-19T04:30:00", "2018-09-19T05:30:00", "2018-09-19T06:30:00"],
            },
            tooltip: {
                x: {
                    format: 'dd/MM/yy HH:mm'
                },
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-11"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-12").length) {
        var options = {
            colors: colors,
            chart: {
                height: 250,
                type: 'radialBar',
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: '70%',
                    }
                },
            },
            series: [70],
            labels: ['Complete'],

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-12"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-13").length) {

        var options = {
            colors: [colors[20]],
            chart: {
                sparkline: {
                    enabled: true
                },
                type: 'bar',
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded',
                    columnWidth: '20%',
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
                data: [60, 30, 90, 46, 61, 28, 63, 60, 66]
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
            document.querySelector("#chart-widget-13"),
            options
        );

        chart.render();
    }
    if ($("#chart-widget-14").length) {

        var options = {
            chart: {
                type: 'line',

                height: 135,
                sparkline: {
                    enabled: true
                }
            },
            series: [{
                data: [47, 45, 74, 14, 56, 74, 14, 11, 7, 39, 82]
            }],
            tooltip: {
                fixed: {
                    enabled: false
                },
                x: {
                    show: false
                },
                y: {
                    title: {
                        formatter: function (seriesName) {
                            return ''
                        }
                    }
                },
                marker: {
                    show: false
                }
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-14"),
            options
        );

        chart.render();


    }
    if ($("#chart-widget-15").length) {

        var options = {
            colors: [colors[0], colors[20]],
            chart: {
                type: 'bar',
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded',

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
                data: [44, 55, 57, 56, 61]
            }, {
                name: 'Revenue',
                data: [76, 85, 101, 98, 87]
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
            tooltip: {
                y: {
                    formatter: function (val) {
                        return "$ " + val + " thousands"
                    }
                }
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-15"),
            options
        );

        chart.render();


    }
    if ($("#chart-widget-16").length) {

        var options = {
            colors: [colors[6]],
            chart: {
                type: 'area',
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded',

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
                data: [44, 55, 57, 56, 61]
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
            tooltip: {
                y: {
                    formatter: function (val) {
                        return "$ " + val + " thousands"
                    }
                }
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-16"),
            options
        );

        chart.render();


    }
    if ($("#chart-widget-17").length) {

        var options = {
            chart: {
                type: 'line',
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    endingShape: 'rounded',

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
                data: [44, 55, 57, 56, 61]
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
            tooltip: {
                y: {
                    formatter: function (val) {
                        return "$ " + val + " thousands"
                    }
                }
            }
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-17"),
            options
        );

        chart.render();

    }
    if ($("#chart-widget-18").length) {


        var options = {
            colors: [colors[0], colors[18], colors[19], colors[17], colors[15], colors[12]],
            chart: {
                width: 240,
                type: 'donut',
            },
            series: [44, 55, 25, 25, 16, 46],
            dataLabels: {
                enabled: false
            },
            legend: {
                position: 'bottom',
                show: false
            }

        }

        var chart = new ApexCharts(
            document.querySelector("#chart-widget-18"),
            options
        );

        chart.render();
    }
    if ($.trumbowyg) {
        $.trumbowyg.svgPath = 'assets/vendor/trumbowyg/ui/icons.svg';

        $("#trumbowyg-note").trumbowyg({
            btns: [
                ['strong', 'em', 'del'],
                ['link'],
                ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                ['unorderedList', 'orderedList'],
                ['fullscreen']
            ]
        });
    }
})(window.jQuery);