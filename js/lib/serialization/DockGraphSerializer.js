/**
 * The serializer saves / loads the state of the dock layout hierarchy
 */
dockspawn.DockGraphSerializer = function()
{
};

dockspawn.DockGraphSerializer.prototype.serialize = function(model)
{
    var graphInfo = this._buildGraphInfo(model.rootNode);
    var dialogs = this._buildDialogsInfo(model.dialogs);
    return JSON.stringify({graphInfo: graphInfo, dialogsInfo: dialogs});
};

dockspawn.DockGraphSerializer.prototype._buildGraphInfo = function(node)
{
    var nodeState = {};
    node.container.saveState(nodeState);

    var childrenInfo = [];
    var self = this;
    node.children.forEach(function(childNode) {
        childrenInfo.push(self._buildGraphInfo(childNode));
    });

    var nodeInfo = {};
    nodeInfo.containerType = node.container.containerType;
    nodeInfo.state = nodeState;
    nodeInfo.children = childrenInfo;
    return nodeInfo;
};

dockspawn.DockGraphSerializer.prototype._buildDialogsInfo = function(dialogs)
{
    var dialogsInfo = [];
    dialogs.forEach(function(dialog) {
        var panelState = {};
        var panelContainer = dialog.panel;
        panelContainer.saveState(panelState);

        var panelInfo = {};
        panelInfo.containerType = panelContainer.containerType;
        panelInfo.state = panelState;
        panelInfo.children = [];
        panelInfo.position = dialog.getPosition();
        panelInfo.isHidden = dialog.isHidden;
        dialogsInfo.push(panelInfo)
    })
    return dialogsInfo;
};
