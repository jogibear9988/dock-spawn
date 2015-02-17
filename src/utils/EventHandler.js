function EventHandler(source, eventName, target) {
    // wrap the target
    this.target = target;
    this.eventName = eventName;
    this.source = source;

    this.source.addEventListener(eventName, this.target);
}

module.exports = EventHandler;

EventHandler.prototype.cancel = function() {
    this.source.removeEventListener(this.eventName, this.target);
};
