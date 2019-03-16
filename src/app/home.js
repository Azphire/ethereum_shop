App = {
    init: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            window.web3 = new Web3(web3.currentProvider);
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
        }
        App.initContract();
    },

    initContract: function () {
        $.getJSON('Store.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            window.store = TruffleContract(data);
            // Set the provider for our contract
            window.store.setProvider(web3.currentProvider);
            // Init app
            App.getProducts();
        });
    },

    ////////////////////////////////////////////////////////////////////////////////

    getProducts: async function () {
        window.totalNum = await App._getProductLength();
        $("#pagination").pagination(totalNum, {
            callback: App.pageCallback,
            prev_text: '<<<',
            next_text: '>>>',
            ellipse_text: '...',
            current_page: 0, // 当前选中的页面
            items_per_page: 8, // 每页显示的条目数
            num_display_entries: 4, // 连续分页主体部分显示的分页条目数
            num_edge_entries: 1 // 两侧显示的首尾分页的条目数
        });
    },

    getHomeProductByKeyword: async function(keyword){
        var tempNum = await App._getProductLength();
        var start = 0;
        var tempList = new Array();
        for(var i = start;i<tempNum;i++){
            var resultInfo = await App._getProductInfo(i);
            if(resultInfo[1].match(keyword)==null){
            }else {
                tempList.push(resultInfo);
            }
        }
        window.searchList = tempList;
        window.totalNum = tempList.length;
        $("#pagination").pagination(totalNum, {
            callback: App.pageCallbackSearch,
            prev_text: '<<<',
            next_text: '>>>',
            ellipse_text: '...',
            current_page: 0, // 当前选中的页面
            items_per_page: 8, // 每页显示的条目数
            num_display_entries: 4, // 连续分页主体部分显示的分页条目数
            num_edge_entries: 1 // 两侧显示的首尾分页的条目数
        });
        if(tempList.length==0){
            alert("没有找到该商品信息，请您换个搜索关键词( ˶‾᷄࿀‾᷅˵ )");
        }
    },


    pageCallback: async function (index, jq) {
        $("#products").html('');
        var pageNum = 8;
        var start = index * pageNum; // 开始
        var end = Math.min((index + 1) * pageNum, totalNum); // 结束
        var content = '';
        for (var i = start; i < end; i++) {
            var result = await App._getProductInfo(i);
            content += '<div class="col-sm-6 col-md-3" >'
                + '<div class="thumbnail">'
                + '<a href="product.html?id=' + i + '">'
                + '<div style="position: relative;">'
                + '<img id="cover" class="img-cover" src="' + result[9] + '" alt="商品封面"/>'
                + '<figcaption id="name" class="img-caption">' + result[1] + '</figcaption>'
                + '</div>'
                + '</a>'
                + '<div class="caption">'
                + '<table class="dashed_tbl">'
                + '<tr>'
                + '<td>销量: <samp id="sales">' + result[6] + '</samp></td>'
                + '<td>评分: <samp id="score">' + result[7] + '</samp></td>'
                + '</tr>'
                + '</table>'
                + '<span class="label label-info">类型</span>'
                + '<samp id="style">' + result[2] + '</samp>'
                + '<br/>'
                + '<span class="label label-info">简介</span>'
                + '<samp id="intro">' + result[3].substr(0, 20) + '......</samp>'
                + '<br/>'
                + '<span class="label label-info">玩法</span>'
                + '<samp id="rules">' + result[4].substr(0, 20) + '......</samp>'
                + '<div align="center">'
                + '<button class="btn btn-danger btn-xs" data-toggle="modal" data-target="#modal" onclick="App.set(' + i + ')">'
                + '购买$ ' + (result[5])
                + '</button>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>';
        }
        $("#products").append(content);
    },

    pageCallbackSearch: async function (index, jq) {
        $("#products").html('');
        var pageNum = 8;
        var start = index * pageNum; // 开始
        var end = Math.min((index + 1) * pageNum, totalNum); // 结束
        var content = '';
        for (var i = start; i < end; i++) {
            var result = searchList[i];
            content += '<div class="col-sm-6 col-md-3" >'
                + '<div class="thumbnail">'
                + '<a href="product.html?id=' + i + '">'
                + '<div style="position: relative;">'
                + '<img id="cover" class="img-cover" src="' + result[9] + '" alt="商品封面"/>'
                + '<figcaption id="name" class="img-caption">' + result[1] + '</figcaption>'
                + '</div>'
                + '</a>'
                + '<div class="caption">'
                + '<table class="dashed_tbl">'
                + '<tr>'
                + '<td>销量: <samp id="sales">' + result[6] + '</samp></td>'
                + '<td>评分: <samp id="score">' + result[7] + '</samp></td>'
                + '</tr>'
                + '</table>'
                + '<span class="label label-info">类型</span>'
                + '<samp id="style">' + result[2] + '</samp>'
                + '<br/>'
                + '<span class="label label-info">简介</span>'
                + '<samp id="intro">' + result[3].substr(0, 20) + '......</samp>'
                + '<br/>'
                + '<span class="label label-info">玩法</span>'
                + '<samp id="rules">' + result[4].substr(0, 20) + '......</samp>'
                + '<div align="center">'
                + '<button class="btn btn-danger btn-xs" data-toggle="modal" data-target="#modal" onclick="App.set(' + i + ')">'
                + '购买$ ' + (result[5])
                + '</button>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>';
        }
        $("#products").append(content);
    },

    set: function (_id) {
        window.purchaseId = _id;
    },

    purchase: function () {
        store.deployed().then(function (storeInstance) {
            storeInstance.isPurchased.call(purchaseId).then(function (result) {
                if (result) {
                    alert("已购买");
                    $("#modal").modal('hide');
                } else {
                    // call purchase
                    storeInstance.purchase(purchaseId, {
                        from: web3.eth.accounts[0],
                        gas: 140000
                    }).then(function (result) {
                        alert("购买成功,等待写入区块!");
                        $("#modal").modal('hide');
                    }).catch(function (err) {
                        alert("购买失败: " + err);
                        $("#modal").modal('hide');
                    });
                }
            });
        });
    },

    ////////////////////////////////////////////////////////////////////////////////

    _getProductLength: function () {
        return new Promise(function (resolve, reject) {
            store.deployed().then(function (storeInstance) {
                storeInstance.getProductLength.call().then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    alert("内部错误22: " + err);
                });
            });
        });
    },

    _getProductInfo: function (id) {
        return new Promise(function (resolve, reject) {
            store.deployed().then(function (storeInstance) {
                storeInstance.getProductInfo.call(id).then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    alert("内部错误11: " + err);
                });
            });
        });
    }
};

/**
 * home.html关键词 查询
 */
function homeSearch() {
    var searchKeyWord = document.getElementById("home-keyword").value;
    App.getHomeProductByKeyword(searchKeyWord);
}

$(function () {
    // ##### note #####
    App.init();
    // ##### note #####

    // 激活导航
    $("#home-menu").addClass("menu-item-active");

});
