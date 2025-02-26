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
            App.getBalanceInfo();
        });
    },

    ////////////////////////////////////////////////////////////////////////////////

    getBalanceInfo: async function () {
        var result = await App._getBalanceInfo();
        console.log(result)
        window.all_gwb = result[2].toNumber();
        var all_eth = (web3.fromWei(result[3])).toFixed(3);
        window.my_gwb = result[4].toNumber();
        var my_eth = (web3.fromWei(result[5])).toFixed(3);
        window.rate = web3.fromWei(result[1]);
        $("#all_gwb").html(all_gwb);
        $("#all_eth").html(all_eth);
        $("#my_gwb").html(my_gwb);
        $("#my_eth").html(my_eth);
        $("#rate1").html(rate.toFixed(3));
        $("#rate2").html((1 / rate).toFixed(3));
    },

    buy: async function () {
        $("#tip_buy").html('正在买入......');
        var num = $("#buy_gwb").val(); // 买入的购物币
        const enable = await ethereum.enable();
        console.log(enable,11)
        store.deployed().then(function (storeInstance) {
            storeInstance.buy({
                from: web3.eth.accounts[0],//当前取默认账号的第一个地址
                value: web3.toWei(num * rate, 'ether'),//单位转换
                gas: 140000
            }).then(function (result) {
                alert("兑换成功,等待写入区块!");
                window.location.reload();
            }).catch(function (err) {
                alert("兑换失败: " + err);
                window.location.reload();
            });
        });
    },

    sell: function () {
        $("#tip_sell").html('正在卖出......');
        var num = $("#sell_gwb").val(); // 卖出的购物币
        store.deployed().then(function (storeInstance) {
            storeInstance.sell(num, {
                from: web3.eth.accounts[0],
                gas: 140000
            }).then(function (result) {
                alert("兑换成功,等待写入区块!");
                window.location.reload();
            }).catch(function (err) {
                alert("兑换失败: " + err);
                window.location.reload();
            });
        });
    },

    ////////////////////////////////////////////////////////////////////////////////

    _getBalanceInfo: function () {
        return new Promise(function (resolve, reject) {
            store.deployed().then(function (storeInstance) {
                storeInstance.getBalanceInfo.call().then(function (result) {
                    resolve(result);
                }).catch(function (err) {
                    alert("请解锁用户: " + err);
                });
            });
        });
    }
};

$(function () {
    // ##### note #####
    App.init();
    // ##### note #####

    // 购物币买入限制
    $("#buy_gwb").bind('input propertychange', function () {
        var num = $(this).val();
        if (0 < num && num < all_gwb) {
            var p = (num * rate).toFixed(3);
            $("#buy_eth").html(p);
        } else {
            $("#buy_eth").html('0.000');
        }
    }).blur(function () {
        var num = $(this).val();
        if (num != '' && num <= 0 || num > all_gwb) {
            alert('非法输入');
            $(this).val('');
        }
    });

    // 购物币卖出限制
    $("#sell_gwb").bind('input propertychange', function () {
        var num = $(this).val();
        if (0 < num && num < my_gwb) {
            var p = (num * rate).toFixed(3);
            $("#sell_eth").html(p);
        } else {
            $("#sell_eth").html('0.000');
        }
    }).blur(function () {
        var num = $(this).val();
        if (num != '' && num <= 0 || num > my_gwb) {
            alert('非法输入');
            $(this).val('');
        }
    });
});