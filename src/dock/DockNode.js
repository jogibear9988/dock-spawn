function DockNode(container)
{
    /** The dock container represented by this node */
    this.container = container;
    this.children = [];
}

module.exports = DockNode;

DockNode.prototype.detachFromParent = function()
{
    if (this.parent)
    {
        this.parent.removeChild(this);
        delete this.parent;
    }
};

DockNode.prototype.removeChild = function(childNode)
{
    var index = this.children.indexOf(childNode);
    if (index >= 0)
        this.children.splice(index, 1);
};

DockNode.prototype.addChild = function(childNode)
{
    childNode.detachFromParent();
    childNode.parent = this;
    this.children.push(childNode);
};

DockNode.prototype.addChildBefore = function(referenceNode, childNode)
{
    this._addChildWithDirection(referenceNode, childNode, true);
};

DockNode.prototype.addChildAfter = function(referenceNode, childNode)
{
    this._addChildWithDirection(referenceNode, childNode, false);
};

DockNode.prototype._addChildWithDirection = function(referenceNode, childNode, before)
{
    // Detach this node from it's parent first
    childNode.detachFromParent();
    childNode.parent = this;

    var referenceIndex = this.children.indexOf(referenceNode);
    var preList = this.children.slice(0, referenceIndex);
    var postList = this.children.slice(referenceIndex + 1, this.children.length);

    this.children = preList.slice(0);
    if (before)
    {
        this.children.push(childNode);
        this.children.push(referenceNode);
    }
    else
    {
        this.children.push(referenceNode);
        this.children.push(childNode);
    }
    Array.prototype.push.apply(this.children, postList);
};

DockNode.prototype.performLayout = function()
{
    var childContainers = this.children.map(function(childNode) { return childNode.container; });
    this.container.performLayout(childContainers);
};

DockNode.prototype.debugDumpTree = function(indent)
{
    if (indent === undefined)
        indent = 0;

    var message = this.container.name;
    for (var i = 0; i < indent; i++)
        message = '\t' + message;

    var parentType = this.parent === undefined ? 'null' : this.parent.container.containerType;
    console.log('>>' + message + ' [' + parentType + ']');

    this.children.forEach(function(childNode) { childNode.debugDumpTree(indent + 1); });
};
