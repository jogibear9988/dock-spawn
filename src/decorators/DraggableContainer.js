var EventHandler = require('../utils/EventHandler'),
    Point = require('../utils/Point'),
    utils = require('../utils/utils');

function DraggableContainer(dialog, delegate, topLevelElement, dragHandle)
{
    this.dialog = dialog;
    this.delegate = delegate;
    this.containerElement = delegate.containerElement;
    this.dockManager = delegate.dockManager;
    this.topLevelElement = topLevelElement;
    this.containerType = delegate.containerType;
    this.mouseDownHandler = new EventHandler(dragHandle, 'mousedown', this.onMouseDown.bind(this));
    this.topLevelElement.style.marginLeft = topLevelElement.offsetLeft + 'px';
    this.topLevelElement.style.marginTop = topLevelElement.offsetTop + 'px';
    this.minimumAllowedChildNodes = delegate.minimumAllowedChildNodes;
}

module.exports = DraggableContainer;

DraggableContainer.prototype.destroy = function()
{
    this.removeDecorator();
    this.delegate.destroy();
};

DraggableContainer.prototype.saveState = function(state)
{
    this.delegate.saveState(state);
};

DraggableContainer.prototype.loadState = function(state)
{
    this.delegate.loadState(state);
};

DraggableContainer.prototype.setActiveChild = function(child)
{
};

Object.defineProperty(DraggableContainer.prototype, 'width', {
    get: function() { return this.delegate.width; }
});

Object.defineProperty(DraggableContainer.prototype, 'height', {
    get: function() { return this.delegate.height; }
});

DraggableContainer.prototype.name = function(value)
{
    if (value)
        this.delegate.name = value;
    return this.delegate.name;
};

DraggableContainer.prototype.resize = function(width, height)
{
    this.delegate.resize(width, height);
};

DraggableContainer.prototype.performLayout = function(children)
{
    this.delegate.performLayout(children);
};

DraggableContainer.prototype.removeDecorator = function()
{
    if (this.mouseDownHandler)
    {
        this.mouseDownHandler.cancel();
        delete this.mouseDownHandler;
    }
};

DraggableContainer.prototype.onMouseDown = function(event)
{
    this._startDragging(event);
    this.previousMousePosition = { x: event.pageX, y: event.pageY };
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

    this.mouseMoveHandler = new EventHandler(window, 'mousemove', this.onMouseMove.bind(this));
    this.mouseUpHandler = new EventHandler(window, 'mouseup', this.onMouseUp.bind(this));
};

DraggableContainer.prototype.onMouseUp = function(event)
{
    this._stopDragging(event);
    this.mouseMoveHandler.cancel();
    delete this.mouseMoveHandler;
    this.mouseUpHandler.cancel();
    delete this.mouseUpHandler;
};

DraggableContainer.prototype._startDragging = function(event)
{
    if (this.dialog.eventListener)
        this.dialog.eventListener.onDialogDragStarted(this.dialog, event);
    document.body.classList.add('disable-selection');
};

DraggableContainer.prototype._stopDragging = function(event)
{
    if (this.dialog.eventListener)
        this.dialog.eventListener.onDialogDragEnded(this.dialog, event);
    document.body.classList.remove('disable-selection');
};

DraggableContainer.prototype.onMouseMove = function(event)
{
    var currentMousePosition = new Point(event.pageX, event.pageY);

    var dx = this.dockManager.checkXBounds(this.topLevelElement, currentMousePosition, this.previousMousePosition);
    var dy = this.dockManager.checkYBounds(this.topLevelElement, currentMousePosition, this.previousMousePosition);
    this._performDrag(dx, dy);
    this.previousMousePosition = currentMousePosition;
};

DraggableContainer.prototype._performDrag = function(dx, dy)
{
    var left = dx + utils.getPixels(this.topLevelElement.style.marginLeft);
    var top = dy + utils.getPixels(this.topLevelElement.style.marginTop);
    this.topLevelElement.style.marginLeft = left + 'px';
    this.topLevelElement.style.marginTop = top + 'px';
};
