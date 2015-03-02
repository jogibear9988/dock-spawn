var DockManagerContext = require('./DockManagerContext'),
    DockNode = require('./DockNode'),
    DockWheel = require('./DockWheel'),
    DockLayoutEngine = require('./DockLayoutEngine'),
    Dialog = require('../dialog/Dialog'),
    DockGraphSerializer = require('../serialization/DockGraphSerializer'),
    DockGraphDeserializer = require('../serialization/DockGraphDeserializer'),
    EventHandler = require('../utils/EventHandler'),
    Point = require('../utils/Point'),
    utils = require('../utils/utils');

/**
 * Dock manager manages all the dock panels in a hierarchy, similar to visual studio.
 * It owns a Html Div element inside which all panels are docked
 * Initially the document manager takes up the central space and acts as the root node
 */

function DockManager(element)
{
    if (element === undefined)
        throw new Error('Invalid Dock Manager element provided');

    this.element = element;
    this.context = this.dockWheel = this.layoutEngine = this.mouseMoveHandler = undefined;
    this.layoutEventListeners = [];

    this.defaultDialogPosition = new Point(0, 0);
}

module.exports = DockManager;

DockManager.prototype.initialize = function()
{
    this.context = new DockManagerContext(this);
    var documentNode = new DockNode(this.context.documentManagerView);
    this.context.model.rootNode = documentNode;
    this.context.model.documentManagerNode = documentNode;
    this.context.model.dialogs = [];
    this.setRootNode(this.context.model.rootNode);
    // Resize the layout
    this.resize(this.element.clientWidth, this.element.clientHeight);
    this.dockWheel = new DockWheel(this);
    this.layoutEngine = new DockLayoutEngine(this);
    this._undockEnabled = true;
    this.rebuildLayout(this.context.model.rootNode);
};

DockManager.prototype.checkXBounds = function(container, currentMousePosition, previousMousePosition){
    var dx = Math.floor(currentMousePosition.x - previousMousePosition.x);
    var leftBounds = currentMousePosition.x + dx < 0 || (container.offsetLeft + container.offsetWidth + dx - 40 ) < 0;
    var rightBounds =
        currentMousePosition.x + dx > this.element.offsetWidth ||
        (container.offsetLeft + dx + 40) > this.element.offsetWidth;

    if (leftBounds || rightBounds)
    {
        previousMousePosition.x = currentMousePosition.x;
        dx = 0;
    }

    return dx;
};

DockManager.prototype.checkYBounds = function(container, currentMousePosition, previousMousePosition){
    var dy = Math.floor(currentMousePosition.y - previousMousePosition.y);
    var topBounds = container.offsetTop + dy < this.element.offsetTop;
    var bottomBounds =
        currentMousePosition.y + dy > this.element.offsetHeight ||
        (container.offsetTop + dy > this.element.offsetHeight + this.element.offsetTop - 20);

    if (topBounds || bottomBounds)
    {
        previousMousePosition.y = currentMousePosition.y;
        dy = 0;
    }

    return dy;
};

DockManager.prototype.rebuildLayout = function(node)
{
    var self = this;
    node.children.forEach(function(child) {
        self.rebuildLayout(child);
    });
    node.performLayout();
};

DockManager.prototype.invalidate = function()
{
    this.resize(this.element.clientWidth, this.element.clientHeight);
};

DockManager.prototype.resize = function(width, height)
{
    this.element.style.width = width + 'px';
    this.element.style.height = height + 'px';
    this.context.model.rootNode.container.resize(width, height);
};

/**
 * Reset the dock model . This happens when the state is loaded from json
 */
DockManager.prototype.setModel = function(model)
{
    utils.removeNode(this.context.documentManagerView.containerElement);
    this.context.model = model;
    this.setRootNode(model.rootNode);

    this.rebuildLayout(model.rootNode);
    this.loadResize(model.rootNode);
    // this.invalidate();
};

DockManager.prototype.loadResize = function(node)
{
    var self = this;
    node.children.reverse().forEach(function(child) {
    self.loadResize(child);
     node.container.setActiveChild(child.container);
    });
    node.children.reverse();
    node.container.resize(node.container.state.width, node.container.state.height);

    // node.performLayout();
};

DockManager.prototype.setRootNode = function(node)
{
    // if (this.context.model.rootNode)
    // {
    //     // detach it from the dock manager's base element
    //     context.model.rootNode.detachFromParent();
    // }

    // Attach the new node to the dock manager's base element and set as root node
    node.detachFromParent();
    this.context.model.rootNode = node;
    this.element.appendChild(node.container.containerElement);
};


DockManager.prototype.onDialogDragStarted = function(sender, e)
{
    this.dockWheel.activeNode = this._findNodeOnPoint(e.pageX, e.pageY);
    this.dockWheel.activeDialog = sender;
    this.dockWheel.showWheel();
    if (this.mouseMoveHandler)
    {
        this.mouseMoveHandler.cancel();
        delete this.mouseMoveHandler;
    }
    this.mouseMoveHandler = new EventHandler(window, 'mousemove', this.onMouseMoved.bind(this));
};

DockManager.prototype.onDialogDragEnded = function(sender)
{
    if (this.mouseMoveHandler)
    {
        this.mouseMoveHandler.cancel();
        delete this.mouseMoveHandler;
    }
    this.dockWheel.onDialogDropped(sender);
    this.dockWheel.hideWheel();
    delete this.dockWheel.activeDialog;
    //TODO: not so good
    sender.saveState(sender.elementDialog.offsetLeft, sender.elementDialog.offsetTop);
};

DockManager.prototype.onMouseMoved = function(e)
{
    this.dockWheel.activeNode = this._findNodeOnPoint(e.clientX, e.clientY);
};

/**
 * Perform a DFS on the dock model's tree to find the
 * deepest level panel (i.e. the top-most non-overlapping panel)
 * that is under the mouse cursor
 * Retuns null if no node is found under this point
 */
DockManager.prototype._findNodeOnPoint = function(x, y)
{
    var stack = [];
    stack.push(this.context.model.rootNode);
    var bestMatch;

    while (stack.length > 0)
    {
        var topNode = stack.pop();

        if (utils.isPointInsideNode(x, y, topNode))
        {
            // This node contains the point.
            bestMatch = topNode;

            // Keep looking future down
            [].push.apply(stack, topNode.children);
        }
    }
    return bestMatch;
};

/** Dock the [dialog] to the left of the [referenceNode] node */
DockManager.prototype.dockDialogLeft = function(referenceNode, dialog)
{
    return this._requestDockDialog(referenceNode, dialog, this.layoutEngine.dockLeft.bind(this.layoutEngine));
};

/** Dock the [dialog] to the right of the [referenceNode] node */
DockManager.prototype.dockDialogRight = function(referenceNode, dialog)
{
    return this._requestDockDialog(referenceNode, dialog, this.layoutEngine.dockRight.bind(this.layoutEngine));
};

/** Dock the [dialog] above the [referenceNode] node */
DockManager.prototype.dockDialogUp = function(referenceNode, dialog)
{
    return this._requestDockDialog(referenceNode, dialog, this.layoutEngine.dockUp.bind(this.layoutEngine));
};

/** Dock the [dialog] below the [referenceNode] node */
DockManager.prototype.dockDialogDown = function(referenceNode, dialog)
{
    return this._requestDockDialog(referenceNode, dialog, this.layoutEngine.dockDown.bind(this.layoutEngine));
};

/** Dock the [dialog] as a tab inside the [referenceNode] node */
DockManager.prototype.dockDialogFill = function(referenceNode, dialog)
{
    return this._requestDockDialog(referenceNode, dialog, this.layoutEngine.dockFill.bind(this.layoutEngine));
};

/** Dock the [container] to the left of the [referenceNode] node */
DockManager.prototype.dockLeft = function(referenceNode, container, ratio)
{
    return this._requestDockContainer(referenceNode, container, this.layoutEngine.dockLeft.bind(this.layoutEngine), ratio);
};

/** Dock the [container] to the right of the [referenceNode] node */
DockManager.prototype.dockRight = function(referenceNode,  container, ratio)
{
    return this._requestDockContainer(referenceNode, container, this.layoutEngine.dockRight.bind(this.layoutEngine), ratio);
};

/** Dock the [container] above the [referenceNode] node */
DockManager.prototype.dockUp = function(referenceNode,  container, ratio)
{
    return this._requestDockContainer(referenceNode, container, this.layoutEngine.dockUp.bind(this.layoutEngine), ratio);
};

/** Dock the [container] below the [referenceNode] node */
DockManager.prototype.dockDown = function(referenceNode,  container, ratio)
{
    return this._requestDockContainer(referenceNode, container, this.layoutEngine.dockDown.bind(this.layoutEngine), ratio);
};

/** Dock the [container] as a tab inside the [referenceNode] node */
DockManager.prototype.dockFill = function(referenceNode, container)
{
    return this._requestDockContainer(referenceNode, container, this.layoutEngine.dockFill.bind(this.layoutEngine));
};
DockManager.prototype.floatDialog = function(container, x, y)
{
    var retdiag = undefined;

    //check the dialog do not already exist
    this.context.model.dialogs.forEach(function(dialog) {
        if (container == dialog.panel) {
            dialog.show(x, y);
            retdiag = dialog;

        }
    });
    if (retdiag)
        return retdiag;
    //try to undock just in case
    try {
        var node = this._findNodeFromContainer(container);
        this.layoutEngine.undock(node);
    } catch (err) {}

    var panel = container;
    utils.removeNode(panel.elementPanel);
    panel.isDialog = true;
    var dialog = new Dialog(panel, this);
    dialog.setPosition(x, y);
    return dialog;
};

DockManager.prototype._requestDockDialog = function(referenceNode, dialog, layoutDockFunction)
{
    // Get the active dialog that was dragged on to the dock wheel
    var panel = dialog.panel;
    var newNode = new DockNode(panel);
    panel.prepareForDocking();
    dialog.destroy();
    layoutDockFunction(referenceNode, newNode);
    // this.invalidate();
    return newNode;
};

DockManager.prototype._requestDockContainer = function(referenceNode, container, layoutDockFunction, ratio)
{
    // Get the active dialog that was dragged on to the dock wheel
    var newNode = new DockNode(container);
    if (container.containerType === 'panel')
    {
        var panel = container;
        panel.prepareForDocking();
        utils.removeNode(panel.elementPanel);
    }
    layoutDockFunction(referenceNode, newNode);

    if (ratio && newNode.parent &&
        (newNode.parent.container.containerType === 'vertical' || newNode.parent.container.containerType === 'horizontal'))
    {
        var splitter = newNode.parent.container;
        splitter.setContainerRatio(container, ratio);
    }

    this.rebuildLayout(this.context.model.rootNode);
    this.invalidate();
    return newNode;
};

DockManager.prototype._requestTabReorder = function(container, e){
    var node = this._findNodeFromContainer(container);
     this.layoutEngine.reorderTabs(node, e.handle, e.state, e.index);
};

/**
 * Undocks a panel and converts it into a floating dialog window
 * It is assumed that only leaf nodes (panels) can be undocked
 */
DockManager.prototype.requestUndockToDialog = function(container, event, dragOffset)
{
    var node = this._findNodeFromContainer(container);
    this.layoutEngine.undock(node);

    // Create a new dialog window for the undocked panel
    var dialog = new Dialog(node.container, this);

    if(event !== undefined){
    // Adjust the relative position
        var dialogWidth = dialog.elementDialog.clientWidth;
        if (dragOffset.x > dialogWidth)
            dragOffset.x = 0.75 * dialogWidth;
        dialog.setPosition(
            event.clientX - dragOffset.x,
            event.clientY - dragOffset.y);
        dialog.draggable.onMouseDown(event);
    }
    return dialog;
};

/** Undocks a panel and converts it into a floating dialog window
 * It is assumed that only leaf nodes (panels) can be undocked
 */
DockManager.prototype.requestUndock = function(container)
{
    var node = this._findNodeFromContainer(container);
    this.layoutEngine.undock(node);
};

/**
 * Removes a dock container from the dock layout hierarcy
 * Returns the node that was removed from the dock tree
 */
DockManager.prototype.requestRemove = function(container)
{
    var node = this._findNodeFromContainer(container);
    var parent = node.parent;
    node.detachFromParent();
    if (parent)
        this.rebuildLayout(parent);
    return node;
};

/** Finds the node that owns the specified [container] */
DockManager.prototype._findNodeFromContainer = function(container)
{
    //this.context.model.rootNode.debugDumpTree();

    var stack = [];
    stack.push(this.context.model.rootNode);

    while (stack.length > 0)
    {
        var topNode = stack.pop();

        if (topNode.container === container)
            return topNode;
        [].push.apply(stack, topNode.children);
    }

    throw new Error('Cannot find dock node belonging to the element');
};

DockManager.prototype.findNodeFromContainerElement = function(containerElm) {
    //this.context.model.rootNode.debugDumpTree();

    var stack = [];
    stack.push(this.context.model.rootNode);

    while (stack.length > 0)
    {
        var topNode = stack.pop();

        if (topNode.container.containerElement === containerElm)
            return topNode;
        [].push.apply(stack, topNode.children);
    }

    throw new Error('Cannot find dock node belonging to the element');
};

DockManager.prototype.addLayoutListener = function(listener)
{
    this.layoutEventListeners.push(listener);
};

DockManager.prototype.removeLayoutListener = function(listener)
{
    this.layoutEventListeners.splice(this.layoutEventListeners.indexOf(listener), 1);
};

DockManager.prototype.suspendLayout = function()
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
		if (listener.onSuspendLayout) listener.onSuspendLayout(self);
	});
};

DockManager.prototype.resumeLayout = function(panel)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
		if (listener.onResumeLayout) listener.onResumeLayout(self, panel);
	});
};

DockManager.prototype.notifyOnDock = function(dockNode)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
		if (listener.onDock) {
			listener.onDock(self, dockNode);
		}
	});
};

DockManager.prototype.notifyOnTabsReorder = function(dockNode)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onTabsReorder) {
            listener.onTabsReorder(self, dockNode);
        }
    });
};


DockManager.prototype.notifyOnUnDock = function(dockNode)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
		if (listener.onUndock) {
			listener.onUndock(self, dockNode);
		}
	});
};

DockManager.prototype.notifyOnClosePanel = function(panel)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onClosePanel) {
            listener.onClosePanel(self, panel);
        }
    });
};


DockManager.prototype.notifyOnCreateDialog = function(dialog)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onCreateDialog) {
            listener.onCreateDialog(self, dialog);
        }
    });
};

DockManager.prototype.notifyOnHideDialog = function(dialog)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onHideDialog) {
            listener.onHideDialog(self, dialog);
        }
    });
};


DockManager.prototype.notifyOnShowDialog = function(dialog)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onShowDialog) {
            listener.onShowDialog(self, dialog);
        }
    });
};


DockManager.prototype.notifyOnChangeDialogPosition = function(dialog, x, y)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onChangeDialogPosition) {
            listener.onChangeDialogPosition(self, dialog, x, y);
        }
    });
};

DockManager.prototype.notifyOnTabChange = function(tabpage)
{
    var self = this;
    this.layoutEventListeners.forEach(function(listener) {
        if (listener.onTabChanged) {
            listener.onTabChanged(self, tabpage);
        }
    });
};

DockManager.prototype.saveState = function()
{
    var serializer = new DockGraphSerializer();
    return serializer.serialize(this.context.model);
};

DockManager.prototype.loadState = function(json)
{
    var deserializer = new DockGraphDeserializer(this);
    this.context.model = deserializer.deserialize(json);
    this.setModel(this.context.model);
};

DockManager.prototype.getPanels = function()
{
    var panels = [];
    //all visible nodes
    this._allPanels(this.context.model.rootNode, panels);

    //all visible or not dialogs
    this.context.model.dialogs.forEach(function(dialog) {
        //TODO: check visible
        panels.push(dialog.panel);
    });

    return panels;
};

DockManager.prototype.undockEnabled = function(state)
{
    this._undockEnabled = state;
    this.getPanels().forEach(function(panel){
        panel.canUndock(state);
    });
};

DockManager.prototype.lockDockState = function(state)
{
    this.undockEnabled(!state); // false - not enabled
    this.hideCloseButton(state); //true - hide
};

DockManager.prototype.hideCloseButton = function(state)
{
    this.getPanels().forEach(function(panel){
        panel.hideCloseButton(state);
    });
};

DockManager.prototype.updatePanels = function(ids)
{
     var panels = [];
    //all visible nodes
    this._allPanels(this.context.model.rootNode, panels);
    //only remove
    panels.forEach(function(panel) {
        if(!ids.contains(panel.elementContent.id)){
           panel.close();
       }
    });

    this.context.model.dialogs.forEach(function(dialog) {
        if(ids.contains(dialog.panel.elementContent.id)){
            dialog.show();
        }
        else{
            dialog.hide();
        }
    });
    return panels;
};

DockManager.prototype.getVisiblePanels = function()
{
    var panels = [];
    //all visible nodes
    this._allPanels(this.context.model.rootNode, panels);

    //all visible
    this.context.model.dialogs.forEach(function(dialog) {
        if(!dialog.isHidden){
            panels.push(dialog.panel);
        }
    });

    return panels;
};

DockManager.prototype._allPanels = function(node, panels)
{
     var self = this;
    node.children.forEach(function(child) {
       self._allPanels(child, panels);
    });
    if (node.container.containerType === 'panel'){
        panels.push(node.container);
    }
};

DockManager.prototype.setCloseTabIconTemplate = function(template){
    this.closeTabIconTemplate = template;
};

//typedef void LayoutEngineDockFunction(DockNode referenceNode, DockNode newNode);

/**
* The Dock Manager notifies the listeners of layout changes so client containers that have
* costly layout structures can detach and reattach themself to avoid reflow
*/
//abstract class LayoutEventListener {
//void onSuspendLayout(DockManager dockManager);
//void onResumeLayout(DockManager dockManager);
//}
