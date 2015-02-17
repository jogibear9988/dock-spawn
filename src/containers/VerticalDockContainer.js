var SplitterDockContainer = require('./SplitterDockContainer'),
    utils = require('../utils/utils');

function VerticalDockContainer(dockManager, childContainers)
{
    this.stackedVertical = true;
    SplitterDockContainer.call(this, utils.getNextId('vertical_splitter_'), dockManager, childContainers);
    this.containerType = 'vertical';
}

VerticalDockContainer.prototype = Object.create(SplitterDockContainer.prototype);
VerticalDockContainer.prototype.constructor = VerticalDockContainer;
module.exports = VerticalDockContainer;
