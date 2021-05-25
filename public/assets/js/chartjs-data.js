(function ($) {
    'use strict';
    window.onload = function (e) {
        if ($("#chartjs-01").length) {
            new Chart(document.getElementById("chartjs-01"), {
                type: 'bar',
                data: {
                    labels: labelGenerator("data", 12),
                    datasets: [{
                        label: 'Dataset 1',
                        backgroundColor: colors[0],
                        data: [
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor()
                        ]
                    }, {
                        label: 'Dataset 2',
                        backgroundColor: colors[1],
                        data: [
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor()
                        ]
                    }, {
                        label: 'Dataset 3',
                        backgroundColor: colors[7],
                        data: [
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor(),
                            randomScalingFactor()
                        ]
                    }]

                },

                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    maintainAspectRatio: true
                }
            });
        }
        if ($("#chartjs-02").length) {
            new Chart(document.getElementById("chartjs-02"), {
                type: 'doughnut',
                data: {
                    labels: labelGenerator("QTY", 6),
                    datasets: [{
                        label: '#Values',
                        data: [randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor(), randomScalingFactor()],
                        backgroundColor: [colors[0], colors[8], colors[10], colors[3], colors[9], colors[5]],
                    }]
                },
                options: {

                    maintainAspectRatio: true
                }
            });
        }
        if ($("#chartjs-03").length) {
            new Chart(document.getElementById("chartjs-03"), {
                type: 'line',
                data: {
                    labels: [10, 15, 6, 19, 17],
                    datasets: [{
                        label: '#Values',
                        data: [10, 15, 6, 25, 17],
                        borderColor: colors[3],
                        backgroundColor: 'transparent',
                        lineTension: 0,

                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],

                    },
                    legend: {
                        display: false
                    },
                    maintainAspectRatio: true
                }
            });

        }
        if ($("#chartjs-04").length) {
            new Chart(document.getElementById("chartjs-04"), {
                type: 'bar',
                data: {
                    labels: [10, 15, 6, 25, 17, 12, 2],
                    datasets: [{
                        label: '#Values',
                        data: [10, 15, 6, 25, 17, 12, 2],
                        backgroundColor: colors[7],
                        lineTension: 0,

                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],
                        xAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],

                    },
                    legend: {
                        display: false
                    },
                    maintainAspectRatio: true
                }
            });

        }
        if ($("#chartjs-05").length) {
            new Chart(document.getElementById("chartjs-05"), {
                type: 'horizontalBar',
                data: {
                    labels: [10, 15, 6, 25, 17, 12, 2],
                    datasets: [{
                        label: '#Values',
                        data: [10, 15, 6, 25, 17, 12, 2],
                        backgroundColor: colors[0],
                        lineTension: 0,

                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],
                        xAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],

                    },
                    legend: {
                        display: false
                    },
                    maintainAspectRatio: true
                }
            });

        }
        if ($("#chartjs-06").length) {
            new Chart(document.getElementById("chartjs-06"), {
                type: 'bar',
                data: {
                    labels: [45, 78, 71, 60, 82, 30],
                    datasets: [{
                        label: '#Values',
                        data: [45, 78, 71, 60, 82, 30],
                        backgroundColor: colors[2],
                        lineTension: 0,

                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],
                        xAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],

                    },
                    legend: {
                        display: false
                    },
                    maintainAspectRatio: true
                }
            });
        }

        if ($("#chartjs-07").length) {
            var barChartData = {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                datasets: [{
                    label: 'House Keeping',
                    backgroundColor: colors[0],
                    data: [
                        16, -56, 98, 29, 35, 48, 82, 8, 65, 81, 40, 50
                    ]
                }, {
                    label: 'Logistics ',
                    backgroundColor: colors[2],
                    data: [
                        25, 60, -85, 26, 55, -48, 87, -89, -52, 56, -56, 82
                    ]
                },
                    {
                        label: 'Server',
                        backgroundColor: colors[5],
                        data: [
                            10, 89, 81, -2, -52, -41, -44, -88, 70, -36, 78, -57
                        ]
                    }, {
                        label: 'Consulting',
                        backgroundColor: colors[7],
                        data: [
                            -45, 32, -98, 85, 57, -35, -82, 75, 55, -73, 56, 85
                        ]
                    },
                    {
                        label: 'Travel',
                        backgroundColor: colors[6],
                        data: [
                            -95, 56, -34, -85, 66, -20, -10, 90, 27, -7, 5, 19
                        ]
                    }]

            };
            new Chart(document.getElementById('chartjs-07').getContext('2d'), {
                type: 'bar',
                data: barChartData,
                options: {
                    opacity: 1,
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        xAxes: [{
                            stacked: true,
                        }],
                        yAxes: [{
                            stacked: true
                        }]
                    }
                }
            });
        }
        if ($("#chartjs-08").length) {
            new Chart(document.getElementById("chartjs-08"), {
                type: 'line',
                data: {
                    labels: [10, 15, 6, 19, 17, 25, 58, 26, 39],
                    datasets: [{
                        label: '#Values',
                        data: [10, 45, 66, 25, 17, 25, 58, 26, 39],

                        backgroundColor: 'rgba(111, 66, 193, 0.41)',


                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            },

                        }],

                    },
                    legend: {
                        display: false
                    },
                    maintainAspectRatio: true
                }
            });
        }
        if ($("#chartjs-09").length) {


            new Chart(document.getElementById("chartjs-09"), {
                "type": "radar",
                "data": {
                    "labels": ["Eating", "Drinking", "Sleeping", "Designing", "Coding", "Cycling", "Running"],
                    "datasets": [{
                        "label": "My First Dataset",
                        "data": [65, 59, 90, 81, 56, 55, 40],
                        "fill": true,
                        "backgroundColor": "rgba(255, 99, 132, 0.2)",
                        "borderColor": "rgb(255, 99, 132)",
                        "pointBackgroundColor": "rgb(255, 99, 132)",
                        "pointBorderColor": "#fff",
                        "pointHoverBackgroundColor": "#fff",
                        "pointHoverBorderColor": "rgb(255, 99, 132)"
                    }, {
                        "label": "My Second Dataset",
                        "data": [28, 48, 40, 19, 96, 27, 100],
                        "fill": true,
                        "backgroundColor": "rgba(54, 162, 235, 0.2)",
                        "borderColor": "rgb(54, 162, 235)",
                        "pointBackgroundColor": "rgb(54, 162, 235)",
                        "pointBorderColor": "#fff",
                        "pointHoverBackgroundColor": "#fff",
                        "pointHoverBorderColor": "rgb(54, 162, 235)"
                    }]
                },
                "options": {
                    "elements": {
                        "line": {
                            "tension": 0,
                            "borderWidth": 3
                        }
                    }
                }
            });
        }
    }

})(window.jQuery);
