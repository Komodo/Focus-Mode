(function() {
    const log       = require("ko/logging").getLogger("focusmode");
    const prefs     = require("ko/prefs");
    const commands  = require("ko/commands");
    const menu      = require("ko/menu");
    const w         = require("ko/windows").getMain();
    const ko        = w.ko;
    
    var elems = {
        toolbars: w.document.getElementById("main-toolboxrow-wrapper"),
        toolbarsBc: w.document.getElementById("cmd_toggleToolbars"),
        menu: w.document.getElementById("toolbar-menubar"),
        menuBc: w.document.getElementById("cmd_toggleMenubar")
    }
    
    var active = prefs.getBoolean("focusmode_on", false);
    var state = JSON.parse(prefs.getString("focusmode_state", "{}"));
    var platform = require("sdk/system").platform;
    var isOSX = platform == "darwin";
    
    //log.setLevel(require("ko/logging").LOG_DEBUG);
    
    this.register = function()
    {
        commands.register("focusmode", this.toggle.bind(this), {
            label: "Toggle Focus Mode"
        });
        
        menu.register({
            id: "menu_toggleFocusMode",
            label: "Toggle Focus Mode",
            context: [
                {
                    select: "#popup_view",
                    before: "#menu_view_tabs"
                }
            ],
            attributes: {
                oncommand: "ko.commands.doCommandAsync('cmd_focusmode')"
            }
        });
        
        var btn = require("ko/button");
        btn.register({
            id: "toggleFocusMode",
            label: "Toggle Focus Mode",
            toolbar: true,
            command: "cmd_focusmode",
            classList: "eye-icon",
            context: [
                {
                    select: "#toggleLeftPane",
                    where: "before"
                },
                {
                    select: "#unifiedMenuButtonTitlebar",
                    where: "before"
                }
            ]
        });
        
    }
    
    this.toggle = function()
    {
        if (active)
            this.disable();
        else
            this.enable();
    }
    
    this.enable = function()
    {
        log.debug("Enabling Focus Mode");
        
        this.saveState();
        
        active = true;
        prefs.setBoolean("focusmode_on", true);
        
        if (state.toolbars) ko.commands.doCommand('cmd_toggleToolbars');
        if (state.menu && ! isOSX) ko.commands.doCommand('cmd_toggleMenubar');
        ko.uilayout.ensurePaneHidden("workspace_left_area");
        ko.uilayout.ensurePaneHidden("workspace_right_area");
        ko.uilayout.ensurePaneHidden("workspace_bottom_area");
        
        elems.toolbarsBc.setAttribute("checked", "false");
        
        if ( ! isOSX)
            elems.menuBc.setAttribute("checked", "false");
    }
    
    this.disable = function()
    {
        log.debug("Disabling Focus Mode");
        
        active = false;
        prefs.setBoolean("focusmode_on", false);
        
        var _state = this.getState();
        if (state.toolbars && state.toolbars != _state.toolbars)
        {
            ko.commands.doCommand('cmd_toggleToolbars');
            elems.toolbarsBc.setAttribute("checked", "true");
        }
        
        if ( ! isOSX && state.menu && state.menu != _state.menu)
        {
            ko.commands.doCommand('cmd_toggleMenubar');
            elems.menuBc.setAttribute("checked", "true");
        }
        
        if (state.leftPane) ko.uilayout.ensurePaneShown("workspace_left_area");
        if (state.rightPane) ko.uilayout.ensurePaneShown("workspace_right_area");
        if (state.bottomPane) ko.uilayout.ensurePaneShown("workspace_bottom_area");
    }
    
    this.getState = function()
    {
        var _state = {};

        _state.toolbars = elems.toolbars.getAttribute("collapsed") != "true";
        _state.menu = elems.menu.getAttribute("inactive") != "true";
        
        _state["leftPane"] = ko.uilayout.leftPaneShown();
        _state["rightPane"] = ko.uilayout.rightPaneShown();
        _state["bottomPane"] = ko.uilayout.outputPaneShown();
        
        return _state;
    }
    
    this.saveState = function(_state)
    {
        if ( ! _state) _state =  this.getState();
        
        _stateJson = JSON.stringify(_state);
        log.debug("Saving state: " + _stateJson);
        
        prefs.setString("focusmode_state", _stateJson);
        state = _state;
    }

}).apply(module.exports);
