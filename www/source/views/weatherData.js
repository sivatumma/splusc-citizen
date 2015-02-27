enyo.kind({
    name: "weatherData",
    kind: "FittableRows",
    classes: "weatherDataCss",
    published: {
        weatherobj: ""
    },
    components: [{
        name: "CityName",
        content: "San Jose",
        classes: "cityNameCss"
    }, {
        kind: "FittableColumns",
        classes: "fontcolor extraPadding",
        components: [{
            content: "Haze",
            classes: "hazeCss item"
        }, {
            content: "Wind",
            classes: "windCss item",
        }, {
            name: "windData",
            classes: "windDataCss item"
        }, {
            content: "Precip",
            classes: "precipCss item"
        }, {
            name: "precipData",
            classes: "precipDataCss item"
        }]
    }, {
        kind: "FittableColumns",
        style: "padding-top:15px;",
        components: [{
            name: "windImage",
            kind: "enyo.Image",
            src: 'assets/haze_icon.png',
            classes: "windImageCss"
        }, {
            name: "tempData",
            content: "28°",
            classes: "tempDataCss"
        }]
    }, {
    	//content:"gfh"
        kind: "weeklyWeather"
    }, {
        tag: "hr",
        classes: "horizontal-line"
    }, {
        content: "Hourly Forecast",
        classes: "fontcolor"
    }],
    create: function() {
        this.inherited(arguments);
        this.assign();
    },
    assign: function() {
        this.weatherobj = weatherDataJson.initialise();
         this.$.windData.setContent(this.weatherobj.data.current_condition[0].windspeedKmph + "km/h");
         this.$.precipData.setContent(this.weatherobj.data.current_condition[0].precipMM + "%");
    }

});
enyo.kind({
    name: "weeklyWeather",
    kind: "enyo.Scroller",
    vertical: "hidden",
    components: [{
        kind: "enyo.Table",
        style: "padding-top:20px",
        attributes: {
            cellpadding: "10"
        },
        components: [{
            classes: "tableRow",
            components: [{
                name: "Day1",
            }, {
                name: "Day2",
            }, {
                name: "Day3",
            }, {
                name: "Day4",
            }, {
                name: "Day5",
            }]
        }, {
            classes: "tableRow",
            components: [{
                tag: "td",
                components: [{
                    name: "statusImage1",
                    kind: "enyo.Image",
                    classes: "cloudImage"
                }]
            }, {
                tag: "td",
                components: [{
                    name: "statusImage2",
                    kind: "enyo.Image",
                    classes: "cloudImage"
                }]
            }, {
                tag: "td",
                components: [{
                    name: "statusImage3",
                    kind: "enyo.Image",
                    classes: "cloudImage"
                }]
            }, {
                tag: "td",
                components: [{
                    name: "statusImage4",
                    kind: "enyo.Image",
                    classes: "cloudImage"
                }]
            }, {
                tag: "td",
                components: [{
                    name: "statusImage5",
                    kind: "enyo.Image",
                    classes: "cloudImage"
                }]
            }]

        }, {
            classes: "tableRow",
            components: [{
                name: "maxTemp1"
            }, {
                name: "maxTemp2"
            }, {
                name: "maxTemp3"
            }, {
                name: "maxTemp4"
            }, {
                name: "maxTemp5"
            }]
        }, {
            classes: "tableRow fontcolor",
            components: [{
                name: "minTemp1"
            }, {
                name: "minTemp2"
            }, {
                name: "minTemp3"
            }, {
                name: "minTemp4"
            }, {
                name: "minTemp5"
            }]
        }]
    }],
    rendered: function() {
        this.inherited(arguments);
        this.getData();
    },
    getData: function() {
        var obj = this.parent.weatherobj;
        this.$.Day1.setContent(this.getDayName(obj.data.weather[0].date));
        this.$.Day2.setContent(this.getDayName(obj.data.weather[1].date));
        this.$.Day3.setContent(this.getDayName(obj.data.weather[2].date));
        this.$.Day4.setContent(this.getDayName(obj.data.weather[3].date));
        this.$.Day5.setContent(this.getDayName(obj.data.weather[4].date));

        this.$.maxTemp1.setContent(obj.data.weather[0].maxtempC + "\xB0");
        this.$.maxTemp2.setContent(obj.data.weather[1].maxtempC + "\xB0");
        this.$.maxTemp3.setContent(obj.data.weather[2].maxtempC + "\xB0");
        this.$.maxTemp4.setContent(obj.data.weather[3].maxtempC + "\xB0");
        this.$.maxTemp5.setContent(obj.data.weather[4].maxtempC + "\xB0");

        this.$.minTemp1.setContent(obj.data.weather[0].mintempC + "\xB0");
        this.$.minTemp2.setContent(obj.data.weather[1].mintempC + "\xB0");
        this.$.minTemp3.setContent(obj.data.weather[2].mintempC + "\xB0");
        this.$.minTemp4.setContent(obj.data.weather[3].mintempC + "\xB0");
        this.$.minTemp5.setContent(obj.data.weather[4].mintempC + "\xB0");
       
        this.$.statusImage1.setSrc(this.getIcon(obj.data.weather[0].hourly[0].weatherDesc[0].value));
        this.$.statusImage2.setSrc(this.getIcon(obj.data.weather[1].hourly[1].weatherDesc[0].value));
        this.$.statusImage3.setSrc(this.getIcon(obj.data.weather[2].hourly[2].weatherDesc[0].value));
        this.$.statusImage4.setSrc(this.getIcon(obj.data.weather[3].hourly[3].weatherDesc[0].value));
        this.$.statusImage5.setSrc(this.getIcon(obj.data.weather[4].hourly[4].weatherDesc[0].value));
    },
    getDayName: function(date) {
        var d = new Date(date);
        var weekDay = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
        return weekDay[d.getDay()];
    },
    getIcon:function(value){
        switch(value){
            case 'Clear' : return 'assets/clear_night_icon2.png';
            case 'Partly Cloudy' : return 'assets/sunny_intervals_icon2.png';
            case  'Sunny' : return 'assets/sunny_icon2.png';
            default : return 'assets/cloudy_icon2.png';
        }
    }
});
