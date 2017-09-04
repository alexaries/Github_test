cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },
    addClickEvent: function(node, target, component, handler, isReplace) {
        console.log(component + ":" + handler);
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        if (isReplace) {
            //是否覆盖掉之前的事件
            clickEvents[0] = eventHandler;
        } else {
            clickEvents.push(eventHandler);
        }
    },
    addSlideEvent: function(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var slideEvents = node.getComponent(cc.Slider).slideEvents;
        slideEvents.push(eventHandler);
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
    showJinbi: function(jinbi, suffix) {
        if (!suffix) {
            suffix = "万";
        }
        var jinbi = parseFloat(jinbi);
        if (jinbi >= 10000) {
            jinbi /= 10000;
            jinbi = jinbi + suffix;
            return jinbi;
        }
        return jinbi;
    },
    checkRate: function(nubmer) {
        //判断字符串是否为数字//
        // 　　var re = /^[0-9]+.?[0-9]*$/;  
        //判断正整数 /^[1-9]+[0-9]*]*$/ 
        var re = /^[0-9]+[0-9]*]*$/;　　
        if (!re.test(nubmer)) {　　　　
            return false;　　
        }
        return true;
    }
});
