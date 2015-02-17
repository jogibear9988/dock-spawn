module.exports = {
    pkg: require('../package.json'),

    // tab
    TabHandle:                  require('./tab/TabHandle'),
    TabHost:                    require('./tab/TabHost'),
    TabPage:                    require('./tab/TabPage'),

    // dialog
    Dialog:                     require('./dialog/Dialog'),

    // decorators
    DraggableContainer:         require('./decorators/DraggableContainer'),
    ResizableContainer:         require('./decorators/ResizableContainer'),

    // dock
    DockLayoutEngine:           require('./dock/DockLayoutEngine'),
    DockManager:                require('./dock/DockManager'),
    DockManagerContext:         require('./dock/DockManagerContext'),
    DockModel:                  require('./dock/DockModel'),
    DockNode:                   require('./dock/DockNode'),
    DockWheel:                  require('./dock/DockWheel'),
    DockWheelItem:              require('./dock/DockWheelItem'),

    // containers
    DocumentManagerContainer:   require('./containers/DocumentManagerContainer'),
    FillDockContainer:          require('./containers/FillDockContainer'),
    HorizontalDockContainer:    require('./containers/HorizontalDockContainer'),
    PanelContainer:             require('./containers/PanelContainer'),
    SplitterDockContainer:      require('./containers/SplitterDockContainer'),
    VerticalDockContainer:      require('./containers/VerticalDockContainer'),

    // splitter
    SplitterBar:                require('./splitter/SplitterBar'),
    SplitterPanel:              require('./splitter/SplitterPanel'),

    // serialization
    DockGraphDeserializer:      require('./serialization/DockGraphDeserializer'),
    DockGraphSerializer:        require('./serialization/DockGraphSerializer'),

    // utils
    Point:                      require('./utils/Point'),
    EventHandler:               require('./utils/EventHandler'),
    UndockInitiator:            require('./utils/UndockInitiator')
};

module.exports.version = module.exports.pkg.version;

if (!Array.prototype.remove) {
    Array.prototype.remove = function (value) {
        var idx = this.indexOf(value);

        if (idx !== -1) {
            return this.splice(idx, 1);
        }

        return false;
    };
}

if (!Array.prototype.contains) {
    Array.prototype.contains = function (obj) {
        var i = this.length;

        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }

        return false;
    };
}

if (!Array.prototype.orderByIndexes) {
    Array.prototype.orderByIndexes = function (indexes){
        var sortedArray = [];

        for (var i = 0; i < indexes.length; i++) {
            sortedArray.push(this[indexes[i]]);
        }

        return sortedArray;
    };
}
