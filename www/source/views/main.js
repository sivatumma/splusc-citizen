enyo.kind({
    name: "MainView",
    kind: "FittableRows",
    classes: "enyo-fit mainAppZ",
    components: [{
        name: "menuPaneViews",
        kind: "mainMenuPane",
        classes: "main-view"
    }],
    create: function() {
        this.inherited(arguments);
    }
});