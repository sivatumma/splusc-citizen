enyo.kind({
    name: "offerDetailsOverview",
    kind: "FittableRows",
    classes: "offerDetailsOverview",
    components: [{
        name: "offerDetailsOverviewHeader",
        kind: "offerDetailsViewHeader"
    }, {
        name: "offerOverviewPanel",
        kind: "offerDetailsPanel",
        classes:"offerOverviewPanel"
    }]
});