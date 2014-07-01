/**
 * Tab Host control contains tabs known as TabPages.
 * The tab strip can be aligned in different orientations
 */
dockspawn.TabHost = function(tabStripDirection, displayCloseButton)
{
    /**
     * Create a tab host with the tab strip aligned in the [tabStripDirection] direciton
     * Only dockspawn.TabHost.DIRECTION_BOTTOM and dockspawn.TabHost.DIRECTION_TOP are supported
     */
    if (tabStripDirection === undefined)
        tabStripDirection = dockspawn.TabHost.DIRECTION_BOTTOM;
    if (displayCloseButton === undefined)
        displayCloseButton = false;

    this.tabStripDirection = tabStripDirection;
    this.displayCloseButton = displayCloseButton;           // Indicates if the close button next to the tab handle should be displayed
    this.pages = [];
    var that = this;
     that.eventListeners = [];
    this.tabHandleListener = {
        onMoveTab :function(e){ that.onMoveTab(e)},
    };
    this.hostElement = document.createElement('div');       // The main tab host DOM element
    this.tabListElement = document.createElement('div');    // Hosts the tab handles
    this.separatorElement = document.createElement('div');  // A seperator line between the tabs and content
    this.contentElement = document.createElement('div');    // Hosts the active tab content
    this.createTabPage = this._createDefaultTabPage;        // Factory for creating tab pages

    if (this.tabStripDirection == dockspawn.TabHost.DIRECTION_BOTTOM)
    {
        this.hostElement.appendChild(this.contentElement);
        this.hostElement.appendChild(this.separatorElement);
        this.hostElement.appendChild(this.tabListElement);
    }
    else if (this.tabStripDirection == dockspawn.TabHost.DIRECTION_TOP)
    {
        this.hostElement.appendChild(this.tabListElement);
        this.hostElement.appendChild(this.separatorElement);
        this.hostElement.appendChild(this.contentElement);
    }
    else
        throw new dockspawn.Exception("Only top and bottom tab strip orientations are supported");

    this.hostElement.classList.add("tab-host");
    this.tabListElement.classList.add("tab-handle-list-container");
    this.separatorElement.classList.add("tab-handle-content-seperator");
    this.contentElement.classList.add("tab-content");
};

// constants
dockspawn.TabHost.DIRECTION_TOP = 0;
dockspawn.TabHost.DIRECTION_BOTTOM = 1;
dockspawn.TabHost.DIRECTION_LEFT = 2;
dockspawn.TabHost.DIRECTION_RIGHT = 3;

dockspawn.TabHost.prototype.onMoveTab = function(e){
    this.tabListElement;
    var index =  Array.prototype.slice.call(this.tabListElement.childNodes).indexOf(e.self.elementBase);

    this.change(/*host*/this, /*handle*/e.self, e.state, index);
};

dockspawn.TabHost.prototype.performTabsLayout = function(indexes){
    this.pages = this.pages.orderByIndexes(indexes);
    
    var items = this.tabListElement.childNodes;
    var itemsArr = [];
    for (var i in items) {
        if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
            itemsArr.push(items[i]);
        }
    }
    itemsArr = itemsArr.orderByIndexes(indexes);
    for (i = 0; i < itemsArr.length; ++i) {
        this.tabListElement.appendChild(itemsArr[i]);
    }
};

dockspawn.TabHost.prototype.addListener = function(listener){
    this.eventListeners.push(listener);
};

dockspawn.TabHost.prototype.removeListener = function(listener)
{
    this.eventListeners.splice(this.eventListeners.indexOf(listener), 1);
};

dockspawn.TabHost.prototype.change = function(host, handle, state, index){
    this.eventListeners.forEach(function(listener) { 
        if (listener.onChange) {
            listener.onChange({host: host, handle: handle, state: state, index: index}); 
        }
    });
};

dockspawn.TabHost.prototype._createDefaultTabPage = function(tabHost, container)
{
    return new dockspawn.TabPage(tabHost, container);
};

dockspawn.TabHost.prototype.setActiveTab = function(container)
{
    if(this.pages.length > 0) { this.onTabPageSelected(this.pages[0]) };
};

dockspawn.TabHost.prototype.resize = function(width, height)
{
    this.hostElement.style.width = width + "px";
    this.hostElement.style.height = height + "px";

    var tabHeight = this.tabListElement.clientHeight;
    if (this.timeoutPerform) //lazy check
        clearTimeout(this.timeoutPerform);
    var self = this;
    this.timeoutPerform = setTimeout(function () {
        self.resizeTabListElement(width, height);
    }, 100);
    var separatorHeight = this.separatorElement.clientHeight;
    var contentHeight = height - tabHeight - separatorHeight;
    this.contentElement.style.height = contentHeight + "px";

    if (this.activeTab)
        this.activeTab.resize(width, contentHeight);
};

dockspawn.TabHost.prototype.resizeTabListElement = function(width, height){
    if(this.pages.length == 0) return;
    var tabListWidth = 0;
    this.pages.forEach(function(page){
        var handle = page.handle;
        handle.elementBase.style.width = ""; //clear
        handle.elementText.style.width = "";
        tabListWidth += handle.elementBase.clientWidth;
    });
    var scaleMultiplier = width / tabListWidth;
    if(scaleMultiplier > 1.2) return; //with a reserve
    var self = this;
    this.pages.forEach(function(page, index){
        var handle = page.handle;
         var newSize = scaleMultiplier * handle.elementBase.clientWidth;
         if(index == self.pages.length - 1)
            newSize = newSize - 5;
         handle.elementBase.style.width = newSize + "px";
         if(self.tabStripDirection == dockspawn.TabHost.DIRECTION_TOP){
             handle.elementText.style.width = newSize - handle.elementCloseButton.clientWidth - 16 + "px";
         }
    });
};

dockspawn.TabHost.prototype.performLayout = function(children)
{
    // Destroy all existing tab pages
    this.pages.forEach(function(tab)
    {
        tab.handle.removeListener(this.tabHandleListener);
        tab.destroy();
    });
    this.pages.length = 0;

    var oldActiveTab = this.activeTab;
    delete this.activeTab;

    var childPanels = children.filter(function(child)
    {
        return child.containerType == "panel";
    });

    if (childPanels.length > 0)
    {
        // Rebuild new tab pages
        var self = this;
        childPanels.forEach(function(child)
        {
            var page = self.createTabPage(self, child);
            page.handle.addListener(self.tabHandleListener);
            self.pages.push(page);

            // Restore the active selected tab
            if (oldActiveTab && page.container === oldActiveTab.container)
                self.activeTab = page;
        });
        this._setTabHandlesVisible(true);
    }
    else
        // Do not show an empty tab handle host with zero tabs
        this._setTabHandlesVisible(false);

    if (this.activeTab)
        this.onTabPageSelected(this.activeTab);
};

dockspawn.TabHost.prototype._setTabHandlesVisible = function(visible)
{
    this.tabListElement.style.display = visible ? "block" : "none";
    this.separatorElement.style.display = visible ? "block" : "none";
};

dockspawn.TabHost.prototype.onTabPageSelected = function(page)
{
    this.activeTab = page;
    this.pages.forEach(function(tabPage)
    {
        var selected = (tabPage === page);
        tabPage.setSelected(selected);
    });

    // adjust the zIndex of the tabs to have proper shadow/depth effect
    var zIndexDelta = 1;
    var zIndex = 1000;
    this.pages.forEach(function(tabPage)
    {
        tabPage.handle.setZIndex(zIndex);
        var selected = (tabPage == page);
        if (selected)
            zIndexDelta = -1;
        zIndex += zIndexDelta;
    });

};
