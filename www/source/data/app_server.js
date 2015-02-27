// // base model type so that different types of models can appear on featured screen
// enyo.kind({
//     // these are expected to exist
//     defaults: {
//         title: "",
//         body: "",
//         id: "",
//         imageURL: "",
//         type: "unknown",
//         sortOrder: ""
//     },
//     primaryKey: "id",
//     readOnly: true, // not backed by the store (not making commits or deletes)
//     name: "cebc.ItemModel",
//     kind: "enyo.Model"
// });

// // Offers
// enyo.kind({
//     name: "cebc.OfferModel",
//     kind: "cebc.ItemModel",
//     defaults: {
//         type: "offer"
//     },
//     parse: function(data) {
//         data.imageURL = data.image;
//         // data.imageURL = "assets/offer/shop" + Math.floor((Math.random() * 3) + 1) + ".png";
//         // data.title = "Bloomingdale's Chicago";
//         // data.body = "Present your out of town identification to the Visitors Center on 3 and enjoy a 10% off savings certificate and gift with minimum purchase.";
//         var addressObj = data.address ? data.address[0] : {};
//         data.location = addressObj.street1 || addressObj.city;
//         data.street1 = addressObj.street1;
//         data.street2 = addressObj.street2;
//         data.city = addressObj.city;
//         data.state = addressObj.state;
//         data.zip = addressObj.zip;
//         data.geocoordinates = addressObj.geocoordinates;
//         return data;
//     }
// });
// enyo.kind({
//     name: "cebc.OfferCollection",
//     kind: "enyo.Collection",
//     model: "cebc.ItemModel",
//     // defaultSource: "ps_source",
//     source: "ajax",
//     type: "offers",
//     instanceAllRecords: true, // call parse on all records as they are created
//     apiOptions: {
//         endpoint: "api/smart-deal",
//         type: "POST"
//     },
//     parse: function(data) {
//         AppConfig.log("OfferCollection - parse", data);
//         // incoming data contains {deal:[]}
//         return data.deal;
//     },
//     fetch: function(opts) {
//         if (opts && opts.query) {
//             this.apiOptions.query = opts.query;
//         }
//         this.apiOptions.query = opts.query;
//         opts = enyo.mixin(opts, this.apiOptions);
//         // make the request
//         this.inherited(arguments);
//     }
// });
// enyo.kind({
//     name: "cebc.LocalOfferModel",
//     kind: "cebc.ItemModel",
//     parse: function(data) {
//         if (data.imageURL && data.imageURL.indexOf("http") != 0) {
//             AppConfig.log(data.imageURL);
//             data.imageURL = AppConfig.baseURL + "offer-images/" + data.imageURL;
//         }
//         if (data.latlng) {
//             data.geocoordinates = {
//                 latitude: data.latlng.lat,
//                 longitude: data.latlng.lng
//             };
//         }
//         AppConfig.log(data);
//         return data;
//     }
// });
// enyo.kind({
//     name: "cebc.LocalOfferCollection",
//     kind: "enyo.Collection",
//     model: "cebc.LocalOfferModel",
//     // defaultSource: "ps_source",
//     source: "ajax",
//     instanceAllRecords: true, // call parse on all records as they are created
//     apiOptions: {
//         endpoint: "offers",
//         type: "GET"
//     },
//     parse: function(data) {
//         return data;
//     },
//     fetch: function(opts) {
//         if (opts) {
//             this.apiOptions.query = opts.query;
//         }
//         this.apiOptions.query = opts.query;
//         opts = enyo.mixin(opts, this.apiOptions);
//         // make the request
//         this.inherited(arguments);
//     }
// });
// // portal source used for all collections that get their data from portal server
// // enyo.kind({
// //     name: "cebc.portalServerSource",
// //     kind: "enyo.Source",
// //     fetch: function(rec, opts) {
// //         var query = opts && opts.query ? {
// //             query: opts.query
// //         } : null;
// //         var endpoint = opts.endpoint.indexOf("http") < 0 ? AppConfig.baseURL + opts.endpoint : opts.endpoint;
// //         AjaxAPI.simpleAjaxRequest(endpoint, this, opts.success, opts.fail, opts.type, query);
// //     },
// //     commit: function(rec, opts) {
// //         // read only
// //     },
// //     destroy: function(rec, opts) {
// //         // read only
// //     }
// // });
// // enyo.store.addSources({
// //     ps_source: "cebc.portalServerSource"
// // });
// // enyo.store.ignoreDuplicates = true;

