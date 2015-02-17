var EventHandler = require('../utils/EventHandler');

function DockWheelItem(wheel, id)
{
    this.wheel = wheel;
    this.id = id;
    var wheelType = id.replace('-s', '');
    this.element = document.createElement('div');
    this.element.classList.add('dock-wheel-item');
    this.element.classList.add('disable-selection');
    this.element.classList.add('dock-wheel-' + wheelType);
    this.element.classList.add('dock-wheel-' + wheelType + '-icon');
    this.hoverIconClass = 'dock-wheel-' + wheelType + '-icon-hover';
    this.mouseOverHandler = new EventHandler(this.element, 'mouseover', this.onMouseMoved.bind(this));
    this.mouseOutHandler = new EventHandler(this.element, 'mouseout', this.onMouseOut.bind(this));
    this.active = false;    // Becomes active when the mouse is hovered over it
}

module.exports = DockWheelItem;

DockWheelItem.prototype.onMouseMoved = function(e)
{
    this.active = true;
    this.element.classList.add(this.hoverIconClass);
    this.wheel.onMouseOver(this, e);
};

DockWheelItem.prototype.onMouseOut = function(e)
{
    this.active = false;
    this.element.classList.remove(this.hoverIconClass);
    this.wheel.onMouseOut(this, e);
};
