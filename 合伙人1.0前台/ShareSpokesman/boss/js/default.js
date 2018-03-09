
var App,myScroll,grade;
var router = new VueRouter({});
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
        clearTimeout(timeout);
        $('#loading').hide();
        return response;
    })
})
Vue.http.options._timeout = 15000;

//管理
var manage = Vue.extend({
    template : "#manage_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
            },
        }
    },
    filters: {},
    watch : {},
    methods : {
        _goGetCash : function(){
            var _this = this;
            _this.parentMsg.review.title = "b";
            _this.parentMsg.review.status = 0;
            routerHref("review");
        },
        _goReturn : function(){
            var _this = this;
            _this.parentMsg.totalOrder.status = 2;
            routerHref("orderStatistics")
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token"); 
        loaded();    
        userLogin(function(){});
    }
});
//管理——资产统计
var assetsCount= Vue.extend({
    template : "#assetsCount_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "colorIndex" : 0,
                "orderNum" : 0,
                "status" : 1,
                "isSelect" : false,
                "currentTab" : 1,
            },
            "select" : {
                "pieColor" : [
                    {"val":1,"name":"#e76610"}
                    ,{"val":2,"name":"#6abdc3"}
                    ,{"val":3,"name":"#e0b42e"}
                    ,{"val":4,"name":"#4eb685"}
                    ,{"val":5,"name":"#e94a49"}
                    ,{"val":6,"name":"#79c2e3"}
                    ,{"val":7,"name":"#71c5b7"}
                    ,{"val":8,"name":"#9acb69"}
                    ,{"val":9,"name":"#f5cd4b"}
                    ,{"val":10,"name":"#f08652"}
                ],
                "dayList" : [
                    {"val":1,"name":"近7日"}
                    ,{"val":2,"name":"近30日"}
                ],
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
                    _this._getOrderNum();
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
        _getOrderNum : function(){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.status = 1;
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_personnel/revenue_and_expenditure_statistics";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    var dataArr = [];
                    // for(var i=0;i<result.data.length;i++){
                    //     _this.base.orderNum = eval(_this.base.orderNum + result.data[i].count);
                    // }
                    function forEach(index){
                        if( index >= result.data.length ){
                            _this.base.dataList = dataArr;
                            return setTimeout(function(){
                                _this._creatCharts(dataArr);
                                myScroll.refresh();
                            },300)
                             
                        }
                        var num = _this.base.colorIndex;
                        _this.base.colorIndex ++;
                        if( num > 9 ){
                            num = 0;
                            _this.base.colorIndex = 1;
                        }
                        var obj = {name:result.data[index].shop_name,y:result.data[index].order_price_proportion * 100,color:_this.select.pieColor[num].name,price:result.data[index].total_price};
                        dataArr.push(obj);
                        forEach(index + 1);
                    }
                    // forEach(0);
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
        _creatCharts : function(data){
            var _this = this;
            console.log(11,data)
            if( data.length > 0 ){
                Highcharts.setOptions({ global: { useUTC: false } });
                $('#todayOrderPie').highcharts({
                    chart: {
                        plotBackgroundColor: "#f3f5f7",
                        plotBorderWidth: null,
                        plotShadow: false,
                        spacing : [0, 0 , 0, 0],
                    },
                    title : {
                        text:null
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: false,
                            cursor: 'pointer',
                            center: ["50%","50%"],
                            dataLabels: {
                                enabled: true,
                                format: '{point.percentage} %',
                            },
                            // colors:["#e76610","#6abdc3","#e0b42e","#4eb685"],
                        }
                    },
                    
                    series: [{
                        type: 'pie',
                        innerSize: '70%',
                        name: '今日下单',
                        data: data
                    }]
                });
            }
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
                        _this._getOrderNum();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});
//管理——资产明细
var assetsDetail= Vue.extend({
    template : "#assetsDetail_page",
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
                "date_start" : "",
                "date_end" : "",
                "dateSelect" : false,
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
        eachDate : function(val){
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
                        _this._getAssetDetail();
                    }
                }
            })
        },
        _getAssetDetail : function(){
            var _this = this;
            _this.base.dateSelect = false;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.token = _this.base.token;
            if( _this.base.date_start ){
                data.date_start = _this.base.date_start + " 00:00:00";
            } else {
                data.date_start = "";
            }
            if( _this.base.date_end ){
                data.date_end = _this.base.date_end + " 00:00:00";
            } else {
                data.date_end = "";
            }
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/asset/get_detail_list_manager";
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
                    _this._getAssetDetail();
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
                        _this._getAssetDetail();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});
//管理——组织架构
var structure = Vue.extend({
    template : "#structure_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "title" : "a",
                "token":'',
                "database":{},
            },
            "title" : {
                "tabs" : "a",
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
                    _this._getShops();
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
        _getShops : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.parentMsg.base.manager_id;
            var url = "http://www.zsb2b.com:8081/manager_personnel/shop_list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log('shop list');
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                }else{
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
        _goToStoreInfoPage:function(i){
            var _this=this;
            routerHref('storeInfo');
            _this.parentMsg.manage.storeData.currentStore=i;
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
                    if( !_this.parentMsg.base.manager_id ){
                        _this._getManagerId();
                    }else{
                        _this._getShops();
                    }
                }
            },350)
        });
    }
});
//管理——组织架构——店铺信息
var storeInfo= Vue.extend({
    template : "#storeInfo_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token":'',
                "currentStore":"",
                "database":{},
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
    },
    watch : {},
    methods : {
        _getShopInfo : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.currentStore;
            var url = "http://www.zsb2b.com:8081/manager_personnel/shop_staff";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log('staff list');
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    setTimeout(function(){
                        myScroll.refresh();
                    },300)
                }else{
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
        _goToDataInfoPage:function(i){
            var _this=this;
            routerHref('dataInfo');
            _this.parentMsg.manage.storeData.currentStaffId=i;
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.currentStore = _this.parentMsg.manage.storeData.currentStore;
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._getShopInfo();
                }
            },350);
        });
    }
});
//管理——组织架构——店铺信息——店铺资料
var storeData= Vue.extend({
    template : "#storeData_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token":'',
                "currentStore":"",
                "database":{},
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
    },
    watch : {},
    methods : {
        _getShopData : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.currentStore;
            console.log("提交的数据");
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_personnel/shop_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log('shop information');
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                }else{
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
        _this.base.currentStore = _this.parentMsg.manage.storeData.currentStore;
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._getShopData();
                }
            },350);
        });
    }
});
//管理——代言人
var spokesman= Vue.extend({
    template : "#spokesman_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token":'',
                "database":{},
            },
			"sortWay":'a',//a为unicode排序，b为按所属店铺排序，c为按等级排序
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
                    _this._getStaffs();
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
        _getStaffs : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            var url = "http://www.zsb2b.com:8081/manager_personnel/manager_staff";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log('staffs list');
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data;
                    setTimeout(function(){
                        myScroll.refresh();
						initials('a');
                    },0)
                }else{
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
        _goToDataInfoPage:function(i){
            var _this=this;
            routerHref('dataInfo');
            _this.parentMsg.manage.storeData.currentStaffId=i;
        },
		_sortStaffs:function(i){
            var _this=this;
            //_this.sortWay=i;
			$(".sort_letter").remove();
			initials(i);
			//var url=window.location.href+'/'+i;
            //history.pushState({"sortWay":i},'', url);
        },
		_goBack:function(){
            var _this=this;
            goBack();
            //_this.sortWay='a';
			//$(".sort_letter").remove();
			//initials('a');
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
		_this.sortWay='a';
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( !_this.parentMsg.base.manager_id ){
                        _this._getManagerId();
                    }else{
                        _this._getStaffs();
                    }
                }
            },350);
        });
    }
});

//审核
var review = Vue.extend({
    template : "#review_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "title" : "a",
                "token" : "",
                "manager_id" : "",
                "dataList" : [],
                "cashList" : [],
                "returnList" : [],
                "page" : 1,
                "maxLength" : 0,
                "text" : "",
                "onoff" : false,
                "isPop" : false,
                "oid" : "",
                "pid" : "",
            },
            "title" : {
                "tabs" : 0,
            },
            "select" : {
                "typeName" : [
                    ,{"val":1,"name":"单品活动"}
                    ,{"val":2,"name":"砍价活动"}
                    ,{"val":3,"name":"众筹活动"}
                    ,{"val":4,"name":"拼团活动"}
                    ,{"val":5,"name":"拍卖活动"}
                    ,{"val":6,"name":"传单活动"}
                ],
                "status" : [
                    ,{"val":1,"name":"待付款"}
                    ,{"val":2,"name":"待提货/发货"}
                    ,{"val":3,"name":"已完成"}
                    ,{"val":4,"name":"退款中"}
                    ,{"val":5,"name":"已退款"}
                ],
                "statusReview" : [
                    {"val":4,"name":"未审核"}
                    ,{"val":5,"name":"已审核"}
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
        eachDate : function(date,format){
            if (!date) return;   
            if (!format){
                format = "YYYY-MM-DD";
            }
            return moment(moment.unix(date)).format(format);    
        },
    },
    watch : {
        "base.title" : function(val){
            var _this = this;
            if( !_this.parentMsg.review.title ){
                if( val == 'a' ){
                    _this._getPromotion();
                } else if( val == 'b' ){
                    _this._getCashList();
                } else if( val == 'c' ){
                    _this._getReturn();
                }
            }
        },
        "title.tabs" : function(val){
            var _this = this;
            if( !_this.parentMsg.review.title ){
                if( _this.base.title == 'a' ){
                    _this._getPromotion();
                } else if( _this.base.title == 'b' ){
                    _this._getCashList();
                } else if( _this.base.title == 'c' ){
                    _this._getReturn();
                }
            }
        },
    },
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
                            if( _this.base.title == 'a' ){
                                _this._getPromotion();
                            } else if( _this.base.title == 'b' ){
                                _this._getCashList();
                            } else if( _this.base.title == 'c' ){
                                _this._getReturn();
                            }
                        }
                    }
                })
            },500)
        },
        _getTitle:function(){
            var _this = this;
            _this.parentMsg.review.title = "";
            _this.parentMsg.review.status = "";
            if( _this.base.title == 'a' ){
                _this._getPromotion();
            } else if( _this.base.title == 'b' ){
                _this._getCashList();
            } else if( _this.base.title == 'c' ){
                _this._getReturn();
            }
        },
        _getPromotion : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.boss_id = _this.parentMsg.base.manager_id;
            data.status = _this.title.tabs;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/activity_all/get_boss";
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
        _getCashList : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.status = _this.title.tabs;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/tixian/list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.cashList = result.data.list;
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
        _getReturn : function(){
            var _this = this;
            var data = {};
            var pagesize = 10 * _this.base.page;
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.status = _this.title.tabs;
            data.pagesize = pagesize;
            data.currentpage = 0;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/refund/list";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                _this.base.onoff = false;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.returnList = result.data.list;
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
                    _this._getTitle();
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
        _goReview : function(type,oid){
            var _this = this;
            _this.parentMsg.review.title = _this.base.title;
            _this.parentMsg.review.status = _this.title.tabs;
            _this.parentMsg.review.type = type;
            _this.parentMsg.review.oid = oid;
            routerHref('activityDetail');
        },
        _goDataInfo : function(){
            var _this = this;
            _this.parentMsg.review.title = _this.base.title;
            _this.parentMsg.review.status = _this.title.tabs;
            routerHref('dataInfo');
        },
        _showCashReview : function(obj){
            var _this = this;
            _this.base.oid = obj.tx_id;
            _this.base.pid = obj.id;
            _this.base.isPop = true;
        },
        _passCashReview : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.oid;
            data.status = 1;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/tixian/tixian_status";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this._passCashNews();
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
        _passCashNews : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.notice_type = 2;
            data.pid = _this.base.pid;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "提现审核已通过";
            data.detailed = "提现审核已通过";
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.isPop = false;
                    layer.msg("审核成功",{icon:1,time:1200});
                    setTimeout(function(){
                        _this._getCashList();
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
                    layer.msg("审核成功，消息推送失败",{icon:0});
                } else {
                    layer.msg('审核成功，消息推送失败',{icon:0});
                }
            });
        },
        _showReturnReview : function(obj){
            var _this = this;
            _this.base.oid = obj.refund_id;
            _this.base.isPop = true;
        },
        _passReturnReview : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/refund/status_change";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.isPop = false;
                    layer.msg("审核成功",{icon:1,time:1200});
                    setTimeout(function(){
                        _this._getReturn();
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
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token"); 
        if( _this.parentMsg.review.title ){
            _this.base.title = _this.parentMsg.review.title;
        }
        if( _this.parentMsg.review.status ){
            _this.title.tabs = _this.parentMsg.review.status;
        }
        _this._loaded();    
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getTitle();
                    } else {
                        _this._getManagerId();
                    }                
                }
            },350)
        });
    }
});
//审核——活动详情
var activityDetail= Vue.extend({
    template : "#activityDetail_page",
    props: ['parent'],
    data : function(){
        return {
            "base" : {
                "token" : "",
                "type" : "",
                "database" : {},
                "product" : {},
                "isPop":false,
                "image_logo" : "",
                "banner_top" : [],
                "product_introduction_img" : [],
                "gift_describe" : [],
                "company_introduction_img" : [],
            },
            "select" : {
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
        _getType:function(){
            var _this = this;
            _this.base.type = _this.parentMsg.review.type;
            if( _this.parentMsg.review.type == 1 ){
                _this._getSingleDetail();
            } else if( _this.parentMsg.review.type == 2 ){
                _this._getBarginDetail();
            }
        },
        _getSingleDetail : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.parentMsg.review.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/single_product/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    _this.base.banner_top = JSON.parse(result.data[0].banner_top);
                    _this.base.product_introduction_img = JSON.parse(result.data[0].product_introduction_img);
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
            data.id = _this.parentMsg.review.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/bargain/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                    _this.base.gift_describe = JSON.parse(result.data[0].gift_describe);
                    _this.base.company_introduction_img = JSON.parse(result.data[0].company_introduction_img);
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
        _passActivity : function(){
            var _this = this;
            var data = {};
            data.boss_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.database.id;
            if( _this.base.type == 1 ){
                data.table_name = "db_single_product";
            } else if( _this.base.type == 2 ){
                data.table_name = "db_bargain";
            }
            data.status = 1;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/activity_all/update";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;               
                if( result.error_code == 0 ){
                    _this._passActivityNews();
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
        _passActivityNews : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.notice_type = 2;
            data.shopowner_id = _this.base.database.shopowner_id;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.headline = "活动已通过审核";
            data.detailed = '标题为"' + _this.base.database.title + '"的活动已通过审核';
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/add_shopowner";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(3,result)               
                if( result.error_code == 0 ){
                    _this.base.isPop = false;
                    layer.msg('审核成功',{icon:1,time:1200});
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
                    layer.msg("审核成功，消息推送失败",{icon:0});
                } else {
                    layer.msg('审核成功，消息推送失败',{icon:0});
                }
            });
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        if( !_this.parentMsg.review.type ){
            return goBack();
        }      
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._getType();                
                }
            },350)
        });
    }
});
//审核——资料信息
var dataInfo= Vue.extend({
    template : "#dataInfo_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token":'',
                "currentStaffId":'',
                "database":{},
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
        _getStaffInfoAll : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.id = _this.base.currentStaffId;
            var url = "http://www.zsb2b.com:8081/shopowner_personnel/personal_details";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log('staff info');
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                }else{
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
        _this.base.currentStaffId = _this.parentMsg.manage.storeData.currentStaffId;
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    _this._getStaffInfoAll();
                }
            },350);
        });
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
                    _this.parentMsg.personalDataEdit.company = result.data[0].company;
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
                "company" : "",
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
            if( _this.base.type == 1 ){
                if( !_this.base.headimgurl ){
                    return layer.msg("请先上传头像",{icon:0});
                }
                data.status = 1;
                data.headimgurl = _this.base.headimgurl;
            } else if( _this.base.type == 2 ){
                if( !_this.base.nickname ){
                    return layer.msg("用户名不能为空",{icon:0});
                }
                data.status = 1;
                data.nickname = _this.base.nickname
            } else if( _this.base.type == 3 ){
                if( !demo.test(_this.base.mobile) ){
                    return layer.msg("请输入正确的联系电话",{icon:0});
                }
                data.status = 1;
                data.mobile = _this.base.mobile
            } else if( _this.base.type == 4 ){
                if( !_this.base.company ){
                    return layer.msg("请输入您的企业名称",{icon:0});
                }
                data.status = 2;
                data.company = _this.base.company
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
        _this.base.company = _this.parentMsg.personalDataEdit.company;
        loaded();
        userLogin(function(){});
    }
});

//个人
var personal = Vue.extend({
    template : "#personal_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "pop":{
                "isPop":false,
                "selectedItem":1,
            },
            "base" : {
                "token" : "",
                "database":{},
                "personal":{},
                "is_manager" : "",
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
        _goShopPage : function(){
            var _this = this;
            $("#loading").show();
            var host = window.location.href.split("?")[1];
            _this.pop.selectedItem = 2;
            location.href = "../shopkeeper/index.html?" + host.split("#!/")[0];
        },
        _goStaffPage : function(val){
            var _this = this;
            $("#loading").show();
            var host = window.location.href.split("?")[1];
            _this.pop.selectedItem = val;
            sessionStorage.setItem("selectPower",val);
            location.href = "../index.html?" + host.split("#!/")[0];
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
                    _this.base.is_manager = result.data[0].is_manager;
                    sessionStorage.setItem("is_manager",result.data[0].is_manager);
                    sessionStorage.setItem("is_shopowner",result.data[0].is_shopowner);
                    sessionStorage.setItem("is_clerk",result.data[0].is_clerk);
                    sessionStorage.setItem("is_prolocutor",result.data[0].is_prolocutor);
                    _this._getLikePersonal();
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
            data.manager_id = _this.parentMsg.base.manager_id;
            data.open_id=_this.parentMsg.base.openid;
			console.log("提交的数据data");
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_personnel/personal_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                }else{
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
        _getLikePersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            var url = "http://www.zsb2b.com:8081/shopowner/get";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.personal = result.data[0];
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
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        _this.base.is_manager = sessionStorage.getItem("is_manager");
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( !_this.parentMsg.base.manager_id ){
                        _this._getManagerId();
                    }else{
                        _this._getLikePersonal();
                    }
                }
            },350)
        });
    }
});
//个人——密码设置
var passwordSetting = Vue.extend({
    template : "#passwordSetting_page",
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
//个人——充值
var recharge = Vue.extend({
    template : "#recharge_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            'base' : {
                "token" : "",
                "recharge" : "",
                "isPop" : false,
                "database" : {},
            },
            "select" : {
                "recharge" : [
                    {"val":200,"name":"200元"}
                    ,{"val":300,"name":"300元"}
                    ,{"val":400,"name":"400元"}
                    ,{"val":500,"name":"500元"}
                    ,{"val":1000,"name":"1000元"}
                    ,{"val":2000,"name":"2000元"}
                ],
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
        _selectRecharge : function(val){
            var _this = this;
            if( _this.base.recharge == val ){
                _this.base.recharge = "";
            } else {
                _this.base.recharge = val;
            }
        },
        _showRecharge : function(){
            var _this = this;
            if( !_this.base.recharge ){
                return layer.msg("请输入充值金额",{icon:0});
            }
            _this.base.isPop = true;
        },
        _goRecharge : function(){
            var _this = this;
            
            var data = {};
            data.token = _this.base.token;
            data.real_pay = _this.base.recharge;
            data.manager_id = _this.parentMsg.base.manager_id;
            console.log(1212,data) 
            var url = "http://www.zsb2b.com:8081/weixin_pay/jhkj_pay_manager_charge";
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
                    layer.msg("充值失败",{icon:0});
                } else {
                    layer.msg('充值失败',{icon:2});
                }
            });
        },
        _getPersonal : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.open_id = _this.parentMsg.base.openid;
            var url = "http://www.zsb2b.com:8081/manager_personnel/personal_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.database = result.data[0];
                }else{
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
                    if( !_this.parentMsg.base.manager_id ){
                        _this._getManagerId();
                    } else {
                        _this._getPersonal();
                    }               
                }
            },350)
        });
    }
});
//个人——提现
var getCash = Vue.extend({
    template : "#getCash_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "number" : "",
                "keyBoard" : false,
                "isPop" : false,
                "database" : {},
                "openid_jhkj" : "",
                "type" : "",
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
    watch : {},
    methods : {
        _fillInput : function(num){
            var _this = this;
            _this.base.number += num;
        },
        _deleteInput : function(){
            var _this = this;
            var length = _this.base.number.length;
            if( length != 0 ){
                _this.base.number = _this.base.number.substring(0,length - 1);
            }
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
            data.manager_id = _this.parentMsg.base.manager_id;
            data.open_id = _this.parentMsg.base.openid;
            var url = "http://www.zsb2b.com:8081/manager_personnel/personal_information";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result);
                if( result.error_code == 0 ){
                    _this.base.number = "";
                    _this.base.database = result.data[0];
                    if( result.data[0].openid_jhkj ){
                        _this.base.openid_jhkj = result.data[0].openid_jhkj;
                    }
                }else{
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
        _goGetOpenid : function(){
            var _this = this;
            var data = {};
            var host = window.location.href;
            var hostTwo = window.location.href.split("#")[0] + "#!/" + "getCash/2";
            var fans_id = getURLParam("fans_id",host);
            data.jump = hostTwo;
            data.fans_id = fans_id;
            data.amount = _this.base.number;
            data = parseParam( data );
            var url = "http://weixin.echao.com/app/index.php?i=4&c=entry&do=MemberOpenid&m=t_we_payment&notify=http%3A%2F%2Fwww.zsb2b.com%3A8081%2Ftixian%2Fwithdraw_cash_check_manager&" + data;
            location.href = url;
        },
        _bossGetCash : function(){
            var _this = this;
            if( !_this.base.number ){
                return layer.msg("请输入提现金额",{icon:0});
            }
            if( _this.base.number < 1 || _this.base.number > 200 ){
                return layer.msg("每次提现不能小于1元且大于200元",{icon:0});
            }
            if( _this.base.number > _this.base.database.amount ){
                return layer.msg("余额不足",{icon:0});
            }
            if( !_this.base.openid_jhkj ){
                return _this.base.isPop = true;
            }
            var data = {};
            data.token = _this.base.token;
            data.manager_id = _this.parentMsg.base.manager_id;
            data.amount = _this.base.number
            data.openid_jhkj = _this.base.openid_jhkj;
            var url = "http://www.zsb2b.com:8081/tixian/tixian_manager";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result);
                if( result.error_code == 0 ){
                    layer.msg("提现成功",{icon:1,time:1200});
                    setTimeout(function(){
                        _this._getPersonal();
                    },1200)
                }else{
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
        loaded();
        userLogin(function(){
            if( _this.base.type == 2 ){
                layer.msg("授权成功",{icon:1});
            }
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
            var url = "http://www.zsb2b.com:8081/notice/get_list_manager";
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
                data.manager_id = _this.parentMsg.base.manager_id;
                var url = "http://www.zsb2b.com:8081/notice/view_manager";
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
            data.manager_id = _this.parentMsg.base.manager_id;
            data.id = _this.base.oid;
            console.log(data)
            var url = "http://www.zsb2b.com:8081/notice/delete_manager_one";
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

//统计
var count = Vue.extend({
    template : "#count_page",
    props: ['parent'],
    data : function(){
        return {
			"parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "orderNum" : 0,
                "colorIndex" : 0,
                "isSelect" : false,
                "currentTab" : 1,
                "orderOne" : {},
                "orderTwo" : {},
                "activity" : {},
            },
            "select" : {
                "dayList" : [
                    {"val":1,"name":"近7日"}
                    ,{"val":2,"name":"近30日"}
                ],
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
    watch : {
        "base.currentTab" : function(val){
            var _this = this;
            _this._getChartChange();
        },
    },
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
                    _this._getCharts();
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
        _getChartChange : function(){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.status = _this.base.currentTab; 
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_personnel/statistics";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.orderOne = result.data;
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
        _getCharts : function(){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.status = _this.base.currentTab; 
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_personnel/statistics";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.orderOne = result.data;
                    _this._creatCharts();
                    _this._getTodayCount();
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
        _getTodayCount : function(){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id; 
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_personnel/today_statistics";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.orderTwo = result.data;
                    _this._getActiCount();
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
        _getActiCount : function(){
            var _this = this;
            var data = {};
            data.token = _this.base.token; 
            console.log(data);
            var url = "http://www.zsb2b.com:8081/activity_all/get_boss_num";
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
        _creatCharts : function(data){
            var _this = this;
            console.log(11,data)
            // if( data.length > 0 ){
                Highcharts.setOptions({ global: { useUTC: false } });
                $('#orderChart').highcharts({
                    chart: {
                        type: 'line',
                    },
                    title: {
                        text: '单位(万元)',
                        x:20,
                        y:18.5,
                        style:{"font-size":"0.26rem","font-weight":"bold"}
                    },
                    xAxis: {
                        allowDecimals: false,
                        gridLineColor: "#eaf0f3",
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        visible: false
                    },
                    yAxis: {
                        title: {
                            text: null
                        },
                        gridLineColor: "#eaf0f3",
                        labels: {
                            formatter: function () {
                                return this.value / 10000;
                            }
                        },
                    },
                    legend: {
                        layout: 'horizontal',
                        align: 'top',
                        verticalAlign: 'top',
                        borderWidth: 0
                    },
                    plotOptions: {
                        area: {
                            marker: {
                                enabled: false,
                                symbol: 'circle',
                                radius: 2,
                                states: {
                                    hover: {
                                        enabled: true
                                    }
                                }
                            },

                        }
                    },
                    series: [{
                        name: '销售额',
                        color : "#a9dfff",
                        data: [0, 11009, 13950, 16824, 18577, 20527, 12475]
                    }, {
                        name: '退款额',
                        color: "#f7ebbf",
                        data: [10, 14000,16000, 18000, 22000, 26000, 28000]
                    }]
                });
            // }
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
                        _this._getCharts();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});
//统计——订单统计
var orderStatistics = Vue.extend({
    template : "#orderStatistics_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "orderNum" : 0,
                "colorIndex" : 0,
            },
            "title" : {
                "tabs" : 1,
            },
            "select" : {
                "pieColor" : [
                    {"val":5,"name":"#e94a49"}
                    ,{"val":6,"name":"#79c2e3"}
                    ,{"val":7,"name":"#71c5b7"}
                    ,{"val":8,"name":"#9acb69"}
                    ,{"val":9,"name":"#f5cd4b"}
                    ,{"val":10,"name":"#f08652"}
                    ,{"val":1,"name":"#e76610"}
                    ,{"val":2,"name":"#6abdc3"}
                    ,{"val":3,"name":"#e0b42e"}
                    ,{"val":4,"name":"#4eb685"}
                ],
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
        "title.tabs" : function(val){
            var _this = this;
            if( !_this.parentMsg.totalOrder.status ){
                _this._getOrderNum();
            }
        },
    },
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
                    _this._getOrderNum();
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
        _getOrderNum : function(){
            var _this = this;
            var data = {};
            _this.parentMsg.totalOrder.status = "";
            data.manager_id = _this.parentMsg.base.manager_id;
            data.index = _this.title.tabs; 
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_order/closingorder";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    _this.base.colorIndex = 0;
                    _this.base.orderNum = 0;
                    var dataArr = [];
                    for(var i=0;i<result.data.length;i++){
                        _this.base.orderNum = eval(_this.base.orderNum + result.data[i].total_price);
                    }
                    function forEach(index){
                        if( index >= result.data.length ){
                            _this.base.dataList = dataArr;
                            return setTimeout(function(){
                                _this._creatCharts(dataArr);
                                myScroll.refresh();
                            },300)
                        }
                        var num = _this.base.colorIndex;
                        _this.base.colorIndex ++;
                        if( num > 9 ){
                            num = 0;
                            _this.base.colorIndex = 1;
                        }
                        var obj = {name:result.data[index].shop_name,y:result.data[index].order_price_proportion * 100,color:_this.select.pieColor[num].name,price:result.data[index].total_price};
                        dataArr.push(obj);
                        forEach(index + 1);
                    }
                    forEach(0);
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
        _creatCharts : function(data){
            var _this = this;
            console.log(11,data)
            if( data.length > 0 ){
                Highcharts.setOptions({ global: { useUTC: false } });
                $('#todayOrderPie').highcharts({
                    chart: {
                        plotBackgroundColor: "#f3f5f7",
                        plotBorderWidth: null,
                        plotShadow: false,
                        spacing : [0, 0 , 0, 0],
                    },
                    title : {
                        text:null
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: false,
                            cursor: 'pointer',
                            center: ["50%","50%"],
                            dataLabels: {
                                enabled: true,
                                format: '{point.percentage} %',
                            },
                        }
                    },
                    
                    series: [{
                        type: 'pie',
                        innerSize: '70%',
                        name: '今日下单',
                        data: data
                    }]
                });
            }
        },
    },
    ready : function(){
        var _this = this;
        _this.parentMsg = _this.parent;
        _this.base.token = sessionStorage.getItem("token");
        if( _this.parentMsg.totalOrder.status ){
            _this.title.tabs = _this.parentMsg.totalOrder.status;
        }
        loaded();
        userLogin(function(){
            setTimeout(function(){
                if( _this.base.token ){
                    if( _this.parentMsg.base.manager_id ){
                        _this._getOrderNum();
                    } else {
                        _this._getManagerId();
                    }
                }
            },350)
        });
    }
});
//统计——今日下单
var todayOrder = Vue.extend({
    template : "#todayOrder_page",
    props: ['parent'],
    data : function(){
        return {
            "parentMsg" : {},
            "base" : {
                "token" : "",
                "dataList" : [],
                "colorIndex" : 0,
                "orderNum" : 0,
            },
            "select" : {
                "pieColor" : [
                    {"val":1,"name":"#e76610"}
                    ,{"val":2,"name":"#6abdc3"}
                    ,{"val":3,"name":"#e0b42e"}
                    ,{"val":4,"name":"#4eb685"}
                    ,{"val":5,"name":"#e94a49"}
                    ,{"val":6,"name":"#79c2e3"}
                    ,{"val":7,"name":"#71c5b7"}
                    ,{"val":8,"name":"#9acb69"}
                    ,{"val":9,"name":"#f5cd4b"}
                    ,{"val":10,"name":"#f08652"}
                ],
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
                    _this._getOrderNum();
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
        _getOrderNum : function(){
            var _this = this;
            var data = {};
            data.manager_id = _this.parentMsg.base.manager_id;
            data.index = 1;
            console.log(data);
            var url = "http://www.zsb2b.com:8081/manager_order/today_order";
            _this.$http.post(url, data ,{emulateJSON:true}).then(function(response){
                var result = response.body;
                console.log(result)              
                if( result.error_code == 0 ){
                    var dataArr = [];
                    for(var i=0;i<result.data.length;i++){
                        _this.base.orderNum = eval(_this.base.orderNum + result.data[i].count);
                    }
                    function forEach(index){
                        if( index >= result.data.length ){
                            _this.base.dataList = dataArr;
                            return setTimeout(function(){
                                _this._creatCharts(dataArr);
                                myScroll.refresh();
                            },300)
                             
                        }
                        var num = _this.base.colorIndex;
                        _this.base.colorIndex ++;
                        if( num > 9 ){
                            num = 0;
                            _this.base.colorIndex = 1;
                        }
                        var obj = {name:result.data[index].shop_name,y:result.data[index].order_price_proportion * 100,color:_this.select.pieColor[num].name,price:result.data[index].total_price};
                        dataArr.push(obj);
                        forEach(index + 1);
                    }
                    forEach(0);
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
        _createPie : function(){
            var _this = this;
            var init_echarts = function () {
                var refreshChart = function (show_data) {
                    my_demo_chart = echarts.init(document.getElementById('todayOrderPie'));
                    my_demo_chart.showLoading({
                        text: '加载中...',
                        effect: 'whirling'
                    });
                    var option = {
                        tooltip: {
                            trigger: 'item',
                            formatter: "{a} <br/>{b}: {c} ({d}%)"
                        },
                        color:["#e94a49","#79c2e3","#71c5b7","#9acb69"],
                        series: [
                            {
                                name:'今日下单',
                                type:'pie',
                                radius: ['50%', '70%'],
                                avoidLabelOverlap: false,
                                label: {
                                    normal: {
                                        show: false,
                                        position: 'center'
                                    },
                                    emphasis: {
                                        show: true,
                                        textStyle: {
                                            fontSize: '30',
                                            fontWeight: 'bold'
                                        }
                                    }
                                },
                                labelLine: {
                                    normal: {
                                        show: false
                                    }
                                },
                                data:show_data
                            }
                        ]
                    };

                    my_demo_chart.hideLoading();
                    my_demo_chart.setOption(option);

                };

                // 获取原始数据
                // $.ajax({
                //     url: "http://cuihuan.net:1015/demo_file/echarts_realtime_demo/get_data.php",
                //     data: {type: "2"},
                //     success: function (data) {
                //         // 根据数据库取到结果拼接现在结果
                //         refreshChart(eval({}));
                //     }
                // });
                
                var arr = [
                    {value:12, name:'A店铺'}
                    ,{value:12, name:'B店铺'}
                    ,{value:12, name:'C店铺'}
                    ,{value:12, name:'D店铺'}
                ];
                refreshChart(arr);

            };
            var default_load = (function () {
                init_echarts();
            })();
        },
        _creatCharts : function(data){
            var _this = this;
            console.log(11,data)
            if( data.length > 0 ){
                Highcharts.setOptions({ global: { useUTC: false } });
                $('#todayOrderPie').highcharts({
                    chart: {
                        plotBackgroundColor: "#f3f5f7",
                        plotBorderWidth: null,
                        plotShadow: false,
                        spacing : [0, 0 , 0, 0],
                    },
                    title : {
                        text:null
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: false,
                            cursor: 'pointer',
                            center: ["50%","50%"],
                            dataLabels: {
                                enabled: true,
                                format: '{point.percentage} %',
                            },
                            // colors:["#e76610","#6abdc3","#e0b42e","#4eb685"],
                        }
                    },
                    
                    series: [{
                        type: 'pie',
                        innerSize: '70%',
                        name: '今日下单',
                        data: data
                    }]
                });
            }
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
                        _this._getOrderNum();
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
                "review" : {
                    "type" : "",
                    "oid" : "",
                    "title" : "",
                    "status" : "",
                },
                "personalDataEdit" : {
                    "headimgurl" : "",
                    "nickname" : "",
                    "mobile" : "",
                    "company" : "",
                },
				"manage":{
                    "storeData":{
                        "currentStore":'',
						"currentStaffId":'',
                    }
                },
                "totalOrder" : {
                    "status" : "",
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
    '/review': {
        component: review,
    },
    '/manage':{
        component:manage,
    },
    '/structure':{
        component:structure,
    },
    '/storeInfo':{
        component:storeInfo,
    },
    '/storeData':{
        component:storeData,
    },
    '/spokesman':{
        component:spokesman,
    },
    '/assetsCount':{
        component:assetsCount,
    },
    '/assetsDetail':{
        component:assetsDetail,
    },
    '/activityDetail':{
        component:activityDetail,
    },
    '/dataInfo':{
        component:dataInfo,
    },
    '/personalData':{
        component:personalData,
    },
    '/personal':{
        component:personal,
    },
    '/passwordSetting':{
        component:passwordSetting,
    },
    '/recharge':{
        component:recharge
    },
    '/message':{
        component:message
    },
    '/getCash/:typeone':{
        name : "getCash",
        component:getCash
    },
    '/count':{
        component:count
    },
    '/todayOrder':{
        component:todayOrder
    },
    '/orderStatistics':{
        component:orderStatistics
    },
    '/error':{
        component:error
    },
    '/personalDataEdit/:typeone':{
        name : "personalDataEdit",
        component:personalDataEdit,
    },
});

router.redirect({
    '/': '/personal'
});


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


