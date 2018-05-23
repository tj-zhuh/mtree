; (function (root, factory) {
    if (typeof define == 'function' && define.amd) {
        define(function (require) {
            var jquery = require('jquery');
            return factory(jquery);
        })
    }
    else {
        root.mtree = factory(root.$)
    }
}(this, function ($) {

    if (typeof $ !== 'function')
        throw new Error('模块$获取失败');

    var version = 'v0.1';

    var manager = (function ($) {
        return {
            privates: [],
            instances: [],
            ctor: null,
            create: function () {
                if (typeof ctor !== 'function')
                    throw new Error('ctor不是函数');

                var obj = new ctor();
                this.privates.push({});
                this.instances.push(obj);
                return obj;

            },
            getp: function (obj, key) {
                if (!obj || typeof key !== 'string')
                    throw new Error('getp函数参数不正确');

                for (var i = 0; i < this.instances.length; i++) {
                    if (this.instances[i] === obj) {
                        return this.privates[i][key];
                    }
                }

            },
            setp: function (obj, key, value) {

                if (!obj || typeof key !== 'string')
                    throw new Error('getp函数参数不正确');

                for (var i = 0; i < this.instances.length; i++) {
                    if (this.instances[i] === obj) {
                        this.privates[i][key] = value;
                    }
                }
            },
            fac: function (ctor) {
                var that = this;
                this.ctor = ctor;
                var dfObj = this.create();
                function ret() {
                    return that.create();
                };
                $.extend(ret, dfObj);
                ret.version = version;
                this.instances[0] = ret;
                return ret;
            }
        };
    })($);

    // 树的一个节点
    function Node() {

        // 节点Id，同一棵树中节点Id一定是唯一的
        this.nodeId;

        // 元素名字
        this.nodeName;

        // span元素，里面存放展开按钮和节点名称
        this.span;

        // ul元素，里面存放子元素
        this.ul;

        // 展开按钮
        this.icon;

        // 对parent节点的引用
        this.parent;

        // 层级(根节点的level是0)
        this.level;

        // 正在展开
        this.isExpanded = false;

        // 所有孩子节点
        this.children = [];

        // 获得所有后代
        this.getDescendant = function () {

            var list = [];

            for (var i = 0; i < this.children.length; i++) {
                list.push(this.children[i]);
            }

            for (var i = 0; i < this.children.length; i++) {
                var sub = this.children[i].getDescendant();
                for (var j = 0; j < sub.length; j++) {
                    list.push(sub[j]);
                }
            }

            return list;
        }

        // 添加子节点
        this.append = function (child) {
            child.level = this.level + 1;
            child.parent = this;
            this.children.push(child);
        }

        // 绘制当前节点
        // container：容器
        // isRoot：根节点放在容器里，其他节点放在父节点的ul中
        this.drawRecursive = function (container, isRoot) {

            var that = this;

            // ctn指向绘制节点的位置
            var ctn;

            // 如果是根节点，则画在container容器中
            if (isRoot) {
                ctn = container;
            } else {
                // 否则，创建一个li，追加到父节点的ul里
                var li = $("<li></li>");
                that.parent.ul.append(li);
                ctn = li;
            }

            // 画一个span
            var span = $("<span></span>");
            span.attr('nodeid', this.nodeId);
            span.attr('nodename', this.nodeName);
            span.attr('level', this.level);
            span.append(this.nodeName);
            that.span = span;
            ctn.append(span);

            // 标注为根节点
            if (isRoot) {
                span.addClass('root');
            }

            // 如果有后代
            if (this.children.length > 0) {

                // 画一个i，作为展开图标
                var icon = $("<i class='icon-sign'></i>");
                icon.attr('nodeid', this.nodeId);
                icon.attr('nodename', this.nodeName);
                icon.attr('level', this.level);
                that.icon = icon;
                span.prepend(icon);

                // 画一个ul，用于存放孩子
                var ul = $("<ul></ul>");
                that.ul = ul;
                ctn.append(ul);

                // 递归的绘制子节点
                for (var i = 0; i < that.children.length; i++) {
                    that.children[i].drawRecursive(container, false);
                }
            } else {
                // 标注为叶子节点
                span.addClass('leaf');
            }
        }

        // 展开
        this.expand = function () {

            if (!this.ul) return;
            this.ul.removeClass('collapsed').addClass('expanded');
            this.icon.removeClass('icon-plus-sign').addClass('icon-minus-sign');
            this.isExpanded = true;
        }

        // 折叠
        this.collapse = function () {

            if (!this.ul) return;
            this.ul.removeClass('expanded').addClass('collapsed');
            this.icon.removeClass('icon-minus-sign').addClass('icon-plus-sign');
            this.isExpanded = false;
        }

        // 展开或折叠
        this.toggle = function () {

            var that = this;

            if (!this.ul) return;

            if (this.isExpanded) {
                this.ul.hide('fast', function () {
                    that.collapse();
                })
            } else {
                this.ul.show('fast', function () {
                    that.expand();
                })
            }
        }

        this.select = function () {
            this.span.addClass('selected');
        }

        this.unselect = function () {
            this.span.removeClass('selected');
        }
    }

    // 将数组转化为树
    // list：待转化的数组    
    // idField：id字段
    // nameField：name字段
    // parentIdField：parentId字段
    // 返回值：返回一个Node对象
    function translate(list, idField, nameField, parentIdField) {

        // 复制列表
        var copyList = [];
        for (var i = 0; i < list.length; i++) {
            copyList.push(list[i]);
        }

        // 找到根节点
        var rootItem = null;
        for (var i = 0; i < copyList.length; i++) {
            var item = copyList[i];
            var parentId = item[parentIdField];
            var found = false;
            for (var j = 0; j < copyList.length; j++) {
                var p = copyList[j];
                if (i !== j && p[idField] === parentId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                rootItem = item;
                copyList.splice(i, 1);
                break;
            }
        }

        if (rootItem == null)
            throw new Error('找不到根节点');

        // 创建根Node
        var root = new Node();
        root.nodeId = rootItem[idField];
        root.nodeName = rootItem[nameField];
        root.parent = null;
        root.level = 0;

        // 所有Node的数组
        var allNodes = [root];

        /*
         * 循环添加节点
         * copyList：原始节点数组
         * allNodes：待生成的Node数组         
         */

        // 在一次遍历中，成功添加了任意子节点
        var findAny = true;

        // while 数组的剩余长度>0 并且 findAny
        while (copyList.length > 0 && findAny) {

            // findAny置为假
            findAny = false;

            // 遍历copyList
            for (var i = 0; i < copyList.length; i++) {

                // 第i个元素
                var child = copyList[i];

                // 遍历allNodes
                for (var j = 0; j < allNodes.length; j++) {

                    // 第j个元素
                    var parent = allNodes[j];

                    // 如果child的父节点Id == parent的节点Id
                    if (child[parentIdField] === parent.nodeId) {

                        // findAny置为真
                        findAny = true;

                        // 创建Node
                        var node = new Node();
                        node.nodeId = child[idField];
                        node.nodeName = child[nameField];

                        // 添加到父节点中
                        parent.append(node);

                        // 在copyList中删除child
                        copyList.splice(i, 1);

                        // 添加到allNodes
                        allNodes.push(node);

                        // 退出对allNodes的遍历
                        break;
                    }
                }
            }
        }

        // 返回
        return {
            root: root,
            allNodes: allNodes
        }
    }

    function getNodeById(allNodes, nodeId) {
        for (var i = 0; i < allNodes.length; i++) {
            if (allNodes[i].nodeId === nodeId)
                return allNodes[i];
        }
    }

    // 默认的配置项
    var defaultConfig = {
        idField: 'nodeId',
        nameField: 'nodeName',
        parentIdField: 'parentId',
        selector: '.mtree',
        autoExpandLevel: 1,
        autoSelectRoot: true
    };

    function ctor() {
        this.root = null;
        this.allNodes = [];
        this.conf = defaultConfig;
        this.currentSelectedNode = null;
    }

    ctor.prototype.config = function (cnf) {
        this.conf = $.extend(true, {}, this.conf, cnf);
        return this;
    }

    // 加载数据
    ctor.prototype.load = function (list, keepState) {

        // 如果已经存在了数据
        if (this.root) {

            // 删除元素
            this.root.span.remove();
            this.root.ul.remove();
        }

        // 如果需要保持状态，则把正在展开的节点记录在变量openningNodeIds中
        if (typeof keepState === 'boolean' && keepState) {
            var expandingNodeIds = [];
            for (var i = 0 ; i < this.allNodes.length; i++) {
                if (this.allNodes[i].isExpanded) {
                    expandingNodeIds.push(this.allNodes[i].nodeId);
                }
            }
        }

        var that = this;

        // 当前的配置简写
        var c = this.conf;

        // 列表 -> 树
        var t = translate(list, c.idField, c.nameField, c.parentIdField);
        this.root = t.root;
        this.allNodes = t.allNodes;

        // 绘制树
        this.root.drawRecursive($(c.selector), true);



        // 点击展开/收起按钮
        $(c.selector + ' .icon-sign').on('click', function (e) {
            var nodeId = $(this).attr('nodeId');
            var node = getNodeById(that.allNodes, nodeId);
            if (!node) return;
            node.toggle();
            e.stopPropagation();
        });

        // 点击节点
        $(c.selector + ' span').on('click', function (e) {
            var nodeId = $(this).attr('nodeId');
            var nodeName = $(this).attr('nodeName');
            var node = getNodeById(that.allNodes, nodeId);
            if (!node) return;

            if (that.currentSelectedNode) {
                that.currentSelectedNode.unselect();
            }

            node.select();
            that.currentSelectedNode = node;

            var nodeSelectHandler = manager.getp(that, 'nodeSelectHandler');
            if (typeof nodeSelectHandler === 'function') {
                nodeSelectHandler(nodeId, nodeName);
            }
        })

        // 如果保持状态，恢复之前的展开和选中
        if (typeof keepState === 'boolean' && keepState) {

            // 选中的节点Id
            var currentSelectNodeId;

            // 如果之前选中了某个节点
            if (that.currentSelectedNode) {
                currentSelectNodeId = that.currentSelectedNode.nodeId;
            }

            // 当前选中节点恢复为null
            that.currentSelectedNode = null;

            // 遍历新树的节点
            for (var i = 0 ; i < that.allNodes.length; i++) {
                var node = that.allNodes[i];

                // 判断选中
                if (node.nodeId == currentSelectNodeId) {
                    node.select();
                    that.currentSelectedNode = node;
                }

                // 判断展开
                var expanded = false;
                for (var j = 0; j < expandingNodeIds.length; j++) {
                    if (expandingNodeIds[j] == node.nodeId) {
                        expanded = true;
                        break;
                    }
                }
                expanded ? node.expand() : node.collapse();
            }

        } else { // 否则，根据config设置展开和选中

            // 展开到指定层
            var autoExpandLevel = c.autoExpandLevel;
            for (var i = 0; i < this.allNodes.length; i++) {
                var node = this.allNodes[i];
                node.level >= autoExpandLevel ? node.collapse() : node.expand();
            }

            // 自动选中根节点
            if (c.autoSelectRoot) {
                this.root.select();
                this.currentSelectedNode = this.root;
            }
        }
    }




    // 设置树节点选择的处理函数
    // 处理函数的参数
    //     nodeId：节点Id
    //     nodeName：节点名字
    ctor.prototype.select = function (handler) {
        manager.setp(this, 'nodeSelectHandler', handler);
    }

    // 获得当前选中的节点
    ctor.prototype.getSelectedNode = function () {

        if (!this.currentSelectedNode)
            return null;

        var ret = {};
        ret.nodeId = this.currentSelectedNode.nodeId;
        ret.nodeName = this.currentSelectedNode.nodeName;
        return ret;
    }

    return manager.fac(ctor);
}))