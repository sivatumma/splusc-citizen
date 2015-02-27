enyo.kind({
    name: "AppConfig",
    statics: {
        baseURL: "https://ec2-54-169-216-17.ap-southeast-1.compute.amazonaws.com", // should be used everywhere in the app
        prodURL: "/",
        debugURL: "https://172.31.26.136/",
        currentLocation: true,
        simulateOtherLocation: false, // set to true to use hyatt location (doesn't update/not working)
        // locationUpdateInterval: 5 * 1000, // 4 seconds
        // dataLoadInterval: 20 * 1000,
        debugMode: false, //  Set this to true to enable console logging and alert() statements. 
        //  Set this to false,before deploying the app into production.
        developmentMode: true, //  Same as above, but meaningful. Would use at a later time.
        alertsEnabled: false, //  alert statements will only work if this is true & debugMode is true.
        consoleLoggingEnabled: true, //  console.log statements will only work if this is true & debugMode is true.
        logglyLoggingEnabled: false, //  AppConfig.log() Logs will go to loggly endpoints if this is set to true. 
        cityName: "San Jose", // Get all city information for specified city
        latitude: 37.3333, // default latitude pointing to Chicago
        longitude: -121.9000, // default logitude pointing to Chicago
        //  alert only if debugMode and alertsMode are true
        alert: function(message) {
            if (AppConfig.debugMode && AppConfig.alertsEnabled) {
                alert(message);
            }
        },
        log: function(message) {
            if (AppConfig.logglyLoggingEnabled) AnalyticsLogger.logAnalyticsData(message);
            // Log only if debugMode and logsMode are true. In production, logs will only goto loggly.
            if (AppConfig.debugMode && AppConfig.consoleLoggingEnabled) {
                console.log(message);
            }
        }
    },
    create: function() {
        this.inherited(arguments);
        if (!window.location.hostname || window.location.hostname.indexOf("localhost") >= 0) {
            AppConfig.baseURL = AppConfig.debugURL;
        }
    }
});