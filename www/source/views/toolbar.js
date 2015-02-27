enyo.kind({
    name: "Toolbar",
    kind: "onyx.Toolbar",
    published: {
        header: ""
    },
    events: {
        onHeader: "",
        onToggleMenu: "",
        onToggleSecondaryMenu: ""
    },
    components: [{
        kind: "onyx.Grabber",
        ontap: "doToggleMenu",
        classes: "toolbarMenuIcon"
    }, {
        name: "header",
        content: "",
        ontap: "doHeader",
        classes:"headerTitle"
    }, {
        name: "rightMenuSection",
        kind: "toolbarRightMenu"
    }],
    create: function() {
        this.inherited(arguments);
        this.headerChanged();
    },
    headerChanged: function() {
        this.$.header.setContent(this.getHeader());
    }
});
// Header for offer details view
enyo.kind({
    name: "offerDetailsViewHeader",
    kind: "onyx.Toolbar",
    classes: "offerDetailsViewHeader",
    events: {
        onHeader: "",
        onToggleMenu: "",
        onToggleSecondaryMenu: ""
    },
    components: [{
        ontap: "backToOffersOverview",
        classes:"toolbarMenuIcon headerTitle",
        components: [{
            classes: "backButtonArrowIcon"
        }]
    }, {
        name: "header",
        content: "Offers",
        ontap: "doHeader",
        classes:"headerTitle"
    }, {
        name: "rightMenuSection",
        kind: "toolbarRightMenu"
    }],
    backToOffersOverview: function(inSender, inEvent) {
        app.pushView("offers");
    }
});
// Toolbar right menu section
enyo.kind({
    name: "toolbarRightMenu",
    classes: "rightMenuIcons",
    components: [{
        name: "notification",
        classes: "notificationIcon"
    }, {
        kind: "onyx.MenuDecorator",
        classes: "cameraMenuDecorator",
        components: [{
            name: "camera",
            classes: "cameraIcon",
        }, {
            kind: "onyx.ContextualPopup",
            name: "cameraPopupContainer",
            classes: "cameraPopupContainer",
            title: "Camera PopUp",
            floating: true,
            components: [{
                content: "Camera",
                classes: "cameraContainerText"
            }, {
                classes: "centerBorder"
            }, {
                content: "Choose from Gallery",
                classes: "cameraContainerText"
            }]
        }]
    }]
});