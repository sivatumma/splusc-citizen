/**
    For simple applications, you might define all of your models, collections,
    and sources in this file.  For more complex applications, you might choose to separate
    these kind definitions into multiple files under this folder.
*/
enyo.kind({
    name: "AjaxAPI",
    statics: {
        //You can make the API request using:
        //  DeviceDetailApi.getConnections(["172.16.255.16"], this, this.test);
        doLogout: function(errorReason) {
            // @TODO: show error popup with ok button instead of alert
            var logoutUrl = AppConfig.baseURL + "logout.jsp";
            if (errorReason) {
                logoutUrl += "?type=" + errorReason;
            }
            window.location = logoutUrl;
            responseHandled = false;
        },
        //In the object that makes the call, you can do handle the response:
        //  test: function(inSender, inEvent){
        //   }
        defaultErrorHandler: function(inSender, inResponse) {
            var responseHandled = false;
            AppConfig.alert(inResponse);
            switch (inResponse) {
                case 0:
                    enyo.Signals.send("onAjaxError", {
                        errorMessage: "Unable to connect to the server. You will be logged out automatically.",
                        forceLogout: true,
                        errorReason: "unreachable"
                    });
                    break;
                case 'timeout':
                    enyo.Signals.send("onAjaxError", {
                        errorMessage: "Request Timed Out"
                    });
                    break;
                default:
                    if (inSender.xhrResponse.body) {
                        enyo.Signals.send("onAjaxError", {
                            errorMessage: "Error: " + inSender.xhrResponse.body
                        });
                    } else {
                        enyo.Signals.send("onAjaxError", {
                            errorMessage: "Error: Unknown"
                        });
                    }
                    // log the user out
                    break;
            }
            return responseHandled;
        },
        unifiedSuccessHandler: function(inSender, inResponse) {
            var responseHandled = true;
            if (inResponse !== null && (inResponse === "" || typeof inResponse === 'object') || inSender.contentType === "application/octet-stream") {
                // return false so that the local success handler can process the response
                responseHandled = false;
            } else {
                // log the user out
                enyo.Signals.send("onAjaxError", {
                    errorMessage: "Session Expired.\n You will be logged out automatically.",
                    errorReason: "session_expired",
                    forceLogout: true
                });
            }
            return responseHandled;
        },
        // request URL - url to call (baseURL + requestURL)
        // ipArray - array of IPs to add to the request or null for none
        // context - context for successCallback or errorCallback
        // successCallback - success handler (parser for the json)
        // errorCallback - optional error handler
        makeAjaxRequest: function(requestURL, ipArray, context, successCallback, errorCallback, method, postBody, contentType, timeoutValue, token) {
            // set url (stripping leadding '/' from requestURL)
            if (requestURL.charAt(0) == "/") {
                requestURL = requestURL.replace("/", "");
            }
            var urlText = requestURL;
            if (urlText.indexOf(AppConfig.baseURL) != 0) {
                if (AppConfig.baseURL.charAt(AppConfig.baseURL.length - 1) == "/") {
                    urlText = AppConfig.baseURL + requestURL;
                } else {
                    urlText = AppConfig.baseURL + "/" + requestURL;
                }
            }
            if (ipArray) {
                urlText = this.generateParamsText(urlText, ipArray);
            }
            // log.debug("*** makeAjaxRequest: " + urlText);
            var methodType = (method && method !== "") ? method.toUpperCase() : "GET";
            var ajax = new enyo.Ajax({
                url: urlText,
                cacheBust: false,
                method: methodType,
                timeout: timeoutValue || AppConfig.defaultTimeoutInterval,
                headers: token,
                contentType: contentType || "application/json", // not setting this treats the data a form
                postBody: postBody
            });
            if (postBody) {
                switch (methodType) {
                    case "POST":
                    case "PUT":
                    case "GET":
                        ajax.postBody = postBody || {};
                        ajax.handleAs = "json";
                        break;
                    default:
                        console.log("Post Body passed to request, but method type is " + methodType, urlText);
                        break;
                }
            }
            // send parameters the remote service using the 'go()' method
            ajax.go();
            // attach responders to the transaction object
            var successHandler = (context && successCallback) ? enyo.bind(context, successCallback) : null;
            ajax.response(function(inSender, inResponse) {
                // unifiedSuccessHandler returns true if it handled the response, so
                //  don't call the handler if it returns true
                if (!AjaxAPI.unifiedSuccessHandler(inSender, inResponse)) {
                    if (successHandler) {
                        successHandler(inSender, inResponse);
                    }
                }
            });
            var errorHandler = (context && errorCallback) ? enyo.bind(context, errorCallback) : null;
            // user error handler that was passed in or the default handler
            ajax.error(errorHandler || AjaxAPI.defaultErrorHandler);
        },
        generateParamsText: function(urlText, ipArray) {
            urlText = urlText.replace("deviceId=?", "");
            urlText = urlText.replace("?", "");
            _.each(ipArray, function(ip) {
                if (ip == ipArray[0]) {
                    urlText = urlText + "?deviceId=" + ip.toString();
                } else {
                    urlText = urlText + "&deviceId=" + ip.toString();
                }
            }, this);
            return (urlText);
        },
        simpleAjaxRequest: function(requestURL, context, successCallback, errorCallback, method, postBody, contentType, timeoutValue) {
            // set url (stripping leadding '/' from requestURL)
            if (requestURL.charAt(0) == "/") {
                requestURL = requestURL.replace("/", "");
            }
            var urlText = requestURL;
            if (urlText.indexOf(AppConfig.baseURL) != 0) {
                if (AppConfig.baseURL.charAt(AppConfig.baseURL.length - 1) == "/") {
                    urlText = AppConfig.baseURL + requestURL;
                } else {
                    urlText = AppConfig.baseURL + "/" + requestURL;
                }
            }
            var authToken = {
                "token": UserModel.responseHeader.token
            };
            // log.debug("*** makeAjaxRequest: " + urlText);
            var methodType = (method && method !== "") ? method.toUpperCase() : "GET";
            var ajax = new enyo.Ajax({
                url: urlText,
                cacheBust: false,
                method: methodType,
                timeout: timeoutValue || AppConfig.defaultTimeoutInterval,
                headers: authToken,
                contentType: contentType || "application/json", // not setting this treats the data a form
                postBody: postBody
            });
            if (postBody) {
                switch (methodType) {
                    case "POST":
                    case "PUT":
                        ajax.postBody = postBody || {};
                        ajax.handleAs = "json";
                        break;
                    default:
                        log.error("Post Body passed to request, but method type is " + methodType, urlText);
                        break;
                }
            }
            // send parameters the remote service using the 'go()' method
            ajax.go();
            // attach responders to the transaction object
            var successHandler = (context && successCallback) ? enyo.bind(context, successCallback) : null;
            ajax.response(function(inSender, inResponse) {
                if (successHandler) {
                    successHandler(inResponse);
                }
            });
            var errorHandler = (context && errorCallback) ? enyo.bind(context, errorCallback) : null;
            // user error handler that was passed in or the default handler
            ajax.error(errorHandler || AjaxAPI.defaultErrorHandler);
        },
    }
});
enyo.kind({
    name: "Utils",
    statics: {
        snippet: function(str, cutOffset) {
            if (str == '' || str == null) str = "";
            if (str.length > cutOffset) {
                return (str.substring(0, cutOffset) + "...");
            } else {
                return str;
            }
        },
        isFunction: function(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        }
    }
});
enyo.kind({
    name: "LayersModel",
    statics: {
        dataUpdated: "",
        lastRequestedLayer: '',
        layersObj: [{
            layerName: "lights",
            dynamicLayer: true,
            requestURL: "api/ebc-lights",
            reqStatus: false,
            dataObject: '',
            active: false
        }, {
            layerName: "parking",
            dynamicLayer: true,
            iconType: "car",
            requestURL: "api/ebc-parking",
            reqStatus: false,
            dataObject: '',
            active: false
        }, {
            layerName: "crowd",
            iconType: 'crowd',
            dynamicLayer: true,
            requestURL: "api/mse/location/clients/",
            reqStatus: false,
            dataObject: '',
            active: false
        }, {
            layerName: "traffic",
            iconType: "traffic",
            dynamicLayer: true,
            requestURL: "api/ebc-smart-traffic",
            reqStatus: false,
            dataObject: '',
            active: false
        }],
        changeLayerStatus: function(layerName, status) {
            var layersObj = [];
            var newLayer = {};
            _.each(LayersModel.layersObj, function(layer) {
                newLayer = {};
                enyo.mixin(newLayer, layer);
                if (layer.layerName == layerName) {
                    newLayer.active = status;
                }
                if (newLayer.active && !newLayer.dataObject && !newLayer.reqStatus) {
                    LayersModel.getData(newLayer);
                    newLayer.reqStatus = true;
                }
                layersObj.push(newLayer);
            });
            LayersModel.layersObj = layersObj;
            enyo.Signals.send("layersUpdated");
        },
        periodicUpdateData: function() {
            setInterval(function() {
                _.each(LayersModel.layersObj, function(layer) {
                    if (layer.dynamicLayer && layer.active) {
                        LayersModel.getData(layer);
                    }
                });
            }, AppConfig.dataLoadInterval);
        },
        getData: function(layerObj) {
            var layer = layerObj.layerName;
            LayersModel.lastRequestedLayer = layer;
            var requestURL = "";
            var postBody = "";
            var method = "";
            switch (layer) {
                case "lights":
                    method = "GET";
                    // postBody = {
                    //     "query": {
                    //         "find": {
                    //             "light": {
                    //                 "operatedBy": "iot-wf",
                    //                 "geocoordinates": {
                    //                     "lat": "+41.887667" + "," + "51.887667",
                    //                     "lon": "-84.632521" + "," + "-87.432521"
                    //                 }
                    //             }
                    //         }
                    //     }
                    // };
                    postBody = {
                        // "query": {
                        //     "documentation": "Get all lights operated by iot-wf",
                        //     "find": {
                        //         "light": {
                        //             "operatedBy": "iot-wf",
                        //             "geocoordinates": {
                        //                 "lat": "+41.887667,+51.887667",
                        //                 "lon": "-87.622521,-87.432521"
                        //             }
                        //         }
                        //     }
                        // }
                        // Fetching all the lights
                        "query": {
                            "documentation": "Get all lights operated by specified organization (maps to logical scopes)",
                            "find": {
                                "light": {
                                    "operatedBy": "iot-wf"
                                }
                            }
                        }
                    };
                    break;
                case "parking":
                    method = "GET";
                    postBody = {
                        "query": {
                            "documentation": "Get parking space operated by specified organization",
                            "find": {
                                "parkingSpace": {
                                    "operatedBy": "iot-wf"
                                }
                            }
                        }
                    };
                    break;
                case "traffic":
                    method = "GET";
                    postBody = {
                        "query": {
                            "documentation": "Get viewports corresponding to medium density traffic operated by 'iot-wf'",
                            "find": {
                                "traffic": {
                                    "operatedBy": "iot-wf"
                                }
                            }
                        }
                    };
                    break;
                default:
                    break;
            }
            var token = "123456";
            var authToken = {
                "token": token
            };
            AjaxAPI.makeAjaxRequest(layerObj.requestURL, null, this, "processData", "errorHandler", method, postBody, null, null, authToken);
            // requestURL, ipArray, context, successCallback, errorCallback, method, postBody, contentType, timeoutValue, token
        },
        processData: function(inSender, inResponse) {
            var layersObj = [];
            var newLayer = {};
            _.each(LayersModel.layersObj, function(layer) {
                newLayer = {};
                enyo.mixin(newLayer, layer);
                if (inSender.url.indexOf(layer.requestURL) >= 0) {
                    switch (layer.layerName) {
                        case "lights":
                            newLayer.dataObject = inResponse.lights;
                            break;
                        case "parking":
                            newLayer.dataObject = inResponse.parkingSpace[0].parkingSpots;
                            break;
                        case "traffic":
                            newLayer.dataObject = inResponse.traffic;
                            break;
                        case "crowd":
                            newLayer.dataObject = inResponse.Locations ? inResponse.Locations.WirelessClientLocation : "undefined";
                            break;
                        default:
                            break;
                    }
                }
                layersObj.push(newLayer);
            });
            LayersModel.layersObj = layersObj;
            enyo.Signals.send("layersUpdated", {
                layerName: LayersModel.lastRequestedLayer
            });
            enyo.Signals.send("hideLoader");
        },
        errorHandler: function(inSender, inResponse) {}
    }
});

// Weather data
enyo.kind({
    name: "weatherDataJson",
    statics: {
        initialise: function() {
            var weatherInfo = {
                "data": {
                    "current_condition": [{
                        "cloudcover": "0",
                        "FeelsLikeC": "8",
                        "FeelsLikeF": "46",
                        "humidity": "71",
                        "observation_time": "05:32 AM",
                        "precipMM": "0.0",
                        "pressure": "1029",
                        "temp_C": "8",
                        "temp_F": "46",
                        "visibility": "16",
                        "weatherCode": "113",
                        "weatherDesc": [{
                            "value": "Clear"
                        }],
                        "weatherIconUrl": [{
                            "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                        }],
                        "winddir16Point": "N",
                        "winddirDegree": "0",
                        "windspeedKmph": "0",
                        "windspeedMiles": "0"
                    }],
                    "request": [{
                        "query": "San Jose, United States Of America",
                        "type": "City"
                    }],
                    "weather": [{
                        "astronomy": [{
                            "moonrise": "05:07 PM",
                            "moonset": "06:39 AM",
                            "sunrise": "07:22 AM",
                            "sunset": "05:03 PM"
                        }],
                        "date": "2015-01-04",
                        "hourly": [{
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "99",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "32",
                            "DewPointC": "-2",
                            "DewPointF": "29",
                            "FeelsLikeC": "3",
                            "FeelsLikeF": "38",
                            "HeatIndexC": "3",
                            "HeatIndexF": "38",
                            "humidity": "71",
                            "precipMM": "0.0",
                            "pressure": "1026",
                            "tempC": "3",
                            "tempF": "38",
                            "time": "200",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0004_black_low_cloud.png"
                            }],
                            "WindChillC": "3",
                            "WindChillF": "38",
                            "winddir16Point": "ENE",
                            "winddirDegree": "62",
                            "WindGustKmph": "5",
                            "WindGustMiles": "3",
                            "windspeedKmph": "2",
                            "windspeedMiles": "1"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "8",
                            "DewPointC": "-2",
                            "DewPointF": "28",
                            "FeelsLikeC": "3",
                            "FeelsLikeF": "37",
                            "HeatIndexC": "3",
                            "HeatIndexF": "38",
                            "humidity": "67",
                            "precipMM": "0.0",
                            "pressure": "1027",
                            "tempC": "3",
                            "tempF": "38",
                            "time": "500",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "3",
                            "WindChillF": "37",
                            "winddir16Point": "ENE",
                            "winddirDegree": "74",
                            "WindGustKmph": "9",
                            "WindGustMiles": "6",
                            "windspeedKmph": "4",
                            "windspeedMiles": "3"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "91",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "27",
                            "DewPointC": "-3",
                            "DewPointF": "28",
                            "FeelsLikeC": "2",
                            "FeelsLikeF": "36",
                            "HeatIndexC": "4",
                            "HeatIndexF": "39",
                            "humidity": "63",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "4",
                            "tempF": "39",
                            "time": "800",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"
                            }],
                            "WindChillC": "2",
                            "WindChillF": "36",
                            "winddir16Point": "E",
                            "winddirDegree": "89",
                            "WindGustKmph": "14",
                            "WindGustMiles": "9",
                            "windspeedKmph": "6",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "45",
                            "DewPointC": "-2",
                            "DewPointF": "29",
                            "FeelsLikeC": "11",
                            "FeelsLikeF": "51",
                            "HeatIndexC": "11",
                            "HeatIndexF": "51",
                            "humidity": "42",
                            "precipMM": "0.0",
                            "pressure": "1029",
                            "tempC": "11",
                            "tempF": "51",
                            "time": "1100",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"
                            }],
                            "WindChillC": "11",
                            "WindChillF": "51",
                            "winddir16Point": "ENE",
                            "winddirDegree": "59",
                            "WindGustKmph": "7",
                            "WindGustMiles": "4",
                            "windspeedKmph": "5",
                            "windspeedMiles": "3"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "99",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "14",
                            "DewPointC": "1",
                            "DewPointF": "35",
                            "FeelsLikeC": "14",
                            "FeelsLikeF": "57",
                            "HeatIndexC": "14",
                            "HeatIndexF": "56",
                            "humidity": "44",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "14",
                            "tempF": "56",
                            "time": "1400",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "14",
                            "WindChillF": "57",
                            "winddir16Point": "N",
                            "winddirDegree": "3",
                            "WindGustKmph": "5",
                            "WindGustMiles": "3",
                            "windspeedKmph": "4",
                            "windspeedMiles": "2"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "7",
                            "DewPointC": "5",
                            "DewPointF": "41",
                            "FeelsLikeC": "15",
                            "FeelsLikeF": "59",
                            "HeatIndexC": "15",
                            "HeatIndexF": "59",
                            "humidity": "50",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "15",
                            "tempF": "59",
                            "time": "1700",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "15",
                            "WindChillF": "59",
                            "winddir16Point": "NNE",
                            "winddirDegree": "24",
                            "WindGustKmph": "7",
                            "WindGustMiles": "4",
                            "windspeedKmph": "6",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "97",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "2",
                            "DewPointC": "0",
                            "DewPointF": "32",
                            "FeelsLikeC": "12",
                            "FeelsLikeF": "54",
                            "HeatIndexC": "16",
                            "HeatIndexF": "61",
                            "humidity": "60",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "12",
                            "tempF": "54",
                            "time": "2000",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "12",
                            "WindChillF": "54",
                            "winddir16Point": "ENE",
                            "winddirDegree": "64",
                            "WindGustKmph": "15",
                            "WindGustMiles": "9",
                            "windspeedKmph": "7",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "2",
                            "DewPointC": "-4",
                            "DewPointF": "25",
                            "FeelsLikeC": "9",
                            "FeelsLikeF": "49",
                            "HeatIndexC": "13",
                            "HeatIndexF": "56",
                            "humidity": "51",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "9",
                            "tempF": "49",
                            "time": "2300",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "9",
                            "WindChillF": "49",
                            "winddir16Point": "ENE",
                            "winddirDegree": "68",
                            "WindGustKmph": "14",
                            "WindGustMiles": "9",
                            "windspeedKmph": "7",
                            "windspeedMiles": "4"
                        }],
                        "maxtempC": "15",
                        "maxtempF": "59",
                        "mintempC": "5",
                        "mintempF": "40",
                        "uvIndex": "2"
                    }, {
                        "astronomy": [{
                            "moonrise": "06:01 PM",
                            "moonset": "07:25 AM",
                            "sunrise": "07:22 AM",
                            "sunset": "05:04 PM"
                        }],
                        "date": "2015-01-05",
                        "hourly": [{
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "95",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "-5",
                            "DewPointF": "23",
                            "FeelsLikeC": "3",
                            "FeelsLikeF": "38",
                            "HeatIndexC": "5",
                            "HeatIndexF": "40",
                            "humidity": "49",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "5",
                            "tempF": "40",
                            "time": "200",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "3",
                            "WindChillF": "38",
                            "winddir16Point": "ENE",
                            "winddirDegree": "60",
                            "WindGustKmph": "13",
                            "WindGustMiles": "8",
                            "windspeedKmph": "6",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "2",
                            "DewPointC": "-7",
                            "DewPointF": "19",
                            "FeelsLikeC": "3",
                            "FeelsLikeF": "37",
                            "HeatIndexC": "5",
                            "HeatIndexF": "40",
                            "humidity": "42",
                            "precipMM": "0.0",
                            "pressure": "1028",
                            "tempC": "5",
                            "tempF": "40",
                            "time": "500",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "3",
                            "WindChillF": "37",
                            "winddir16Point": "ENE",
                            "winddirDegree": "66",
                            "WindGustKmph": "17",
                            "WindGustMiles": "10",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "93",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "3",
                            "DewPointC": "-6",
                            "DewPointF": "21",
                            "FeelsLikeC": "4",
                            "FeelsLikeF": "39",
                            "HeatIndexC": "6",
                            "HeatIndexF": "42",
                            "humidity": "42",
                            "precipMM": "0.0",
                            "pressure": "1026",
                            "tempC": "6",
                            "tempF": "42",
                            "time": "800",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "4",
                            "WindChillF": "39",
                            "winddir16Point": "ENE",
                            "winddirDegree": "72",
                            "WindGustKmph": "19",
                            "WindGustMiles": "12",
                            "windspeedKmph": "9",
                            "windspeedMiles": "6"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "4",
                            "DewPointC": "-2",
                            "DewPointF": "29",
                            "FeelsLikeC": "13",
                            "FeelsLikeF": "56",
                            "HeatIndexC": "14",
                            "HeatIndexF": "57",
                            "humidity": "33",
                            "precipMM": "0.0",
                            "pressure": "1026",
                            "tempC": "14",
                            "tempF": "57",
                            "time": "1100",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "13",
                            "WindChillF": "56",
                            "winddir16Point": "ENE",
                            "winddirDegree": "76",
                            "WindGustKmph": "18",
                            "WindGustMiles": "11",
                            "windspeedKmph": "10",
                            "windspeedMiles": "6"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "91",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "3",
                            "DewPointC": "3",
                            "DewPointF": "37",
                            "FeelsLikeC": "20",
                            "FeelsLikeF": "67",
                            "HeatIndexC": "20",
                            "HeatIndexF": "67",
                            "humidity": "32",
                            "precipMM": "0.0",
                            "pressure": "1024",
                            "tempC": "20",
                            "tempF": "67",
                            "time": "1400",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "20",
                            "WindChillF": "67",
                            "winddir16Point": "NE",
                            "winddirDegree": "40",
                            "WindGustKmph": "10",
                            "WindGustMiles": "6",
                            "windspeedKmph": "9",
                            "windspeedMiles": "6"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "3",
                            "DewPointC": "6",
                            "DewPointF": "42",
                            "FeelsLikeC": "18",
                            "FeelsLikeF": "65",
                            "HeatIndexC": "18",
                            "HeatIndexF": "65",
                            "humidity": "43",
                            "precipMM": "0.0",
                            "pressure": "1023",
                            "tempC": "18",
                            "tempF": "65",
                            "time": "1700",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "18",
                            "WindChillF": "65",
                            "winddir16Point": "NE",
                            "winddirDegree": "49",
                            "WindGustKmph": "9",
                            "WindGustMiles": "6",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "89",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "-2",
                            "DewPointF": "29",
                            "FeelsLikeC": "15",
                            "FeelsLikeF": "60",
                            "HeatIndexC": "18",
                            "HeatIndexF": "65",
                            "humidity": "48",
                            "precipMM": "0.0",
                            "pressure": "1023",
                            "tempC": "15",
                            "tempF": "60",
                            "time": "2000",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "15",
                            "WindChillF": "60",
                            "winddir16Point": "ENE",
                            "winddirDegree": "65",
                            "WindGustKmph": "17",
                            "WindGustMiles": "11",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "-4",
                            "DewPointF": "26",
                            "FeelsLikeC": "12",
                            "FeelsLikeF": "54",
                            "HeatIndexC": "15",
                            "HeatIndexF": "60",
                            "humidity": "43",
                            "precipMM": "0.0",
                            "pressure": "1023",
                            "tempC": "12",
                            "tempF": "54",
                            "time": "2300",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "12",
                            "WindChillF": "54",
                            "winddir16Point": "ENE",
                            "winddirDegree": "78",
                            "WindGustKmph": "18",
                            "WindGustMiles": "11",
                            "windspeedKmph": "9",
                            "windspeedMiles": "5"
                        }],
                        "maxtempC": "20",
                        "maxtempF": "67",
                        "mintempC": "7",
                        "mintempF": "45",
                        "uvIndex": "2"
                    }, {
                        "astronomy": [{
                            "moonrise": "06:56 PM",
                            "moonset": "08:05 AM",
                            "sunrise": "07:22 AM",
                            "sunset": "05:05 PM"
                        }],
                        "date": "2015-01-06",
                        "hourly": [{
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "87",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "-4",
                            "DewPointF": "24",
                            "FeelsLikeC": "6",
                            "FeelsLikeF": "44",
                            "HeatIndexC": "8",
                            "HeatIndexF": "47",
                            "humidity": "41",
                            "precipMM": "0.0",
                            "pressure": "1022",
                            "tempC": "8",
                            "tempF": "47",
                            "time": "200",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "6",
                            "WindChillF": "44",
                            "winddir16Point": "ENE",
                            "winddirDegree": "77",
                            "WindGustKmph": "21",
                            "WindGustMiles": "13",
                            "windspeedKmph": "10",
                            "windspeedMiles": "6"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "-4",
                            "DewPointF": "25",
                            "FeelsLikeC": "6",
                            "FeelsLikeF": "43",
                            "HeatIndexC": "7",
                            "HeatIndexF": "45",
                            "humidity": "45",
                            "precipMM": "0.0",
                            "pressure": "1022",
                            "tempC": "7",
                            "tempF": "45",
                            "time": "500",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "6",
                            "WindChillF": "43",
                            "winddir16Point": "ENE",
                            "winddirDegree": "65",
                            "WindGustKmph": "17",
                            "WindGustMiles": "11",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "-2",
                            "DewPointF": "28",
                            "FeelsLikeC": "7",
                            "FeelsLikeF": "45",
                            "HeatIndexC": "9",
                            "HeatIndexF": "48",
                            "humidity": "46",
                            "precipMM": "0.0",
                            "pressure": "1022",
                            "tempC": "9",
                            "tempF": "48",
                            "time": "800",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "7",
                            "WindChillF": "45",
                            "winddir16Point": "E",
                            "winddirDegree": "83",
                            "WindGustKmph": "25",
                            "WindGustMiles": "15",
                            "windspeedKmph": "12",
                            "windspeedMiles": "7"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "2",
                            "DewPointF": "35",
                            "FeelsLikeC": "16",
                            "FeelsLikeF": "61",
                            "HeatIndexC": "16",
                            "HeatIndexF": "61",
                            "humidity": "38",
                            "precipMM": "0.0",
                            "pressure": "1023",
                            "tempC": "16",
                            "tempF": "61",
                            "time": "1100",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "16",
                            "WindChillF": "61",
                            "winddir16Point": "E",
                            "winddirDegree": "84",
                            "WindGustKmph": "15",
                            "WindGustMiles": "10",
                            "windspeedKmph": "10",
                            "windspeedMiles": "6"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "5",
                            "DewPointF": "40",
                            "FeelsLikeC": "21",
                            "FeelsLikeF": "69",
                            "HeatIndexC": "21",
                            "HeatIndexF": "69",
                            "humidity": "35",
                            "precipMM": "0.0",
                            "pressure": "1021",
                            "tempC": "21",
                            "tempF": "69",
                            "time": "1400",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "21",
                            "WindChillF": "69",
                            "winddir16Point": "ENE",
                            "winddirDegree": "69",
                            "WindGustKmph": "5",
                            "WindGustMiles": "3",
                            "windspeedKmph": "4",
                            "windspeedMiles": "3"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "9",
                            "DewPointF": "48",
                            "FeelsLikeC": "20",
                            "FeelsLikeF": "68",
                            "HeatIndexC": "20",
                            "HeatIndexF": "68",
                            "humidity": "49",
                            "precipMM": "0.0",
                            "pressure": "1020",
                            "tempC": "20",
                            "tempF": "68",
                            "time": "1700",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "20",
                            "WindChillF": "68",
                            "winddir16Point": "NE",
                            "winddirDegree": "54",
                            "WindGustKmph": "5",
                            "WindGustMiles": "3",
                            "windspeedKmph": "4",
                            "windspeedMiles": "2"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "80",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "4",
                            "DewPointF": "39",
                            "FeelsLikeC": "16",
                            "FeelsLikeF": "60",
                            "HeatIndexC": "19",
                            "HeatIndexF": "66",
                            "humidity": "69",
                            "precipMM": "0.0",
                            "pressure": "1020",
                            "tempC": "16",
                            "tempF": "60",
                            "time": "2000",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "16",
                            "WindChillF": "60",
                            "winddir16Point": "ENE",
                            "winddirDegree": "73",
                            "WindGustKmph": "8",
                            "WindGustMiles": "5",
                            "windspeedKmph": "4",
                            "windspeedMiles": "2"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "3",
                            "DewPointF": "38",
                            "FeelsLikeC": "13",
                            "FeelsLikeF": "55",
                            "HeatIndexC": "16",
                            "HeatIndexF": "60",
                            "humidity": "68",
                            "precipMM": "0.0",
                            "pressure": "1021",
                            "tempC": "13",
                            "tempF": "55",
                            "time": "2300",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "13",
                            "WindChillF": "55",
                            "winddir16Point": "E",
                            "winddirDegree": "81",
                            "WindGustKmph": "10",
                            "WindGustMiles": "6",
                            "windspeedKmph": "5",
                            "windspeedMiles": "3"
                        }],
                        "maxtempC": "21",
                        "maxtempF": "69",
                        "mintempC": "8",
                        "mintempF": "46",
                        "uvIndex": "2"
                    }, {
                        "astronomy": [{
                            "moonrise": "07:52 PM",
                            "moonset": "08:42 AM",
                            "sunrise": "07:22 AM",
                            "sunset": "05:06 PM"
                        }],
                        "date": "2015-01-07",
                        "hourly": [{
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "78",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "0",
                            "DewPointC": "3",
                            "DewPointF": "38",
                            "FeelsLikeC": "8",
                            "FeelsLikeF": "46",
                            "HeatIndexC": "9",
                            "HeatIndexF": "48",
                            "humidity": "66",
                            "precipMM": "0.0",
                            "pressure": "1021",
                            "tempC": "9",
                            "tempF": "48",
                            "time": "200",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "8",
                            "WindChillF": "46",
                            "winddir16Point": "E",
                            "winddirDegree": "93",
                            "WindGustKmph": "15",
                            "WindGustMiles": "9",
                            "windspeedKmph": "7",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "2",
                            "DewPointC": "3",
                            "DewPointF": "37",
                            "FeelsLikeC": "7",
                            "FeelsLikeF": "45",
                            "HeatIndexC": "8",
                            "HeatIndexF": "46",
                            "humidity": "70",
                            "precipMM": "0.0",
                            "pressure": "1021",
                            "tempC": "8",
                            "tempF": "46",
                            "time": "500",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "7",
                            "WindChillF": "45",
                            "winddir16Point": "ENE",
                            "winddirDegree": "76",
                            "WindGustKmph": "12",
                            "WindGustMiles": "8",
                            "windspeedKmph": "6",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "10",
                            "DewPointC": "3",
                            "DewPointF": "38",
                            "FeelsLikeC": "8",
                            "FeelsLikeF": "46",
                            "HeatIndexC": "9",
                            "HeatIndexF": "48",
                            "humidity": "66",
                            "precipMM": "0.0",
                            "pressure": "1022",
                            "tempC": "9",
                            "tempF": "48",
                            "time": "800",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "8",
                            "WindChillF": "46",
                            "winddir16Point": "E",
                            "winddirDegree": "98",
                            "WindGustKmph": "15",
                            "WindGustMiles": "9",
                            "windspeedKmph": "7",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "6",
                            "DewPointC": "4",
                            "DewPointF": "40",
                            "FeelsLikeC": "17",
                            "FeelsLikeF": "63",
                            "HeatIndexC": "17",
                            "HeatIndexF": "63",
                            "humidity": "42",
                            "precipMM": "0.0",
                            "pressure": "1023",
                            "tempC": "17",
                            "tempF": "63",
                            "time": "1100",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "17",
                            "WindChillF": "63",
                            "winddir16Point": "E",
                            "winddirDegree": "93",
                            "WindGustKmph": "12",
                            "WindGustMiles": "7",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "5",
                            "DewPointC": "6",
                            "DewPointF": "43",
                            "FeelsLikeC": "22",
                            "FeelsLikeF": "71",
                            "HeatIndexC": "24",
                            "HeatIndexF": "75",
                            "humidity": "36",
                            "precipMM": "0.0",
                            "pressure": "1021",
                            "tempC": "22",
                            "tempF": "71",
                            "time": "1400",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "22",
                            "WindChillF": "71",
                            "winddir16Point": "E",
                            "winddirDegree": "92",
                            "WindGustKmph": "3",
                            "WindGustMiles": "2",
                            "windspeedKmph": "2",
                            "windspeedMiles": "1"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "1",
                            "DewPointC": "10",
                            "DewPointF": "50",
                            "FeelsLikeC": "20",
                            "FeelsLikeF": "67",
                            "HeatIndexC": "20",
                            "HeatIndexF": "67",
                            "humidity": "53",
                            "precipMM": "0.0",
                            "pressure": "1020",
                            "tempC": "20",
                            "tempF": "67",
                            "time": "1700",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "20",
                            "WindChillF": "67",
                            "winddir16Point": "N",
                            "winddirDegree": "354",
                            "WindGustKmph": "2",
                            "WindGustMiles": "1",
                            "windspeedKmph": "1",
                            "windspeedMiles": "1"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "72",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "2",
                            "DewPointC": "5",
                            "DewPointF": "40",
                            "FeelsLikeC": "18",
                            "FeelsLikeF": "64",
                            "HeatIndexC": "20",
                            "HeatIndexF": "67",
                            "humidity": "74",
                            "precipMM": "0.0",
                            "pressure": "1020",
                            "tempC": "18",
                            "tempF": "64",
                            "time": "2000",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "18",
                            "WindChillF": "64",
                            "winddir16Point": "E",
                            "winddirDegree": "80",
                            "WindGustKmph": "3",
                            "WindGustMiles": "2",
                            "windspeedKmph": "1",
                            "windspeedMiles": "1"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "2",
                            "DewPointC": "4",
                            "DewPointF": "39",
                            "FeelsLikeC": "16",
                            "FeelsLikeF": "60",
                            "HeatIndexC": "20",
                            "HeatIndexF": "67",
                            "humidity": "73",
                            "precipMM": "0.0",
                            "pressure": "1020",
                            "tempC": "16",
                            "tempF": "60",
                            "time": "2300",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "16",
                            "WindChillF": "60",
                            "winddir16Point": "ESE",
                            "winddirDegree": "111",
                            "WindGustKmph": "8",
                            "WindGustMiles": "5",
                            "windspeedKmph": "4",
                            "windspeedMiles": "2"
                        }],
                        "maxtempC": "22",
                        "maxtempF": "71",
                        "mintempC": "6",
                        "mintempF": "43",
                        "uvIndex": "2"
                    }, {
                        "astronomy": [{
                            "moonrise": "08:46 PM",
                            "moonset": "09:16 AM",
                            "sunrise": "07:22 AM",
                            "sunset": "05:07 PM"
                        }],
                        "date": "2015-01-08",
                        "hourly": [{
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "70",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "6",
                            "DewPointC": "3",
                            "DewPointF": "37",
                            "FeelsLikeC": "7",
                            "FeelsLikeF": "45",
                            "HeatIndexC": "8",
                            "HeatIndexF": "46",
                            "humidity": "73",
                            "precipMM": "0.0",
                            "pressure": "1019",
                            "tempC": "8",
                            "tempF": "46",
                            "time": "200",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "7",
                            "WindChillF": "45",
                            "winddir16Point": "SE",
                            "winddirDegree": "142",
                            "WindGustKmph": "8",
                            "WindGustMiles": "5",
                            "windspeedKmph": "4",
                            "windspeedMiles": "2"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "21",
                            "DewPointC": "2",
                            "DewPointF": "36",
                            "FeelsLikeC": "6",
                            "FeelsLikeF": "43",
                            "HeatIndexC": "6",
                            "HeatIndexF": "43",
                            "humidity": "75",
                            "precipMM": "0.0",
                            "pressure": "1019",
                            "tempC": "6",
                            "tempF": "43",
                            "time": "500",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "6",
                            "WindChillF": "43",
                            "winddir16Point": "SSW",
                            "winddirDegree": "202",
                            "WindGustKmph": "4",
                            "WindGustMiles": "2",
                            "windspeedKmph": "2",
                            "windspeedMiles": "1"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "68",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "37",
                            "DewPointC": "3",
                            "DewPointF": "37",
                            "FeelsLikeC": "7",
                            "FeelsLikeF": "45",
                            "HeatIndexC": "8",
                            "HeatIndexF": "47",
                            "humidity": "69",
                            "precipMM": "0.0",
                            "pressure": "1019",
                            "tempC": "8",
                            "tempF": "47",
                            "time": "800",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"
                            }],
                            "WindChillC": "7",
                            "WindChillF": "45",
                            "winddir16Point": "SE",
                            "winddirDegree": "128",
                            "WindGustKmph": "15",
                            "WindGustMiles": "9",
                            "windspeedKmph": "7",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "0",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "43",
                            "DewPointC": "4",
                            "DewPointF": "39",
                            "FeelsLikeC": "16",
                            "FeelsLikeF": "61",
                            "HeatIndexC": "16",
                            "HeatIndexF": "61",
                            "humidity": "44",
                            "precipMM": "0.0",
                            "pressure": "1020",
                            "tempC": "16",
                            "tempF": "61",
                            "time": "1100",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"
                            }],
                            "WindChillC": "16",
                            "WindChillF": "61",
                            "winddir16Point": "SSE",
                            "winddirDegree": "163",
                            "WindGustKmph": "11",
                            "WindGustMiles": "7",
                            "windspeedKmph": "7",
                            "windspeedMiles": "4"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "3",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "65",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "33",
                            "DewPointC": "6",
                            "DewPointF": "42",
                            "FeelsLikeC": "22",
                            "FeelsLikeF": "71",
                            "HeatIndexC": "24",
                            "HeatIndexF": "74",
                            "humidity": "36",
                            "precipMM": "0.0",
                            "pressure": "1018",
                            "tempC": "22",
                            "tempF": "71",
                            "time": "1400",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0002_sunny_intervals.png"
                            }],
                            "WindChillC": "22",
                            "WindChillF": "71",
                            "winddir16Point": "SSW",
                            "winddirDegree": "211",
                            "WindGustKmph": "9",
                            "WindGustMiles": "5",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "4",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "100",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "8",
                            "DewPointC": "9",
                            "DewPointF": "47",
                            "FeelsLikeC": "19",
                            "FeelsLikeF": "66",
                            "HeatIndexC": "19",
                            "HeatIndexF": "66",
                            "humidity": "51",
                            "precipMM": "0.0",
                            "pressure": "1018",
                            "tempC": "19",
                            "tempF": "66",
                            "time": "1700",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Sunny"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0001_sunny.png"
                            }],
                            "WindChillC": "19",
                            "WindChillF": "66",
                            "winddir16Point": "WSW",
                            "winddirDegree": "253",
                            "WindGustKmph": "9",
                            "WindGustMiles": "6",
                            "windspeedKmph": "8",
                            "windspeedMiles": "5"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "9",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "41",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "53",
                            "DewPointC": "6",
                            "DewPointF": "43",
                            "FeelsLikeC": "17",
                            "FeelsLikeF": "63",
                            "HeatIndexC": "19",
                            "HeatIndexF": "66",
                            "humidity": "72",
                            "precipMM": "0.0",
                            "pressure": "1019",
                            "tempC": "17",
                            "tempF": "63",
                            "time": "2000",
                            "visibility": "10",
                            "weatherCode": "116",
                            "weatherDesc": [{
                                "value": "Partly Cloudy"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0004_black_low_cloud.png"
                            }],
                            "WindChillC": "17",
                            "WindChillF": "63",
                            "winddir16Point": "SSW",
                            "winddirDegree": "206",
                            "WindGustKmph": "6",
                            "WindGustMiles": "4",
                            "windspeedKmph": "3",
                            "windspeedMiles": "2"
                        }, {
                            "chanceoffog": "0",
                            "chanceoffrost": "0",
                            "chanceofhightemp": "0",
                            "chanceofovercast": "0",
                            "chanceofrain": "4",
                            "chanceofremdry": "0",
                            "chanceofsnow": "0",
                            "chanceofsunshine": "92",
                            "chanceofthunder": "0",
                            "chanceofwindy": "0",
                            "cloudcover": "5",
                            "DewPointC": "5",
                            "DewPointF": "40",
                            "FeelsLikeC": "13",
                            "FeelsLikeF": "55",
                            "HeatIndexC": "17",
                            "HeatIndexF": "63",
                            "humidity": "69",
                            "precipMM": "0.0",
                            "pressure": "1019",
                            "tempC": "13",
                            "tempF": "55",
                            "time": "2300",
                            "visibility": "10",
                            "weatherCode": "113",
                            "weatherDesc": [{
                                "value": "Clear"
                            }],
                            "weatherIconUrl": [{
                                "value": "http://cdn.worldweatheronline.net/images/wsymbols01_png_64/wsymbol_0008_clear_sky_night.png"
                            }],
                            "WindChillC": "13",
                            "WindChillF": "55",
                            "winddir16Point": "SW",
                            "winddirDegree": "216",
                            "WindGustKmph": "11",
                            "WindGustMiles": "7",
                            "windspeedKmph": "5",
                            "windspeedMiles": "3"
                        }],
                        "maxtempC": "22",
                        "maxtempF": "71",
                        "mintempC": "9",
                        "mintempF": "48",
                        "uvIndex": "2"
                    }]
                }
            }
            return weatherInfo;
        }
    }
});