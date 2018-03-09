
var App,myScroll;
var router = new VueRouter();
router.back = false;
var cssBox = ".pageRight-enter{transform: translateX(-100%);-webkit-transform: translateX(-100%);}.pageRight-leave{transform: translateX(100%);-webkit-transform: translateX(100%);}";

Vue.http.interceptors.push(function(request, next) {
    var timeout;
    $('#loading').show();
    if (request._timeout) {
        timeout = setTimeout(function(){
            next(request.respondWith(request.body, {
                 status: 408,
                 statusText: '请求超时'
            }));
        },request._timeout)
    }
    next(function(response) {
        $('#loading').hide();
        return response;
    })
})
Vue.http.options._timeout = 10000;

//统计
var count = Vue.extend({
    template : "#count_page",
    props: ['parent'],
    data : function(){
        return {
			"parentMsg" : {},
            "base" : {
                "token" : "",
                "activity" : {},
                "order" : {},
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
                    _this._getOrderCount();
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
        _getActivity : function(){
            var _this = this;
            var data = {};
            // data.boss_id = _this.parentMsg.base.manager_id;
            // data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/activity_all/get_shopowner_num";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.activity = result.data;
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
        _getOrderCount : function(){
            var _this = this;
            var data = {};
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/shopowner/statistics";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(12,result)              
                if( result.error_code == 0 ){
                    _this.base.order = result.data;
                    _this._getActivity();
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
        _alertShow : function(){
            layer.msg("即将开放，敬请期待",{icon:0});
        },
        _goProduct : function(){
            var _this = this;
            sessionStorage.setItem("productBack","count");
            routerHref('manageProduct');
        },
    },
    ready : function(){
        var _this = this;
		_this.parentMsg = _this.parent;
		_this.parentMsg.personal.managePerson.title='b';
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getOrderCount();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});
//统计——代言人排名
var spokesmanRanking = Vue.extend({
    template : "#spokesmanRanking_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "database":{},
            },
            "title":{
                "tabs":'b',
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
                    _this._getRanking(0);
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
        _getRanking:function(i){
            var _this = this;
            _this.title.tabs= i==0?'b':'c';
            _this.base.database={};
            var data = {};
            data.token = _this.base.token;
            data.status= i; //0为1个月，1为全部累计
            data.shopowner_id=_this.parentMsg.base.shopowner_id;
            var url = "http://www.zsb2b.com:8081/shopowner_personnel/ranking";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
					setTimeout(function(){
						myScroll.refresh();
					},300);
                    console.log('排行榜 base.database');
                    console.log(_this.base.database);
                }else {
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
        _gotoDataInfoPage:function(i){
            var _this=this;
            routerHref("dataInfo");
            _this.parentMsg.personal.managePerson.currentStaffId=i;
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function () {
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.shopowner_id ){
                        _this._getRanking(0);
                    } else {
                        _this._getManagerId();
                    }
                }
            },300);
        })
    }
});

//活动
var activity = Vue.extend({
    template : "#activity_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "manager_id" : "",
                "dataList" : [],
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
            },
            "title":{
                "tabs" : 1,
                "isPop" : false,
                "isDropDown" : false,
                "currentDropDown":0,
            },
            "select" : {
                "typeArr" : [
                    {"val":0,"name":"全部活动"}
                    ,{"val":1,"name":"单品"}
                    ,{"val":2,"name":"砍价"}
                    ,{"val":3,"name":"众筹"}
                    ,{"val":4,"name":"拼团"}
                    ,{"val":5,"name":"拍卖"}
                    ,{"val":6,"name":"传单"}
                ],
                "typeName" : [
                    ,{"val":1,"name":"单品活动"}
                    ,{"val":2,"name":"砍价活动"}
                    ,{"val":3,"name":"众筹活动"}
                    ,{"val":4,"name":"拼团活动"}
                    ,{"val":5,"name":"拍卖活动"}
                    ,{"val":6,"name":"传单活动"}
                ],
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
        "title.tabs" : function(val){
            var _this = this;
            _this._getPromotion();
        },
        "title.currentDropDown" : function(val){
            var _this = this;
            _this._getPromotion();
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
                        _this._getPromotion();
                    }
                }
            })
        },
        _togglePop:function(){
            var _this = this;
            _this.title.isDropDown = false;
            _this.title.isPop = !_this.isPop;
        },
        _getPromotion : function(){//获取活动
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.boss_id = _this.parentMsg.base.manager_id;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.status = _this.title.tabs;
            data.activity_type = _this.title.currentDropDown;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/activity_all/get_shopowner";
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
        _selectType : function(val){
            var _this = this;
            _this.title.isDropDown = false;
            _this.title.currentDropDown = val;
        },
        _alertMore : function(){
            layer.msg("即将开放，敬请期待",{icon:0})
        },
        _closeActivity : function(type,oid,num){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = oid;
            if( type == 1 ){
                data.table_name = "db_single_product";
            } else if( type == 2 ){
                data.table_name = "db_bargain";
            }
            data.open_off = num;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/activity_all/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._getPromotion();
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
        _goBargin : function(){
            var _this = this;
            for(var i in _this.parentMsg.bargin){
                _this.parentMsg.bargin[i] = "";
            }
            for(var i in _this.parentMsg.product){
                _this.parentMsg.product[i] = "";
            }
            _this.parentMsg.bargin.banner = [];
            _this.parentMsg.bargin.detail = [];
            _this.parentMsg.bargin.company = [];
            routerHref("addActivityBargain");
        },
        _goSingle : function(){
            var _this = this;
            for(var i in _this.parentMsg.single){
                _this.parentMsg.single[i] = "";
            }
            for(var i in _this.parentMsg.product){
                _this.parentMsg.product[i] = "";
            }
            _this.parentMsg.single.banner_top = [];
            _this.parentMsg.single.product_introduction_img = [];
            routerHref("addActivitySingle");
        },
        _goEdit : function(type,oid){
            var _this = this;
            _this.parentMsg.editActivity.oid = oid;
            if( type == 1 ){
                for(var i in _this.parentMsg.single){
                    _this.parentMsg.single[i] = "";
                }
                for(var i in _this.parentMsg.product){
                    _this.parentMsg.product[i] = "";
                }
                _this.parentMsg.single.banner_top = [];
                _this.parentMsg.single.product_introduction_img = [];
                routerHref("editSingle");
            } else if( type == 2 ){
                for(var i in _this.parentMsg.bargin){
                    _this.parentMsg.bargin[i] = "";
                }
                for(var i in _this.parentMsg.product){
                    _this.parentMsg.product[i] = "";
                }
                _this.parentMsg.bargin.banner = [];
                _this.parentMsg.bargin.detail = [];
                _this.parentMsg.bargin.company = [];
                routerHref("editBargain");
            }
        },
        _goPreview : function(obj){
            var _this = this;
            if( obj.activity_type == 2 ){
                $("#loading").show();
                sessionStorage.setItem("boss_id",_this.parentMsg.base.manager_id);
                sessionStorage.setItem("activity_id",obj.id);
                location.href = "http://ssm.echao.com/ShareSpokesman/bargain_fenx/bargin_preview.html?fans_id=" + getURLParam("fans_id",window.location.href);
                // layer.msg("即将开放，敬请期待",{icon:0});
            } else if( obj.activity_type == 1 ){
                routerProductAdd('activityView',obj.activity_type,obj.id);
            }
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
                        _this._getPromotion();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });        
    }
});
//添加活动--单品
var addActivitySingle = Vue.extend({
    template : "#addActivitySingle_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "foot" : true,
                "describe" : false,
            },
            "add" : {
                "product_id" : "",
                "title" : "",
                "start_time" : "",
                "end_time" : "",
                "start_up_money_all" : "",
                "product_quantity" : "",
                "original_price" : "",
                "floor_price" : "",
                "bargain_times" : "",
                "max_sale" : "",
                "min_sale" : "",
                "share_money_time" : "",
                "forward_money_time" : "",
                "browse_money_time" : "",
                "sale_profit" : "",
                "direct_profit" : "",
                "indirect_profit" : "",
                "image_logo" : "",
                "banner_top" : [],
                "product_introduction" : "",
                "product_introduction_img" : [],
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
        _getParent : function(){
            var _this = this;
            for(var i in _this.parentMsg.single){
                _this.add[i] = _this.parentMsg.single[i];
            }
            _this.add.banner = [];
            if( _this.parentMsg.single.start_time ){
                 _this.add.start_time = _this.parentMsg.single.start_time;
                 _this.add.end_time = _this.parentMsg.single.end_time;
            } else {
                _this.add.start_time = moment().format("YYYY-MM-DDTHH:mm");
                _this.add.end_time = moment().add(7,"days").format("YYYY-MM-DDTHH:mm");
            }
            if( _this.parentMsg.product.image ){
                _this.add.banner_top = JSON.parse(_this.parentMsg.product.image);
                _this.add.image_logo = JSON.parse(_this.parentMsg.product.image)[0];
                _this.add.title = _this.parentMsg.product.title;
                _this.add.original_price = _this.parentMsg.product.price;
                _this.add.product_quantity = _this.parentMsg.product.quality;
                _this.add.product_id = _this.parentMsg.product.product_id;
            }
            setTimeout(function(){
                myScroll.refresh();
            },600)
        },
        _hideFoot : function(){
            var _this = this;
            _this.base.foot = false;
        },
        _showFoot : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
        },
        _startMove : function(){
            var _this = this;
            _this.base.foot = false;
            document.removeEventListener('touchmove', handler, false);
        },
        _stopMove : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
            document.addEventListener('touchmove', handler, false);
        },
        _save : function(){
            var _this = this;
            var error = {};
            error.title = [/.+/ , '标题不能为空'];
            error.start_time =  [ /.+/ , "开始时间不能为空" ];
            error.end_time  = [ /.+/ ,"结束时间不能为空" ];
            error.start_up_money_all  = [ /.+/ ,"启动资金不能为空" ];
            error.product_quantity  = [ /.+/ ,"库存数量不能为空" ];
            error.original_price  =[ /.+/ , "产品价格不能为空"];
            error.floor_price  = [/.+/ , "活动底价不能为空" ];
            error.product_id  = [/.+/ , "请选择活动产品" ];
            error.share_money_time  = [/.+/ , "分享金不能为空"];
            error.forward_money_time  = [/.+/ , "转发金不能为空" ];
            error.browse_money_time  = [/.+/ , "浏览金不能为空" ];
            error.sale_profit  = [/.+/ , "成单佣金不能为空" ];
            error.direct_profit  = [/.+/ , "直接代言人佣金不能为空" ];
            error.indirect_profit  = [/.+/ , "间接代言人佣金不能为空" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.banner_top.length == 0 ){
                return layer.msg("产品轮播图不能为空",{icon:0});
            }
            var start_time = _this.add.start_time.replace("T"," ") + ":00";
            var end_time = _this.add.end_time.replace("T"," ") + ":00";
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.openid = _this.parentMsg.base.openid;
            data.token = _this.base.token;
            data.status = 0;
            data.title = _this.add.title;
            data.start_time = start_time;
            data.end_time = end_time;
            data.start_up_money_all = _this.add.start_up_money_all;
            data.product_quantity = _this.add.product_quantity;
            data.original_price = _this.add.original_price;
            data.floor_price = _this.add.floor_price;
            data.product_id = _this.add.product_id;
            data.share_money_time = _this.add.share_money_time;
            data.forward_money_time = _this.add.forward_money_time;
            data.browse_money_time = _this.add.browse_money_time;
            data.sale_profit = _this.add.sale_profit;
            data.direct_profit = _this.add.direct_profit;
            data.indirect_profit = _this.add.indirect_profit;
            data.image_logo = _this.add.image_logo;
            data.product_introduction = _this.add.product_introduction;
            data.banner_top = JSON.stringify(_this.add.banner_top);
            data.product_introduction_img = JSON.stringify(_this.add.product_introduction_img);
            data.addtime = moment().format("X");
            console.log(data)
            var url = "http://www.zsb2b.com:8081/single_product/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._addNews();
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
        _showProductDescribe : function(obj){
            var _this = this;
            _this.base[obj] = true;
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _alertBanner : function(){
            layer.msg("产品轮播图最多只能上传5张",{icon:0})
        },
        _removeImg : function(obj,index){
            var _this = this;
            _this.add[obj].splice(index,1);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _selectBanner : function(file,obj){
            var _this = this;
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:750
            })
            .then(function (rst) {
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this.add[obj].push(result.data);
                        var img = new Image();
                        img.src = result.data;
                        img.onload = function(){
                            setTimeout(function(){
                                myScroll.refresh();
                            },300)
                        }
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
                layer.msg(err,{icon:2});
            })
            .always(function () {
            });
        },
        _selectProduct : function(){
            var _this = this;
            for(var i in _this.add){
                _this.parentMsg.single[i] = _this.add[i];
            }
            routerHref("selectProduct");
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
        _goPreview : function(){
            var _this = this;
            var error = {};
            error.title = [/.+/ , '标题不能为空'];
            error.start_time =  [ /.+/ , "开始时间不能为空" ];
            error.end_time  = [ /.+/ ,"结束时间不能为空" ];
            error.start_up_money_all  = [ /.+/ ,"启动资金不能为空" ];
            error.product_quantity  = [ /.+/ ,"库存数量不能为空" ];
            error.original_price  =[ /.+/ , "产品价格不能为空"];
            error.floor_price  = [/.+/ , "活动底价不能为空" ];
            error.product_id  = [/.+/ , "请选择活动产品" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.banner_top.length == 0 ){
                return layer.msg("产品轮播图不能为空",{icon:0});
            }
            for(var i in _this.add){
                _this.parentMsg.single[i] = _this.add[i];
            }
            _this.parentMsg.singlePreView.banner = _this.add.banner_top;
            _this.parentMsg.singlePreView.title = _this.add.title;
            _this.parentMsg.singlePreView.price = _this.add.floor_price;
            _this.parentMsg.singlePreView.number = _this.add.product_quantity;
            _this.parentMsg.singlePreView.text = _this.add.product_introduction;
            _this.parentMsg.singlePreView.detail = _this.add.product_introduction_img;
            routerProductAdd('activityView','a',1)
        },
        _addNews : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "单品活动待审核";
            data.detailed = '标题为“' + _this.add.title + '”的单品活动待审核';
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add_manager";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    layer.msg("添加成功，请等待上级审核",{icon:1,time:1200});
                    setTimeout(function(){
                        backPage("activity");
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
                    layer.msg("添加成功，消息推送失败",{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
                } else {
                    layer.msg('添加成功，消息推送失败',{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
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
            if( _this.base.token ){
                _this._getParent();
                if( !_this.parentMsg.base.manager_id ){
                    _this._getManagerId();
                }
            }
        });
    }
});
//编辑活动--单品
var editSingle = Vue.extend({
    template : "#editSingle_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "foot" : true,
                "describe" : false,
            },
            "add" : {
                "product_id" : "",
                "title" : "",
                "start_time" : "",
                "end_time" : "",
                "start_up_money_all" : "",
                "product_quantity" : "",
                "original_price" : "",
                "floor_price" : "",
                "share_money_time" : "",
                "forward_money_time" : "",
                "browse_money_time" : "",
                "sale_profit" : "",
                "direct_profit" : "",
                "indirect_profit" : "",
                "image_logo" : "",
                "banner_top" : [],
                "product_introduction" : "",
                "product_introduction_img" : [],
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
        _getParent : function(){
            var _this = this;
            for(var i in _this.parentMsg.single){
                _this.add[i] = _this.parentMsg.single[i];
            }
            _this.add.banner = [];
            if( _this.parentMsg.single.start_time ){
                 _this.add.start_time = _this.parentMsg.single.start_time;
                 _this.add.end_time = _this.parentMsg.single.end_time;
            } else {
                _this.add.start_time = moment().format("YYYY-MM-DDTHH:mm");
                _this.add.end_time = moment().add(7,"days").format("YYYY-MM-DDTHH:mm");
            }
            if( _this.parentMsg.product.image ){
                _this.add.banner_top = JSON.parse(_this.parentMsg.product.image);
                _this.add.image_logo = JSON.parse(_this.parentMsg.product.image)[0];
                _this.add.title = _this.parentMsg.product.title;
                _this.add.original_price = _this.parentMsg.product.price;
                _this.add.product_quantity = _this.parentMsg.product.quality;
                _this.add.product_id = _this.parentMsg.product.product_id;
            }
            setTimeout(function(){
                myScroll.refresh();
            },600)
        },
        _hideFoot : function(){
            var _this = this;
            _this.base.foot = false;
        },
        _showFoot : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
        },
        _startMove : function(){
            var _this = this;
            _this.base.foot = false;
            document.removeEventListener('touchmove', handler, false);
        },
        _stopMove : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
            document.addEventListener('touchmove', handler, false);
        },
        _save : function(){
            var _this = this;
            var start_time,end_time;
            var error = {};
            error.title = [/.+/ , '标题不能为空'];
            error.start_time =  [ /.+/ , "开始时间不能为空" ];
            error.end_time  = [ /.+/ ,"结束时间不能为空" ];
            error.start_up_money_all  = [ /.+/ ,"启动资金不能为空" ];
            error.product_quantity  = [ /.+/ ,"库存数量不能为空" ];
            error.original_price  =[ /.+/ , "产品价格不能为空"];
            error.floor_price  = [/.+/ , "活动底价不能为空" ];
            error.product_id  = [/.+/ , "请选择活动产品" ];
            error.share_money_time  = [/.+/ , "分享金不能为空"];
            error.forward_money_time  = [/.+/ , "转发金不能为空" ];
            error.browse_money_time  = [/.+/ , "浏览金不能为空" ];
            error.sale_profit  = [/.+/ , "成单佣金不能为空" ];
            error.direct_profit  = [/.+/ , "直接代言人佣金不能为空" ];
            error.indirect_profit  = [/.+/ , "间接代言人佣金不能为空" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.banner_top.length == 0 ){
                return layer.msg("产品轮播图不能为空",{icon:0});
            }
            if( _this.add.start_time.split(":").length > 2 ){
                start_time = _this.add.start_time.replace("T"," ");
            } else {
                start_time = _this.add.start_time.replace("T"," ") + ":00";
            }
            if( _this.add.end_time.split(":").length > 2 ){
                end_time = _this.add.end_time.replace("T"," ");
            } else {
                end_time = _this.add.end_time.replace("T"," ") + ":00";
            }
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.id = _this.parentMsg.editActivity.oid;
            data.title = _this.add.title;
            data.start_time = start_time;
            data.end_time = end_time;
            data.start_up_money_all = _this.add.start_up_money_all;
            data.product_quantity = _this.add.product_quantity;
            data.original_price = _this.add.original_price;
            data.floor_price = _this.add.floor_price;
            data.product_id = _this.add.product_id;
            data.share_money_time = _this.add.share_money_time;
            data.forward_money_time = _this.add.forward_money_time;
            data.browse_money_time = _this.add.browse_money_time;
            data.sale_profit = _this.add.sale_profit;
            data.direct_profit = _this.add.direct_profit;
            data.indirect_profit = _this.add.indirect_profit;
            data.image_logo = _this.add.image_logo;
            data.product_introduction = _this.add.product_introduction;
            data.banner_top = JSON.stringify(_this.add.banner_top);
            data.product_introduction_img = JSON.stringify(_this.add.product_introduction_img);
            console.log(data)
            var url = "http://www.zsb2b.com:8081/single_product/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._addNews();
                    
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
        _showProductDescribe : function(obj){
            var _this = this;
            _this.base[obj] = true;
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _alertBanner : function(){
            layer.msg("产品轮播图最多只能上传5张",{icon:0})
        },
        _removeImg : function(obj,index){
            var _this = this;
            _this.add[obj].splice(index,1);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _selectBanner : function(file,obj){
            var _this = this;
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:750
            })
            .then(function (rst) {
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this.add[obj].push(result.data);
                        var img = new Image();
                        img.src = result.data;
                        img.onload = function(){
                            setTimeout(function(){
                                myScroll.refresh();
                            },300)
                        }
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
                layer.msg(err,{icon:2});
            })
            .always(function () {
            });
        },
        _selectProduct : function(){
            var _this = this;
            sessionStorage.setItem("changeProduct","true");
            for(var i in _this.add){
                _this.parentMsg.single[i] = _this.add[i];
            }
            routerHref("selectProduct");
        },
        _getSingleDetail : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.parentMsg.editActivity.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/single_product/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.add.title = result.data[0].title;
                    _this.add.start_time = result.data[0].start_time.replace(" ","T");
                    _this.add.end_time = result.data[0].end_time.replace(" ","T");
                    _this.add.start_up_money_all = result.data[0].start_up_money_all;
                    _this.add.product_quantity = result.data[0].product_quantity;
                    _this.add.original_price = result.data[0].original_price;
                    _this.add.floor_price = result.data[0].floor_price;
                    _this.add.share_money_time = result.data[0].share_money_time;
                    _this.add.forward_money_time = result.data[0].forward_money_time;
                    _this.add.browse_money_time = result.data[0].browse_money_time;
                    _this.add.sale_profit = result.data[0].sale_profit;
                    _this.add.direct_profit = result.data[0].direct_profit;
                    _this.add.indirect_profit = result.data[0].indirect_profit;
                    _this.add.image_logo = result.data[0].image_logo;
                    _this.add.product_introduction = result.data[0].product_introduction;
                    _this.add.banner_top = JSON.parse(result.data[0].banner_top);
                    _this.add.product_introduction_img = JSON.parse(result.data[0].product_introduction_img);
                    _this.add.product_id = result.data[0].product_id;
                    _this._getProduct(result.data[0].product_id)
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
                    _this.parentMsg.product.image = result.data[0].image;
                    _this.parentMsg.product.title = result.data[0].name;
                    _this.parentMsg.product.price = result.data[0].money;
                    _this.parentMsg.product.quality = result.data[0].stock;
                    _this.parentMsg.product.product_id = result.data[0].id;
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
        _goPreview : function(){
            var _this = this;
            var error = {};
            error.title = [/.+/ , '标题不能为空'];
            error.start_time =  [ /.+/ , "开始时间不能为空" ];
            error.end_time  = [ /.+/ ,"结束时间不能为空" ];
            error.start_up_money_all  = [ /.+/ ,"启动资金不能为空" ];
            error.product_quantity  = [ /.+/ ,"库存数量不能为空" ];
            error.original_price  =[ /.+/ , "产品价格不能为空"];
            error.floor_price  = [/.+/ , "活动底价不能为空" ];
            error.product_id  = [/.+/ , "请选择活动产品" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.banner_top.length == 0 ){
                return layer.msg("产品轮播图不能为空",{icon:0});
            }
            for(var i in _this.add){
                _this.parentMsg.single[i] = _this.add[i];
            }
            sessionStorage.setItem("changeProduct","true");
            _this.parentMsg.singlePreView.banner = _this.add.banner_top;
            _this.parentMsg.singlePreView.title = _this.add.title;
            _this.parentMsg.singlePreView.price = _this.add.floor_price;
            _this.parentMsg.singlePreView.number = _this.add.product_quantity;
            _this.parentMsg.singlePreView.text = _this.add.product_introduction;
            _this.parentMsg.singlePreView.detail = _this.add.product_introduction_img;
            routerProductAdd('activityView','a',1)
        },
        _addNews : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "单品活动已修改";
            data.detailed = '标题为“' + _this.add.title + '”的单品活动已修改';
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add_manager";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    layer.msg("修改成功，请等待上级审核",{icon:1,time:1200});
                    setTimeout(function(){
                        backPage("activity");
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
                    layer.msg("修改成功，消息推送失败",{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
                } else {
                    layer.msg('修改成功，消息推送失败',{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        var change = sessionStorage.getItem("changeProduct");
        if( !_this.parentMsg.editActivity.oid ){
            return backPage('activity');
        }
        loaded();
        userLogin(function(){
            if( _this.base.token ){
                _this._getParent();
                setTimeout(function(){
                    if( change ){
                        sessionStorage.removeItem("changeProduct");
                    } else {
                        _this._getSingleDetail();
                    }
                },320)
            }
        });
    }
});
//添加活动--砍价
var addActivityBargain = Vue.extend({
    template : "#addActivityBargain_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "foot" : true,
                "productDescribe" : false,
                "rule" : false,
                "prize" : false,
                "company" : false,
            },
            "add" : {
                "product_id" : "",
                "title" : "",
                "start_time" : "",
                "end_time" : "",
                "start_up_money_all" : "",
                "gift_quantity" : "",
                "original_price" : "",
                "floor_price" : "",
                "bargain_times" : "",
                "max_sale" : "",
                "min_sale" : "",
                "share_money_time" : "",
                "forward_money_time" : "",
                "browse_money_time" : "",
                "gift_describe_txt" : "",
                "activity_rules" : "",
                "award_information" : "",
                "company_introduction" : "",
                "banner" : [],
                "detail" : [],
                "company" : [],
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
        _getParent : function(){
            var _this = this;
            for(var i in _this.parentMsg.bargin){
                _this.add[i] = _this.parentMsg.bargin[i];
            }
            _this.add.banner = [];
            if( _this.parentMsg.bargin.start_time ){
                 _this.add.start_time = _this.parentMsg.bargin.start_time;
                 _this.add.end_time = _this.parentMsg.bargin.end_time;
            } else {
                _this.add.start_time = moment().format("YYYY-MM-DDTHH:mm");
                _this.add.end_time = moment().add(7,"days").format("YYYY-MM-DDTHH:mm");
            }
            if( _this.parentMsg.product.image ){
                _this.add.banner.push(JSON.parse(_this.parentMsg.product.image)[0]);
                _this.add.title = _this.parentMsg.product.title;
                _this.add.original_price = _this.parentMsg.product.price;
                _this.add.gift_quantity = _this.parentMsg.product.quality;
                _this.add.product_id = _this.parentMsg.product.product_id;
            }
            setTimeout(function(){
                myScroll.refresh();
            },600)
        },
        _hideFoot : function(){
            var _this = this;
            _this.base.foot = false;
        },
        _showFoot : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
        },
        _startMove : function(){
            var _this = this;
            _this.base.foot = false;
            document.removeEventListener('touchmove', handler, false);
        },
        _stopMove : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
            document.addEventListener('touchmove', handler, false);
        },
        _save : function(){
            var _this = this;
            var error = {};
            error.title = [/.+/ , '标题不能为空'];
            error.start_time =  [ /.+/ , "开始时间不能为空" ];
            error.end_time  = [ /.+/ ,"结束时间不能为空" ];
            error.start_up_money_all  = [ /.+/ ,"启动资金不能为空" ];
            error.gift_quantity  = [ /.+/ ,"库存数量不能为空" ];
            error.original_price  =[ /.+/ , "产品价格不能为空"];
            error.floor_price  = [/.+/ , "活动底价不能为空" ];
            error.bargain_times  = [/.+/ , "帮砍次数不能为空"];
            error.max_sale  = [/.+/ , "最高减价不能为空" ];
            error.min_sale  = [/.+/ , "最低减价不能为空" ];
            error.product_id  = [/.+/ , "请选择活动产品" ];
            error.share_money_time  = [/.+/ , "分享金不能为空"];
            error.forward_money_time  = [/.+/ , "转发金不能为空" ];
            error.browse_money_time  = [/.+/ , "浏览金不能为空" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.banner.length == 0 ){
                return layer.msg("banner图不能为空",{icon:0});
            }
            var start_time = _this.add.start_time.replace("T"," ") + ":00";
            var end_time = _this.add.end_time.replace("T"," ") + ":00";
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.openid = _this.parentMsg.base.openid;
            data.token = _this.base.token;
            data.status = 0;
            data.title = _this.add.title;
            data.start_time = start_time;
            data.end_time = end_time;
            data.start_up_money_all = _this.add.start_up_money_all;
            data.gift_quantity = _this.add.gift_quantity;
            data.new_gift_quantity = _this.add.gift_quantity;
            data.original_price = _this.add.original_price;
            data.floor_price = _this.add.floor_price;
            data.bargain_times = _this.add.bargain_times;
            data.max_sale = _this.add.max_sale;
            data.min_sale = _this.add.min_sale;
            data.product_id = _this.add.product_id;
            data.share_money_time = _this.add.share_money_time;
            data.forward_money_time = _this.add.forward_money_time;
            data.browse_money_time = _this.add.browse_money_time;
            data.image_logo = _this.add.banner[0];
            data.gift_describe_txt = _this.add.gift_describe_txt;
            data.activity_rules = _this.add.activity_rules;
            data.award_information = _this.add.award_information;
            data.company_introduction = _this.add.company_introduction;
            data.gift_describe = JSON.stringify(_this.add.detail);
            data.company_introduction_img = JSON.stringify(_this.add.company);
            data.addtime = moment().format("X");
            console.log(data)
            var url = "http://www.zsb2b.com:8081/bargain/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._addNews();
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
        _showProductDescribe : function(obj){
            var _this = this;
            _this.base[obj] = true;
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _alertBanner : function(){
            layer.msg("banner图只能上传一张",{icon:0})
        },
        _removeImg : function(obj,index){
            var _this = this;
            _this.add[obj].splice(index,1);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _selectBanner : function(file,obj){
            var _this = this;
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:750
            })
            .then(function (rst) {
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this.add[obj].push(result.data);
                        var img = new Image();
                        img.src = result.data;
                        img.onload = function(){
                            setTimeout(function(){
                                myScroll.refresh();
                            },300)
                        }
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
                layer.msg(err,{icon:2});
            })
            .always(function () {
            });
        },
        _selectProduct : function(){
            var _this = this;
            for(var i in _this.add){
                _this.parentMsg.bargin[i] = _this.add[i];
            }
            routerHref("selectProduct");
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
        _goPreview : function(){
            var _this = this;
            layer.msg("即将开放，敬请期待",{icon:0});
        },
        _addNews : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "砍价活动待审核";
            data.detailed = '标题为“' + _this.add.title + '”的砍价活动待审核';
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add_manager";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    layer.msg("添加成功，请等待上级审核",{icon:1,time:1200});
                    setTimeout(function(){
                        backPage("activity");
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
                    layer.msg("添加成功，消息推送失败",{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
                } else {
                    layer.msg('添加成功，消息推送失败',{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
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
            if( _this.base.token ){
                _this._getParent();
                if( !_this.parentMsg.base.manager_id ){
                    _this._getManagerId();
                }
            }
        });
    }
});
//编辑活动--砍价
var editBargain = Vue.extend({
    template : "#editBargain_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "foot" : true,
                "productDescribe" : false,
                "rule" : false,
                "prize" : false,
                "company" : false,
            },
            "add" : {
                "product_id" : "",
                "title" : "",
                "start_time" : "",
                "end_time" : "",
                "start_up_money_all" : "",
                "gift_quantity" : "",
                "original_price" : "",
                "floor_price" : "",
                "bargain_times" : "",
                "max_sale" : "",
                "min_sale" : "",
                "share_money_time" : "",
                "forward_money_time" : "",
                "browse_money_time" : "",
                "gift_describe_txt" : "",
                "activity_rules" : "",
                "award_information" : "",
                "company_introduction" : "",
                "banner" : [],
                "detail" : [],
                "company" : [],
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
        _getParent : function(){
            var _this = this;
            for(var i in _this.parentMsg.bargin){
                _this.add[i] = _this.parentMsg.bargin[i];
            }
            _this.add.banner = [];
            if( _this.parentMsg.bargin.start_time ){
                 _this.add.start_time = _this.parentMsg.bargin.start_time;
                 _this.add.end_time = _this.parentMsg.bargin.end_time;
            } else {
                _this.add.start_time = moment().format("YYYY-MM-DDTHH:mm");
                _this.add.end_time = moment().add(7,"days").format("YYYY-MM-DDTHH:mm");
            }
            if( _this.parentMsg.product.image ){
                _this.add.banner.push(JSON.parse(_this.parentMsg.product.image)[0]);
                _this.add.title = _this.parentMsg.product.title;
                _this.add.original_price = _this.parentMsg.product.price;
                _this.add.gift_quantity = _this.parentMsg.product.quality;
                _this.add.product_id = _this.parentMsg.product.product_id;
            }
            setTimeout(function(){
                myScroll.refresh();
            },600)
        },
        _hideFoot : function(){
            var _this = this;
            _this.base.foot = false;
        },
        _showFoot : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
        },
        _startMove : function(){
            var _this = this;
            _this.base.foot = false;
            document.removeEventListener('touchmove', handler, false);
        },
        _stopMove : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
            document.addEventListener('touchmove', handler, false);
        },
        _save : function(){
            var _this = this;
            var start_time,end_time;
            var error = {};
            error.title = [/.+/ , '标题不能为空'];
            error.start_time =  [ /.+/ , "开始时间不能为空" ];
            error.end_time  = [ /.+/ ,"结束时间不能为空" ];
            error.start_up_money_all  = [ /.+/ ,"启动资金不能为空" ];
            error.gift_quantity  = [ /.+/ ,"库存数量不能为空" ];
            error.original_price  =[ /.+/ , "产品价格不能为空"];
            error.floor_price  = [/.+/ , "活动底价不能为空" ];
            error.bargain_times  = [/.+/ , "帮砍次数不能为空"];
            error.max_sale  = [/.+/ , "最高减价不能为空" ];
            error.min_sale  = [/.+/ , "最低减价不能为空" ];
            error.product_id  = [/.+/ , "请选择活动产品" ];
            error.share_money_time  = [/.+/ , "分享金不能为空"];
            error.forward_money_time  = [/.+/ , "转发金不能为空" ];
            error.browse_money_time  = [/.+/ , "浏览金不能为空" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.banner.length == 0 ){
                return layer.msg("banner图不能为空",{icon:0});
            }
            if( _this.add.start_time.split(":").length > 2 ){
                start_time = _this.add.start_time.replace("T"," ");
            } else {
                start_time = _this.add.start_time.replace("T"," ") + ":00";
            }
            if( _this.add.end_time.split(":").length > 2 ){
                end_time = _this.add.end_time.replace("T"," ");
            } else {
                end_time = _this.add.end_time.replace("T"," ") + ":00";
            }
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.parentMsg.editActivity.oid;
            data.title = _this.add.title;
            data.start_time = start_time;
            data.end_time = end_time;
            data.start_up_money_all = _this.add.start_up_money_all;
            data.gift_quantity = _this.add.gift_quantity;
            data.new_gift_quantity = _this.add.gift_quantity;
            data.original_price = _this.add.original_price;
            data.floor_price = _this.add.floor_price;
            data.bargain_times = _this.add.bargain_times;
            data.max_sale = _this.add.max_sale;
            data.min_sale = _this.add.min_sale;
            data.product_id = _this.add.product_id;
            data.share_money_time = _this.add.share_money_time;
            data.forward_money_time = _this.add.forward_money_time;
            data.browse_money_time = _this.add.browse_money_time;
            data.image_logo = _this.add.banner[0];
            data.gift_describe_txt = _this.add.gift_describe_txt;
            data.activity_rules = _this.add.activity_rules;
            data.award_information = _this.add.award_information;
            data.company_introduction = _this.add.company_introduction;
            data.gift_describe = JSON.stringify(_this.add.detail);
            data.company_introduction_img = JSON.stringify(_this.add.company);
            console.log(data)
            var url = "http://www.zsb2b.com:8081/bargain/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._addNews();
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
        _showProductDescribe : function(obj){
            var _this = this;
            _this.base[obj] = true;
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _alertBanner : function(){
            layer.msg("banner图只能上传一张",{icon:0})
        },
        _removeImg : function(obj,index){
            var _this = this;
            _this.add[obj].splice(index,1);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _selectBanner : function(file,obj){
            var _this = this;
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:750
            })
            .then(function (rst) {
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this.add[obj].push(result.data);
                        var img = new Image();
                        img.src = result.data;
                        img.onload = function(){
                            setTimeout(function(){
                                myScroll.refresh();
                            },300)
                        }
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
                layer.msg(err,{icon:2});
            })
            .always(function () {
            });
        },
        _selectProduct : function(){
            var _this = this;
            sessionStorage.setItem("changeProduct","true");
            for(var i in _this.add){
                _this.parentMsg.bargin[i] = _this.add[i];
            }
            routerHref("selectProduct");
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
        _getBarginDetail : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.parentMsg.editActivity.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/bargain/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.add.title = result.data[0].title;
                    _this.add.start_time = result.data[0].start_time.replace(" ","T");
                    _this.add.end_time = result.data[0].end_time.replace(" ","T");
                    _this.add.start_up_money_all = result.data[0].start_up_money_all;
                    _this.add.gift_quantity = result.data[0].gift_quantity;
                    _this.add.original_price = result.data[0].original_price;
                    _this.add.floor_price = result.data[0].floor_price;
                    _this.add.bargain_times = result.data[0].bargain_times;
                    _this.add.max_sale = result.data[0].max_sale;
                    _this.add.min_sale = result.data[0].min_sale;
                    _this.add.share_money_time = result.data[0].share_money_time;
                    _this.add.forward_money_time = result.data[0].forward_money_time;
                    _this.add.browse_money_time = result.data[0].browse_money_time;
                    _this.add.gift_describe_txt = result.data[0].gift_describe_txt;
                    _this.add.activity_rules = result.data[0].activity_rules;
                    _this.add.award_information = result.data[0].award_information;
                    _this.add.company_introduction = result.data[0].company_introduction;
                    _this.add.banner.push(result.data[0].image_logo);
                    _this.add.detail = JSON.parse(result.data[0].gift_describe);
                    _this.add.company = JSON.parse(result.data[0].company_introduction_img);
                    _this.add.product_id = result.data[0].product_id;
                    _this._getProduct(result.data[0].product_id)
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
                    _this.parentMsg.product.image = result.data[0].image;
                    _this.parentMsg.product.title = result.data[0].name;
                    _this.parentMsg.product.price = result.data[0].money;
                    _this.parentMsg.product.quality = result.data[0].stock;
                    _this.parentMsg.product.product_id = result.data[0].id;
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
        _goPreview : function(){
            var _this = this;
            layer.msg("即将开放，敬请期待",{icon:0});
        },
        _addNews : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "砍价活动已修改";
            data.detailed = '标题为“' + _this.add.title + '”的砍价活动已修改';
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add_manager";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    layer.msg("修改成功，请等待上级审核",{icon:1,time:1200});
                    setTimeout(function(){
                        backPage("activity");
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
                    layer.msg("修改成功，消息推送失败",{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
                } else {
                    layer.msg('修改成功，消息推送失败',{icon:0,time:1200});
                    setTimeout(function(){
                        backPage("activity");
                    },1200)
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        var change = sessionStorage.getItem("changeProduct");
        if( !_this.parentMsg.editActivity.oid ){
            return backPage('activity');
        }
        loaded();
        userLogin(function(){
            if( _this.base.token ){
                _this._getParent();
                setTimeout(function(){
                    if( change ){
                        sessionStorage.removeItem("changeProduct");
                    } else {
                        _this._getBarginDetail();
                    }
                },320)
            }
        });
    }
});

//订单
var order = Vue.extend({
    template : "#order_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "title" : "a",
                "token" : "",
                "page" : 1,
                "status" : 1,
                "param_text" : "",
                "dataList" : [],
                "isPop" : false,
                "oid" : "",
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
                "database" : {},
            },
            "review" : {
                "tabs" : 0,
            },
            "select" : {
                "status" : [
                    {"val":1,"name":"待付款"}
                    ,{"val":2,"name":"提货/发货"}
                    ,{"val":4,"name":"退款中"}
                    ,{"val":3,"name":"已完成"}
                ],
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
        "base.status" : function(val){
            var _this = this;
            if( !_this.base.param_text ){
                _this._getOrder();
            }
        },
        "base.title" : function(val){
            var _this = this;
            if( !_this.base.param_text ){
                if( val == "a" ){
                    _this._getOrder();
                } else {
                    _this._getOrderReview();
                }
            }
        },
        "review.tabs" : function(val){
            var _this = this;
            if( !_this.base.param_text ){
                _this._getOrderReview();
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
                        if( _this.base.title == 'a' ){
                            _this._getOrder();
                        } else {
                            _this._getOrderReview();
                        }
                    }
                }
            })
        },
        _getOrder : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.status = _this.base.status;
            data.param_text = _this.base.param_text;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/order/order_status_shopowner_pay_status";
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
        _getOrderReview : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.status = _this.review.tabs;
            data.param_text = _this.base.param_text;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/order/order_status_shopowner_status";
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
        _showReview : function(obj){
            var _this = this;
            _this.base.database = obj;
            _this.base.isPop = true;
        },
        _goReview : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.database.id;
            data.status = 1;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/order/order_status_shopowner_status_change";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.isPop = false;
                    layer.msg("审核成功",{icon:1,time:1200});
                    setTimeout(function(){
                        _this._getOrderReview();
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
        _addPolicy : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.openid = _this.parentMsg.base.openid;
            data.card_no = "";
            data.order_no = _this.base.database.order_no;
            data.standard = "";
            data.other = "";
            data.amount = _this.base.database.total_price;
            data.remark = _this.base.database.remark;
            data.real_name = _this.base.database.nickname;
            data.mobile = _this.base.database.mobile;
            data.cid = _this.base.database.cid;
            data.pid = _this.base.database.pid;
            data.mid = _this.base.database.mid;
            data.shopowner_id = _this.base.database.sid;
            data.order_title = _this.base.database.title;
            data.order_price = _this.base.database.unit_price;
            data.order_num = _this.base.database.number;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/policy/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._goReview();
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
        _goDetail : function(obj){
            var _this = this;
            _this.parentMsg.order.database = obj;
            routerHref("orderDetail");
        },
        _goSearchPage : function(){
            var _this = this;
            _this.parentMsg.order.title = _this.base.title;
            _this.parentMsg.order.pay_status = _this.base.status;
            _this.parentMsg.order.status = _this.review.tabs;
            routerProductAdd('search',1,1)
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        var param_text = sessionStorage.getItem("param_text");
        _this.base.token = sessionStorage.getItem("token");      
        userLogin(function(){
            if( param_text ){
                sessionStorage.removeItem("param_text");
                _this.base.param_text = param_text;
                if( _this.parentMsg.order.title == 'a' ){
                    _this.base.status = _this.parentMsg.order.pay_status;
                } else if( _this.parentMsg.order.title == 'b' ){
                    _this.base.title = _this.parentMsg.order.title;
                    _this.review.tabs = _this.parentMsg.order.status;
                }
                _this.parentMsg.order.title = "";
                _this.parentMsg.order.pay_status = "";
                _this.parentMsg.order.status = "";
            }
            setTimeout(function(){
                if( _this.base.token ){
                    _this._loaded();
                    if( _this.parentMsg.base.manager_id ){
                        if( _this.base.title == 'a' ){
                            _this._getOrder();
                        } else {
                            _this._getOrderReview();
                        }
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});
//订单(状态)——订单详情
var orderDetail = Vue.extend({
    template : "#orderDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
            },
            "select" : {
                "status" : [
                    {"val":1,"name":"待付款"}
                    ,{"val":2,"name":"提货/发货"}
                    ,{"val":4,"name":"退款中"}
                    ,{"val":3,"name":"已完成"}
                ],
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
    methods : {},
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        if( !_this.parentMsg.order.database.order_no ){
            return backPage("order");
        }
        loaded();
    }
});

//个人
var personal= Vue.extend({
    template : "#personal_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "pop":{
                "isPop":false,
                "selectedItem":'b',
            },
            "base" : {
                "token" : "",
                "database":{}
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
        _goBossPage : function(){
            var _this = this;
            $("#loading").show();
            var host = window.location.href.split("?")[1];
            _this.pop.selectedItem = "a";
            location.href = "../boss/index.html?" + host.split("#!/")[0];
        },
        _goStaffPage : function(){
            var _this = this;
            $("#loading").show();
            var host = window.location.href.split("?")[1];
            _this.pop.selectedItem = "c";
            location.href = "../index.html?" + host.split("#!/")[0];
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
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.parentMsg.base.user_id;
            var url = "http://www.zsb2b.com:8081/shopowner_personnel/personal_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    console.log('个人 base.database');
                    console.log(_this.base.database);
                    _this.parentMsg.base.shopowner_id=_this.base.database.shopowner_id;
                }else {
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
        _alertShow : function(){
            layer.msg("更多的功能在陆续开发中...",{icon:0});
        },
        _goProduct : function(){
            var _this = this;
            sessionStorage.setItem("productBack","personal");
            routerHref('manageProduct');
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
		_this.parentMsg.personal.managePerson.title='a';
        _this.base.token = sessionStorage.getItem("token");
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
//个人——店铺设置
var storeSetting= Vue.extend({
    template : "#storeSetting_page",
    props: ['parent'],
    data : function(){
        return {
            'isReadOnly':true,
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "database":{},
				"oldDatabase":{
                    "address":'',
                    "image":'',
                    "shop_name":'',
                    "phone":'',
                    "id":'',
                    "token":''
                }
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
                    _this._getShop();
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
        _getShop : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/shopowner_personnel/shop_get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
					_this.base.oldDatabase.address=_this.base.database.address;
                    _this.base.oldDatabase.image=_this.base.database.image;
                    _this.base.oldDatabase.shop_name=_this.base.database.shop_name;
                    _this.base.oldDatabase.phone=_this.base.database.phone;
					_this.base.oldDatabase.id=_this.base.database.id;
                    _this.base.oldDatabase.token= _this.base.token;
                    console.log('店铺设置 base.database');
                    console.log(_this.base.database);
                }else {
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
        _reviseShop : function(){
            var _this = this;
            var data ={};
			data.token = _this.base.token;
            data.id=_this.base.database.id;
            data.address=_this.base.database.address;
			data.image=_this.base.database.image;
			data.shop_name=_this.base.database.shop_name;
			data.phone=_this.base.database.phone;
            if(data.address==_this.base.oldDatabase.address&&data.image==_this.base.oldDatabase.image&&data.shop_name==_this.base.oldDatabase.shop_name&&data.phone==_this.base.oldDatabase.phone){
                return layer.msg("数据未做修改",{icon:0});
            }
            console.log('提交的数据data');
            console.log(data);
			if( !data.address ){
                return layer.msg("店铺地址不能为空",{icon:0});
            }
            if( !data.shop_name ){
                return layer.msg("店铺名称不能为空",{icon:0});
            }
            if( !/^1(3|4|5|7|8)\d{9}$/.test(data.phone) ){
                return layer.msg("联系电话格式不正确",{icon:0});
            }
			var url = "http://www.zsb2b.com:8081/shopowner/update_information";
			_this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
				var result = response.body;
				console.log(result);
				if( result.error_code == 0 ){
					_this.isReadOnly=true;
					layer.msg(result.data,{icon:1});
					_this._getShop();
				}else {
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
            console.log(file);
            if( file.length == 0 ){ return };
			//document.querySelector('#shopImgFile').addEventListener('change', function () {
				lrz(file[0], {
					quality:0.7,
					width:100
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
						console.log(11,result);
						if( result.error_code == 0 ){
							_this.base.database.image = result.data;
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
			//});
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
        userLogin(function() {
            setTimeout(function () {
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getShop();
                    } else {
                        _this._getManagerId();
                    }
                }
            }, 350)
        });
    }
});
//个人——人员管理/店铺管理
var managePerson= Vue.extend({
    template : "#managePerson_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "database":{},
            },
            "title":"",//a为人员管理,b为店铺管理
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
                    _this._getStaff();
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
        _getStaff : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.parentMsg.base.shopowner_id;
            var url = "http://www.zsb2b.com:8081/shopowner_personnel/personnel_management";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    console.log('人员管理 base.database');
                    console.log(_this.base.database);
					setTimeout(function(){
						myScroll.refresh();
					},300);
                }else {
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
		_gotoDataInfoPage:function(i){
            var _this=this;
            routerHref("dataInfo");
            _this.parentMsg.personal.managePerson.currentStaffId=i;
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
		_this.title=_this.parentMsg.personal.managePerson.title;
        _this.base.token = sessionStorage.getItem("token");
        loaded();
		userLogin(function() {
            setTimeout(function () {
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getStaff();
                    } else {
                        _this._getManagerId();
                    }
                }
            }, 350);
        });
    }
});
//个人——人员管理——资料信息
var dataInfo = Vue.extend({
    template : "#dataInfo_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "currentPersonId":'',
                "database":{},
                "storeInfo":{}
            },
            "title":{
                "tab":'b',
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
	},
    watch : {},
    methods : {
        _getStaffInfoAll:function(){
            var _this = this;
            _this.title.tab='b';
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.currentStaffId;
            var url = "http://www.zsb2b.com:8081/shopowner_personnel/personal_details";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    console.log('资料信息 base.database');
                    console.log(_this.base.database);
					setTimeout(function(){
                        myScroll.refresh();
                    },300)
                }else {
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
		_getStaffInfo:function(){
            var _this=this;
            _this.title.tab='a';
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.currentStaffId=_this.parentMsg.personal.managePerson.currentStaffId;
        loaded();
        userLogin(function() {
            setTimeout(function () {
                _this._getStaffInfoAll();
            }, 350)
        });
    }
});
//个人——产品管理
var manageProduct= Vue.extend({
    template : "#manageProduct_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "dataList" : [],
                "totalData" : 0,
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
            },
            "search" : {
                "status" : 0,
            },
            "title":{
                "tabs" : 0,
                "type" : 1,
                "isDropDown":false,
                "isPop":false,
            },
            "select" : {
                "status" : [
                    {"val":0,"name":"全部产品"}
                    ,{"val":1,"name":"出售中"}
                    ,{"val":2,"name":"已下架"}
                    ,{"val":3,"name":"零库存"}
                ],
                "type" : [
                    {"val":1,"name":"钻石","isDropDown":false,"data":[
                        {"val":1,"name":"钻石"}
                        ,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"女戒"}
                        ,{"val":4,"name":"吊坠"}
                        ,{"val":5,"name":"手链"}
                    ]}
                    ,{"val":2,"name":"珍珠","isDropDown":false,"data":[
                        {"val":1,"name":"珍珠"}
						,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"女戒"}
                        ,{"val":4,"name":"吊坠"}
                        ,{"val":5,"name":"手链"}
                    ]}
                    ,{"val":3,"name":"彩宝","isDropDown":false,"data":[
                        {"val":1,"name":"彩宝"}
						,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"女戒"}
                        ,{"val":4,"name":"吊坠"}
                        ,{"val":5,"name":"手链"}
                    ]}
                    ,{"val":4,"name":"素金","isDropDown":false,"data":[
                        {"val":1,"name":"素金"}
						,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"女戒"}
                        ,{"val":4,"name":"吊坠"}
                        ,{"val":5,"name":"手链"}
                    ]}
                ],
                "addType" : [
                    {"val":1,"name":"钻石","data":[
                        {"val":1,"name":"女戒"}
                        ,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"对戒"}
                        ,{"val":4,"name":"手链"}
                        ,{"val":5,"name":"项链"}
                    ]}
                    ,{"val":2,"name":"钻石","data":[
                        {"val":1,"name":"女戒"}
                        ,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"对戒"}
                        ,{"val":4,"name":"手链"}
                        ,{"val":5,"name":"项链"}
                    ]}
                ],
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
        eachType : function(vals, index){
            var _this = this;
            var name = "";
            for( var i in _this.select.type[index].data ){
                if( vals == _this.select.type[index].data[i].val ){
                    name = _this.select.type[index].data[i].name;
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
    watch : {
        "search.status" : function(val){
            var _this = this;
            _this._getProduct();
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
                        _this._getProduct();
                    }
                }
            })
        },
        _toggleTabs:function (val) {
            var _this=this;
            _this.title.isDropDown = false;
            _this.search.status = val;
        },
        _toggleType : function(index,val){
            var _this = this;
            _this.title.tabs = val;
            _this.title.tabs = val;
            var i=_this.select.type[index].isDropDown;
            _this.select.type.forEach(function(item,index){
                item.isDropDown=false;
            });
            _this.select.type[index].isDropDown = !i;
        },
		_toggleTheFirst : function(){
            var _this=this;
            _this.title.tabs = 0;
            _this.select.type.forEach(function(item,index){
                item.isDropDown=false;
            });
        },
        _getProduct : function(){//获取活动
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.shop_id = _this.parentMsg.base.shopowner_id;
            data.status = _this.search.status;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/shopowner_product/product_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data.list;
                    _this.base.totalData = result.data.totalrecord;
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
                    _this._getProduct();
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
        _productBack : function(){
            var _this = this;
            var productBack = sessionStorage.getItem("productBack");
            if( productBack ){
                sessionStorage.removeItem("productBack");
                backPage(productBack);
            } else {
                goBack();
            }
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
                        _this._getProduct();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});
//个人——产品管理——新增产品
var addGoods = Vue.extend({
    template : "#addGoods_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "foot" : true,
                "typeone" : "",
                "typetwo" : "",
                "typeName" : "",
                "describe" : false,
            },
            "add" : {
                "name" : "",
                "barcode" : "",
                "money" : "",
                "stock" : "",
                "parameter" : [],
                "remark" : "",
                "carousel_figure" : [],
                "image" : [],
            },
            "select" : {
                "addType" : [
                    {"val":1,"name":"钻石","data":[
                        {"val":1,"name":"女戒"}
                        ,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"对戒"}
                        ,{"val":4,"name":"手链"}
                        ,{"val":5,"name":"项链"}
                    ]}
                    ,{"val":2,"name":"钻石","data":[
                        {"val":1,"name":"女戒"}
                        ,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"对戒"}
                        ,{"val":4,"name":"手链"}
                        ,{"val":5,"name":"项链"}
                    ]}
                ],
            }
        }
    },
    filters: {},
    watch : {},
    methods : {
        _hideFoot : function(){
            var _this = this;
            _this.base.foot = false;
        },
        _showFoot : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
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
        _getTypeName : function(){
            var _this = this;
            for(var i in _this.select.addType){
                if( _this.base.typeone == _this.select.addType[i].val ){
                    for(var j in _this.select.addType[i].data){
                        if( _this.base.typetwo == _this.select.addType[i].data[j].val ){
                            _this.base.typeName = _this.select.addType[i].data[j].name;
                        }
                    }
                }
            }
        },
        _save : function(){
            var _this = this;
            var error = {};
            error.name = [/.+/ , '产品名称不能为空'];
            // error.barcode =  [ /.+/ , "条码不能为空" ];
            error.money  = [ /.+/ ,"销售价格不能为空" ];
            error.stock  = [ /.+/ ,"库存不能为空" ];
            for(var i in error){
                if( !error[i][0].test( _this.add[i])){
                    return layer.msg(error[i][1],{icon:0});
                }
            }
            if( _this.add.image.length == 0 ){
                return layer.msg("产品轮播图不能为空",{icon:0});
            }
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.shop_id = _this.parentMsg.base.shopowner_id;
            data.product_source = 1;
            data.name = _this.add.name;
            data.type = _this.base.typeone;
            data.type1 = _this.base.typetwo;
            data.barcode = _this.add.barcode;
            data.money = _this.add.money;
            data.stock = _this.add.stock;
            data.parameter = _this.add.parameter;
            data.remark = _this.add.remark;
            data.carousel_figure = JSON.stringify(_this.add.carousel_figure);
            data.image = JSON.stringify(_this.add.image);
            console.log(data)
            var url = "http://www.zsb2b.com:8081/products/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    layer.msg("添加成功",{icon:1,time:1200});
                    setTimeout(function(){
                        backPage("manageProduct");
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
        _addInfo : function(){
            var _this = this;
            var data = {"key":"","name":""};
            _this.add.parameter.push(data);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _removeInfo : function(index){
            var _this = this;
            _this.add.parameter.splice(index,1);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _startMove : function(){
            var _this = this;
            _this.base.foot = false;
            document.removeEventListener('touchmove', handler, false);
        },
        _stopMove : function(){
            var _this = this;
            _this.base.foot = true;
            $('.wrapper').scrollTop(0);
            $('.wrapper').scrollLeft(0);
            document.addEventListener('touchmove', handler, false);
        },
        _showProductDescribe : function(obj){
            var _this = this;
            _this.base[obj] = true;
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _alertBanner : function(){
            layer.msg("最多只能上传5张",{icon:0})
        },
        _removeImg : function(obj,index){
            var _this = this;
            _this.add[obj].splice(index,1);
            setTimeout(function(){
                myScroll.refresh();
            },300)
        },
        _selectBanner : function(file,obj){
            var _this = this;
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:750
            })
            .then(function (rst) {
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this.add[obj].push(result.data);
                        var img = new Image();
                        img.src = result.data;
                        img.onload = function(){
                            setTimeout(function(){
                                myScroll.refresh();
                            },300)
                        }
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
                layer.msg(err,{icon:2});
            })
            .always(function () {
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        if( !_this.$route.params.typeone ){
            return goBack();
        }
        _this.base.typeone = _this.$route.params.typeone;
        _this.base.typetwo = _this.$route.params.typetwo;
        _this._getTypeName();
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( !_this.parentMsg.base.manager_id ){
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});
//个人——消息
var message = Vue.extend({
    template : "#message_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "isPop":false,
                "dataList" : [],
                "title" : "",
                "detail" : "",
                "date" : "",
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
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            var url = "http://www.zsb2b.com:8081/notice/get_list_shopowner";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data;
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
                _this.base.title = obj.headline;
                _this.base.detail = obj.detailed;
                _this.base.date = obj.create_time;
                _this.base.isPop = true;
            } else {
                var data = {};
                data.notice_id = obj.id;
                data.shopowner_id = _this.parentMsg.base.shopowner_id;
                var url = "http://www.zsb2b.com:8081/notice/view_shopowner";
                _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;             
                if( result.error_code == 0 ){
                    _this.base.title = obj.headline;
                    _this.base.detail = obj.detailed;
                    _this.base.date = obj.create_time;
                    _this.base.isPop = true;
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
        _delOneMessage : function(){
            var _this = this;
            var data = {};
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.id = _this.base.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/delete_shopowner_one";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;            
                if( result.error_code == 0 ){
                    layer.msg('删除成功',{icon:1});
                    _this.base.isPop = false;
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
//个人——密码设置
var passwordSetting = Vue.extend({
    template : "#passwordSetting_page",
    props: ['parent'],
    data : function(){
        return {
            "isPop":false,
        }
    },
    filters: {},
    watch : {},
    methods : {},
    ready : function(){
        var _this = this;
        loaded();
    }
});
//个人——更多
var more= Vue.extend({
    template : "#more_page",
    props: ['parent'],
    data : function(){
        return {}
    },
    filters: {},
    watch : {},
    methods : {},
    ready : function(){
        var _this = this;
        loaded();
    }
});
//个人——个人资料
var personalData = Vue.extend({
    template : "#personalData_page",
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
    filters: {},
    watch : {},
    methods : {
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/shopowner/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    _this.parentMsg.personalDataEdit.headimgurl = result.data[0].headimgurl;
                    _this.parentMsg.personalDataEdit.nickname = result.data[0].nickname;
                    _this.parentMsg.personalDataEdit.mobile = result.data[0].mobile;
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
                    _this._getPersonal();
                }
            },350)
        });
    }
});
//个人——个人资料修改
var personalDataEdit = Vue.extend({
    template : "#personalData_edit",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "type" : "",
                "headimgurl" : "",
                "nickname" : "",
                "mobile" : "",
                "editImg" : "",
            },
        }
    },
    filters: {},
    watch : {},
    methods : {
        _selectImg : function(file){
            var _this = this;
            if( file.length == 0 ){ return };
            lrz(file[0], {
                quality:0.7,
                width:200
            })
            .then(function (rst) {
                return rst;
            })
            .then(function (rst) {
                var data = {};
                var uploadUrl = "http://www.zsb2b.com:8081/img_upload/up";
                data.data = rst.base64;
                _this.$http.post(uploadUrl, data ,{emulateJSON:true}).then(function(response){
                    var result = response.body;
                    if( result.error_code == 0 ){
                        _this.base.headimgurl = result.data;
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
                layer.msg(err,{icon:2});
            })
            .always(function () {
            });
        },
        _save : function(){
            var _this= this;
            var data = {};
            var demo = /^1(3|4|5|7|8)\d{9}$/;
            data.token = _this.base.token;
            data.status = 1;
            if( _this.base.type == 1 ){
                if( !_this.base.headimgurl ){
                    return layer.msg("请先上传头像",{icon:0});
                }
                data.headimgurl = _this.base.headimgurl;
            } else if( _this.base.type == 2 ){
                if( !_this.base.nickname ){
                    return layer.msg("用户名不能为空",{icon:0});
                }
                data.nickname = _this.base.nickname
            } else if( _this.base.type == 3 ){
                if( !demo.test(_this.base.mobile) ){
                    return layer.msg("请输入正确的联系电话",{icon:0});
                }
                data.mobile = _this.base.mobile
            }
            var url = "http://www.zsb2b.com:8081/shopowner/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    layer.msg("修改成功",{icon:1,time:1200});
                    setTimeout(function(){
                        goBack();
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
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/shopowner/get";
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
        _this.base.type = _this.$route.params.typeone;
        _this.base.headimgurl = _this.parentMsg.personalDataEdit.headimgurl;
        _this.base.nickname = _this.parentMsg.personalDataEdit.nickname;
        _this.base.mobile = _this.parentMsg.personalDataEdit.mobile;
        loaded();
        userLogin(function(){});
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
//产品选择
var selectProduct = Vue.extend({
    template : "#selectProduct_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "dataList" : [],
                "totalData" : 0,
                "page" : 1,
            },
            "search" : {
                "status" : 1,
            },
            "title":{
                "tabs" : 0,
                "type" : 1,
            },
            "select" : {
                "status" : [
                    {"val":0,"name":"全部产品"}
                    ,{"val":1,"name":"出售中"}
                    ,{"val":2,"name":"已下架"}
                    ,{"val":3,"name":"零库存"}
                ],
                "type" : [
                    {"val":1,"name":"钻石","isDropDown":false,"data":[
                        {"val":1,"name":"钻石"}
                        ,{"val":2,"name":"男戒"}
                        ,{"val":3,"name":"女戒"}
                        ,{"val":4,"name":"吊坠"}
                        ,{"val":5,"name":"手链"}
                    ]}
                    ,{"val":2,"name":"珍珠","isDropDown":false,"data":[
                        {"val":1,"name":"珍珠"}
                    ]}
                    ,{"val":3,"name":"彩宝","isDropDown":false,"data":[
                        {"val":1,"name":"彩宝"}
                    ]}
                    ,{"val":4,"name":"素金","isDropDown":false,"data":[
                        {"val":1,"name":"素金"}
                    ]}
                ],
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
        eachType : function(vals, index){
            var _this = this;
            var name = "";
            for( var i in _this.select.type[index].data ){
                if( vals == _this.select.type[index].data[i].val ){
                    name = _this.select.type[index].data[i].name;
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
        _toggleType : function(index,val){
            var _this = this;
            _this.title.tabs = val;
            _this.select.type[index].isDropDown = !_this.select.type[index].isDropDown;
        },
        _getProduct : function(){//获取活动
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.shop_id = _this.parentMsg.base.shopowner_id;
            data.status = _this.search.status;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/shopowner_product/product_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.dataList = result.data.list;
                    _this.base.totalData = result.data.totalrecord;
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
                    _this._getProduct();
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
        _selectOne : function(obj){
            var _this = this;
            _this.parentMsg.product.image = obj.image;
            _this.parentMsg.product.title = obj.name;
            _this.parentMsg.product.price = obj.money;
            _this.parentMsg.product.quality = obj.stock;
            _this.parentMsg.product.product_id = obj.id;
            goBack();
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
                        _this._getProduct();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});
//活动详情
var activityDetail = Vue.extend({
    template : "#activityDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "type" : "",
                "oid" : "",
                "database" : {},
                "product" : {},
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
        _getType : function(){
            var _this = this;
            if( _this.base.type == 1 ){
                _this._getSingleDetail();
            } else if( _this.base.type == 2 ){
                _this._getBarginDetail();
            }
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
        _getSingleDetail : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/single_product/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    _this._getProduct(result.data[0].product_id)
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
        _getBarginDetail : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.parentMsg.editActivity.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/bargain/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.add.database = result.data[0];
                    _this._getProduct(result.data[0].product_id)
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
        _this.base.type = _this.$route.params.typeone;
        _this.base.oid = _this.$route.params.typetwo;
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

//搜索
var search = Vue.extend({
    template : "#search_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "delShow" : false,
                "type" : "",
                "dataList" : [],
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
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
            data.type = _this.base.type;
            console.log(data);
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
            if( !_this.base.info ){
                return;
            }
            if( _this.base.type == 1 ){
                sessionStorage.setItem("param_text",_this.base.info);
                routerHref("order");
            } else if( _this.base.type == 2 ){
                // sessionStorage.setItem("param_text",_this.base.info);
                // routerHref("promotion");
            }
        },
        _delSearch : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.shopowner_id = _this.parentMsg.base.shopowner_id;
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
            _this.base.info = info;
            _this._goSearch();
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.type = _this.$route.params.typeone;
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

//单品活动预览
var activityView = Vue.extend({
    template : "#activityView_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg":{},
            "base" : {
                "token" : "",
                "activity_id" : "",
                "activity_type" : "",
                "banner" : [],
                "detail" : [],
                "database" : {
                    "title" : "",
                    "floor_price" : "",
                    "product_quantity" : "",
                    "product_introduction" : "",
                },
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
                _this._getProduct();
            } else if( _this.base.activity_type == 'a' ){
                _this._singlePreview();
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
        _singlePreview : function(){
            var _this = this;
            _this.base.banner = _this.parentMsg.singlePreView.banner;
            _this.base.database.title = _this.parentMsg.singlePreView.title;
            _this.base.database.floor_price = _this.parentMsg.singlePreView.price;
            _this.base.database.product_quantity = _this.parentMsg.singlePreView.number;
            _this.base.database.product_introduction = _this.parentMsg.singlePreView.text;
            _this.base.detail = _this.parentMsg.singlePreView.detail;
            setTimeout(function(){
                myScroll.refresh();
                _this._banner();
                _this._easyLoad();
            },500)
        },
        _banner : function(){
            var _this = this;
            if( _this.base.banner.length > 1 ){
                var swiper = new Swiper('.activityView_banner.swiper-container', {
                    pagination: '.circle.swiper-pagination',
                    paginationClickable: true,
                    loop: true,
                    centeredSlides: true,
                    autoplay: 4000,
                    autoplayDisableOnInteraction: false
                });
            }
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
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.activity_type = _this.$route.params.typeone;
        _this.base.activity_id = _this.$route.params.typetwo;
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
                },
                "product" : {
                    "image" : "",
                    "title" : "",
                    "price" : "",
                    "quality" : "",
                    "product_id" : "",
                },
                "single" : {
                    "product_id" : "",
                    "title" : "",
                    "start_time" : "",
                    "end_time" : "",
                    "start_up_money_all" : "",
                    "product_quantity" : "",
                    "original_price" : "",
                    "floor_price" : "",
                    "bargain_times" : "",
                    "max_sale" : "",
                    "min_sale" : "",
                    "share_money_time" : "",
                    "forward_money_time" : "",
                    "browse_money_time" : "",
                    "sale_profit" : "",
                    "direct_profit" : "",
                    "indirect_profit" : "",
                    "image_logo" : "",
                    "banner_top" : [],
                    "product_introduction" : "",
                    "product_introduction_img" : [],
                },
                "bargin" : {
                    "product_id" : "",
                    "title" : "",
                    "start_time" : "",
                    "end_time" : "",
                    "start_up_money_all" : "",
                    "gift_quantity" : "",
                    "original_price" : "",
                    "floor_price" : "",
                    "bargain_times" : "",
                    "max_sale" : "",
                    "min_sale" : "",
                    "share_money_time" : "",
                    "forward_money_time" : "",
                    "browse_money_time" : "",
                    "gift_describe_txt" : "",
                    "activity_rules" : "",
                    "award_information" : "",
                    "company_introduction" : "",
                    "banner" : [],
                    "detail" : [],
                    "company" : [],
                },
                "editActivity" : {
                    "oid" : "",
                },
                "order" : {
                    "database" : {},
                    "title" : "",
                    "pay_status" : "",
                    "status" : "",
                },
                "personalDataEdit" : {
                    "headimgurl" : "",
                    "nickname" : "",
                    "mobile" : "",
                },
                "personal":{
					"managePerson":{
                        "currentStaffId":'',
						"title":'a',
                    },
                },
                "singlePreView" : {
                    "banner" : [],
                    "title" : "",
                    "price" : "",
                    "number" : "",
                    "text" : "",
                    "detail" : [],
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
})

//路由
router.map({
    '/activity': {
        component: activity,
    },
    '/addActivitySingle':{
        component:addActivitySingle,
    },
    '/addActivityBargain': {
        component: addActivityBargain,
    },
    '/addGoods/:typeone/:typetwo':{
        name : "addGoods",
        component:addGoods,
    },
    '/order':{
        component:order,
    },
    '/orderDetail':{
        component:orderDetail,
    },
    '/personal':{
        component:personal,
    },
    '/storeSetting':{
        component:storeSetting,
    },
    '/managePerson':{
        component:managePerson,
    },
    '/manageProduct':{
        component:manageProduct
    },
    '/message':{
        component:message
    },
    '/passwordSetting':{
        component:passwordSetting
    },
    '/more':{
        component:more
    },
    '/dataInfo':{
        component:dataInfo,
    },
    '/count':{
        component:count,
    },
    '/spokesmanRanking':{
        component:spokesmanRanking,
    },
    '/error':{
        component:error,
    },
    '/selectProduct':{
        component:selectProduct,
    },
    '/editSingle':{
        component:editSingle,
    },
    '/editBargain':{
        component:editBargain,
    },
    '/activityDetail/:typeone/:typetwo':{
        name : "activityDetail",
        component:activityDetail,
    },
    '/search/:typeone/:typetwo':{
        name : "search",
        component:search,
    },
	'/personalData':{
        component:personalData,
    },
    '/personalDataEdit/:typeone':{
        name : "personalDataEdit",
        component:personalDataEdit,
    },
    '/activityView/:typeone/:typetwo':{
        name : "activityView",
        component:activityView,
    },
});

router.redirect({
    '/': '/personal'
})


function routerHref(href){
    router.go({path : '/' + href});
}

function routerProductAdd(href,typeone,typetwo){
    if( typetwo ){
        router.go({name : href,params : {typeone:typeone,typetwo:typetwo}});
    } else {
        router.go({name : href,params : {typeone:typeone}});
    }
}

function goBack(){
    router.back = true;
    window.history.go(-1);
}

function backPage(page){
    router.back = true;
    setTimeout(function(){
        router.go({path : '/' + page});
    },0)
}

//用户登录
function userLogin(callback){
    var host = window.location.href;
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
        console.log(2222333,data)
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