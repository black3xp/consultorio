(function ($) {
    'use strict';
    if ($("#chart-17").length) {

        var options = {
            colors: [colors[14], colors[4]],
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
                name: 'Last Month',
                data: [44, 55, 57, 56, 61, 58, 63, 60, 66]
            }, {
                name: 'This Month',
                data: [76, 85, 101, 98, 87, 105, 91, 114, 94]
            }],
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
            document.querySelector("#chart-17"),
            options
        );

        chart.render();
    }
    if ($("#chart-18").length) {

        var options = {
            annotations: {
                yaxis: [{
                    y: 8200,
                    borderColor: colors[1],
                    label: {
                        borderColor: colors[1],
                        style: {
                            color: '#fff',
                            background: colors[1],
                        },
                        text: 'Followers',
                    }
                }],
                xaxis: [{
                    x: new Date('23 Nov 2017').getTime(),
                    strokeDashArray: 0,
                    borderColor: colors[0],
                    label: {
                        borderColor: colors[0],
                        style: {
                            color: '#fff',
                            background: colors[0],
                        },
                        text: 'Blog Redesign',
                    }
                }],
                points: [{
                    x: new Date('27 Nov 2017').getTime(),
                    y: 8506.9,
                    marker: {
                        size: 8,
                        fillColor: '#fff',
                        strokeColor: colors[6],
                        radius: 2
                    },
                    label: {
                        borderColor: colors[6],
                        offsetY: 0,
                        style: {
                            color: '#fff',
                            background: colors[6],
                        },

                        text: 'Insta Stories',
                    }
                }]
            },
            chart: {
                height: 350,
                type: 'line',
            },
            dataLabels: {
                enabled: false
            },
            colors: colors,
            stroke: {
                curve: 'straight'
            },
            grid: {
                padding: {
                    right: 30,
                    left: 20
                },
                strokeDashArray: '3',
            },
            series: [{
                data: [8107, 8128, 8122, 8165, 8340, 8423, 8423, 8514, 8481, 8487, 8506, 8626, 8668, 8602, 8607, 8512, 8496, 8600, 8881, 9340]
            }],
            labels: ["13 Nov 2017", "14 Nov 2017", "15 Nov 2017", "16 Nov 2017", "17 Nov 2017", "20 Nov 2017", "21 Nov 2017", "22 Nov 2017", "23 Nov 2017", "24 Nov 2017", "27 Nov 2017", "28 Nov 2017", "29 Nov 2017", "30 Nov 2017", "01 Dec 2017", "04 Dec 2017", "05 Dec 2017", "06 Dec 2017", "07 Dec 2017", "08 Dec 2017"],
            xaxis: {
                type: 'datetime',
            },
        }

        var chart = new ApexCharts(
            document.querySelector("#chart-18"),
            options
        );

        chart.render();


    }
})(window.jQuery);


