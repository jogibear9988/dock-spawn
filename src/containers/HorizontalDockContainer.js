var SplitterDockContainer = require('./SplitterDockContainer'),
    utils = require('../utils/utils');

function HorizontalDockContainer(dockManager, childContainers)
{
    this.stackedVertical = false;
    SplitterDockContainer.call(this, utils.getNextId('horizontal_splitter_'), dockManager, childContainers);
    this.containerType = 'horizontal';
}

HorizontalDockContainer.prototype = Object.create(SplitterDockContainer.prototype);
HorizontalDockContainer.prototype.constructor = HorizontalDockContainer;
module.exports = HorizontalDockContainer;
