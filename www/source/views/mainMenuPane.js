enyo.kind({
    name: "mainMenuPane",
    classes: "enyo-unselectable",
    published: {
        selectedView: ""
    },
    components: [{
        name: "menupane",
        kind: "rwatkins.MenuPane",
        onViewChange: "viewChangeHandler",
        onMenuOpen: "menuOpenHandler",
        onMenuClose: "menuCloseHandler",
        menu: [{
            classes: "menu-header",
            components: [{
                content: "Menu",
            }, {
                name: "menuCloseIcon",
                classes: "menuCloseIcon",
                handlers: {
                    ontap: "ToggleMenuHandler",
                },
                ToggleMenuHandler: function() {
                    this.bubble("onMenuClose");
                }
            }]
        }, {
            content: "Offers",
            view: "offers",
            classes: "menu-item"
        }, {
            view: "weather",
            classes: "menu-item",
            content: "Weather"
        }, {
            components: [{
                view: "mapServices",
                name: "lights",
                classes: "menu-item",
                components: [{
                    content: "Lights",
                }, {
                    name: "lightsLayer",
                    kind: "onyx.Checkbox",
                    layerName: "lights",
                    checked: true,
                    classes: "layersCheckbox"
                }]
            }, {
                view: "mapServices",
                name: "parking",
                classes: "menu-item",
                components: [{
                    content: "Parking",
                }, {
                    name: "parkingLayer",
                    layerName: "parking",
                    kind: "onyx.Checkbox",
                    checked: true,
                    classes: "layersCheckbox"
                }]
            }, {
                view: "mapServices",
                classes: "menu-item",
                name: "traffic",
                layerName: "traffic",
                components: [{
                    content: "Traffic",
                }, {
                    name: "trafficLayer",
                    layerName: "traffic",
                    kind: "onyx.Checkbox",
                    classes: "layersCheckbox"
                }]
            }]
        }],
        components: [{
            name: "loginViewPage",
            classes: "view",
            kind: "loginView"
        }, {
            name: "offers",
            classes: "view",
            components: [{
                kind: "Toolbar",
                header: "Offers",
                onToggleMenu: "toolbarToggleMenuHandler"
            }, {
                kind: "OffersView",
                classes: "content"
            }]
        }, {
            name: "offerDetailsView",
            classes: "view",
            components: [{
                onToggleMenu: "toolbarToggleMenuHandler"
            }, {
                kind: "offerDetailsOverview"
            }]
        }, {
            name: "weather",
            components: [{
                kind: "Toolbar",
                header: "Weather",
                onToggleMenu: "toolbarToggleMenuHandler"
            }, {
                components: [{
                    kind: "weatherData"
                }]
            }]
        }, {
            name: "mapServices",
            classes: "view",
            components: [{
                kind: "Toolbar",
                header: "Citizen",
                onToggleMenu: "toolbarToggleMenuHandler"
            }, {
                name: "mapContainer",
                classes: "content"
            }]
        }]
    }],
    bindings: [{
        from: ".app.currentView",
        to: ".selectedView",
        transform: function(v) {
            if (v) {
                this.$.menupane.selectView(v);
            }
            return v;
        }
    }],
    create: function() {
        this.inherited(arguments);
    },
    viewChangeHandler: function(inSender, inEvent) {
        if (inSender.toview === "mapServices" || app.currentView === "mapServices") {
            if (!this.map) {
                this.map = this.$.mapContainer.createComponent({
                    kind: "leafletMap",
                    classes: "map height100"
                }, {
                    owner: this
                });
                this.$.mapContainer.render();
                this.loadLayers();
            }
        }
    },
    menuCloseHandler: function(inSender, inEvent) {
        this.$.menupane.$.menu.applyStyle("z-index", "0");
        this.$.menupane.$.menu.applyStyle("transform", "translateZ(0) translateX(0%)");
        this.$.menupane.$.menu.applyStyle("transition-duration", "0.6s");
        this.loadLayers();
    },
    toolbarToggleMenuHandler: function(inSender, inEvent) {
        this.$.menupane.toggleMenu();
    },
    loadLayers: function() {
        _.each(this.$.menupane.$.menu.controls[3].children, function(child) {
            LayersModel.changeLayerStatus(child.controls[1].layerName, child.controls[1].checked);
        });
    }
});