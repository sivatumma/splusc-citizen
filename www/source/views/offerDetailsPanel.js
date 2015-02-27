enyo.kind({
    name: "offerDetailsPanel",
    kind: "Panels",
    classes: "offerDetailsPanelCls",
    fit: true,
    draggable: false,
    components: [{
        name: "offerDetailsViewSection",
        kind: "offerDetailsViewPanel"
    }],
    rendered: function() {
        this.inherited(arguments);
    }
});