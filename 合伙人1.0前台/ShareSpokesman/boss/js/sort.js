//自由驱动工作室
//作者：林鑫
//$(function(){
//        var Initials=$('.initials');
//        var LetterBox=$('#letterBox');
//        Initials.find('ul').append('<li>A</li><li>B</li><li>C</li><li>D</li><li>E</li><li>F</li><li>G</li><li>H</li><li>I</li><li>J</li><li>K</li><li>L</li><li>M</li><li>N</li><li>O</li><li>P</li><li>Q</li><li>R</li><li>S</li><li>T</li><li>U</li><li>V</li><li>W</li><li>X</li><li>Y</li><li>Z</li><li>#</li>');
//        initials();
//
//        $(".initials ul li").click(function(){
//            var _this=$(this);
//            var LetterHtml=_this.html();
//            LetterBox.html(LetterHtml).fadeIn();
//
//            Initials.css('background','rgba(145,145,145,0.6)');
//
//            setTimeout(function(){
//                Initials.css('background','rgba(145,145,145,0)');
//                LetterBox.fadeOut();
//            },1000);
//
//            var _index = _this.index()
//            if(_index==0){
//                $('html,body').animate({scrollTop: '0px'}, 300);//点击第一个滚到顶部
//            }else if(_index==27){
//                var DefaultTop=$('#default').position().top;
//                $('html,body').animate({scrollTop: DefaultTop+'px'}, 300);//点击最后一个滚到#号
//            }else{
//                var letter = _this.text();
//                if($('#'+letter).length>0){
//                    var LetterTop = $('#'+letter).position().top;
//                    $('html,body').animate({scrollTop: LetterTop-45+'px'}, 300);
//                }
//            }
//        })
//
//        var windowHeight=$(window).height();
//        var InitHeight=windowHeight-45;
//        Initials.height(InitHeight);
//        var LiHeight=InitHeight/28;
//        Initials.find('li').height(LiHeight);
//});

function initials(sortWay) {//排序
    var SortList=$(".spokesman_list");
    var SortBox=$(".spokesman_listBox");
    var initials = [];
    var letter=[];
    var num=0;

    var shopownerId=[];
    var shopName=[];
    var userLevel=[];
    var spokesman=document.getElementsByClassName('spokesman_name');
    for(var i=0;i<spokesman.length;i++){
        //shopownerId.push(spokesman[i].getAttribute('shopwonerId'));
        //shopName.push(spokesman[i].getAttribute('shopName'));
        //userLevel.push(spokesman[i].getAttribute('userLevel'));
    }
    console.log("shopownerId "+shopownerId);
    console.log("shopName "+shopName);
    console.log("userLevel "+userLevel);

    if(sortWay=='a'){//首字母排序
        SortList.sort(asc_sort1).appendTo('.spokesman_listBox');//排序
        function asc_sort1(a, b) {
            return makePy($(b).find('.spokesman_name').text().charAt(0))[0].toUpperCase() < makePy($(a).find('.spokesman_name').text().charAt(0))[0].toUpperCase() ? 1 : -1;
        }

        SortList.each(function(i) {
            var initial = makePy($(this).find('.spokesman_name').text().charAt(0))[0].toUpperCase();
            console.log(initial);
            if(initial>='A'&&initial<='Z'){
                if (initials.indexOf(initial) === -1)
                    initials.push(initial);
            }else{
                num++;
            }

        });

        $.each(initials, function(index, value) {//添加首字母标签
            SortBox.append('<li class="sort_letter" id="'+ value +'">' + value + '</li>');
        });
        if(num!=0){SortBox.append('<li class="sort_letter" id="default">#</li>');}

        for (var i =0;i<SortList.length;i++) {//插入到对应的首字母后面
            letter=makePy(SortList.eq(i).find('.spokesman_name').text().charAt(0))[0].toUpperCase();
            switch(letter){
                case "A":
                    $('#A').after(SortList.eq(i));
                    break;
                case "B":
                    $('#B').after(SortList.eq(i));
                    break;
                case "C":
                    $('#C').after(SortList.eq(i));
                    break;
                case "D":
                    $('#D').after(SortList.eq(i));
                    break;
                case "E":
                    $('#E').after(SortList.eq(i));
                    break;
                case "F":
                    $('#F').after(SortList.eq(i));
                    break;
                case "G":
                    $('#G').after(SortList.eq(i));
                    break;
                case "H":
                    $('#H').after(SortList.eq(i));
                    break;
                case "I":
                    $('#I').after(SortList.eq(i));
                    break;
                case "J":
                    $('#J').after(SortList.eq(i));
                    break;
                case "K":
                    $('#K').after(SortList.eq(i));
                    break;
                case "L":
                    $('#L').after(SortList.eq(i));
                    break;
                case "M":
                    $('#M').after(SortList.eq(i));
                    break;
                case "O":
                    $('#O').after(SortList.eq(i));
                    break;
                case "P":
                    $('#P').after(SortList.eq(i));
                    break;
                case "Q":
                    $('#Q').after(SortList.eq(i));
                    break;
                case "R":
                    $('#R').after(SortList.eq(i));
                    break;
                case "S":
                    $('#S').after(SortList.eq(i));
                    break;
                case "T":
                    $('#T').after(SortList.eq(i));
                    break;
                case "U":
                    $('#U').after(SortList.eq(i));
                    break;
                case "V":
                    $('#V').after(SortList.eq(i));
                    break;
                case "W":
                    $('#W').after(SortList.eq(i));
                    break;
                case "X":
                    $('#X').after(SortList.eq(i));
                    break;
                case "Y":
                    $('#Y').after(SortList.eq(i));
                    break;
                case "Z":
                    $('#Z').after(SortList.eq(i));
                    break;
                default:
                    $('#default').after(SortList.eq(i));
                    break;
            }
        };

    }else if(sortWay=='b'){//按店铺名称排序
        SortList.sort(asc_sort2).appendTo(".spokesman_listBox");
        function asc_sort2(a, b) {
            return ($(a).find('.spokesman_name').attr('shopownerId')) - ($(b).find('.spokesman_name').attr('shopownerId'));
        }

        SortList.each(function(i) {
            var initial = spokesman[i].getAttribute('shopName');
            console.log(initial);
            if (initials.indexOf(initial) === -1){initials.push(initial);}
        });

        $.each(initials, function(index, value) {//添加店铺名称标签
            SortBox.append('<li class="sort_letter" id="shopName'+ index+1 +'">' + value + '</li>');
        });
        if(num!=0){SortBox.append('<li class="sort_letter" id="default">#</li>');}

        for (var i =0;i<SortList.length;i++) {//插入到对应的首字母后面
            letter=spokesman[i].getAttribute('shopwonerId');
            switch(letter){
                case "1":
                    $('#shopName1').after(SortList.eq(i));
                    break;
                case "2":
                    $('#shopName2').after(SortList.eq(i));
                    break;
                case "3":
                    $('#shopName3').after(SortList.eq(i));
                    break;
                case "4":
                    $('#shopName4').after(SortList.eq(i));
                    break;
                case "5":
                    $('#shopName5').after(SortList.eq(i));
                    break;
                case "6":
                    $('#shopName6').after(SortList.eq(i));
                    break;
                case "7":
                    $('#shopName7').after(SortList.eq(i));
                    break;
                case "8":
                    $('#shopName8').after(SortList.eq(i));
                    break;
                case "9":
                    $('#shopName9').after(SortList.eq(i));
                    break;
                case "10":
                    $('#shopName10').after(SortList.eq(i));
                    break;
                case "11":
                    $('#shopName11').after(SortList.eq(i));
                    break;
            }
        };

    }else if(sortWay=='c'){//按等级排序
        SortList.sort(asc_sort3).appendTo(".spokesman_listBox");
        function asc_sort3(a, b) {
            return ($(a).find('.spokesman_name').attr('userLevel')) - ($(b).find('.spokesman_name').attr('userLevel'));
        }

        SortList.each(function(i) {
            var initial=spokesman[i].getAttribute('userLevel');
            if (initials.indexOf(initial) === -1){initials.push(initial);}
        });

        $.each(initials, function(index, value) {//添加等级标签
            SortBox.append('<li class="sort_letter" id="userLevel'+ index+1 +'">' + value + '</li>');
        });

        for (var i =0;i<SortList.length;i++) {//插入到对应的首字母后面
            var letter=spokesman[i].getAttribute('userLevel');
            switch(letter){
                case "1":
                    $('#userLevel1').after(SortList.eq(i));
                    break;
                case "2":
                    $('#userLevel2').after(SortList.eq(i));
                    break;
                case "3":
                    $('#userLevel3').after(SortList.eq(i));
                    break;
                case "4":
                    $('#userLevel4').after(SortList.eq(i));
                    break;
                case "5":
                    $('#userLevel5').after(SortList.eq(i));
                    break;
                case "6":
                    $('#userLevel6').after(SortList.eq(i));
                    break;
                case "7":
                    $('#userLevel7').after(SortList.eq(i));
                    break;
                case "8":
                    $('#userLevel8').after(SortList.eq(i));
                    break;
                case "9":
                    $('#userLevel9').after(SortList.eq(i));
                    break;
                case "10":
                    $('#userLevel10').after(SortList.eq(i));
                    break;
                case "11":
                    $('#userLevel11').after(SortList.eq(i));
                    break;
                case "12":
                    $('#userLevel12').after(SortList.eq(i));
                    break;
                case "13":
                    $('#userLevel13').after(SortList.eq(i));
                    break;
                case "14":
                    $('#userLevel14').after(SortList.eq(i));
                    break;
                case "15":
                    $('#userLevel15').after(SortList.eq(i));
                    break;
            }
        };
    }
}

























