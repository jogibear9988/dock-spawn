var EventHandler = require('../utils/EventHandler'),
    UndockInitiator = require('../utils/UndockInitiator'),
    utils = require('../utils/utils');

/**
 * This dock container wraps the specified element on a panel frame with a title bar and close button
 */
function PanelContainer(elementContent, dockManager, title)
{
    if (!title)
        title = 'Panel';
    this.elementContent = elementContent;
    this.dockManager = dockManager;
    this.title = title;
    this.containerType = 'panel';
    this.iconName = 'fa fa-arrow-circle-right';
    this.iconTemplate = null;
    this.minimumAllowedChildNodes = 0;
    this._floatingDialog = undefined;
    this.isDialog = false;
    this._canUndock = dockManager._undockEnabled;
    this.eventListeners = [];
    this._initialize();
}

module.exports = PanelContainer;

PanelContainer.prototype.canUndock = function(state){
    this._canUndock = state;
    this.undockInitiator.enabled = state;
    this.eventListeners.forEach(function(listener) {
        if (listener.onDockEnabled) {
            listener.onDockEnabled({self: this, state: state});
        }
    });

};

PanelContainer.prototype.addListener = function(listener){
    this.eventListeners.push(listener);
};

PanelContainer.prototype.removeListener = function(listener)
{
    this.eventListeners.splice(this.eventListeners.indexOf(listener), 1);
};

Object.defineProperty(PanelContainer.prototype, 'floatingDialog', {
    get: function() { return this._floatingDialog; },
    set: function(value)
    {
        this._floatingDialog = value;
        var canUndock = (this._floatingDialog === undefined);
        this.undockInitiator.enabled = canUndock;
    }
});

PanelContainer.loadFromState = function(state, dockManager)
{
    var elementName = state.element;
    var elementContent = document.getElementById(elementName);
    if(elementContent === null) {
        return null;
    }
    var ret = new PanelContainer(elementContent, dockManager);
    ret.loadState(state);
    return ret;
};

PanelContainer.prototype.saveState = function(state)
{
    state.element = this.elementContent.id;
    state.width = this.width;
    state.height = this.height;
};

PanelContainer.prototype.loadState = function(state)
{
    this.width = state.width;
    this.height = state.height;
    this.state = {width: state.width, height: state.height};
    // this.resize(this.width, this.height);
};

PanelContainer.prototype.setActiveChild = function(child)
{
};

Object.defineProperty(PanelContainer.prototype, 'containerElement', {
    get: function() { return this.elementPanel; }
});

PanelContainer.prototype._initialize = function()
{
    this.name = utils.getNextId('panel_');
    this.elementPanel = document.createElement('div');
    this.elementTitle = document.createElement('div');
    this.elementTitleText = document.createElement('div');
    this.elementContentHost = document.createElement('div');
    this.elementButtonClose = document.createElement('div');

    this.elementPanel.appendChild(this.elementTitle);
    this.elementTitle.appendChild(this.elementTitleText);
    this.elementTitle.appendChild(this.elementButtonClose);
    this.elementButtonClose.innerHTML = '<i class="fa fa-times"></i>';
    this.elementButtonClose.classList.add('panel-titlebar-button-close');
    this.elementPanel.appendChild(this.elementContentHost);

    this.elementPanel.classList.add('panel-base');
    this.elementTitle.classList.add('panel-titlebar');
    this.elementTitle.classList.add('disable-selection');
    this.elementTitleText.classList.add('panel-titlebar-text');
    this.elementContentHost.classList.add('panel-content');

    // set the size of the dialog elements based on the panel's size
    var panelWidth = this.elementContent.clientWidth;
    var panelHeight = this.elementContent.clientHeight;
    var titleHeight = this.elementTitle.clientHeight;
    this._setPanelDimensions(panelWidth, panelHeight + titleHeight);

    // Add the panel to the body
    document.body.appendChild(this.elementPanel);

    this.closeButtonClickedHandler =
        new EventHandler(this.elementButtonClose, 'click', this.onCloseButtonClicked.bind(this));

    utils.removeNode(this.elementContent);
    this.elementContentHost.appendChild(this.elementContent);

    // Extract the title from the content element's attribute
    var contentTitle = this.elementContent.dataset.panelCaption;
    var contentIcon = this.elementContent.dataset.panelIcon;
    if (contentTitle) this.title = contentTitle;
    if (contentIcon) this.iconName = contentIcon;
    this._updateTitle();

    this.undockInitiator = new UndockInitiator(this.elementTitle, this.performUndockToDialog.bind(this));
    delete this.floatingDialog;
};


PanelContainer.prototype.hideCloseButton = function(state){
     this.elementButtonClose.style.display = state ? 'none' : 'block';
     this.eventListeners.forEach(function(listener) {
        if (listener.onHideCloseButton) {
            listener.onHideCloseButton({self: this, state: state});
        }
    });
};


PanelContainer.prototype.destroy = function()
{
    utils.removeNode(this.elementPanel);
    if (this.closeButtonClickedHandler)
    {
        this.closeButtonClickedHandler.cancel();
        delete this.closeButtonClickedHandler;
    }
};

/**
 * Undocks the panel and and converts it to a dialog box
 */
PanelContainer.prototype.performUndockToDialog = function(e, dragOffset)
{
     this.isDialog = true;
    this.undockInitiator.enabled = false;
    return this.dockManager.requestUndockToDialog(this, e, dragOffset);
};

/**
 * Undocks the container and from the layout hierarchy
 * The container would be removed from the DOM
 */
PanelContainer.prototype.performUndock = function()
{

    this.undockInitiator.enabled = false;
    this.dockManager.requestUndock(this);
};

PanelContainer.prototype.prepareForDocking = function()
{
    this.isDialog = false;
    this.undockInitiator.enabled = this.canUndock;
};

Object.defineProperty(PanelContainer.prototype, 'width', {
    get: function() { return this._cachedWidth; },
    set: function(value)
    {
        if (value !== this._cachedWidth)
        {
            this._cachedWidth = value;
            this.elementPanel.style.width = value + 'px';
        }
    }
});

Object.defineProperty(PanelContainer.prototype, 'height', {
    get: function() { return this._cachedHeight; },
    set: function(value)
    {
        if (value !== this._cachedHeight)
        {
            this._cachedHeight = value;
            this.elementPanel.style.height = value + 'px';
        }
    }
});

PanelContainer.prototype.resize = function(width,  height)
{
    // if (this._cachedWidth === width && this._cachedHeight === height)
    // {
    //     // Already in the desired size
    //     return;
    // }
    this._setPanelDimensions(width, height);
    this._cachedWidth = width;
    this._cachedHeight = height;
};

PanelContainer.prototype._setPanelDimensions = function(width, height)
{
    this.elementTitle.style.width = width + 'px';
    this.elementContentHost.style.width = width + 'px';
    this.elementContent.style.width = width + 'px';
    this.elementPanel.style.width = width + 'px';

    var titleBarHeight = this.elementTitle.clientHeight;
    var contentHeight = height - titleBarHeight;
    this.elementContentHost.style.height = contentHeight + 'px';
    this.elementContent.style.height = contentHeight + 'px';
    this.elementPanel.style.height = height + 'px';
};

PanelContainer.prototype.setTitle = function(title)
{
    this.title = title;
    this._updateTitle();
    if (this.onTitleChanged)
        this.onTitleChanged(this, title);
};

PanelContainer.prototype.setTitleIcon = function(iconName)
{
    this.iconName = iconName;
    this._updateTitle();
    if (this.onTitleChanged)
        this.onTitleChanged(this, this.title);
};

PanelContainer.prototype.setTitleIconTemplate = function(iconTemplate)
{
    this.iconTemplate = iconTemplate;
    this._updateTitle();
    if (this.onTitleChanged)
        this.onTitleChanged(this, this.title);
};

PanelContainer.prototype.setCloseIconTemplate = function(closeIconTemplate)
{
    this.elementButtonClose.innerHTML = closeIconTemplate();
};

PanelContainer.prototype._updateTitle = function()
{
    if(this.iconTemplate !== null)
    {
        this.elementTitleText.innerHTML = this.iconTemplate(this.iconName) + this.title;
        return;
    }
    this.elementTitleText.innerHTML = '<i class="' + this.iconName + '"></i> ' + this.title;
};

PanelContainer.prototype.getRawTitle = function()
{
    return this.elementTitleText.innerHTML;
};

PanelContainer.prototype.performLayout = function(children)
{
};

PanelContainer.prototype.onCloseButtonClicked = function()
{
   this.close();
};

PanelContainer.prototype.close = function() {
     //TODO: hide
    if (this.isDialog) {
        this.floatingDialog.hide();

        this.floatingDialog.setPosition(this.dockManager.defaultDialogPosition.x, this.dockManager.defaultDialogPosition.y);
    }
    else
    {
        this.performUndockToDialog();
        this.floatingDialog.hide();
        this.floatingDialog.setPosition(this.dockManager.defaultDialogPosition.x, this.dockManager.defaultDialogPosition.y);
    }
     this.dockManager.notifyOnClosePanel(this);
};
