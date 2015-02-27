enyo.kind({
    name: "OffersView",
    kind: "FittableRows",
    components: [{
        name: "offersData",
        classes: "offers-view",
        content: "Offers",
        ontap: "goToOfferDetailsView"
    }],
    create: function() {
        this.inherited(arguments);
    },
    goToOfferDetailsView: function() {
        app.pushView("offerDetailsView");
    }
});