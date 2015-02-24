var TabHandle = require('./TabHandle'),
    PanelContainer = require('../containers/PanelContainer'),
    utils = require('../utils/utils');

function TabPage(host, container)
{
    if (arguments.length === 0) {
        return;
    }

    this.selected = false;
    this.host = host;
    this.container = container;

    this.handle = new TabHandle(this);
    this.containerElement = container.containerElement;

    if (container instanceof PanelContainer)
    {
        var panel = container;
        panel.onTitleChanged = this.onTitleChanged.bind(this);
    }
}

module.exports = TabPage;

TabPage.prototype.onTitleChanged = function(/*sender, title*/)
{
    this.handle.updateTitle();
};

TabPage.prototype.destroy = function()
{
    this.handle.destroy();

    if (this.container instanceof PanelContainer)
    {
        var panel = this.container;
        delete panel.onTitleChanged;
    }
};

TabPage.prototype.onSelected = function()
{
    this.host.onTabPageSelected(this);
    if (this.container instanceof PanelContainer)
    {
        var panel = this.container;
        panel.dockManager.notifyOnTabChange(this);
    }

};

TabPage.prototype.setSelected = function(flag)
{
    this.selected = flag;
    this.handle.setSelected(flag);

    if (!this._initContent)
        this.host.contentElement.appendChild(this.containerElement);
    this._initContent = true;
    if (this.selected)
    {
        this.containerElement.style.display = 'block';
        // force a resize again
        var width = this.host.contentElement.clientWidth;
        var height = this.host.contentElement.clientHeight;
        this.container.resize(width, height);
    }
    else {
        this.containerElement.style.display = 'none';
    }
};

TabPage.prototype.resize = function(width, height)
{
    this.container.resize(width, height);
};
