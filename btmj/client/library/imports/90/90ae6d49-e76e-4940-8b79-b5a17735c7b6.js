"use strict";

// 包头麻将调试地址
// var URL = "http://116.62.193.47:8009";
// var URL = "http://116.62.193.47:9009";
// var URL = "http://121.196.213.165:9009";
var URL = "http://127.0.0.1:9009";
cc.game.config['noCache'] = true;
cc.game.config.myversion = 201708042;
var HTTP = cc.Class({
    extends: cc.Component,
    statics: {
        sessionId: 0,
        userId: 0,
        master_url: URL,
        url: URL,
        sendRequest: function sendRequest(path, data, handler, extraUrl) {
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 5000;
            var str = "?";
            for (var k in data) {
                if (str != "?") {
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if (extraUrl == null) {
                extraUrl = HTTP.url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            // console.log("RequestURL:" + requestURL);
            xhr.open("GET", requestURL, true);
            if (cc.sys.isNative) {
                xhr.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                    // console.log("http res("+ xhr.responseText.length + "):" + xhr.responseText);
                    try {
                        var ret = JSON.parse(xhr.responseText);
                        if (handler !== null) {
                            handler(ret);
                        } /* code */
                    } catch (e) {
                        console.log("err:" + e);
                        //handler(null);
                    } finally {
                        if (cc.vv && cc.vv.wc) {
                            //       cc.vv.wc.hide();
                        }
                    }
                }
            };
            if (cc.vv && cc.vv.wc) {
                //cc.vv.wc.show();
            }
            xhr.send();
            return xhr;
        }
    }
});