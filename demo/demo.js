
require.config({
    paths: {
        "mtree": "../src/mtree",
        "jquery": "jquery-1.12.4"
    }
})

define(function (require) {
    var $ = require('jquery');
    var mtree = require('mtree');

    mtree.config({
        autoExpandLevel: 1,
        autoSelectRoot: true,
        containerSelector: '.mtree'
    });

    var data = getData();
    mtree.load(data);

    mtree.select(function (nodeId, nodeName) {
        $('.display').html('您点击了' + nodeName);
    });

    $('#load').click(function () {
        var data = getData();
        mtree.load(data, true);
    })
})

var flag = false;
function getData() {
    flag = !flag;
    return flag ? getData1() : getData2();
}

function getData1() {

    var data = [{
        nodeId: '1',
        nodeName: '冶炼厂',
        parentId: 'root'
    }, {
        nodeId: '11',
        nodeName: '工序1',
        parentId: '1'
    }, {
        nodeId: '12',
        nodeName: '工序2',
        parentId: '1'
    }, {
        nodeId: '111',
        nodeName: '车间1',
        parentId: '11'
    }, {
        nodeId: '112',
        nodeName: '车间2',
        parentId: '11'
    }];

    return data;

}

function getData2() {

    var data = [{
        nodeId: '1',
        nodeName: '冶炼厂',
        parentId: 'root'
    }, {
        nodeId: '11',
        nodeName: '工序1',
        parentId: '1'
    }, {
        nodeId: '12',
        nodeName: '工序2',
        parentId: '1'
    }, {
        nodeId: '13',
        nodeName: '工序3',
        parentId: '1'
    }, {
        nodeId: '14',
        nodeName: '工序4',
        parentId: '1'
    }, {
        nodeId: '111',
        nodeName: '车间1',
        parentId: '11'
    }, {
        nodeId: '112',
        nodeName: '车间2',
        parentId: '11'
    }];

    return data;
}


m.select(function (nodeId, nodeName) {

    // 在这里对节点选择事件进行处理
    // nodeId是选中节点的Id
    // nodeName是选中节点的名字

});