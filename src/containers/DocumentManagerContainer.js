var FillDockContainer = require('./FillDockContainer'),
    DocumentTabPage = require('./DocumentTabPage'),
    TabHost = require('../tab/TabHost');

/**
 * The document manager is then central area of the dock layout hierarchy.
 * This is where more important panels are placed (e.g. the text editor in an IDE,
 * 3D view in a modelling package etc
 */

function DocumentManagerContainer(dockManager)
{
    FillDockContainer.call(this, dockManager, TabHost.DIRECTION_TOP);
    this.minimumAllowedChildNodes = 0;
    this.element.classList.add('document-manager');
    this.tabHost.createTabPage = this._createDocumentTabPage;
    this.tabHost.displayCloseButton = true;
}

DocumentManagerContainer.prototype = Object.create(FillDockContainer.prototype);
DocumentManagerContainer.prototype.constructor = DocumentManagerContainer;
module.exports = DocumentManagerContainer;

DocumentManagerContainer.prototype._createDocumentTabPage = function(tabHost, container)
{
    return new DocumentTabPage(tabHost, container);
};

DocumentManagerContainer.prototype.saveState = function(state)
{
    FillDockContainer.prototype.saveState.call(this, state);
    state.documentManager = true;
};

/** Returns the selected document tab */
DocumentManagerContainer.prototype.selectedTab = function()
{
    return this.tabHost.activeTab;
};
