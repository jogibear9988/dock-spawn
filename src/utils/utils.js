var counter = 0;

module.exports = {
    getPixels: function (pixels) {
        if (pixels === null) {
            return 0;
        }

        return parseInt(pixels.replace('px', ''));
    },

    disableGlobalTextSelection: function () {
        document.body.classList.add('disable-selection');
    },

    enableGlobalTextSelection: function () {
        document.body.classList.remove('disable-selection');
    },

    isPointInsideNode: function (px, py, node) {
        var element = node.container.containerElement;

        return (
            px >= element.offsetLeft &&
            px <= element.offsetLeft + element.clientWidth &&
            py >= element.offsetTop &&
            py <= element.offsetTop + element.clientHeight
        );
    },

    getNextId: function (prefix) {
        return prefix + counter++;
    },

    removeNode: function (node) {
        if (node.parentNode === null) {
            return false;
        }

        node.parentNode.removeChild(node);

        return true;
    }
};
