var PanelContainer = require('../containers/PanelContainer'),
    DraggableContainer = require('../decorators/DraggableContainer'),
    ResizableContainer = require('../decorators/ResizableContainer'),
    EventHandler = require('../utils/EventHandler'),
    utils = require('../utils/utils');

function Dialog(panel, dockManager)
{
    this.panel = panel;
    this.zIndexCounter = 100;
    this.dockManager = dockManager;
    this.eventListener = dockManager;
    this._initialize();
    this.dockManager.context.model.dialogs.push(this);
        this.position = dockManager.defaultDialogPosition;

    this.dockManager.notifyOnCreateDialog(this);
}

module.exports = Dialog;

Dialog.prototype.saveState = function(x, y){
    this.position = {x: x, y: y};
    this.dockManager.notifyOnChangeDialogPosition(this, x, y);
};

Dialog.fromElement = function(id, dockManager)
{
    return new Dialog(new PanelContainer(document.getElementById(id), dockManager), dockManager);
};

Dialog.prototype._initialize = function()
{
    this.panel.floatingDialog = this;
    this.elementDialog = document.createElement('div');
    this.elementDialog.appendChild(this.panel.elementPanel);
    this.draggable = new DraggableContainer(this, this.panel, this.elementDialog, this.panel.elementTitle);
    this.resizable = new ResizableContainer(this, this.draggable, this.draggable.topLevelElement);

    document.body.appendChild(this.elementDialog);
    this.elementDialog.classList.add('dialog-floating');
    this.elementDialog.classList.add('rounded-corner-top');
    this.panel.elementTitle.classList.add('rounded-corner-top');

    this.mouseDownHandler = new EventHandler(this.elementDialog, 'mousedown', this.onMouseDown.bind(this));
    this.resize(this.panel.elementPanel.clientWidth, this.panel.elementPanel.clientHeight);
    this.isHidden = false;
    this.bringToFront();
};

Dialog.prototype.setPosition = function(x, y)
{
    this.position = {x: x, y: y};
    this.elementDialog.style.left = x + 'px';
    this.elementDialog.style.top = y + 'px';
    this.dockManager.notifyOnChangeDialogPosition(this, x, y);
};

Dialog.prototype.getPosition = function()
{
    return {
        left: this.position ? this.position.x : 0,
        top: this.position ? this.position.y : 0
    };
};

Dialog.prototype.onMouseDown = function()
{
    this.bringToFront();
};

Dialog.prototype.destroy = function()
{
    if (this.mouseDownHandler)
    {
        this.mouseDownHandler.cancel();
        delete this.mouseDownHandler;
    }
    this.elementDialog.classList.remove('rounded-corner-top');
    this.panel.elementTitle.classList.remove('rounded-corner-top');
    utils.removeNode(this.elementDialog);
    this.draggable.removeDecorator();
    utils.removeNode(this.panel.elementPanel);
     this.dockManager.context.model.dialogs.remove(this);
    delete this.panel.floatingDialog;
};

Dialog.prototype.resize = function(width, height)
{
    this.resizable.resize(width, height);
};

Dialog.prototype.setTitle = function(title)
{
    this.panel.setTitle(title);
};

Dialog.prototype.setTitleIcon = function(iconName)
{
    this.panel.setTitleIcon(iconName);
};

Dialog.prototype.bringToFront = function()
{
    this.elementDialog.style.zIndex = this.zIndexCounter++;
};

Dialog.prototype.hide = function()
{
    this.elementDialog.style.zIndex = 0;
    this.elementDialog.style.display = 'none';
     if(!this.isHidden)
    {
        this.isHidden = true;
        this.dockManager.notifyOnHideDialog(this);
    }
};

Dialog.prototype.show = function()
{
    this.elementDialog.style.zIndex = 100;
    this.elementDialog.style.display = 'block';
    if(this.isHidden)
    {
        this.isHidden = false;
        this.dockManager.notifyOnShowDialog(this);
    }
};
