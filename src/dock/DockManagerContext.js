var DockModel = require('./DockModel'),
    DocumentManagerContainer = require('../containers/DocumentManagerContainer');

function DockManagerContext(dockManager)
{
    this.dockManager = dockManager;
    this.model = new DockModel();
    this.documentManagerView = new DocumentManagerContainer(this.dockManager);
}

module.exports = DockManagerContext;
