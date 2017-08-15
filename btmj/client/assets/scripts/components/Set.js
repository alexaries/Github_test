cc.Class({
    extends: cc.Component,
    properties: {
        voice: cc.Node,
        help: cc.Node,
        _btnYXOpen: null,
        _btnYXClose: null,
        _btnYYOpen: null,
        _btnYYClose: null,
    },
    // use this for initialization
    onLoad: function() {
        if (cc.vv == null) {
            return;
        }
        this._btnYXOpen = this.node.getChildByName("voice").getChildByName("jbs_details").getChildByName("sound_on");
        this._btnYXClose = this.node.getChildByName("voice").getChildByName("jbs_details").getChildByName("sound_off");
        this._btnYYOpen = this.node.getChildByName("voice").getChildByName("jbs_details").getChildByName("music_on");
        this._btnYYClose = this.node.getChildByName("voice").getChildByName("jbs_details").getChildByName("music_off");
        cc.vv.utils.addClickEvent(this._btnYXOpen, this.node, "Set", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._btnYXClose, this.node, "Set", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._btnYYOpen, this.node, "Set", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._btnYYClose, this.node, "Set", "onBtnClicked");
        this.refreshVolume();
    },
    refreshVolume: function() {
        this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
        this._btnYXOpen.active = !this._btnYXClose.active;
        this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
        this._btnYYOpen.active = !this._btnYYClose.active;
    },
    onBtnClicked: function(event) {
        if (event.target.name == "guanbi") {
            this.node.active = false;
        } else if (event.target.name == "sound_on") {
            cc.vv.audioMgr.setSFXVolume(1);
            this.refreshVolume();
        } else if (event.target.name == "sound_off") {
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
        } else if (event.target.name == "music_on") {
            cc.vv.audioMgr.setBGMVolume(1);
            this.refreshVolume();
        } else if (event.target.name == "music_off") {
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
        } else if (event.target.name == "set_music1") {
            this.voice.active = true;
            this.help.active = false;
        } else if (event.target.name == "set_faq0") {
            this.voice.active = false;
            this.help.active = true;
        }
    },
});