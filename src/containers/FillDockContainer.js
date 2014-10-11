var TabHost = require('../tab/TabHost'),
    utils = require('../utils/utils');

function FillDockContainer(dockManager, tabStripDirection)
{
    if (arguments.length === 0) {
        return;
    }

    if (tabStripDirection === undefined) {
        tabStripDirection = TabHost.DIRECTION_BOTTOM;
    }

    this.dockManager = dockManager;
    this.tabOrientation = tabStripDirection;
    this.name = utils.getNextId('fill_');
    this.element = document.createElement('div');
    this.containerElement = this.element;
    this.containerType = 'fill';
    this.minimumAllowedChildNodes = 2;
    this.element.classList.add('dock-container');
    this.element.classList.add('dock-container-fill');
    this.tabHost = new TabHost(this.tabOrientation);
    var that = this;
    this.tabHostListener = {
        onChange: function (e) {
            that.dockManager._requestTabReorder(that, e);
        }
    };
    this.tabHost.addListener(this.tabHostListener);
    this.element.appendChild(this.tabHost.hostElement);
}

module.exports = FillDockContainer;

FillDockContainer.prototype.setActiveChild = function(child)
{
    this.tabHost.setActiveTab(child);
};

FillDockContainer.prototype.resize = function(width, height)
{
    this.element.style.width = width + 'px';
    this.element.style.height = height + 'px';
    this.tabHost.resize(width, height);
};

FillDockContainer.prototype.performLayout = function(children)
{
    this.tabHost.performLayout(children);
};

FillDockContainer.prototype.destroy = function()
{
    if (utils.removeNode(this.element))
        delete this.element;
};

FillDockContainer.prototype.saveState = function(state)
{
    state.width = this.width;
    state.height = this.height;
};

FillDockContainer.prototype.loadState = function(state)
{
    // this.resize(state.width, state.height);
    // this.width = state.width;
    // this.height = state.height;
    this.state = {width: state.width, height: state.height};
};

Object.defineProperty(FillDockContainer.prototype, 'width', {
    get: function() {
        // if(this.element.clientWidth === 0 && this.stateWidth !== 0)
        //     return this.stateWidth;
        return this.element.clientWidth;
    },
    set: function(value) {
        this.element.style.width = value + 'px';
    }
});

Object.defineProperty(FillDockContainer.prototype, 'height', {
    get: function() {
        // if(this.element.clientHeight === 0 && this.stateHeight !== 0)
        //     return this.stateHeight;
        return this.element.clientHeight;
    },
    set: function(value) {
        this.element.style.height = value + 'px';
    }
});
