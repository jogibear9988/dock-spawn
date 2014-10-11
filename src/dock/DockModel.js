/**
 * The Dock Model contains the tree hierarchy that represents the state of the
 * panel placement within the dock manager.
 */
function DockModel()
{
    this.rootNode = this.documentManagerNode = undefined;
}

module.exports = DockModel;
