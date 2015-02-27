enyo.kind({
    name: "mapUtils",
    statics: {
        originalLocation: null,
        simulatedLocation: {
            latitude: AppConfig.latitude ? AppConfig.latitude : "",
            longitude: AppConfig.longitude ? AppConfig.longitude : ""
        },
        getCurrentPosition: function(callback) {
            var location = getUserLocation();
            if (location) {
                if (AppConfig.simulateOtherLocation) {
                    if (!cls.mapUtils.originalLocation) {
                        // save it
                        cls.mapUtils.originalLocation = location;
                        location = {
                            lat: cls.mapUtils.simulatedLocation.latitude,
                            lng: cls.mapUtils.simulatedLocation.longitude
                        };
                    } else {
                        // update it
                        var delta = {
                            latitude: location.lat - cls.mapUtils.originalLocation.latitude,
                            longitude: location.lng - cls.mapUtils.originalLocation.longitude
                        };
                        location = {
                            latitude: delta.lat + cls.mapUtils.simulatedLocation.latitude,
                            longitude: delta.lng + cls.mapUtils.simulatedLocation.longitude
                        }
                    }
                }
                app.setCurrentLocation({
                    latitude: location.lat,
                    longitude: location.lng,
                    accuracy: 10
                });
            } else {
                if (navigator && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        var currentLocation = position.coords;
                        currentLocation.accuracy = currentLocation.accuracy || 100;
                        if (AppConfig.simulateOtherLocation) {
                            if (!cls.mapUtils.originalLocation) {
                                // save it
                                cls.mapUtils.originalLocation = currentLocation;
                                currentLocation = enyo.mixin(currentLocation, cls.mapUtils.simulatedLocation);
                            } else {
                                // update it
                                var delta = {
                                    latitude: currentLocation.latitude - cls.mapUtils.originalLocation.latitude,
                                    longitude: currentLocation.longitude - cls.mapUtils.originalLocation.longitude
                                };
                                currentLocation = {
                                    latitude: delta.latitude + cls.mapUtils.simulatedLocation.latitude,
                                    longitude: delta.longitude + cls.mapUtils.simulatedLocation.longitude,
                                    accuracy: currentLocation.accuracy
                                }
                            }
                        }
                        app.setCurrentLocation({
                            latitude: currentLocation ? currentLocation.latitude : cls.mapUtils.simulatedLocation.latitude,
                            longitude: currentLocation ? currentLocation.longitude : cls.mapUtils.simulatedLocation.longitude,
                            accuracy: currentLocation ? currentLocation.accuracy : 100
                        });
                    });
                }
            }
        },
        getFriendlyValue: function(distance) {
            if (distance) {
                var friendlyValue = "";
                var val = distance.toFixed(2);
                if (val > 100) {
                    val = Math.round(val);
                    // friendlyValue = ""; // "Approximately, ~"
                }
                return friendlyValue + val + " Miles";
            } else {
                return "not available";
            }
        },
        calculateDistance: function(pos1, pos2) {
            var lat1 = Geo.parseDMS(pos1.latitude);
            var lon1 = Geo.parseDMS(pos1.longitude);
            var lat2 = Geo.parseDMS(pos2.latitude);
            var lon2 = Geo.parseDMS(pos2.longitude);
            AppConfig.log(lat1, lon1, lat2, lon2);
            // var p1 = new LatLon(lat, lon);     
            var R = 6371 / 1.609344; // km / km/mi
            var φ1 = lat1.toRadians();
            var φ2 = lat2.toRadians();
            var Δφ = (lat2 - lat1).toRadians();
            var Δλ = (lon2 - lon1).toRadians();
            var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return d;
        },
        updateDistance: function(collection, opts) {
            collection.closestDevice = null;
            if (opts.fromLocation) {
                _.each(collection.records, function(item) {
                    var distance = cls.mapUtils.calculateDistance(item.get('geocoordinates'), opts.fromLocation);
                    item.set('DISTANCE', distance);
                    if (!collection.closestDevice || collection.closestDevice.distance > distance) {
                        collection.closestDevice = {
                            device: item,
                            distance: distance
                        };
                    }
                });
            }
        },
        getHashValue: function(inString) {
            var hash = 0;
            if (!inString || inString.length == 0) return hash;
            for (i = 0; i < inString.length; i++) {
                char = inString.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        },
    }
});
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - * /
The MIT License (MIT)

Copyright (c) 2014 Chris Veness

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
/ * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions                       (c) Chris Veness 2002-2014  */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51° 28′ 40.12″ N');                                                 */
/*    var lon = Geo.parseDMS('000° 00′ 05.31″ W');                                                */
/*    var p1 = new LatLon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* jshint node:true */
/* global define */
'use strict';
/**
 * Tools for converting between numeric degrees and degrees / minutes / seconds.
 *
 * @namespace
 */
var Geo = {};
/** Extend Number object with method to convert numeric degrees to radians */
if (typeof Number.prototype.toRadians == 'undefined') {
    Number.prototype.toRadians = function() {
        return this * Math.PI / 180;
    };
}
// note Unicode Degree = U+00B0. Prime = U+2032, Double prime = U+2033
/**
 * Parses string representing degrees/minutes/seconds into numeric degrees.
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3° 37′ 09″W).
 * Seconds and minutes may be omitted.
 *
 * @param   {string|number} dmsStr - Degrees or deg/min/sec in variety of formats.
 * @returns {number} Degrees as decimal number.
 */
Geo.parseDMS = function(dmsStr) {
    // check for signed decimal degrees without NSEW, if so return it directly
    if (typeof dmsStr == 'number' && isFinite(dmsStr)) return Number(dmsStr);
    // strip off any sign or compass dir'n & split out separate d/m/s
    var dms = String(dmsStr).trim().replace(/^-/, '').replace(/[NSEW]$/i, '').split(/[^0-9.,]+/);
    if (dms[dms.length - 1] == '') dms.splice(dms.length - 1); // from trailing symbol
    if (dms == '') return NaN;
    // and convert to decimal degrees...
    var deg;
    switch (dms.length) {
        case 3: // interpret 3-part result as d/m/s
            deg = dms[0] / 1 + dms[1] / 60 + dms[2] / 3600;
            break;
        case 2: // interpret 2-part result as d/m
            deg = dms[0] / 1 + dms[1] / 60;
            break;
        case 1: // just d (possibly decimal) or non-separated dddmmss
            deg = dms[0];
            // check for fixed-width unseparated format eg 0033709W
            //if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
            //if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600;
            break;
        default:
            return NaN;
    }
    if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve
    return Number(deg);
};
/**
 * Converts decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added.
 *
 * @private
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms'.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Geo.toDMS = function(deg, format, dp) {
    if (isNaN(deg)) return null; // give up here if we can't make a number from deg
    // default values
    if (typeof format == 'undefined') format = 'dms';
    if (typeof dp == 'undefined') {
        switch (format) {
            case 'd':
                dp = 4;
                break;
            case 'dm':
                dp = 2;
                break;
            case 'dms':
                dp = 0;
                break;
            default:
                format = 'dms';
                dp = 0; // be forgiving on invalid format
        }
    }
    deg = Math.abs(deg); // (unsigned result ready for appending compass dir'n)
    var dms, d, m, s;
    switch (format) {
        default: // invalid format spec!
        case 'd':
            d = deg.toFixed(dp); // round degrees
            if (d < 100) d = '0' + d; // pad with leading zeros
            if (d < 10) d = '0' + d;
            dms = d + '°';
            break;
        case 'dm':
            var min = (deg * 60).toFixed(dp); // convert degrees to minutes & round
            d = Math.floor(min / 60); // get component deg/min
            m = (min % 60).toFixed(dp); // pad with trailing zeros
            if (d < 100) d = '0' + d; // pad with leading zeros
            if (d < 10) d = '0' + d;
            if (m < 10) m = '0' + m;
            dms = d + '°' + m + '′';
            break;
        case 'dms':
            var sec = (deg * 3600).toFixed(dp); // convert degrees to seconds & round
            d = Math.floor(sec / 3600); // get component deg/min/sec
            m = Math.floor(sec / 60) % 60;
            s = (sec % 60).toFixed(dp); // pad with trailing zeros
            if (d < 100) d = '0' + d; // pad with leading zeros
            if (d < 10) d = '0' + d;
            if (m < 10) m = '0' + m;
            if (s < 10) s = '0' + s;
            dms = d + '°' + m + '′' + s + '″';
            break;
    }
    return dms;
};
/**
 * Converts numeric degrees to deg/min/sec latitude (2-digit degrees, suffixed with N/S).
 *
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms'.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Geo.toLat = function(deg, format, dp) {
    var lat = Geo.toDMS(deg, format, dp);
    return lat === null ? '–' : lat.slice(1) + (deg < 0 ? 'S' : 'N'); // knock off initial '0' for lat!
};
/**
 * Convert numeric degrees to deg/min/sec longitude (3-digit degrees, suffixed with E/W)
 *
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms'.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Geo.toLon = function(deg, format, dp) {
    var lon = Geo.toDMS(deg, format, dp);
    return lon === null ? '–' : lon + (deg < 0 ? 'W' : 'E');
};
/**
 * Converts numeric degrees to deg/min/sec as a bearing (0°..360°)
 *
 * @param   {number} deg - Degrees to be formatted as specified.
 * @param   {string} [format=dms] - Return value as 'd', 'dm', 'dms'.
 * @param   {number} [dp=0|2|4] - Number of decimal places to use – default 0 for dms, 2 for dm, 4 for d.
 * @returns {string} Degrees formatted as deg/min/secs according to specified format.
 */
Geo.toBrng = function(deg, format, dp) {
    deg = (Number(deg) + 360) % 360; // normalise -ve values to 180°..360°
    var brng = Geo.toDMS(deg, format, dp);
    return brng === null ? '–' : brng.replace('360', '0'); // just in case rounding took us up to 360°!
};
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/** Extend Number object with method to  trim whitespace from string
 *  (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
    String.prototype.trim = function() {
        return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
}
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != 'undefined' && module.exports) module.exports = Geo; // CommonJS
if (typeof define == 'function' && define.amd) define([], function() {
    return Geo;
}); // AMD