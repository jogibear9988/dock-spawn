var TabPage = require('../tab/TabPage'),
    utils = require('../utils/utils');

/**
 * Specialized tab page that doesn't display the panel's frame when docked in a tab page
 */
function DocumentTabPage(host, container)
{
    TabPage.call(this, host, container);

    // If the container is a panel, extract the content element and set it as the tab's content
    if (this.container.containerType === 'panel')
    {
        this.panel = container;
        this.containerElement = this.panel.elementContent;

        // detach the container element from the panel's frame.
        // It will be reattached when this tab page is destroyed
        // This enables the panel's frame (title bar etc) to be hidden
        // inside the tab page
        utils.removeNode(this.containerElement);
    }
}

DocumentTabPage.prototype = Object.create(TabPage.prototype);
DocumentTabPage.prototype.constructor = DocumentTabPage;
module.exports = DocumentTabPage;

DocumentTabPage.prototype.destroy = function()
{
    TabPage.prototype.destroy.call(this);

    // Restore the panel content element back into the panel frame
    utils.removeNode(this.containerElement);
    this.panel.elementContentHost.appendChild(this.containerElement);
};
