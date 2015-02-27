enyo.kind({
    name: "loginView",
    kind: "FittableRows",
    classes: "loginViewSectbackground",
    components: [{
        // app logo for now cisco logo
        name: "loginLogo",
        kind: "Image",
        classes: "appLogo",
        src: "assets/cisco-logo.png"
    }, {
        name: "loginCenterSection",
        kind: "FittableRows",
        classes: "loginCenterSection",
        components: [{
            name: "loginTitle",
            content: commonString.LOGIN,
            kind: "Control",
            classes: "loginViewLabel"
        }, {
            name: "loginUsername",
            kind: "Input",
            placeholder: commonString.USERNAME,
            classes: "loginViewInputFields",
            onkeydown: "handleKeyStroke"
        }, {
            name: "loginPassword",
            kind: "Input",
            placeholder: commonString.PASSWORD,
            type: "password",
            classes: "loginViewInputFields",
            onkeydown: "handleKeyStroke"
        }, {
            name: "buttonSignIn",
            kind: "enyo.Button",
            content: commonString.SIGN_IN,
            classes: "loginViewSignInButton",
            ontap: "onTapButtonSignIn"
        }]
    }, {
        kind: "Signals",
        keyboardUp: "onKeyboardUp"
    }],
    create: function() {
        this.inherited(arguments);
        this.$.loginUsername.setValue("admin");
        this.$.loginPassword.setValue("admin");
    },
    rendered: function() {
        this.inherited(arguments);
    },
    onTapButtonSignIn: function(inSender, inEvent) {
        inSender.setDisabled(true);
        this.$.buttonSignIn.setDisabled(false);
        this.goToNextPanel();
    },
    handleKeyStroke: function(inSender, inEvent) {
        if (inEvent.keyCode === 13) {
            this.onTapButtonSignIn(this.$.buttonSignIn);
            return true;
        }
    },
    goToNextPanel: function() {
        app.setViewDirect("mapServices");
    }
});