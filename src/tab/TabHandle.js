var PanelContainer = require('../containers/PanelContainer'),
    UndockInitiator = require('../utils/UndockInitiator'),
    EventHandler = require('../utils/EventHandler'),
    utils = require('../utils/utils');

/**
 * A tab handle represents the tab button on the tab strip
 */
function TabHandle(parent)
{
    this.parent = parent;
    var undockHandler = TabHandle.prototype._performUndock.bind(this);
    this.elementBase = document.createElement('div');
    this.elementText = document.createElement('div');
    this.elementCloseButton = document.createElement('div');
    this.elementBase.classList.add('tab-handle');
    this.elementBase.classList.add('disable-selection'); // Disable text selection
    this.elementText.classList.add('tab-handle-text');
    this.elementCloseButton.classList.add('tab-handle-close-button');
    this.elementBase.appendChild(this.elementText);
    if (this.parent.host.displayCloseButton)
        this.elementBase.appendChild(this.elementCloseButton);

    this.parent.host.tabListElement.appendChild(this.elementBase);

    var panel = parent.container;
    var title = panel.getRawTitle();
    var that = this;
    this.undockListener = {
        onDockEnabled:function(e){ that.undockEnabled(e.state); },
        onHideCloseButton: function(e){ that.hideCloseButton(e.state); }
    };
    this.eventListeners = [];
    panel.addListener(this.undockListener);

    this.elementText.innerHTML = title;

    // Set the close button text (font awesome)
    if (this.parent.container instanceof PanelContainer && this.parent.container.dockManager.closeTabIconTemplate) {
         this.elementCloseButton.innerHTML = this.parent.container.dockManager.closeTabIconTemplate();
    }
    else {
        this.elementCloseButton.innerHTML = '<i class="fa fa-times"></i>';
    }

    this._bringToFront(this.elementBase);

    this.undockInitiator = new UndockInitiator(this.elementBase, undockHandler);
    this.undockInitiator.enabled = true;
    this.mouseClickHandler = new EventHandler(this.elementBase, 'click', this.onMouseClicked.bind(this));
    this.mouseDownHandler = new EventHandler(this.elementBase, 'mousedown', this.onMouseDown.bind(this));
    this.closeButtonHandler = new EventHandler(this.elementCloseButton, 'mousedown', this.onCloseButtonClicked.bind(this));

    this.moveThreshold = 10;
    this.zIndexCounter = 100;
}

module.exports = TabHandle;

TabHandle.prototype.addListener = function(listener){
    this.eventListeners.push(listener);
};

TabHandle.prototype.removeListener = function(listener)
{
    this.eventListeners.splice(this.eventListeners.indexOf(listener), 1);
};

TabHandle.prototype.undockEnabled = function(state)
{
      this.undockInitiator.enabled = state;
};

TabHandle.prototype.onMouseDown = function(e)
{
    if(this.undockInitiator.enabled)
        this.undockInitiator.setThresholdPixels(40, false);
    if (this.mouseMoveHandler)
    {
        this.mouseMoveHandler.cancel();
        delete this.mouseMoveHandler;
    }
    if (this.mouseUpHandler)
    {
        this.mouseUpHandler.cancel();
        delete this.mouseUpHandler;
    }
    this.stargDragPosition = e.clientX;
    this.mouseMoveHandler = new EventHandler(this.elementBase, 'mousemove', this.onMouseMove.bind(this));
    this.mouseUpHandler = new EventHandler(window, 'mouseup', this.onMouseUp.bind(this));
};

TabHandle.prototype.onMouseUp = function()
{
    if(this.undockInitiator.enabled)
        this.undockInitiator.setThresholdPixels(10, true);
    if(this.elementBase){
         this.elementBase.classList.remove('tab-handle-dragged');
    }
    this.dragged = false;
    this.mouseMoveHandler.cancel();
    this.mouseUpHandler.cancel();
    delete this.mouseMoveHandler;
    delete this.mouseUpHandler;

};

TabHandle.prototype.generateMoveTabEvent = function(event, pos) {
    var contain = pos > event.rect.left && pos < event.rect.right;
    var m = Math.abs(event.bound - pos);
    if(m < this.moveThreshold && contain)
        this.moveTabEvent(this, event.state);
};

TabHandle.prototype.moveTabEvent = function(that, state){
    that.eventListeners.forEach(function(listener) {
        if (listener.onMoveTab) {
            listener.onMoveTab({self: that, state: state});
        }
    });

};

TabHandle.prototype.onMouseMove = function(e)
{
    if(Math.abs(this.stargDragPosition  -  e.clientX) < 10)
        return;
    this.elementBase.classList.add('tab-handle-dragged');
   this.dragged = true;
   this.prev = this.current;
   this.current = e.clientX;
   this.direction =  this.current - this.prev;
   var tabRect = this.elementBase.getBoundingClientRect();
   var event = this.direction < 0 ? {state: 'left', bound: tabRect.left, rect:tabRect} :
    {state: 'right', bound: tabRect.right, rect:tabRect};
   if(this.direction !== 0) this.generateMoveTabEvent(event, this.current);
};

TabHandle.prototype.hideCloseButton = function(state)
{
    this.elementCloseButton.style.display = state ? 'none' : 'block';
};

TabHandle.prototype.updateTitle = function()
{
    if (this.parent.container instanceof PanelContainer)
    {
        var panel = this.parent.container;
        var title = panel.getRawTitle();
        this.elementText.innerHTML = title;
    }
};

TabHandle.prototype.destroy = function()
{
    var panel = this.parent.container;
    panel.removeListener(this.undockListener);

    this.mouseClickHandler.cancel();
    this.mouseDownHandler.cancel();
    this.closeButtonHandler.cancel();

    if (this.mouseUpHandler) {
        this.mouseUpHandler.cancel();
    }

    utils.removeNode(this.elementBase);
    utils.removeNode(this.elementCloseButton);
    delete this.elementBase;
    delete this.elementCloseButton;
};

TabHandle.prototype._performUndock = function(e, dragOffset)
{
    if (this.parent.container.containerType === 'panel')
    {
        this.undockInitiator.enabled = false;
        var panel = this.parent.container;
        return panel.performUndockToDialog(e, dragOffset);
    }
    else
        return null;
};

TabHandle.prototype.onMouseClicked = function()
{
    this.parent.onSelected();
};

TabHandle.prototype.onCloseButtonClicked = function()
{
    // If the page contains a panel element, undock it and destroy it
    if (this.parent.container.containerType === 'panel')
    {
        this.parent.container.close();
        // this.undockInitiator.enabled = false;
        // var panel = this.parent.container;
        // panel.performUndock();
    }
};

TabHandle.prototype.setSelected = function(selected)
{
    var selectedClassName = 'tab-handle-selected';
    if (selected)
        this.elementBase.classList.add(selectedClassName);
    else
        this.elementBase.classList.remove(selectedClassName);
};

TabHandle.prototype.setZIndex = function(zIndex)
{
    this.elementBase.style.zIndex = zIndex;
};

TabHandle.prototype._bringToFront = function(element)
{
    element.style.zIndex = this.zIndexCounter;
    this.zIndexCounter++;
};
