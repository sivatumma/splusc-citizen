/**
 Define and instantiate your enyo.Application kind in this file.  Note,
 application rendering should be deferred until DOM is ready by wrapping
 it in a call to enyo.ready().
 */
enyo.kind({
    name: "ciscoEbcSanJose",
    kind: "Application",
    published: {
        currentView: "",
        viewstack: 0,
        currentLocation: null,
        offerCount: 0,
        currentUser: null,
    },
    components: [
        // collections of devices
        {
            // name: "offerCollection",
            // kind: "cebc.OfferCollection"
        }
    ],
    // bindings: [{
    //     from: ".$.offerCollection.length",
    //     to: ".offerCount"
    // }],
    setViewDirect: function(viewName) {
        this.viewstack = []; // reset the stack
        this.pushView(viewName);
    },
    pushView: function(viewName) {
        // use when you want to return from a view
        this.viewstack.push(viewName);
        this.setCurrentView(viewName);
    },
    popView: function() {
        var previousView = this.viewstack.pop();
        var newView = this.viewstack.length ? this.viewstack[this.viewstack.length - 1] : "";
        this.setCurrentView(newView);
    },
    create: function() {
        this.inherited(arguments);
        this.viewstack = [];
        mapUtils.getCurrentPosition();
        app.setCurrentUser("krishna");
    },
    currentUserChanged: function(oldVal) {
        // app.$.offerCollection.fetch({
        //     replace: true,
        //     destroyLocal: true
        // });
    }

});
enyo.ready(function() {
    new ciscoEbcSanJose({
        name: "app",
        view: "MainView"
    });
});

function getUserLocation() {   
    if (typeof(nativeBridge) != "undefined") {                         
        var loc = nativeBridge.getUserLocation();                            
        if (loc) {                             
            var latlng = JSON.parse(loc);  //No need to parse in the case of iOS 
            if (latlng.lat && latlng.lng) {
                return {
                    latitude: latlng.lat,
                    longitude: latlng.lng,
                    accuracy: 10
                };                            
            }
        }  
    }
    return false;
}