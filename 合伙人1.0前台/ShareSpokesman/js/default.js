

var App,myScroll;
var router = new VueRouter({});
router.back = false;
var cssBox = ".pageRight-enter{transform: translateX(-100%);-webkit-transform: translateX(-100%);}.pageRight-leave{transform: translateX(100%);-webkit-transform: translateX(100%);}";

Vue.http.interceptors.push(function(request, next) {
    var timeout;
    $('#loading').show();
    if(request._timeout) {
        timeout = setTimeout(function(){
            next(request.respondWith(request.body, {
                 status: 408,
                 statusText: '请求超时'
            }));
        },request._timeout)
    }
    next(function(response) {
        clearTimeout(timeout);
        $('#loading').hide();
        return response;
    })
})
Vue.http.options._timeout = 15000;

//活动
var promotion = Vue.extend({
    template : "#promotion_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "manager_id" : "",
                "dataList" : [],
                "param_text" : "",
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "type" : "",
                "sideShow" : false,
                "onoff" : false,
            },
            "title" : {
                "tabs" : "a",
                "type" : 66,
            },
        }
    },
    filters: {
        eachTitle : function(val){
            var _this = this;
            var name = "";
            if( val ){
                if( val.length > 20 ){
                    name = val.substring(0,20) + "...";
                } else {
                    name = val;
                }
            }
            return name;
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "title.tabs" : function(val){
            this._getPromotion();
        },
        "title.type" : function(val){
            var _this = this;
            if( val == 66 ){
                _this.base.type = "";
            } else {
                 _this.base.type = val;
            }
            _this.base.sideShow = false;
            _this._getPromotion();
        }
    },
    methods : {
        _loaded : function(num){
            var _this = this;
            myScroll = new IScroll('.wrapper', {
                probeType: 3,        
                mouseWheel: true, 
                scrollbars: false, 
                fadeScrollbars: true, 
                interactiveScrollbars: true, 
                shrinkScrollbars: 'scale', 
                useTransform: true, 
                useTransition: true, 
                bounce: true, 
                freeScroll: false, 
                startX: 0,
                startY: 0,
                preventDefault: false,
            });
            if( num ){
                myScroll.scrollTo(0,num);
            }
            myScroll.on('scroll',function(){
                var num = _this.base.maxLength - myScroll.y;
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length >= size ){
                    if( num > 30 ){                        
                        if( _this.base.text != "松开加载更多" ){
                            _this.base.text = "上拉加载更多";
                        }
                    }
                    if ( num > 88 ){
                        _this.base.text = "松开加载更多";
                        _this.base.onoff = true;
                        var num = myScroll.y;
                        myScroll.refresh();
                        myScroll.scrollTo(0,num)
                    }
                } else {
                    if( myScroll.y < _this.base.maxLength ){
                        _this.base.text = "已经是最后一页了";
                    }
                }
            });
            myScroll.on('scrollEnd',function(){
                _this.base.nowY = myScroll.y;
                _this.base.text = "";
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length == size ){
                    var num = _this.base.maxLength - myScroll.y;
                    if( num > 40 ){
                        _this.base.text = "正在加载中";
                        _this.base.page ++;
                        _this._getPromotion();
                    }
                }
            })
        },
        _getPromotion : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.boss_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.activity_type = _this.base.type;
            data.pagesize = pagesize;
            data.currentpage = 0;
            if( _this.title.tabs == 'b' ){
                data.quantity = 1;
            } else if( _this.title.tabs == 'c' ){
                data.original_price = 1;
            }
            data.param_text = _this.base.param_text;
            var url = "http://www.zsb2b.com:8081/activity_all/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.param_text = "";
                    _this.base.dataList = result.data.list;
                    setTimeout(function(){
                        myScroll.refresh();
                        _this.base.maxLength = myScroll.maxScrollY;
                    },500)
                    // _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.onoff = false;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.is_prolocutor = result.data[0].is_prolocutor;
                    _this._getPromotion();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goDetail : function(d){
            var _this = this;
            if( d.activity_type == 1 || d.activity_type == 6 ){
                routerHrefId("productDetail",d.activity_type,d.id);
            } else if( d.activity_type == 2 ){
                window.location.href = "http://ssm.echao.com/ShareSpokesman/bargain_fenx/index.html?userid=" + d.user_id + "&actid=" + d.id + "&fans_id=" + getURLParam("fans_id",window.location.href);
            }
        },
        _getActivity : function(type,oid){
            routerHrefId("promotionDetail",type,oid);
        },
        _wechatShare:function () {
            var _this = this;
            var url;
            var host = window.location.href;
            $.ajax({
                async: false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  host,
                                desc : _this.parentMsg.personal.name + "邀请您成为他（她）的代言人",
                                imgUrl: "http://imageserver.echao.com/uploadfile/20170616/f223c78671.jpg",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    "menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        var param_text = sessionStorage.getItem("param_text");
        _this.base.token = sessionStorage.getItem("token");
        if( param_text ){
            sessionStorage.removeItem("param_text");
            _this.base.param_text = param_text;
        }
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._loaded();
                    if( _this.parentMsg.base.manager_id ){
                        _this._getPromotion();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
        
    }
});

//非代言人活动列表
var promotionOther = Vue.extend({
    template : "#promotionOther_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "manager_id" : "",
                "dataList" : [],
                "param_text" : "",
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "type" : "",
                "sideShow" : false,
                "onoff" : false,
                "is_prolocutor" : "",
            },
            "title" : {
                "tabs" : "a",
                "type" : 66,
            },
        }
    },
    filters: {
        eachTitle : function(val){
            var _this = this;
            var name = "";
            if( val ){
                if( val.length > 20 ){
                    name = val.substring(0,20) + "...";
                } else {
                    name = val;
                }
            }
            return name;
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "title.tabs" : function(val){
            this._getPromotion();
        },
        "title.type" : function(val){
            var _this = this;
            if( val == 66 ){
                _this.base.type = "";
            } else {
                 _this.base.type = val;
            }
            _this.base.sideShow = false;
            _this._getPromotion();
        }
    },
    methods : {
        _loaded : function(num){
            var _this = this;
            myScroll = new IScroll('.wrapper', {
                probeType: 3,        
                mouseWheel: true, 
                scrollbars: false, 
                fadeScrollbars: true, 
                interactiveScrollbars: true, 
                shrinkScrollbars: 'scale', 
                useTransform: true, 
                useTransition: true, 
                bounce: true, 
                freeScroll: false, 
                startX: 0,
                startY: 0,
                preventDefault: false,
            });
            if( num ){
                myScroll.scrollTo(0,num);
            }
            myScroll.on('scroll',function(){
                var num = _this.base.maxLength - myScroll.y;
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length >= size ){
                    if( num > 30 ){                        
                        if( _this.base.text != "松开加载更多" ){
                            _this.base.text = "上拉加载更多";
                        }
                    }
                    if ( num > 88 ){
                        _this.base.text = "松开加载更多";
                        _this.base.onoff = true;
                        var num = myScroll.y;
                        myScroll.refresh();
                        myScroll.scrollTo(0,num)
                    }
                } else {
                    if( myScroll.y < _this.base.maxLength ){
                        _this.base.text = "已经是最后一页了";
                    }
                }
            });
            myScroll.on('scrollEnd',function(){
                _this.base.nowY = myScroll.y;
                _this.base.text = "";
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length == size ){
                    var num = _this.base.maxLength - myScroll.y;
                    if( num > 40 ){
                        _this.base.text = "正在加载中";
                        _this.base.page ++;
                        _this._getPromotion();
                    }
                }
            })
        },
        _getPromotion : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.boss_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.activity_type = _this.base.type;
            data.pagesize = pagesize;
            data.currentpage = 0;
            if( _this.title.tabs == 'b' ){
                data.quantity = 1;
            } else if( _this.title.tabs == 'c' ){
                data.original_price = 1;
            }
            data.param_text = _this.base.param_text;
            var url = "http://www.zsb2b.com:8081/activity_all/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.param_text = "";
                    _this.base.dataList = result.data.list;
                    setTimeout(function(){
                        myScroll.refresh();
                        _this.base.maxLength = myScroll.maxScrollY;
                    },500)
                    // _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.onoff = false;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.is_prolocutor = result.data[0].is_prolocutor;
                    _this._getPromotion();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goDetail : function(d){
            var _this = this;
            if( d.activity_type == 1 || d.activity_type == 6 ){
                routerHrefId("productDetail",d.activity_type,d.id);
            } else if( d.activity_type == 2 ){
                window.location.href = "http://ssm.echao.com/ShareSpokesman/bargain_fenx/index.html?userid=" + d.user_id + "&actid=" + d.id + "&fans_id=" + getURLParam("fans_id",window.location.href);
            }
        },
        _getActivity : function(type,oid){
            routerHrefId("promotionDetail",type,oid);
        },
        _wechatShare:function () {
            var _this = this;
            var url;
            var host = window.location.href;
            $.ajax({
                async: false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  host,
                                desc : _this.parentMsg.personal.name + "邀请您成为他（她）的代言人",
                                imgUrl: "http://imageserver.echao.com/uploadfile/20170616/f223c78671.jpg",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    "menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        var param_text = sessionStorage.getItem("param_text");
        _this.base.token = sessionStorage.getItem("token");
        if( param_text ){
            sessionStorage.removeItem("param_text");
            _this.base.param_text = param_text;
        }
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._loaded();
                    if( _this.parentMsg.base.manager_id ){
                        _this._getPromotion();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
        
    }
});

//活动详情
var promotionDetail = Vue.extend({
    template : "#promotion_detail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "activity_type" : "",
                "activity_id" : "",
                "database" : {},
                "product" : {},
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
        eachImage : function(val){
            var _this = this;
            var name = "";
            if( val ){
                var arr = JSON.parse(val);
                name = arr[0];
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getType();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getType : function(){
            var _this = this;
            if( _this.base.activity_type == 1 ){
                _this._getSingle();
            } else if( _this.base.activity_type == 2 ){
                _this._getBargain();
            } else if( _this.base.activity_type == 6 ){
                _this._getLeaflet();
            }
        },
        _getBargain : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.activity_id;
            var url = "http://www.zsb2b.com:8081/bargain/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    console.log(result.data[0])
                    _this._getProduct(result.data[0].product_id);
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getSingle : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.activity_id;
            var url = "http://www.zsb2b.com:8081/single_product/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    console.log(result.data[0])
                    _this._getProduct(result.data[0].product_id);
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getLeaflet : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.activity_id;
            var url = "http://www.zsb2b.com:8081/leaflet/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(5,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    _this._getProduct(result.data[0].product_id);
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getProduct : function(oid){
            var _this = this;
            var data = {};
            data.index = 2;
            data.id = oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/products/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(33,result)               
                if( result.error_code == 0 ){
                    _this.base.product = result.data[0];
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.activity_type = _this.$route.params.activity_type;
        _this.base.activity_id = _this.$route.params.activity_id;
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getType();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//产品详情
var productDetail = Vue.extend({
    template : "#product_detail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "activity_id" : "",
                "activity_type" : "",
                "url" : "",
                "banner" : [],
                "detail" : [],
                "database" : {},
                "share" : false,
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {},
    methods : {
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.is_prolocutor = result.data[0].is_prolocutor;
                    _this._getType();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _banner : function(){
            var _this = this;
            if( _this.base.banner.length > 1 ){
                var swiper = new Swiper('.product_banner.swiper-container', {
                    pagination: '.circle.swiper-pagination',
                    paginationClickable: true,
                    loop: true,
                    centeredSlides: true,
                    autoplay: 4000,
                    autoplayDisableOnInteraction: false
                });
            }
        },
        _wechatShare:function () {
            var _this = this;
            var host = window.location.href;
            // host = host.split("#!/")[0] + "&page=" + host.split("#!/")[1];
            $.ajax({
                async: false,
                cache:false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    console.log(22,host,window.location.href)
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : _this.base.database.title,
                                link :  host,
                                desc : _this.base.database.product_introduction,
                                imgUrl: _this.base.database.image_logo,
                                success: function( d ){
                                    var shareData = {};
                                    shareData.user_id = _this.parentMsg.base.user_id;
                                    shareData.boss_id = _this.parentMsg.base.manager_id;
                                    shareData.forward = 0;
                                    shareData.share = 1;
                                    shareData.see = 0;
                                    shareData.single_product_id = _this.base.activity_id;
                                    shareData.share_price = _this.base.database.share_money_time;
                                    $.ajax({
                                        async:false,
                                        type: "POST",
                                        url: "http://www.zsb2b.com:8081/operation_num/single_product_add",
                                        data:shareData,
                                        dataType: "json",
                                        success: function (data) {
                                            console.log("share",data);
                                        },
                                        error:function () {
                                            layer.msg("分享出错了",{icon:2})
                                        }
                                    })
                                    var shareDataLog = {};
                                    shareDataLog.openid = _this.parentMsg.base.openid;
                                    shareDataLog.spokesman_id = _this.parentMsg.base.user_id;
                                    shareDataLog.manager_id = _this.parentMsg.base.manager_id;
                                    shareDataLog.shopowner_id = _this.parentMsg.base.shopowner_id;
                                    shareDataLog.clerk_id = _this.parentMsg.base.clerk_id;
                                    shareDataLog.prolocutor_id = _this.parentMsg.base.prolocutor_id;
                                    shareDataLog.MONEY = _this.base.database.share_money_time;
                                    shareDataLog.types = "分享金";
                                    shareDataLog.type = 1;
                                    shareDataLog.create_days = "";
                                    shareDataLog.create_date = "";
                                    shareDataLog.activity_id = _this.base.activity_id;
                                    shareDataLog.activity_type = _this.base.activity_type;
                                    $.ajax({
                                        async:false,
                                        type: "POST",
                                        url: "http://www.zsb2b.com:8081/manager_income/add",
                                        data:shareDataLog,
                                        dataType: "json",
                                        success: function (data) {
                                            console.log("sharelog",data);
                                        },
                                        error:function () {
                                            layer.msg("分享出错了",{icon:2})
                                        }
                                    })
                                },
                                cancel: function(){
                                }
                            };
                            forwardData = {
                                title : _this.base.database.title,
                                link :  host,
                                desc : _this.base.database.product_introduction,
                                imgUrl: _this.base.database.image_logo,
                                success: function( d ){
                                    console.log(55,host);
                                    var shareData = {};
                                    shareData.user_id = _this.parentMsg.base.user_id;
                                    shareData.boss_id = _this.parentMsg.base.manager_id;
                                    shareData.forward = 1;
                                    shareData.share = 0;
                                    shareData.see = 0;
                                    shareData.single_product_id = _this.base.activity_id;
                                    shareData.share_price = _this.base.database.forward_money_time;
                                    $.ajax({
                                        async:false,
                                        type: "POST",
                                        url: "http://www.zsb2b.com:8081/operation_num/single_product_add",
                                        data:shareData,
                                        dataType: "json",
                                        success: function (data) {
                                            console.log("forward",data);
                                        },
                                        error:function () {
                                            layer.msg("转发出错了",{icon:2})
                                        }
                                    })
                                    var shareDataLog = {};
                                    shareDataLog.openid = _this.parentMsg.base.openid;
                                    shareDataLog.spokesman_id = _this.parentMsg.base.user_id;
                                    shareDataLog.manager_id = _this.parentMsg.base.manager_id;
                                    shareDataLog.shopowner_id = _this.parentMsg.base.shopowner_id;
                                    shareDataLog.clerk_id = _this.parentMsg.base.clerk_id;
                                    shareDataLog.prolocutor_id = _this.parentMsg.base.prolocutor_id;
                                    shareDataLog.MONEY = _this.base.database.forward_money_time;
                                    shareDataLog.types = "转发金";
                                    shareDataLog.type = 2;
                                    shareDataLog.create_days = "";
                                    shareDataLog.create_date = "";
                                    shareDataLog.activity_id = _this.base.activity_id;
                                    shareDataLog.activity_type = _this.base.activity_type;
                                    $.ajax({
                                        async:false,
                                        type: "POST",
                                        url: "http://www.zsb2b.com:8081/manager_income/add",
                                        data:shareDataLog,
                                        dataType: "json",
                                        success: function (data) {
                                            console.log("forwardlog",data);
                                        },
                                        error:function () {
                                            layer.msg("转发出错了",{icon:2})
                                        }
                                    })
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(forwardData);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    "menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
        },
        _easyLoad : function(){
            $("img.lazy").lazyload({
                container: $('#scroller'),
                effect: "fadeIn",
                threshold:0
            }).on('load', function () {
                $(this).removeClass();
                setTimeout(function(){
                    myScroll.refresh();
                },300)
            });
        },
        _getType : function(){
            var _this = this;
            if( _this.base.activity_type == 1 ){
                _this._getProduct();
            } else if( _this.base.activity_type == 6 ){
                _this._getLeaflet();
            }
        },
        _getProduct : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.activity_id;
            var url = "http://www.zsb2b.com:8081/single_product/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    if( result.data[0].banner_top ){
                        _this.base.banner = JSON.parse(result.data[0].banner_top);
                    }
                    if( result.data[0].product_introduction_img ){
                        _this.base.detail = JSON.parse(result.data[0].product_introduction_img);
                    }
                    setTimeout(function(){
                        myScroll.refresh();
                        _this._banner();
                        _this._easyLoad();
                    },500)
                    _this._createSingle();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getLeaflet : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.activity_id;
            var url = "http://www.zsb2b.com:8081/leaflet/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(5,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    if( result.data[0].banner_top ){
                        _this.base.banner = JSON.parse(result.data[0].banner_top);
                    }
                    if( result.data[0].product_introduction_img ){
                        _this.base.detail = JSON.parse(result.data[0].product_introduction_img);
                    }
                    setTimeout(function(){
                        myScroll.refresh();
                        _this._banner();
                        _this._easyLoad();
                    },500)
                    _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _createSingle : function(){
            var _this = this;
            var data = {};
            data.single_product_id = _this.base.activity_id;
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/single_product_user/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    _this._createLook();
                    _this._createLookLog();
                    _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _createLook : function(){
            var _this = this;
            var data = {};
            data.user_id = _this.parentMsg.base.user_id;
            data.boss_id = _this.parentMsg.base.manager_id;
            data.forward = 0;
            data.share = 0;
            data.see = 1;
            data.single_product_id = _this.base.activity_id;
            data.share_price = _this.base.database.browse_money_time;
            console.log(22,data)
            var url = "http://www.zsb2b.com:8081/operation_num/single_product_add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _createLookLog : function(){
            var _this = this;
            var data = {};
            data.openid = _this.parentMsg.base.openid;
            data.spokesman_id = _this.parentMsg.base.user_id;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.clerk_id = _this.parentMsg.base.clerk_id;
            data.prolocutor_id = _this.parentMsg.base.prolocutor_id;
            data.MONEY = _this.base.database.browse_money_time;
            data.types = "浏览金";
            data.type = 3;
            data.create_days = "";
            data.create_date = "";
            data.activity_id = _this.base.activity_id;
            data.activity_type = _this.base.activity_type;
            var url = "http://www.zsb2b.com:8081/manager_income/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goPayPage : function(){
            var _this = this;
            _this.parentMsg.pay.database = _this.base.database;
            _this.parentMsg.pay.totalPrice = _this.base.database.floor_price;
            _this.parentMsg.pay.onePrice = _this.base.database.floor_price;
            _this.parentMsg.pay.original_price = _this.base.database.original_price;
            _this.parentMsg.pay.number = 1;
            _this.parentMsg.pay.img = _this.base.database.image_logo;
            _this.parentMsg.pay.title = _this.base.database.title;
            routerHrefId("pay",_this.base.activity_type);
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        if( !_this.$route.params.activity_id ){
            return goBack();
        }
        loaded();
        _this.base.token = sessionStorage.getItem("token");
        _this.base.activity_type = _this.$route.params.activity_type;
        _this.base.activity_id = _this.$route.params.activity_id;
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getType();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
        
        
    }
});

//立即支付
var pay = Vue.extend({
    template : "#pay_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "getType" : 1,
                "payType" : 2,
                "foot" : true,
                "delShow" : false,
                "type" : "",
                "order" : {},
                "consignee" : "",
                "phone" : "",
                "pickup_information" : "",
            }
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "base.getType" : function(val){
            setTimeout(function(){
                myScroll.refresh();
            },500)
        },
    },
    methods : {
        _showTips : function(){
            var _this = this;
            var demo = /^1(3|4|5|7|8)\d{9}$/;
            if( !_this.base.order.id ){
                return layer.msg("订单生成失败",{icon:0});
            }
            if( _this.base.getType == 2 ){
                if( !_this.base.consignee ){
                    return layer.msg("请输入收货人",{icon:0});
                }
                if( !demo.test(_this.base.phone) ){
                    return layer.msg("请输入正确的联系电话",{icon:0});
                }
                if( !_this.base.pickup_information ){
                    return layer.msg("请输入收货地址",{icon:0});
                }
            }
            _this.base.delShow = true;
        },
        _goPay : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.pid = _this.parentMsg.base.user_id;
            data.order_no = _this.base.order.order_no;
            data.id = _this.base.order.id;
            data.need_pay =_this.base.order.need_pay;
            console.log(1212,data) 
            var url = "http://www.zsb2b.com:8081/weixin_pay/jhkj_pay_order";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    console.log(34343,result.data)
                    location.href = result.data.url;
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg('发起支付失败',{icon:0});
                } else {
                    layer.msg('发起支付失败',{icon:2});
                }
            });
        },
        _changOrder : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.order.id;
            if( _this.base.getType == 2 ){
                data.is_express = 1;
                data.pay_price_type = 2;
                data.consignee = _this.base.consignee;
                data.phone = _this.base.phone;
                data.pickup_information = _this.base.pickup_information;
            } else {
                data.is_express = 0;
                data.pay_price_type = 2;
                data.consignee = "";
                data.phone = "";
                data.pickup_information = "";
            }
            console.log(1212,data) 
            var url = "http://www.zsb2b.com:8081/order/order_status_pay_after_update_consignee";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    _this._goPay();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _hideFoot : function(){
            var _this = this;
            _this.base.foot = false;
        },
        _resetScroll : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
        },
        _createOrder : function(){
            var _this = this;
            var data = {};
            data.create_time = moment().format("X");
            data.gid = _this.parentMsg.pay.database.product_id;
            data.total_price = _this.parentMsg.pay.database.floor_price;
            data.discount_price = _this.parentMsg.pay.database.floor_price;
            data.need_pay = _this.parentMsg.pay.database.floor_price;
            data.unit_price = _this.parentMsg.pay.database.floor_price;
            data.original_price = _this.parentMsg.pay.database.original_price;
            data.title_pic = _this.parentMsg.pay.database.image_logo;
            data.title = _this.parentMsg.pay.database.title;
            data.remark = "";
            data.number = 1;
            data.cid = _this.parentMsg.base.user_id;
            data.mid = _this.parentMsg.base.manager_id;
            data.pid = _this.parentMsg.base.prolocutor_id;
            data.sid = _this.parentMsg.base.shopowner_id;
            data.aid = _this.parentMsg.pay.database.id;
            data.activity_type = _this.base.type;
            console.log(1212,data) 
            var url = "http://www.zsb2b.com:8081/order/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(4,result)               
                if( result.error_code == 0 ){
                    _this.base.order = result.data;
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _fromOrder : function(){
            var _this = this;
            _this.base.order.id = _this.parentMsg.pay.database.id;
            _this.base.order.order_no = _this.parentMsg.pay.database.order_no;
            _this.base.order.need_pay = _this.parentMsg.pay.database.need_pay;
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.type = _this.$route.params.activity_type;
        if( !_this.parentMsg.pay.totalPrice ){
            return goBack();
        }
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.type == 66 ){
                    _this._fromOrder();
                } else {
                    _this._createOrder();
                }
            },320)
        });
    }
});

//统计
var count = Vue.extend({
    template : "#count_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "user_id" : "",
                "manager_id" : "",
                "openid" : "",
            },
            "progress" : {
                "width" : 0,
                "num" : 0,
            },
            "total" : {
                "database" : {},
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "progress.num" : function(val){
            var _this = this;
            var timer = setInterval(function(){
                if( _this.progress.width <= val ){
                    var length = _this.progress.width ++;
                    $('.count_progress_img dd').width(length+'%');
                } else {
                    clearInterval(timer);
                }
            },10)
        },
    },
    methods : {
        _getCount : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.openid = _this.parentMsg.base.openid;
            var url = "http://www.zsb2b.com:8081/personnel/statistics";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                if( result.error_code == 0 ){
                    _this.total.database = result.data[0];
                    _this._getTask();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getTask : function(){
            var _this = this;
            var data = {};
            var time = moment().format('YYYY-MM-DD');
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.addtime = new Date(time).getTime() / 1000;
            var url = "http://www.zsb2b.com:8081/people_task/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                if( result.error_code == 0 ){
                    if( result.data.state == "success" ){
                        _this.progress.num = result.data._percent > 100 ? 100 : result.data._percent;
                        _this._updateTask(time,result.data.id);
                    } else if( result.data.state == "empty" ){
                        _this.progress.num = 0;
                    } else {
                        _this.progress.num = result.data._percent > 100 ? 100 : result.data._percent;
                    }
                    // _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.is_prolocutor = result.data[0].is_prolocutor;
                    _this._getCount();
                    
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _updateTask : function(time,oid){
            var _this = this;
            var data = {};
            console.log(time)
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.token = _this.base.token;
            data.id = oid;
            data.task_type = 1;
            data.addtime = new Date(time).getTime() / 1000;
            var url = "http://www.zsb2b.com:8081/people_task/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(222,result);
                if( result.error_code == 0 ){
                    
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _wechatShare:function () {
            var _this = this;
            var url;
            var host = window.location.href;
            $.ajax({
                async: false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  host,
                                desc : _this.parentMsg.personal.name + "邀请您成为他（她）的代言人",
                                imgUrl: "http://imageserver.echao.com/uploadfile/20170616/f223c78671.jpg",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    "menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getCount();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//签到
var signIn = Vue.extend({
    template : "#signIn_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "text" : "",
                "taskcount" : 0,
            },
            "progress" : {
                "width" : 0,
                "num" : 0,
            },
            "calendar" : {
                "signIn" : [],
                "nowYear" : "",
                "nowMonth" : "",
                "page" : 0,
                "database" : {},
            },
        }
    },
    filters: {
        eachMonth : function(val){
            var _this = this;
            var name = 0;
            if( val ){
                val = val - 0;
                if( val < 10){
                    name = "0" + val;
                } else {
                    name = val;
                }
            }
            return name;
        },
        eachSignIn : function(val){
            var _this = this;
            var name = "";
            for(var i=0;i<_this.calendar.signIn.length;i++){
                if( val == _this.calendar.signIn[i] ){
                    name = "signIn";
                }
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _signIn : function(){
            var _this = this;
            var data = {};
            var time = moment().format('YYYY-MM-DD');
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.openid = _this.parentMsg.base.openid;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.clerk_id = _this.parentMsg.base.clerk_id;
            data.agent_id = _this.parentMsg.base.prolocutor_id;
            data.addtime = new Date(time).getTime() / 1000;
            var url = "http://www.zsb2b.com:8081/people_task/add";
            if( _this.base.text == "已签到" ){
                return;
            } else {
                _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    console.log(11,result);
                    if( result.error_code == 0 ){
                        layer.msg("签到成功",{icon:1});
                        _this.base.text = "已签到";
                        _this.base.taskcount = result.data.sign_count || 0;
                        _this.calendar.signIn = [];
                        for(var i=0;i<_this.base.taskcount;i++){
                            _this.calendar.signIn.push(moment().subtract(i,'days').format('YYYY-MM-DD'))
                        }
                    } else if( result.error_code == 300 ){
                        sessionStorage.removeItem("token");
                        layer.msg(result.error_msg,{icon:0});
                        userLogin(function(){});
                    } else {
                        layer.msg(result.error_msg,{icon:0});
                    }
                }, function(response){
                    if( response.status == 408 ){
                        layer.msg(response.statusText,{icon:0});
                    } else {
                        layer.msg('出错了',{icon:2});
                    }
                });
            }
        },
        _getTask : function(){
            var _this = this;
            var data = {};
            var time = moment().format('YYYY-MM-DD');
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.addtime = new Date(time).getTime() / 1000;
            var url = "http://www.zsb2b.com:8081/people_task/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                if( result.error_code == 0 ){
                    if( result.data.state == "empty" ){
                        _this.base.text = "签到";
                        _this.base.taskcount = result.data.sign_count || 0;
                        for(var i=0;i<_this.base.taskcount;i++){
                            _this.calendar.signIn.push(moment().subtract(i+1,'days').format('YYYY-MM-DD'))
                        }
                    } else {
                        console.log(1212312)
                        _this.base.text = "已签到";
                        _this.base.taskcount = result.data.sign_count || 0;
                        for(var i=0;i<_this.base.taskcount;i++){
                            _this.calendar.signIn.push(moment().subtract(i,'days').format('YYYY-MM-DD'))
                        }
                    }
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getTask();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _removeMonth : function(){
            var _this = this;
            _this.calendar.page --;
            var date = moment().add(_this.calendar.page,'month').format('YYYY-MM');
            _this.calendar.nowYear = date.split("-")[0];
            _this.calendar.nowMonth = date.split("-")[1];
            _this.calendar.database = newCalendar(date);
        },
        _addMonth : function(){
            var _this = this;
            _this.calendar.page ++;
            var date = moment().add(_this.calendar.page,'month').format('YYYY-MM');
            _this.calendar.nowYear = date.split("-")[0];
            _this.calendar.nowMonth = date.split("-")[1];
            _this.calendar.database = newCalendar(date);
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        var date = new Date();
        var nowdate = moment().format('YYYY-MM');
        _this.calendar.nowYear = nowdate.split("-")[0];
        _this.calendar.nowMonth = nowdate.split("-")[1];
        _this.calendar.database = newCalendar(nowdate);
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getTask();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//订单
var order = Vue.extend({
    template : "#order_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "delShow" : false,
                "delOrder" : "",
                "param_text" : "",
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
            },
            "order" : {
                "status" : 1,
            },
            "select" : {
                "status" : [
                    {"val":1,"name":"待付款"}
                    ,{"val":2,"name":"提货/发货"}
                    ,{"val":3,"name":"已完成"}
                    ,{"val":4,"name":"退款中"}
                    ,{"val":5,"name":"已退款"}
                ]
            }
        }
    },
    filters: {
        eachEcho : function(vals, obj){
            var _this = this;
            var name = '';
            for( var i in _this.select[obj] ){
                if( vals == _this.select[obj][i].val ){
                    name = _this.select[obj][i].name;
                }
            }
            return name;
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "order.status" : function(val){
            var _this = this;
            if( !_this.base.param_text ){
                _this._getOrder();
            }
        },
    },
    methods : {
        _loaded : function(num){
            var _this = this;
            myScroll = new IScroll('.wrapper', {
                probeType: 3,        
                mouseWheel: true, 
                scrollbars: false, 
                fadeScrollbars: true, 
                interactiveScrollbars: true, 
                shrinkScrollbars: 'scale', 
                useTransform: true, 
                useTransition: true, 
                bounce: true, 
                freeScroll: false, 
                startX: 0,
                startY: 0,
                preventDefault: false,
            });
            if( num ){
                myScroll.scrollTo(0,num);
            }
            myScroll.on('scroll',function(){
                var num = _this.base.maxLength - myScroll.y;
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length >= size ){
                    if( num > 30 ){                        
                        if( _this.base.text != "松开加载更多" ){
                            _this.base.text = "上拉加载更多";
                        }
                    }
                    if ( num > 88 ){
                        _this.base.text = "松开加载更多";
                        _this.base.onoff = true;
                        var num = myScroll.y;
                        myScroll.refresh();
                        myScroll.scrollTo(0,num)
                    }
                } else {
                    if( myScroll.y < _this.base.maxLength ){
                        _this.base.text = "已经是最后一页了";
                    }
                }
            });
            myScroll.on('scrollEnd',function(){
                _this.base.nowY = myScroll.y;
                _this.base.text = "";
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length == size ){
                    var num = _this.base.maxLength - myScroll.y;
                    if( num > 40 ){
                        _this.base.text = "正在加载中";
                        _this.base.page ++;
                        _this._getOrder();
                    }
                }
            })
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.is_prolocutor = result.data[0].is_prolocutor;
                    _this._getOrder();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _wechatShare:function () {
            var _this = this;
            var url;
            var host = window.location.href;
            $.ajax({
                async: false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  host,
                                desc : _this.parentMsg.personal.name + "邀请您成为他（她）的代言人",
                                imgUrl: "http://imageserver.echao.com/uploadfile/20170616/f223c78671.jpg",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    "menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
        },
        _getOrder : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.status = _this.order.status;
            data.user_id = _this.parentMsg.base.user_id;
            data.param_text = _this.base.param_text;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/order/order_status";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(33,result)              
                if( result.error_code == 0 ){
                    _this.base.param_text = "";
                    _this.base.dataList = result.data.list;
                    setTimeout(function(){
                        myScroll.refresh();
                        _this.base.maxLength = myScroll.maxScrollY;
                    },500)
                    // _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.onoff = false;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _cancelShow : function(oid){
            var _this = this;
            _this.base.delShow = true;
            _this.base.delOrder = oid;
        },
        _cancelOrder : function(){
            var _this = this;
            var data = {};
            data.id = _this.base.delOrder;
            data.index = 1;
            var url = "http://www.zsb2b.com:8081/order/delete";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(33,result)              
                if( result.error_code == 0 ){
                    _this.base.delShow = false;
                    layer.msg("删除成功",{icon:1,time:1200});
                    setTimeout(function(){
                        _this._getOrder();
                    },1200)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goOrderDetail : function( obj ){
            var _this = this;
            _this.parentMsg.order.database = obj;
            routerHref("orderDetail");
        },
        _goPayPage : function(obj){
            var _this = this;
            _this.parentMsg.pay.database = obj;
            _this.parentMsg.pay.totalPrice = obj.total_price;
            _this.parentMsg.pay.original_price = obj.original_price;
            _this.parentMsg.pay.onePrice = obj.unit_price;
            _this.parentMsg.pay.number = obj.number;
            _this.parentMsg.pay.img = obj.title_pic;
            _this.parentMsg.pay.title = obj.title;
            routerHrefId("pay",66);
        },
        _goSearchPage : function(){
            var _this = this;
            _this.parentMsg.order.pay_status = _this.order.status;
            routerSearch(1);
        },
        _changeStatus : function(obj,num){
            var _this = this;
            var data = {};
            data.order_no = obj.order_no;
            data.update = num;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/personnel/update_order_status";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(33,result)              
                if( result.error_code == 0 ){
                    _this.base.delShow = false;
                    layer.msg("操作成功",{icon:1,time:1200});
                    setTimeout(function(){
                        _this._getOrder();
                    },1200)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goReturn : function(obj){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = obj.id;
            data.user_id = _this.parentMsg.base.user_id;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/refund/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(33,result)              
                if( result.error_code == 0 ){
                    if( obj.pay_status == 3 ){
                        layer.msg('退款申请已提交，请等待审核',{icon:1,time:1200});
                        setTimeout(function(){
                            _this._getOrder();
                        },1200)
                    } else {
                        layer.msg('退款成功',{icon:1,time:1200});
                        setTimeout(function(){
                            _this._getOrder();
                        },1200)
                    }
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        var param_text = sessionStorage.getItem("param_text");
        _this.base.token = sessionStorage.getItem("token");
        if( param_text ){
            sessionStorage.removeItem("param_text");
            _this.base.param_text = param_text;
            if( _this.parentMsg.order.pay_status ){
                _this.order.status = _this.parentMsg.order.pay_status;
                _this.parentMsg.order.pay_status = "";
            }
        }
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._loaded();
                    if( _this.parentMsg.base.manager_id ){
                        _this._getOrder();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
})

//订单详情
var orderDetail = Vue.extend({
    template : "#orderDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "select" : {
                "status" : [
                    {"val":1,"name":"待付款"}
                    ,{"val":2,"name":"提货/发货"}
                    ,{"val":3,"name":"已完成"}
                    ,{"val":4,"name":"退款中"}
                    ,{"val":5,"name":"已退款"}
                ]
            }
        }
    },
    filters: {
        eachEcho : function(vals, obj){
            var _this = this;
            var name = '';
            for( var i in _this.select[obj] ){
                if( vals == _this.select[obj][i].val ){
                    name = _this.select[obj][i].name;
                }
            }
            return name;
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
    },
    watch : {},
    methods : {
        _goPayPage : function(obj){
            var _this = this;
            _this.parentMsg.pay.totalPrice = _this.parentMsg.order.database.total_price;
            _this.parentMsg.pay.original_price = _this.parentMsg.order.database.original_price;
            _this.parentMsg.pay.onePrice = _this.parentMsg.order.database.unit_price;
            _this.parentMsg.pay.number = _this.parentMsg.order.database.number;
            _this.parentMsg.pay.img = _this.parentMsg.order.database.title_pic;
            _this.parentMsg.pay.title = _this.parentMsg.order.database.title;
            routerHref("pay");
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        if( !_this.parentMsg.order.database.order_no ){
            return backPage("order");
        }
        loaded();
        userLogin(function(){});
    }
})

//个人
var personal = Vue.extend({
    template : "#personal_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "database" : {},
                "avatarShow" : false,
                "is_manager" : "",
                "is_shopowner" : "",
            }
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
        eachLevel : function(val){
            var _this = this;
            var name = "";
            if( val ){
                if( 0 < val < 5 ){
                    name = "LV" + val + "代言人";
                } else if( 5 <= val < 10 ){
                    name = "LV" + val + "合伙人";
                } else {
                    name = "LV" + val + "联合创始人";
                }
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _getPersonal : function(){
            var _this = this;
            var data = {};
            var selectPower = sessionStorage.getItem("selectPower");
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                _this.base.avatarShow = true;
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    _this.parentMsg.personal.name = result.data.user.nickname;
                    _this.base.is_manager = result.data.user.is_manager;
                    _this.base.is_shopowner = result.data.user.is_shopowner;
                    _this.parentMsg.base.is_prolocutor = result.data.user.is_prolocutor;
                    if( !selectPower ){
                        if( result.data.user.is_clerk == 1 ){
                            sessionStorage.setItem("selectPower",3);
                        } else {
                            sessionStorage.setItem("selectPower",4);
                        }
                    }
                    sessionStorage.setItem("is_manager",result.data.user.is_manager);
                    sessionStorage.setItem("is_shopowner",result.data.user.is_shopowner);
                    sessionStorage.setItem("is_clerk",result.data.user.is_clerk);
                    sessionStorage.setItem("is_prolocutor",result.data.user.is_prolocutor);
                    _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.avatarShow = true;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _wechatShare:function () {
            var _this = this;
            var url;
            
            var host = window.location.href;
            // if( host.indexOf("%") > -1 ){
            //     host = host.split("%")[0];
            // }
            // alert(host +"\n\t"+window.location.href)
            $.ajax({
                async: false,
                cache:false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  host,
                                desc : _this.parentMsg.personal.name + "邀请您成为TA的代言人",
                                imgUrl: "http://www.zsb2b.com/ShareSpokesman/img/public/invatation.png",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    //"menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
            
        },
        _clearStorage : function(){
            sessionStorage.clear();
            alert(window.location.href);
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        var sharePage = sessionStorage.getItem("sharePage");
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( sharePage ){
                        sessionStorage.removeItem("sharePage");
                        return routerHref(sharePage);
                    }
                    _this._getPersonal();
                }
            },350)
        });
        
    }
});

//每日任务
var dailyTask = Vue.extend({
    template : "#dailyTask_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
            },
            "progress" : {
                "width" : 0,
                "num" : 0,
                "active" : 0,
                "side" : false,
                "signIn" : 0,
                "develop_user" : 0,
                "share" : 0,
                "forward" : 0,
                "complete_order" : 0,
                "developcount" : 0,
                "sharecount" : 0,
                "forwardcount" : 0,
                "completecount" : 0,
            }
        }
    },
    filters: {},
    watch : {
        "progress.num" : function(val){
            var _this = this;
            var timer = setInterval(function(){
                if( _this.progress.width <= val ){
                    var length = _this.progress.width ++;
                    $('.count_progress_img dd').width(length+'%');
                } else {
                    clearInterval(timer);
                }
            },10)
        },
    },
    methods : {
        _getTask : function(){
            var _this = this;
            var data = {};
            var time = moment().format('YYYY-MM-DD');
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.addtime = new Date(time).getTime() / 1000;
            var url = "http://www.zsb2b.com:8081/people_task/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                if( result.error_code == 0 ){
                    if( result.data.state == "success" ){
                        _this.progress.num = result.data._percent > 100 ? 100 : result.data._percent;
                        _this.progress.developcount = result.data.task_rule[0].developcount;
                        _this.progress.sharecount = result.data.task_rule[0].sharecount;
                        _this.progress.forwardcount = result.data.task_rule[0].forwardcount;
                        _this.progress.completecount = result.data.task_rule[0].completecount;
                        _this._updateTask(time,result.data.id);
                    } else if( result.data.state == "empty" ){
                        _this.progress.num = 0;
                        _this.progress.active = 0;
                        _this.progress.developcount = result.data.task_rule[0].developcount;
                        _this.progress.sharecount = result.data.task_rule[0].sharecount;
                        _this.progress.forwardcount = result.data.task_rule[0].forwardcount;
                        _this.progress.completecount = result.data.task_rule[0].completecount;
                    } else {
                        _this.progress.num = result.data._percent > 100 ? 100 : result.data._percent;
                        _this.progress.active = result.data._percent;
                        _this.progress.developcount = result.data.task_rule[0].developcount;
                        _this.progress.sharecount = result.data.task_rule[0].sharecount;
                        _this.progress.forwardcount = result.data.task_rule[0].forwardcount;
                        _this.progress.completecount = result.data.task_rule[0].completecount;
                        _this.progress.signIn = 1;
                        _this.progress.develop_user = result.data.develop_user;
                        _this.progress.share = result.data.share;
                        _this.progress.forward = result.data.forward;
                        _this.progress.complete_order = result.data.complete_order;
                    }
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.base.is_prolocutor = result.data[0].is_prolocutor;
                    _this._getTask();
                    
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _updateTask : function(time,oid){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.user_id = _this.parentMsg.base.user_id;
            data.token = _this.base.token;
            data.id = oid;
            data.task_type = 1;
            data.addtime = new Date(time).getTime() / 1000;
            var url = "http://www.zsb2b.com:8081/people_task/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(33,result)
                if( result.error_code == 0 ){
                    _this._getTask();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                _this.progress.side = true;
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getTask();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//个人资料
var personalDetail = Vue.extend({
    template : "#personalDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "level" : 1,
                "avatar" : "",
                "database" : {},
                "token" : "",
                "avatarShow" : false,
                "location" : {},
            },
            "phone" : {
                "show" : false,
                "name" : "",
                "realname" : "",
                "number" : "",
            }
        }
    },
    filters: {
        eachLevel : function(val,num){
            var _this = this;
            var name = "";
            if( val == num ){
                name = "LV_active";
            } else if( val > num ){
                name = "LV_over";
            }
            return name;
        },
        eachLocation : function(val,obj){
            var _this = this;
            var name = "";
            if( val ){
                name = val.replace(obj,"");
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _loadGrade : function(){
            var _this = this;
            grade = new IScroll('.personalDetail_lv', {
                probeType: 3,
                mouseWheel: true,
                scrollbars: false,
                fadeScrollbars: true,
                interactiveScrollbars: true,
                shrinkScrollbars: 'scale',
                useTransform: true,
                useTransition: true,
                bounce: true,
                freeScroll: false,
                scrollX:true,
                scrollY:false,
                startX: 0,
                startY: 0,
                preventDefault: false,
            });
        },
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.avatarShow = true;
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    _this.base.level = _this.base.database.user.user_level;
                    _this.base.avatar = _this.base.database.user.headimgurl;
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                    _this._getLocation();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.avatarShow = true;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _showEdit : function(){
            var _this = this;
            _this.phone.name = _this.base.database.user.nickname;
            _this.phone.realname = _this.base.database.user.realname;
            _this.phone.number = _this.base.database.user.mobile;
            _this.phone.show = true;
        },
        _editPhone : function(){//修改手机
            var _this = this;
            var demo = /^1(3|4|5|7|8)\d{9}$/;
            if( !_this.phone.name ){
                return layer.msg('昵称不能为空',{icon:0})
            }
            if( !_this.phone.number ){
                return layer.msg('手机号码不能为空',{icon:0});
            }
            if( !demo.test(_this.phone.number) ){
                return layer.msg('请输入正确的手机号码',{icon:0});
            }
            if( _this.phone.number == _this.base.database.user.mobile ){
                _this._editName();
            } else {
                var data = {};
                data.update = 2;
                data.token = _this.base.token;
                data.phone = _this.phone.number;
                var url = "http://www.zsb2b.com:8081/personnel/update";
                _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body; 
                    console.log(1,result)              
                    if( result.error_code == 0 ){
                        _this._editName();
                    } else if( result.error_code == 300 ){
                        sessionStorage.removeItem("token");
                        layer.msg(result.error_msg,{icon:0});
                        userLogin(function(){});
                    } else {
                        layer.msg(result.error_msg,{icon:0});
                    }
                }, function(response){
                    if( response.status == 408 ){
                        layer.msg(response.statusText,{icon:0});
                    } else {
                        layer.msg('出错了',{icon:2});
                    }
                });
            }
        },
        _editName : function(){//修改昵称
            var _this = this;
            var data = {};
            data.update = 1;
            data.token = _this.base.token;
            data.nickname = _this.phone.name;
            var url = "http://www.zsb2b.com:8081/personnel/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(2,result)               
                if( result.error_code == 0 ){
                    if( _this.phone.realname ){
                        _this._editRealName();
                    } else {
                        _this.phone.show = false;
                        layer.msg('修改成功',{icon:1});
                        _this._getPersonal();
                    }
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _editRealName : function(){
            var _this = this;
            var data = {};
            data.update = 4;
            data.token = _this.base.token;
            data.realname = _this.phone.realname;
            var url = "http://www.zsb2b.com:8081/personnel/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(2,result)               
                if( result.error_code == 0 ){
                    _this.phone.show = false;
                    layer.msg('修改成功',{icon:1});
                    _this._getPersonal();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _selectAvater : function(file){//选择图片
            var _this = this;
            console.log(file)
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:200
            })
            .then(function (rst) {
                // 处理成功会执行
                var img = new Image();
                img.src = rst.base64;
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this._editAvatar(result.data)
                    } else {
                        layer.msg(result.error_msg,{icon:0});
                    }
                }, function(response){
                    if( response.status == 408 ){
                        layer.msg(response.statusText,{icon:0});
                    } else {
                        layer.msg('出错了',{icon:2});
                    }
                });                                                                                     

                return rst;
            })
            .catch(function (err) {
                // 处理失败会执行
                layer.msg(err,{icon:2});
            })
            .always(function () {
                // 不管是成功失败，都会执行
                
            });
        },
        _editAvatar : function(imgurl){//修改头像
            var _this = this;
            var data = {};
            data.update = 3;
            data.token = _this.base.token;
            data.headimgurl = imgurl;
            var url = "http://www.zsb2b.com:8081/personnel/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(2,result)               
                if( result.error_code == 0 ){
                    layer.msg('修改成功',{icon:1});
                    _this.base.avatar = imgurl;
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getLocation : function(){
            var _this = this;
            var host = window.location.href;
            $.ajax({
                async: false,
                cache:false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            var initDefault = function(success, error){
                                var callback = function( add ){
                                    if( add.message === "query ok" && typeof add.result === "object" && typeof add.result.ad_info === "object" ){
                                        console.log(111,add);
                                        _this.base.location = add.result;
                                    }else{
                                        layer.msg("获取地址失败",{icon:0});
                                    }
                                }
                                wx.getLocation({
                                    type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
                                    success: function (res) {
                                        // res.latitude 纬度，浮点数，范围为90 ~ -90
                                        // res.longitude 经度，浮点数，范围为180 ~ -180。
                                        $.ajax({
                                            url: "http://apis.map.qq.com/ws/geocoder/v1?callback=?&output=jsonp",
                                            data: {
                                                location : res.latitude + "," + res.longitude,
                                                coord_type : 5, 
                                                key : "5XIBZ-DUQWD-CJC4S-HKJP7-YNPWZ-EPFD4",
                                            },
                                            type: "GET",
                                            crossDomain : true,
                                            dataType:'json',
                                            success : callback
                                        }); 
                                    },
                                });
                            }
                            initDefault(function(add, data){
                                console.log( "success", add );
                            })
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                _this._loadGrade();
                if( _this.base.token ){
                    _this._getPersonal();
                }
            },350)
        });
        
    }
});

//代言人
var poster = Vue.extend({
    template : "#poster_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "openid" : "",
                "ownData" : {},
                "ownShow" : true,
            },
            "title" : {
                "tabs" : 2,
            },
        }
    },
    filters: {
        eachRank : function(val){
            var _this = this;
            var name = "";
            if( val == 0 ){
                name = "first";
            } else if( val == 1 ){
                name = "second";
            } else if( val == 2 ){
                name = "third";
            }
            return name;
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "title.tabs" : function(val){
            var _this = this;
            if( val == 2 ){
                _this.base.ownShow = true;
            } else {
                _this.base.ownShow = false;
            }
            _this._getUserRank();
        },
    },
    methods : {
        _getUserRank : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.index = _this.title.tabs;
            var url = "http://www.zsb2b.com:8081/personnel/ranking";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data;
                    if( !_this.base.ownData.rank ){
                        _this._eachOwn();
                    }
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
                setTimeout(function(){
                    myScroll.refresh();
                },300)
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getUserRank();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _eachOwn : function(){
            var _this = this;
            for(var i=0;i<_this.base.dataList.length;i++){
                if( _this.parentMsg.base.openid == _this.base.dataList[i].openid ){
                    _this.base.ownData = _this.base.dataList[i];
                    _this.base.ownData.rank = (i + 1);
                }
            }
        },
        _setToken : function(token,oid){
            sessionStorage.setItem("posterToken",token);
            sessionStorage.setItem("posterId",oid)
            routerHref("posterDetail");
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getUserRank();
                    } else {
                        _this._getManagerId();
                    }
                }           
            },350)
        });
    }
});

//代言人资料
var posterDetail = Vue.extend({
    template : "#posterDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "posterToken" : "",
                "posterId" : "",
                "database" : {},
                "result" : {},
                "rank_price" : "",
                "rank_order" : "",
            },
            "title" : {
                "tabs" : "a",
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
        eachLevel : function(val){
            var _this = this;
            var name = "";
            if( val ){
                if( 0 < val < 5 ){
                    name = "LV" + val + "代言人";
                } else if( 5 <= val < 10 ){
                    name = "LV" + val + "合伙人";
                } else {
                    name = "LV" + val + "联合创始人";
                }
            }
            return name;
        },
        eachPercent : function(val){
            var _this = this;
            var name = 0;
            if( val ){
                name = Math.round(val);
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getPersonal();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getDetail : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.posterToken;
            var url = "http://www.zsb2b.com:8081/personnel/achievement";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(33,result)              
                if( result.error_code == 0 ){
                    _this.base.result = result.data[0];
                    // _this._getRank();
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.posterToken;
            var url = "http://www.zsb2b.com:8081/personnel/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                _this.base.avatarShow = true;
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    _this._getDetail();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.avatarShow = true;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getRank : function(){
            var _this = this;
            var data = {};
            data.pid = _this.parentMsg.base.user_id;
            data.guest_id = _this.base.posterId;
            var url = "http://www.zsb2b.com:8081/people/comprehensive_ranking";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(44,result)              
                if( result.error_code == 0 ){
                    _this.base.rank_price = result.data.rank_price;
                    _this.base.rank_order = result.data.rank_order;
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.posterToken = sessionStorage.getItem("posterToken");
        _this.base.posterId = sessionStorage.getItem("posterId");
        if( !_this.base.posterToken ){
            return goBack();
        }
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getPersonal();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//钱包
var wallet = Vue.extend({
    template : "#wallet_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "database" : {},
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {},
    methods : {
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getWallet();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getWallet : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.parentMsg.base.user_id;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/wallet/view";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getWallet();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
        
    }
});

//提现申请
var getcash = Vue.extend({
    template : "#getcash_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "number" : "",
                "type" : "",
                "amount" : 0,
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {},
    methods : {
        _subGetCash : function(){
            var _this = this;
            var data = {};
            var host = window.location.href;
            var hostTwo = window.location.href.split("#")[0] + "#!/" + "getCash/2";
            var fans_id = getURLParam("fans_id",host);
            if( !_this.base.number ){
                return layer.msg("请输入提现金额",{icon:0});
            }
            if( _this.base.number > _this.base.amount ){
                return layer.msg("余额不足",{icon:0});
            }
            if( _this.base.number < 1 || _this.base.number > 200 ){
                return layer.msg("每次提现金额不能小于1元且不能大于200元",{icon:0});
            }
            data.jump = hostTwo;
            data.fans_id = fans_id;
            data.amount = _this.base.number;
            data = parseParam( data );
            sessionStorage.setItem("subCash",_this.base.number);
            var url = "http://weixin.echao.com/app/index.php?i=4&c=entry&do=MemberOpenid&m=t_we_payment&notify=http%3A%2F%2Fwww.zsb2b.com%3A8081%2Fweixin_pay%2Fjhkj_pay_withdraw_cash_check&" + data;
            console.log(url)
            location.href = url;
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this.parentMsg.personal.name = result.data[0].nickname;
                    _this._getWallet();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getWallet : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.parentMsg.base.user_id;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/wallet/view";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.amount = result.data[0].amount;
                    if( _this.base.type == 2 ){
                        _this._subCashNews();
                    }
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _subCashNews : function(){
            var _this = this;
            var data = {};
            var subCash = sessionStorage.getItem("subCash");
            if( subCash ){
                sessionStorage.removeItem("subCash");
            }
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "提现申请";
            data.detailed = _this.parentMsg.personal.name + "申请提现" + subCash + "元";
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add_manager";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg("消息推送失败",{icon:0});
                } else {
                    layer.msg('消息推送失败',{icon:0});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.type = _this.$route.params.activity_type;
        loaded();
        userLogin(function(){
            if( _this.base.type == 2 ){
                layer.msg("提现申请已提交，请等待审核",{icon:1,time:1600});
                setTimeout(function(){
                    if( _this.base.token ){
                        if( _this.parentMsg.base.manager_id ){
                            _this._getWallet();
                        } else {
                            _this._getManagerId();
                        }
                    }
                },1600)
            } else {
                setTimeout(function(){
                    if( _this.base.token ){
                        if( _this.parentMsg.base.manager_id ){
                            _this._getWallet();
                        } else {
                            _this._getManagerId();
                        }
                    }
                },300)
            }
        });
    }
});

//消息
var message = Vue.extend({
    template : "#message_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "detailShow" : false,
                "delShow" : false,
                "detail" : "",
                "oid" : "",
            },
        }
    },
    filters: {
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
        eachTitle : function(val){
            var _this = this;
            var name = "";
            if( val ){
                if( val.length > 10 ){
                    name = val.substring(0,10) + "...";
                } else {
                    name = val;
                }
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getMessage();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getMessage : function(){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.pid = _this.parentMsg.base.user_id;
            var url = "http://www.zsb2b.com:8081/notice/get_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data;
                    setTimeout(function(){
                        myScroll.refresh();
                    },500)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _showDetail : function(obj,index){
            var _this = this;
            _this.base.oid = obj.id;
            if( obj.record_status == 1 ){
                _this.base.detail = obj.detailed;
                _this.base.detailShow = true;
            } else {
                var data = {};
                data.notice_id = obj.id;
                data.pid = _this.parentMsg.base.user_id;
                var url = "http://www.zsb2b.com:8081/notice/view";
                _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.detail = obj.detailed;
                    _this.base.detailShow = true;
                    _this.base.dataList[index].record_status = 1;
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
            }
        },
        _delMessage : function(){
            var _this = this;
            var data = {};
            data.pid = _this.parentMsg.base.user_id;
            var url = "http://www.zsb2b.com:8081/notice/delete";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;            
                if( result.error_code == 0 ){
                    layer.msg('删除成功',{icon:1});
                    _this.base.delShow = false;
                    _this._getMessage();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _delOneMessage : function(){
            var _this = this;
            var data = {};
            data.pid = _this.parentMsg.base.user_id;
            data.id = _this.base.oid;
            var url = "http://www.zsb2b.com:8081/notice/delete_one";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;            
                if( result.error_code == 0 ){
                    layer.msg('删除成功',{icon:1});
                    _this.base.detailShow = false;
                    _this._getMessage();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getMessage();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//质保单
var warranty = Vue.extend({
    template : "#warranty_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
            },
        }
    },
    filters: {
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {},
    methods : {
        _loaded : function(num){
            var _this = this;
            setTimeout(function(){
                myScroll = new IScroll('.wrapper', {
                    probeType: 3,        
                    mouseWheel: true, 
                    scrollbars: false, 
                    fadeScrollbars: true, 
                    interactiveScrollbars: true, 
                    shrinkScrollbars: 'scale', 
                    useTransform: true, 
                    useTransition: true, 
                    bounce: true, 
                    freeScroll: false, 
                    startX: 0,
                    startY: 0,
                    preventDefault: false,
                });
                if( num ){
                    myScroll.scrollTo(0,num);
                }
                myScroll.on('scroll',function(){
                    var num = _this.base.maxLength - myScroll.y;
                    var size = _this.base.page * 10;
                    var length = _this.base.dataList.length;
                    if( length >= size ){
                        if( num > 30 ){                        
                            if( _this.base.text != "松开加载更多" ){
                                _this.base.text = "上拉加载更多";
                            }
                        }
                        if ( num > 88 ){
                            _this.base.text = "松开加载更多";
                            _this.base.onoff = true;
                            var num = myScroll.y;
                            myScroll.refresh();
                            myScroll.scrollTo(0,num)
                        }
                    } else {
                        if( myScroll.y < _this.base.maxLength ){
                            _this.base.text = "已经是最后一页了";
                        }
                    }
                });
                myScroll.on('scrollEnd',function(){
                    _this.base.nowY = myScroll.y;
                    _this.base.text = "";
                    var size = _this.base.page * 10;
                    var length = _this.base.dataList.length;
                    if( length == size ){
                        var num = _this.base.maxLength - myScroll.y;
                        if( num > 40 ){
                            _this.base.text = "正在加载中";
                            _this.base.page ++;
                            _this._getPromotion();
                        }
                    }
                })
            },500)
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getWarranty();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getWarranty : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.pid = _this.parentMsg.base.user_id;
            data.pagesize = pagesize;
            data.currentpage = 0;
            var url = "http://www.zsb2b.com:8081/policy/get_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data.list;
                    setTimeout(function(){
                        myScroll.refresh();
                        _this.base.maxLength = myScroll.maxScrollY;
                    },500)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.onoff = false;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goWarrantyDetail : function(obj){
            var _this = this;
            var shop = JSON.parse(obj.shop);
            var host = window.location.href;
            var data = obj.order_no + ',' + obj.policy_number + ',' + '-' + ',' + obj.selling_time + ',' + obj.real_name + ',' + obj.mobile + ',' + "-" + ',' + '-' + ',' + obj.order_title + ',' + '-' + ',' + obj.original_price + ',' + obj.amount + ',' + obj.gd_image + ',' + obj.remark + ',' + obj.amount_capital + ',' + obj.shop_name + ',' + obj.shop_address + ',' + obj.autograph + ',' + shop.inc_logo + ',' + shop.inc_cachet;
            sessionStorage.setItem("warrantyData",data);
            location.href = "warranty/warranty.html?" + host.split("?")[1];
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this._loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getWarranty();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//切换
var userChange = Vue.extend({
    template : "#userChange_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "power" : 0,
                "is_manager" : "",
                "is_shopowner" : "",
                "is_clerk" : "",
            },
            "select" : {
                "power" : [
                    {"val":1,"name":"老板"}
                    ,{"val":2,"name":"店长"}
                    ,{"val":3,"name":"店员"}
                    ,{"val":4,"name":"代言人"}
                ]
            },
        }
    },
    filters: {
        eachEcho : function(vals, obj){
            var _this = this;
            var name = '';
            for( var i in _this.select[obj] ){
                if( vals == _this.select[obj][i].val ){
                    name = _this.select[obj][i].name;
                }
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _goBossPage : function(){
            var _this = this;
            $("#loading").show();
            var host = window.location.href.split("?")[1];
            _this.base.power = 1;
            location.href = "boss/index.html?" + host.split("#!/")[0];
        },
        _goShopPage : function(){
            var _this = this;
            $("#loading").show();
            var host = window.location.href.split("?")[1];
            _this.base.power = 2;
            location.href = "shopkeeper/index.html?" + host.split("#!/")[0];
        },
        _backPersonal : function(val){
            var _this = this;
            if( _this.base.power != val ){
                sessionStorage.setItem("selectPower",val);
                _this.base.power = val;
                backPage("personal");
            }
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.is_manager = sessionStorage.getItem("is_manager");
        _this.base.is_shopowner = sessionStorage.getItem("is_shopowner");
        _this.base.is_clerk = sessionStorage.getItem("is_clerk");
        _this.base.power = sessionStorage.getItem("selectPower");
        if( !_this.base.is_manager && !_this.base.is_shopowner ){
            return goBack();
        }
        loaded();
        userLogin(function(){});
    }
});

//提现记录
var getCashDetail = Vue.extend({
    template : "#getCashDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "delShow" : false,
                "status" : 0,
                "dataList" : [],
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
            }
        }
    },
    filters: {
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
    },
    watch : {
        "base.status" : function(val){
            var _this = this;
            _this._getCashList();
        },
    },
    methods : {
        _loaded : function(num){
            var _this = this;
            myScroll = new IScroll('.wrapper', {
                probeType: 3,        
                mouseWheel: true, 
                scrollbars: false, 
                fadeScrollbars: true, 
                interactiveScrollbars: true, 
                shrinkScrollbars: 'scale', 
                useTransform: true, 
                useTransition: true, 
                bounce: true, 
                freeScroll: false, 
                startX: 0,
                startY: 0,
                preventDefault: false,
            });
            if( num ){
                myScroll.scrollTo(0,num);
            }
            myScroll.on('scroll',function(){
                var num = _this.base.maxLength - myScroll.y;
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length >= size ){
                    if( num > 30 ){                        
                        if( _this.base.text != "松开加载更多" ){
                            _this.base.text = "上拉加载更多";
                        }
                    }
                    if ( num > 88 ){
                        _this.base.text = "松开加载更多";
                        _this.base.onoff = true;
                        var num = myScroll.y;
                        myScroll.refresh();
                        myScroll.scrollTo(0,num)
                    }
                } else {
                    if( myScroll.y < _this.base.maxLength ){
                        _this.base.text = "已经是最后一页了";
                    }
                }
            });
            myScroll.on('scrollEnd',function(){
                _this.base.nowY = myScroll.y;
                _this.base.text = "";
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length == size ){
                    var num = _this.base.maxLength - myScroll.y;
                    if( num > 40 ){
                        _this.base.text = "正在加载中";
                        _this.base.page ++;
                        _this._getCashList();
                    }
                }
            })
        },
        _getCashList : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.spokesman_id = _this.parentMsg.base.user_id;
            data.status = _this.base.status;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/tixian/list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data.list;
                    setTimeout(function(){
                        myScroll.refresh();
                        _this.base.maxLength = myScroll.maxScrollY;
                    },500)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.onoff = false;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getCashList();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._loaded();
                    if( _this.parentMsg.base.manager_id ){
                        _this._getCashList();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});

//钱包明细
var walletDetail = Vue.extend({
    template : "#walletDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "delShow" : false,
                "dataList" : [],
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
            }
        }
    },
    filters: {
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
        eachTwo : function(x){
            var f = parseFloat(x);
            if (isNaN(f)) {
                return "0.00";
            }
            var f = Math.round(x*100)/100;
            var s = f.toString();
            var rs = s.indexOf('.');
            if (rs < 0) {
                rs = s.length;
                s += '.';
            }
            while (s.length <= rs + 2) {
                s += '0';
            }
            return s;
        },
        eachType : function(val){
            var _this = this;
            var name = "";
            if( val ){
                if( val == 1 ){
                    name = "分享";
                } else if( val == 2 ){
                    name = "转发";
                } else if( val == 3 ){
                    name = "浏览";
                } else if( val == 4 ){
                    name = "充值";
                } else if( val == 5 ){
                    name = "订单";
                } else if( val == 6 ){
                    name = "佣金";
                }
            }
            return name;
        },
        cutDate : function(val){
            var _this = this;
            var name = "";
            if(val){
                name = val.split(" ")[0];
            }
            return name;
        },
    },
    watch : {},
    methods : {
        _loaded : function(num){
            var _this = this;
            myScroll = new IScroll('.wrapper', {
                probeType: 3,        
                mouseWheel: true, 
                scrollbars: false, 
                fadeScrollbars: true, 
                interactiveScrollbars: true, 
                shrinkScrollbars: 'scale', 
                useTransform: true, 
                useTransition: true, 
                bounce: true, 
                freeScroll: false, 
                startX: 0,
                startY: 0,
                preventDefault: false,
            });
            if( num ){
                myScroll.scrollTo(0,num);
            }
            myScroll.on('scroll',function(){
                var num = _this.base.maxLength - myScroll.y;
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length >= size ){
                    if( num > 30 ){                        
                        if( _this.base.text != "松开加载更多" ){
                            _this.base.text = "上拉加载更多";
                        }
                    }
                    if ( num > 88 ){
                        _this.base.text = "松开加载更多";
                        _this.base.onoff = true;
                        var num = myScroll.y;
                        myScroll.refresh();
                        myScroll.scrollTo(0,num)
                    }
                } else {
                    if( myScroll.y < _this.base.maxLength ){
                        _this.base.text = "已经是最后一页了";
                    }
                }
            });
            myScroll.on('scrollEnd',function(){
                _this.base.nowY = myScroll.y;
                _this.base.text = "";
                var size = _this.base.page * 10;
                var length = _this.base.dataList.length;
                if( length == size ){
                    var num = _this.base.maxLength - myScroll.y;
                    if( num > 40 ){
                        _this.base.text = "正在加载中";
                        _this.base.page ++;
                        _this._getWalletDetail();
                    }
                }
            })
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getWalletDetail();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getWalletDetail : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.id = _this.parentMsg.base.user_id;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/wallet/profit_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data.list;
                    setTimeout(function(){
                        myScroll.refresh();
                        _this.base.maxLength = myScroll.maxScrollY;
                    },500)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.onoff = false;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        userLogin(function(){
            setTimeout(function(){
                _this._loaded();
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getWalletDetail();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});

//404
var error = Vue.extend({
    template : "#error_page",
    props: ['parent'],
    data : function(){
        return {}
    },
    filters: {},
    watch : {},
    methods : {},
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
    }
});

//邀请
var invite = Vue.extend({
    template : "#invite_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "share" : false,
                "reload" : true,
            },
        }
    },
    filters: {},
    watch : {},
    methods : {
        _wechatShare:function () {
            var _this = this;
            var url;           
            var host = window.location.href;
            var hostTwo = window.location.href.split('#')[0] + "#!/join";
            // host = host + "&page=join";
            $.ajax({
                async: false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( hostTwo ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  hostTwo,
                                desc : _this.parentMsg.personal.name + "邀请您成为TA的代言人，为店铺代言，粉丝即渠道，社交分享赚佣金，顾客购买赚佣金，推广传播赚佣金，让您的每个操作产生价值！",
                                imgUrl: "http://www.zsb2b.com/ShareSpokesman/img/public/invatation.png",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    "menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
            
        },
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result);
                _this.base.avatarShow = true;
                if( result.error_code == 0 ){
                    _this.parentMsg.personal.name = result.data.user.nickname;
                    _this._wechatShare();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                _this.base.avatarShow = true;
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        userLogin(function(){
            setTimeout(function(){
                wx.ready(function(){
                    if( !_this.parentMsg.personal.name ){
                        _this._getPersonal();
                    } else {
                        _this._wechatShare();
                    }
                })
            },300)
        });
    }
});

//加入
var join = Vue.extend({
    template : "#join_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "is_prolocutor" : "",
            },
            "info" : {
                "name" : "",
                "mobile" : "",
            },
        }
    },
    filters: {},
    watch : {},
    methods : {
        _joinShare : function(){
            var _this = this;
            var error = {};
            error.name = [/.{2,}/ , '请输入正确的姓名'];
            error.mobile =  [ /^1(3|4|5|7|8)\d{9}$/ , "请输入正确的手机号码" ];
            for(var i in error){
                if( !error[i][0].test( _this.info[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            _this._editPhone();
        },
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._wechatShare();
                    if( result.data[0].is_prolocutor == 1 ){
                        routerHref("personal");
                    }
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _editPhone : function(){//修改手机
            var _this = this;
            var data = {};
            data.update = 2;
            data.token = _this.base.token;
            data.phone = _this.info.mobile;
            var url = "http://www.zsb2b.com:8081/personnel/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;              
                if( result.error_code == 0 ){
                    _this._editName();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _editName : function(){//修改昵称
            var _this = this;
            var data = {};
            data.update = 1;
            data.token = _this.base.token;
            data.nickname = _this.info.name;
            var url = "http://www.zsb2b.com:8081/personnel/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;              
                if( result.error_code == 0 ){
                    routerHref("personal");
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _wechatShare:function () {
            var _this = this;
            var url;
            
            var host = window.location.href;
            $.ajax({
                async: false,
                cache:false,
                url: "http://weixin.echao.com/api/jssdk_access.php",
                data: { url: encodeURIComponent( host ) },
                type: "GET",
                dataType: "json",
                success: function(data){
                    if( data && data.status ){
                        var wxConfig = data.info || {};
                        wxConfig.debug = false;
                        wxConfig.jsApiList = ['checkJsApi','onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareWeibo','onMenuShareQZone','hideMenuItems','showMenuItems','hideAllNonBaseMenuItem','showAllNonBaseMenuItem','translateVoice','startRecord','stopRecord','onVoiceRecordEnd','playVoice','onVoicePlayEnd','pauseVoice','stopVoice','uploadVoice','downloadVoice','chooseImage','previewImage','uploadImage','downloadImage','getNetworkType','openLocation','getLocation','hideOptionMenu','showOptionMenu','closeWindow','scanQRCode','chooseWXPay','openProductSpecificView','addCard','chooseCard','openCard'];
                        wx.config( wxConfig );
                        wx.ready(function () {
                            sharedata = {
                                title : "合伙人",
                                link :  host,
                                desc : _this.parentMsg.personal.name + "邀请您成为TA的代言人",
                                imgUrl: "http://www.zsb2b.com/ShareSpokesman/img/public/invatation.png",
                                success: function( d ){
                                    console.log(22222,d)
                                },
                                cancel: function(){
                                }
                            };
                            wx.onMenuShareAppMessage(sharedata);
                            wx.onMenuShareTimeline(sharedata);
                            wx.onMenuShareQQ(sharedata);
                            wx.onMenuShareWeibo(sharedata);
                            wx.hideMenuItems({
                                menuList: [
                                   /* "menuItem:share:timeline",//分享到朋友圈
                                    "menuItem:share:weiboApp",//分享到Weibo*/
                                    "menuItem:share:qq",//分享到QQ
                                    "menuItem:share:facebook",//分享到FB
                                    "menuItem:share:QZone",//分享到 QQ 空间
                                    //"menuItem:copyUrl",//复制链接
                                    "menuItem:originPage",//原网页
                                    "menuItem:readMode",//阅读模式
                                    "menuItem:openWithQQBrowser",//在QQ浏览器中打开
                                    "menuItem:openWithSafari",//在Safari中打开
                                    "menuItem:share:email",//邮件
                                    "menuItem:share:brand",//一些特殊公众号
                                ]
                            });
                        });
                    }
                },
                error: function(){
                    layer.msg("出错了",{icon:2});
                }
            })
            
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        userLogin(function(){
            setTimeout(function(){
                _this._getManagerId();
            },320)
        });
    }
});

//搜索
var search = Vue.extend({
    template : "#search_page",
    props: ['parent'],
    data : function(){
        return {
            "base" : {
                "delShow" : false,
                "token" : "",
                "type" : "",
                "dataList" : [],
            },
            "search" : {
                "info" : "",
            },
        }
    },
    filters: {},
    watch : {},
    methods : {
        _getManagerId : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/personnel/user_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.parentMsg.base.manager_id = result.data[0].manager_id;
                    _this.parentMsg.base.user_id = result.data[0].id;
                    _this.parentMsg.base.openid = result.data[0].openid;
                    _this.parentMsg.base.clerk_id = result.data[0].clerk_id;
                    _this.parentMsg.base.shopowner_id = result.data[0].shopowner_id;
                    _this.parentMsg.base.prolocutor_id = result.data[0].prolocutor_id;
                    _this._getSearch();
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _getSearch : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.pid = _this.parentMsg.base.user_id;
            data.type = _this.base.type;
            var url = "http://www.zsb2b.com:8081/search/search_log_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(11,result)
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data;
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
                setTimeout(function(){
                    myScroll.refresh();
                },300)
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goSearch : function(){
            var _this = this;
            if( !_this.search.info ){
                return;
            }
            if( _this.base.type == 1 ){
                sessionStorage.setItem("param_text",_this.search.info);
                routerHref("order");
            } else if( _this.base.type == 2 ){
                sessionStorage.setItem("param_text",_this.search.info);
                routerHref("promotion");
            }
        },
        _delSearch : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.pid = _this.parentMsg.base.user_id;
            data.type = _this.base.type;
            var url = "http://www.zsb2b.com:8081/search/search_log_delete";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.base.delShow = false;
                    _this.base.dataList = [];
                    layer.msg("删除成功",{icon:1});
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                } else if( result.error_code == 300 ){
                    sessionStorage.removeItem("token");
                    layer.msg(result.error_msg,{icon:0});
                    userLogin(function(){});
                } else {
                    layer.msg(result.error_msg,{icon:0});
                }
                setTimeout(function(){
                    myScroll.refresh();
                },300)
            }, function(response){
                if( response.status == 408 ){
                    layer.msg(response.statusText,{icon:0});
                } else {
                    layer.msg('出错了',{icon:2});
                }
            });
        },
        _goHistory : function(info){
            var _this = this;
            _this.search.info = info;
            _this._goSearch();
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.type = _this.$route.params.type;
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getSearch();
                    } else {
                        _this._getManagerId();
                    }
                }           
            },350)
        });
    }
});

//通用设置**
App = Vue.extend({
    data : function(){
        return {            
            "parentMsg" : {
                "base" : {
                    "user_id" : "",
                    "manager_id" : "",
                    "openid" : "",
                    "clerk_id" : "",
                    "shopowner_id" : "",
                    "prolocutor_id" : "",
                    "is_prolocutor" : "",
                },
                "promotion" : {
                    "database" : {},
                },
                "order" : {
                    "database" : {},
                    "pay_status" : "",
                },
                "personal" : {
                    "name" : "",
                },
                "pay" : {
                    "database" : {},
                    "totalPrice" : "",
                    "original_price" : "",
                    "onePrice" : "",
                    "number" : "",
                    "img" : "",
                    "title" : "",
                },
            }
        }
    },
    watch : {},
    methods : {},
    ready : function(){
        var _this = this;
        $('.hideDiv').show();
    }
})

router.beforeEach(function(transition){
    if( router.back ){
        $('#styleBox').html(cssBox);
    } else {
        $('#styleBox').html('');
    }
    router.back = false;
    transition.next();
});

router.map({
    '/count': {
        component: count,
    },
    '/signIn': {
        component: signIn,
    },
    '/promotion':{
        component:promotion,
    },
    '/promotionDetail/:activity_type/:activity_id':{
        name:'promotionDetail',
        component:promotionDetail,
    },
    '/productDetail/:activity_type/:activity_id':{
        name:'productDetail',
        component:productDetail,
    },
    '/pay/:activity_type/':{
        name : "pay",
        component:pay,
    },
    '/order': {
        component: order,
    },
    '/orderDetail': {
        component: orderDetail,
    },
    '/personal': {
        component: personal,
    },
    '/dailyTask': {
        component: dailyTask,
    },
    '/personalDetail': {
        component: personalDetail,
    },
    '/poster': {
        component: poster,
    },
    '/posterDetail': {
        component: posterDetail,
    },
    '/wallet':{
        component:wallet,
    },
    '/getCash/:activity_type':{
        name : "getCash",
        component:getcash,
    },
    '/message':{
        component:message,
    },
    '/warranty':{
        component:warranty,
    },
    '/userChange':{
        component:userChange,
    },
    '/getCashDetail':{
        component:getCashDetail,
    },
    '/error':{
        component:error,
    },
    '/walletDetail':{
        component:walletDetail,
    },
    '/search/:type':{
        name:'search',
        component:search,
    },
    '/invite':{
        component:invite,
    },
    '/join':{
        component:join,
    },
    '/promotionOther':{
        component:promotionOther,
    },
})

router.redirect({
    '/': '/personal'
})

//左滑切入
function routerHref(href){
    router.go({path : '/' + href});
}
function routerHrefId(href,type,oid){
    if( oid ){
        router.go({name : href,params : {activity_type:type,activity_id:oid}});
    } else {
        router.go({name : href,params : {activity_type:type}});
    }
}
function routerSearch(type){
    router.go({name : "search",params : {type:type}});
}
//返回上一步
function goBack(){
    router.back = true;
    window.history.go(-1);  
}
//右滑切入
function backPage(page){
    router.back = true;
    setTimeout(function(){
        router.go({path : '/' + page});
    },0)
}
//保留两位小数
function toDecimal2(x) {
    var f = parseFloat(x);
    if (isNaN(f)) {
        return false;
    }
    var f = Math.round(x*100)/100;
    var s = f.toString();
    var rs = s.indexOf('.');
    if (rs < 0) {
        rs = s.length;
        s += '.';
    }
    while (s.length <= rs + 2) {
        s += '0';
    }
    return s;
}
//日期转换
function formatDate(date, format) {   
    if (!date) return;   
    if (!format) format = "yyyy-MM-dd";   
    switch(typeof date) {   
        case "string":   
            date = new Date(date.replace(/-/, "/"));   
            break;   
        case "number":   
            date = new Date(date);   
            break;   
    }    
    if (!date instanceof Date) return;   
    var dict = {   
        "yyyy": date.getFullYear(),   
        "M": date.getMonth() + 1,   
        "d": date.getDate(),   
        "H": date.getHours(),   
        "m": date.getMinutes(),   
        "s": date.getSeconds(),   
        "MM": ("" + (date.getMonth() + 101)).substr(1),   
        "dd": ("" + (date.getDate() + 100)).substr(1),   
        "HH": ("" + (date.getHours() + 100)).substr(1),   
        "mm": ("" + (date.getMinutes() + 100)).substr(1),   
        "ss": ("" + (date.getSeconds() + 100)).substr(1)   
    };       
    return format.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function() {   
        return dict[arguments[0]];   
    });                   
}
//去空格
function Trim(str){
    return str.replace(/(^\s*)|(\s*$)/g, "");
}
//清除连带关系
function cloneObject(myObj){
    if(typeof(myObj) != 'object' || myObj == null){ return myObj; }
    var newObj = Object.prototype.toString.call(myObj) === "[object Array]" ? new Array() : new Object();
    for(var i in myObj){
        newObj[i] = this.cloneObject(myObj[i]);
    }
    return newObj;
}
//用户登录
// function userLogin(callback){
//     var oldUrl = window.location.href;
//     // return console.log(222,oldUrl)
//     var p = {};
//     var fans_id = getURLParam("fans_id",oldUrl);
//     var manager_id = getURLParam("manager_id",oldUrl);
//     if( !fans_id && !manager_id ){
//         return routerHref("error");
//     }
//     // var shareurl = oldUrl.split("?")[0] + "?" + "fans_id=" + fans_id;
//     // if( source_fans_id ){
//     //     shareurl = shareurl + "&source_fans_id=" + source_fans_id;
//     // }
//     // if( getURLParam("from",oldUrl.split("#!/")[0]) || getURLParam("isappinstalled",oldUrl.split("#!/")[0]) ){
//     //     return location.href = shareurl;
//     // }

    // if( getURLParam("from",oldUrl.split("#!/")[0]) ){
    //     shareurl = delUrlParam(oldUrl.split("#!/")[0],"from");
    //     return location.href = shareurl + "#!/" + oldUrl.split("#!/")[1];
    // }
    // if( getURLParam("isappinstalled",oldUrl.split("#!/")[0]) ){
    //     shareurl = delUrlParam(oldUrl.split("#!/")[0],"isappinstalled");
    //     console.log(111,shareurl)
    //     console.log(222,oldUrl.split("#!/")[1])
    //     return location.href = shareurl;
    // }
//     var token = sessionStorage.getItem("token");//查找本地是否有token
//     if( token ){
//         if( !getURLParam("token",oldUrl) ){
//             return callback();
//         } else {//清除掉地址栏中的token,保存到本地，刷新页面
//             var hrefUrl = delUrlParam(oldUrl,"token");
//             return window.location.href = hrefUrl;
//         }
//     } else {
//         if( !getURLParam("token",oldUrl) ){
    
//             if( fans_id && fans_id.indexOf("#!") > -1 ){
//                 fans_id = fans_id.split("#")[0];
//             }
//             if( manager_id && manager_id.indexOf("#!") > -1 ){
//                 manager_id = manager_id.split("#")[0];
//             }
//             if( !fans_id && !manager_id ){
//                 return routerHref("error");
//             } else if ( !fans_id && manager_id ){
//                 p.manager_id = manager_id;
//             } else if ( !manager_id && fans_id ){
//                 p.fans_id = fans_id;
//             } else if( fans_id && manager_id ){
//                 p.manager_id = manager_id;
//                 p.fans_id = fans_id;
//             }
//             // p.url = oldUrl.split("?")[0] + "?" + oldUrl.split("?")[1];
//             p.url = oldUrl;
//             p = parseParam(p);
//             return window.location.href = 'http://weixin.echao.com/app/index.php?i=4&c=entry&do=silence&m=simp_fans&'+p;
//         } else {//清除掉地址栏中的token,保存到本地，刷新页面
//             sessionStorage.setItem("token",getURLParam("token",window.location.href));
//             if( oldUrl.indexOf("%") > -1 ){
//                 oldUrl = oldUrl.split("%")[0];
//                 return window.location.href = oldUrl;
//             }
//             return window.location.href = delUrlParam(oldUrl,"token");
//         }
//     }
//     return callback();
// }
function userLogin(callback){
    var host = window.location.href;
    if( host.indexOf("invite") > -1 ){
        host = host.replace("invite","join");
    }
    var token = sessionStorage.getItem("token");
    if( token ){
        return callback();
    } else {
        var data = {};
        var fans_id = getURLParam("fans_id",host);
        var manager_id = getURLParam("manager_id",host);
        if( fans_id && fans_id.indexOf("#!") > -1 ){
            fans_id = fans_id.split("#")[0];
        }
        if( manager_id && manager_id.indexOf("#!") > -1 ){
            manager_id = manager_id.split("#")[0];
        }
        if( !fans_id && !manager_id ){
            return routerHref("error");
        } else if ( !fans_id && manager_id ){
            data.manager_id = manager_id;
        } else if ( !manager_id && fans_id ){
            data.fans_id = fans_id;
        } else if( fans_id && manager_id ){
            data.manager_id = manager_id;
            data.fans_id = fans_id;
        }
        data.url = host;
        data = parseParam(data);
        return window.location.href = 'http://ssm.echao.com:8081/fans/auth?'+data;
    }
}
//查找地址中的参数
function getURLParam(strParamName, url) {
    var strReturn = "";
    var strHref = url.toLowerCase();
    if (strHref.indexOf("?") > -1) {
        var strQueryString = strHref.substr(strHref.indexOf("?") + 1).toLowerCase();
        var aQueryString = strQueryString.split("&");
        for (var iParam = 0; iParam < aQueryString.length; iParam++) {
            if (aQueryString[iParam].indexOf(strParamName.toLowerCase() + "=") > -1) {
                var aParam = aQueryString[iParam].split("=");
                strReturn = aParam[1];
                if( strReturn.indexOf("#!") > -1 ){
                    strReturn = strReturn.split("#")[0];
                }
                break;
            }
        }
    }
    return strReturn;
}
function getURLParamTwo(strParamName, url) {
    var strReturn = "";
    var strHref = url;
    if (strHref.indexOf("?") > -1) {
        var strQueryString = strHref.substr(strHref.indexOf("?") + 1);
        var aQueryString = strQueryString.split("&");
        for (var iParam = 0; iParam < aQueryString.length; iParam++) {
            if (aQueryString[iParam].indexOf(strParamName + "=") > -1) {
                var aParam = aQueryString[iParam].split("=");
                strReturn = aParam[1];
                if( strReturn.indexOf("#!") > -1 ){
                    strReturn = strReturn.split("#")[0];
                }
                break;
            }
        }
    }
    return strReturn;
}
//清除地址栏中的指定的参数key及其对应的value
function delUrlParam(url, key) {
    var str = "";
    if (url.indexOf('?') != -1) {
        str = url.substr(url.indexOf('?') + 1);
    }
    else {
        return url;
    }
    var arr = "";
    var returnurl = "";
    var setparam = "";
    if (str.indexOf('&') != -1) {
        arr = str.split('&');
        for (i in arr) {
            if (arr[i].split('=')[0] != key) {
                returnurl = returnurl + arr[i].split('=')[0] + "=" + arr[i].split('=')[1] + "&";
            }
        }
        return url.substr(0, url.indexOf('?')) + "?" + returnurl.substr(0, returnurl.length - 1);
    }
    else {
        arr = str.split('=');
        if (arr[0] == key) {
            return url.substr(0, url.indexOf('?'));
        }
        else {
            return url;
        }
    }
}
//将JSON对象转化为url参数
function parseParam(param, key) {
    var paramStr = "";
    if (param instanceof String || param instanceof Number || param instanceof Boolean) {
        paramStr += "&" + key + "=" + encodeURIComponent(param);//URL编码
    } else {
        $.each(param, function(i) {
            var k = key == null ? i : key + (param instanceof Array ? "[" + i + "]" : "." + i);
            paramStr += '&' + parseParam(this, k);
        });
    }
    return paramStr.substr(1);
};

// 日历
function newCalendar(set_date){
    moment.locale('zh-cn', { weekdaysMin : [ "日", "一", "二", "三", "四", "五", "六" ] });
    moment.locale('zh-cn');
    var daysArr   = [[], [], [], [], [], []]; // 6*7的日历数组
    var weekdays  = moment.weekdaysMin();// 取出星期
    var nowDay    = moment().format('YYYY-MM-DD');// 当天
    var nowDate   = moment(set_date);// 解析时间 ( 指定月份 )
    var frontDate = moment(set_date).subtract(1, 'month');// 解析时间 ( 上月 )
    var afterDate = moment(set_date).add(1, 'month');// 解析时间 ( 下月 )

    var currentMonthDays  = nowDate.daysInMonth(); // 当前指定月份天数
    var currentWeekday    = nowDate.date(1).weekday(); // 当前指定月份1日为星期几
    var nowMonth          = nowDate.format('YYYY-MM');// 当前指定月份
    var lastMonthDays     = frontDate.daysInMonth(); // 上月天数
    var frontMonth        = frontDate.format('YYYY-MM');// 上月月份
    var afterMonth        = afterDate.format('YYYY-MM');// 下月月份

    function getDay( day ){
        var ret = {};
        if( day <= lastMonthDays ){
            ret.day = day;
            ret.date = frontMonth +'-'+ ( '00'+day ).slice(-2);
            ret.month = '';// 非当前月
        }else if( day <= (lastMonthDays + currentMonthDays) ){
            ret.day = day - lastMonthDays;
            ret.date = nowMonth +'-'+ ( '00'+ret.day ).slice(-2);
            ret.month = 'current';// 当前月
            ret.nowDay = ret.date == nowDay;// 是否当天
        }else{
            ret.day = day - (lastMonthDays + currentMonthDays);
            ret.date = afterMonth +'-'+ ( '00'+ret.day ).slice(-2);
            ret.month = '';// 非当前月
        }
        return ret;
    }
    for (var i = 0; i < 7; i += 1) {
        var virtualDay = (lastMonthDays - currentWeekday+1) + i;
        for (var j = 0; j < 6; j += 1) {
            daysArr[j][i] = getDay(virtualDay + (j * 7));
        }
    }
    return {
        weekdays: weekdays,
        data: daysArr
    };
}
// 获取日期
function getNowDate(num){
    var name;
    var date = new Date();
    var seperator1 = "-";
    var month = date.getMonth() + 1;
    var strDate = date.getDate() + num;
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    name = date.getFullYear() + seperator1 + month + seperator1 + strDate;
    return name;
}
