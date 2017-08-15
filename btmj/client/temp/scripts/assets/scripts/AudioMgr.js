"use strict";
cc._RFpush(module, '55caepcpvFK5r0Ax5f8jss4', 'AudioMgr');
// scripts/AudioMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        bgmVolume: 1.0,
        sfxVolume: 1.0,
        bgmAudioID: -1
    },
    // use this for initialization
    init: function init() {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t != null && t > 0) {
            this.bgmVolume = parseFloat(t);
        } else {
            cc.sys.localStorage.setItem("bgmVolume", 1.0);
        };
        var t = cc.sys.localStorage.getItem("sfxVolume");
        if (t != null && t > 0) {
            this.sfxVolume = parseFloat(t);
        } else {
            cc.sys.localStorage.setItem("sfxVolume", 1.0);
        };
        cc.game.on(cc.game.EVENT_HIDE, function () {
            console.log("cc.audioEngine.pauseAll");
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            console.log("cc.audioEngine.resumeAll");
            cc.audioEngine.resumeAll();
        });
    },
    getUrl: function getUrl(url) {
        return cc.url.raw("resources/sounds/" + url);
    },
    playBGM: function playBGM(url) {
        var audioUrl = this.getUrl(url);
        console.log(audioUrl);
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);
        }
        this.bgmAudioID = cc.audioEngine.play(audioUrl, true, this.bgmVolume);
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t == null) {
            t = 0;
        }
        console.log('当前音量是多少' + t);
        this.setBGMVolume(t);
        // alert("当前的id是--"+this.bgmAudioID);
    },
    playSFX: function playSFX(url) {
        var audioUrl = this.getUrl(url);
        if (this.sfxVolume > 0) {
            var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);
        }
    },

    setSFXVolume: function setSFXVolume(v) {
        if (this.sfxVolume != v) {
            cc.sys.localStorage.setItem("sfxVolume", v);
            this.sfxVolume = v;
        }
    },
    setBGMVolume: function setBGMVolume(v, force) {
        if (this.bgmAudioID >= 0) {
            if (v > 0) {
                cc.audioEngine.resume(this.bgmAudioID);
            } else {
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }
        if (this.bgmVolume != v || force) {
            cc.sys.localStorage.setItem("bgmVolume", v);
            this.bgmVolume = v;
            cc.audioEngine.setVolume(this.bgmAudioID, v);
        }
    },
    pauseAll: function pauseAll() {
        cc.audioEngine.pauseAll();
    },
    resumeAll: function resumeAll() {
        cc.audioEngine.resumeAll();
    }
});

cc._RFpop();