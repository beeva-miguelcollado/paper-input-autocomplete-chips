Polymer({

  is: 'paper-autocomplete-results',

  hostAttributes: {
    'tabindex': -1
  },

  properties: {
    selectableItems: {
      type: Array,
      value: function() { return []; }
    },

    /**
    * By default navigating of results with the keyboard is circular. i.e.
    * when you are in the first item and you click the up arrow you will
    * move to the last item. If you are in the last item and then click
    * the down arrow, you will move to the first element.
    * By setting this property to true, you prevent this behaviour
    */
    notCircular: {
      type: Boolean,
      value: false
    }
  },

  get items() {
    return this.$.paperMenu.items;
  },

  get focusedItem() {
    return this.$.paperMenu.querySelector('.iron-selected');
  },

  indexOf: function (selectableElement) {
    return this.$.paperMenu.indexOf(selectableElement);
  },

  indexOfSelectable: function (selectableElement) {
    return this.selectableItems.indexOf(selectableElement);
  },

  select: function (index) {
    if ((index >= 0) && (this.selectableItems.length > index)) {

      var focusedItem = this.focusedItem;

      if (focusedItem) {
        focusedItem.classList.remove('iron-selected');
        focusedItem.active = false;
      }

      var nextElement = this.selectableItems[index];

      nextElement.classList.add('iron-selected');
      nextElement.active = true;

      var offset = nextElement.offsetTop + nextElement.offsetHeight;
      var clientHeightOffsetParent = (this.offsetParent) ? this.offsetParent.clientHeight : 0;
      var scrollTopValue = Math.max(0, offset - clientHeightOffsetParent);

      if (this.offsetParent) {
        this.offsetParent.scrollTop = scrollTopValue;
      }
    }
  },

  selectFirst: function () {
    this.select(0);
  },

  selectPrevious: function () {
    var selectedItem = this.focusedItem;

    if (typeof(selectedItem) !== 'undefined') {
      index = Number(this.indexOfSelectable(selectedItem));
      index = Math.max(index - 1, -1);

      if (index < 0) {
        if (!this.notCircular) {
          this.selectLast();
        }
      } else {
        this.select(index);
      }
    }
  },

  selectNext: function () {
    var index = 0;
    var selectedItem = this.focusedItem;

    if (typeof(selectedItem) !== 'undefined') {
      index = Number(this.indexOfSelectable(selectedItem));
      index = Math.min(index + 1, this.selectableItems.length);

      if (index >= this.selectableItems.length) {
        if (!this.notCircular) {
          this.selectFirst();
        }
      } else {
        this.select(index);
      }
    }
  },

  selectLast: function () {
    this.select(this.selectableItems.length - 1);
  },

  _onIronItemsChanged: function (e) {
    if (e.detail) {
      var that = this;

      if (e.detail.removedNodes) {
        e.detail.removedNodes.forEach(function(item) {
            that.arrayDelete('selectableItems', item);
        });
      }

      if (e.detail.addedNodes) {
        e.detail.addedNodes.forEach(function(item) {
          if ((item.hasAttribute) && (item.hasAttribute('selectable-item'))) {
            that.push('selectableItems', item);
          }
        });
      }
    }
  }

});
