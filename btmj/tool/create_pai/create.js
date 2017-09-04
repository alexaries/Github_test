//循环插入牌
for (var i = 0; i < 12; i++) {
    var clone = $(".span1").eq(0).clone();
    var value = (i + 1) % 9;
    clone.find('.prefix').val(value);
    clone.appendTo("#parent");
}
//监听事件
$('.prefix').off('change').on('change', function(e) {
    // var value = e.target.value;
    // var index = $(this).parent().index();
    // console.log(valuecreate});
});
$('.suffix').off('change').on('change', function(e) {
    var self = $(this);
    var value = e.target.value;
    var index = self.parent().index();
    var option_arr = null;
    self.parent().find('.prefix').empty();
    if (value == 'feng') {
        option_arr = ['东', '南', '西', '北', '中', '发', '白'];
    } else {
        option_arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
    for (var i in option_arr) {
        var html = '<option value="' + i + '">' + option_arr[i] + '</option>';
        self.parent().find('.prefix').append($(html));
    }
});
$('.create').off('click').on('click', function() {
    $('.startTime').html(new Date().getTime());
    $('.ret').html("正在计算！");
    var span_arr = $('.span1');
    var length = span_arr.length;
    var text_arr = [];
    var pai_id_arr = [];
    for (var i = 0; i < length; i++) {
        var prefix = span_arr.eq(i).find('.prefix');
        var prefix_value = prefix.val();
        var prefix_text = prefix.find("option:selected").text();
        var suffix = span_arr.eq(i).find('.suffix');
        var suffix_value = suffix.val();
        var suffix_text = suffix.find("option:selected").text();
        var text = prefix_text + suffix_text;
        if (suffix_value == 'feng') {
            if (prefix_value == '4') {
                text = '红中';
            }
            if (prefix_value == '5') {
                text = '发财';
            }
            if (prefix_value == '6') {
                text = '白板';
            }
        }
        text_arr.push(text);
        var diff = 0;
        switch (suffix_value) {
            case 'tong':
                break;
            case 'tiao':
                diff = 9;
                break;
            case 'wan':
                diff = 18;
                break;
            case 'feng':
                diff = 27;
                break;
        }
        var pai_id = parseInt(prefix_value) + diff;
        pai_id_arr.push(pai_id);
    };
    pai_id_arr.sort(function(a, b) {
        return a - b;
    });

    function holdsLog(holds) {
        var h = ["1筒", "2筒", "3筒", "4筒", "5筒", "6筒", "7筒", "8筒", "9筒", "1条", "2条", "3条", "4条", "5条", "6条", "7条", "8条", "9条", "1万", "2万", "3万", "4万", "5万", "6万", "7万", "8万", "9万", "东风", "南风", "西风", "北风", "红中", "发财", "白板"];
        var hu = [];
        var th = holds.slice(0);
        for (var i = 0; i < th.length; i++) {
            var value = th[i];
            var pai = h[value];
            hu.push(pai);
        }
        return hu;
    }
    text_arr = holdsLog(pai_id_arr);
    var pai_arr_div = $('.paiArr');
    pai_arr_div.empty();
    pai_arr_div.text(text_arr.join(','));
    var pai_id_arr_div = $('.paiIdArr');
    pai_id_arr_div.empty();
    pai_id_arr_div.text(pai_id_arr.join(','));
    $('.afterCreate').show();
    //取赖子
    var span_laizi = $('.span_laizi');
    var prefix_value_laizi = span_laizi.find('.prefix').val();
    var suffix_value_laizi = span_laizi.find('.suffix').val();
    var diff_laizi = 0;
    switch (suffix_value_laizi) {
        case 'tong':
            break;
        case 'tiao':
            diff_laizi = 9;
            break;
        case 'wan':
            diff_laizi = 18;
            break;
        case 'feng':
            diff_laizi = 27;
            break;
    }
    var pai_id_laizi = parseInt(prefix_value_laizi) + diff_laizi;
    $('.laiziId').html(pai_id_laizi);
    var config = {
        _holds: pai_id_arr,
        _daPai: pai_id_laizi,
        _debug: false,
    };
    begin(config, function(data) {
        dealTingData(data);
    });
});
//刷新手牌
$('.fresh').off('click').on('click', function() {
    var span_arr = $('.span1');
    var length = span_arr.length;
    var pai_id_arr = [];
    for (var i = 0; i < length; i++) {
        var prefix = span_arr.eq(i).find('.prefix');
        var suffix_random = random_suffix();
        var prefix_random = random_prefix(suffix_random == 'feng');
        prefix.val(prefix_random);
        var suffix = span_arr.eq(i).find('.suffix');
        suffix.val(suffix_random);
    }
    var span_laizi = $('.span_laizi');
    var suffix_random_laizi = random_suffix();
    var prefix_random_laizi = random_prefix(suffix_random_laizi == 'feng');
    span_laizi.find('.prefix').val(prefix_random_laizi);
    span_laizi.find('.suffix').val(suffix_random_laizi);
});
var prefix_arr = [0, 1, 2, 3, 4, 5, 6, 7, 8];
// var suffix_arr = ['tong', 'tiao', 'wan', 'feng'];
var suffix_arr = ['tong', 'tiao', 'wan', 'feng', 'tong', 'tiao', 'wan', 'tong', 'tiao', 'wan', 'tong', 'tiao', 'wan', 'tong', 'tiao', 'wan'];

function random_prefix(isFeng) {
    var length = prefix_arr.length;
    if (isFeng) {
        length = 7;
    };
    var n = Math.floor(Math.random() * prefix_arr.length + 1) - 1;
    if (isFeng && (n == 4 || n > 6)) {
        n = 0;
    }
    return prefix_arr[n];
};

function random_suffix() {
    var n = Math.floor(Math.random() * suffix_arr.length + 1) - 1;
    return suffix_arr[n];
};
//牌的id转换为牌名
function id2name(id) {
    id = parseInt(id);
    if (id < 0 || id > 33) return null;
    var d = Math.floor(id / 9);
    var y = id % 9;
    var name = "";
    switch (d) {
        case 0:
            name = (y + 1) + "筒";
            break;
        case 1:
            name = (y + 1) + "条";
            break;
        case 2:
            name = (y + 1) + "万";
            break;
        case 3:
            switch (y) {
                case 0:
                    name = "东风";
                    break;
                case 1:
                    name = "南风";
                    break;
                case 2:
                    name = "西风";
                    break;
                case 3:
                    name = "北风";
                    break;
                case 4:
                    name = "红中";
                    break;
                case 5:
                    name = "发财";
                    break;
                case 6:
                    name = "白板";
                    break;
            }
            break;
    }
    return name;
};

function dealTingData(tingData) {
    $('.endTime').html(new Date().getTime());
    var diff_time = $('.endTime').text() - $('.startTime').text();
    $('.diffTime').html(diff_time);
    // console.log(tingData);
    if (Object.keys(tingData).length == 0) {
        $('.ret').html("不能听牌！");
        return;
    }
    var tingName = [];
    var ret_html = "<tr>" + "<td>听的牌</td>" + "<td>胡牌</td>" + "<td>是否清一色</td>" + "<td>赖子被当成万能牌的个数</td>" + "<td>是否能硬胡</td>" + "<td>是否以258为将</td>" + "</tr>";
    for (var i in tingData) {
        var name = id2name(i);
        var value = tingData[i];
        var hu = value.hu;
        var hu_arr = [];
        for (var j in hu) {
            var hu_name = id2name(hu[j]);
            hu_arr.push(hu_name);
        }
        // console.log(hu_arr);
        tingName.push(name);
        var isQingyise = value.isQingYiSe == null ? false : value.isQingYiSe;
        var isFengYiSe = value.isFengYiSe == null ? false : value.isFengYiSe;
        isQingyise = isQingyise || isFengYiSe;
        ret_html += "<tr>" + "<td>" + name + "</td>" + "<td>" + hu_arr.join(',') + "</td>" + "<td>" + isQingyise + "</td>" + "<td>" + value.laizi_usedNum + "</td>" + "<td>" + value.isHard + "</td>" + "<td>" + value.is_258 + "</td>" + "</tr>";
    }
    $('.ret').html(ret_html);
}