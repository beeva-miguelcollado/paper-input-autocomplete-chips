Polymer({
  is: 'paper-input-autocomplete-chips',

  behaviors: [
    Polymer.IronControlState,
    Polymer.IronFormElementBehavior,
    Polymer.PaperInputBehavior,
    WebPaperElem.InputAutoCompleteBehavior
  ],

  properties: {
    chipLabelPrefix: {
      type: String,
      value: ''
    },
    chipLabelSuffix: {
      type: String,
      value: ''
    },
    /**
     * The candidates from local variable.
     */
    selectedObjects: {
      type: Array,
      value: function() { return []; },
      notify: true
    },
    /**
     * The candidates from local variable.
     */
    localCandidates:{
      type:Array,
      value: function() { return []; }
    },
    /**
     * Hidden Input value.
     */
    hiddenValue: {
      type: String,
      notify: true,
    },

    placeholderAfterSelected: {
      type: String,
    },

    _placeholderAfterSelected: {
      type: String,
    },

    /**
      * Whether or not the chip uses an animated transition between opened and
      * closed states
      *
      * @attribute animated
      * @type Boolean
      * @default true
      */
    animated: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },

    noChipImage: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },

    _boundOnBlur: {
      type: Function,
      value: function() {
        return this._onBlur.bind(this);
      }
    },

    maxSelectedItems: {
      type: Number,
      value: 0
    },

    readOnly: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },

    removeOnly: {
      type: Boolean,
      value: false,
      reflectToAttribute: true
    },

    removeSelectedFromSuggestions: {
      type: Boolean,
      value: false
    },

    notCircular: {
      type: Boolean,
      value: false
    },

    withCustomSuggestionBoxPosition: {
      type: Boolean,
      value: false
    },

    noDisplayInputEditLine: {
      type: Boolean,
      value: false
    },
  },

  listeners: {
    'tap': '_onTap',
    'iron-input-validate': '_onIronInputValidate'
  },

  observers: [
    '_onInputValueChange(inputValue)',
    '_onSelectedObjectsChange(selectedObjects)',
    '_onSelectedObjectsChange(selectedObjects.splices)',
    '_onAutoCompleteSelectedObjectChange(selectedObject)',
    '_suggestionsChanged(_suggestions)',
    '_suggestionsChanged(_suggestions.splices)',
    '_loadingChanged(_loading)',
    '_calculateSuggestionPanelPosition(suggestionsPosition)',
    '_cptReadOnlyOrRemoveOnly(readOnly, removeOnly)',
    '_cptInputTextStyle(readOnly, removeOnly, noDisplayInputEditLine)'
  ],

  get _paperInputContainerElement() {
    return this.$.paperInputContainer;
  },

  get hasSelectedObjects() {
    return ((this.selectedObjects) && (this.selectedObjects.length > 0));
  },

  get $input() {
    return this.$.input;
  },

  _suggestionFilterBeforePublish: function (suggestions) {
    if (this.removeSelectedFromSuggestions) {
      var selectedKeys = [];

      this.selectedObjects.forEach(function(item) {
        selectedKeys.push(item.key);
      });

      var filteredSuggestions = suggestions.filter(function (item) {
        return (selectedKeys.indexOf(item.key) < 0);
      });

      suggestions = filteredSuggestions;
    }

    return suggestions;
  },

  _onTap: function (e) {
    if ((e.target === this.$.inputTagsContainer) && (!this._inputElement.focused)) {
      this._inputElement.focus();
    }
  },

  _local_keyup: function (e) {
    this._keyup(e);
  },

  _local_keydown: function (e) {
    if (e.which === 8) {
      this._keydown_backspace_handler(e);
    } else {
      this._keydown(e);
    }
  },

  _local_blur: function (e) {
    this._blur(e);
  },

  _local_paste: function(e){
    this._paste(e);
  },

  _onInputValueChange: function (inputValue) {
    var hasSelectedObjects = ((this.selectedObjects) && (this.selectedObjects.length > 0));

    this.hiddenValue = ((inputValue === '') && hasSelectedObjects) ? ' ' : inputValue;
    this._paperInputContainerElement._handleValueAndAutoValidate(this._inputElement);
  },

  _loadingChanged: function(_loading){
    if (this._loading) {
      this.showSuggestionsPanel();
    } else {
      this.hideSuggestionsPanel();
    }
  },

  _onSelectedObjectsChange: function (selectedObjects) {
    if (selectedObjects) {
      if (selectedObjects.indexSplices) {
        var self = this;
        selectedObjects.indexSplices.forEach(function(spliceItem) {
          if (spliceItem.addedCount > 0) {
            self._fixMissingObjextKeys([ spliceItem.object[spliceItem.index] ]);
          }
        });
        //console.info(this.selectedObjects);
      } else {
        this._fixMissingObjextKeys(selectedObjects);
      }
    }

    this._updatePlaceholderAfterSelected();
    this._updateHiddenInputTextForFloatLabel();
    this.selectedObject = null;
  },

  _updatePlaceholderAfterSelected: function () {
    if ((this.alwaysFloatLabel) && ((!this.selectedObjects) || (this.selectedObjects.length <= 0))) {
      this._placeholderAfterSelected = this.placeholder;
    } else if ((this.selectedObjects) && (this.selectedObjects.length > 0)) {
      this._placeholderAfterSelected = this.placeholderAfterSelected;
    }
    else {
      this._placeholderAfterSelected = null;
    }
  },

  getInitialsFrom: function(value) {
    if (value && typeof value === 'string') {
      return value.replace(/[^A-Z]/g, '');
    }
  },

  _fixMissingObjextKeys: function (objectArray) {
    if (objectArray && (objectArray instanceof Array)) {
      objectArray.forEach(function(obj) {
        if (!obj.key) {
          obj.key = this._generateObjectKey(obj.name);
        }
      });
    }
  },

  _findObjectAlreadySelected: function (objValue) {
    var returnValue = -1;

    if (objValue) {
      var index = (this.selectedObjects) ? this.selectedObjects.length : 0;

      while (index--) {
        var objToCompare = this.selectedObjects[index];

        if (objToCompare.key === objValue.key) {
          returnValue = index;
          break;
        }
      }
    }

    return returnValue;
  },

  _onAutoCompleteSelectedObjectChange: function (selectedObject) {
    this.appendSelectedObject(selectedObject);

    this.inputValue = null;
    this._setSelectedItem(null);

    this._updateHiddenInputTextForFloatLabel();
  },

  _onChipRemove: function (e) {
    e.preventDefault();

    this.removeSelectedObject(e.target.dataObject);

    this._updateHiddenInputTextForFloatLabel();
  },

  _updateHiddenInputTextForFloatLabel: function () {
    this.hiddenValue = (this.hasSelectedObjects) ? ' ' : null;

    if (this.hasSelectedObjects) {
      this.$.inputTagsContainer.classList.add('chip-item-added');
    } else {
      this.$.inputTagsContainer.classList.remove('chip-item-added');
    }
  },

  _suggestionsChanged: function (suggestions) {
    if ((this._suggestions) && (this._suggestions.length > 0)) {
      this.showSuggestionsPanel();
    } else {
      this.hideSuggestionsPanel();
    }
  },

  _cptReadOnlyOrRemoveOnly: function (readOnly, removeOnly) {
    this.$.inputContainer.hidden = !!(readOnly || removeOnly);
  },

  _canRemoveChip: function (chipItem, readOnly, removeOnly) {
    return !!((!chipItem.readOnly) && (!readOnly));
  },

  _canInputText: function (readOnly, removeOnly) {
    return !!((!readOnly) && (!removeOnly));
  },

  _cptInputTextStyle: function (readOnly, removeOnly, noDisplayInputEditLine) {
    if (this._canInputText(readOnly, removeOnly)) {
      this.classList.remove('no-display-input-edit-line');
    } else {
      this.classList.add('no-display-input-edit-line');
    }

    this.updateStyles();
  },

  // Element Lifecycle
  ready: function() {
    this._override_paperInputContainer();
    this.addEventListener('blur', this._boundOnBlur, true);
  },

  // Element Behavior
  hideSuggestionsPanel: function () {
    this.$.suggestionsPanel.classList.add('hidden');
  },

  showSuggestionsPanel: function () {
    this.fire('before-show-suggestion-panel');
    this._calculateSuggestionPanelPosition();
    this.$.suggestionsPanel.classList.remove('hidden');

    this.async(function () {
      if (this.isSuggestionsOnBottom) {
        this.$.autocompleteResults.selectFirst();
      } else {
        this.$.autocompleteResults.selectLast();
      }
    }, 1);
  },

  _calculateSuggestionPanelPosition: function () {
    if (this.withCustomSuggestionBoxPosition) {
      fire('custom-suggestion-position', {
        inputContainer: this.$.paperInputContainer,
        inputElement: this.$input,
        suggestionPanel: this.$.suggestionsPanel
      });
    } else {
      if (this.suggestionsPosition === 'top') {
        var inputRect = this.$input.getBoundingClientRect();

        // Bottom margin from paper-input-container
        var diffBottom = 8;
        var deltaBottom = inputRect.height + diffBottom;

        this.$.suggestionsPanel.style.top = '';
        this.$.suggestionsPanel.style.bottom = deltaBottom + 'px';
      } else if (this.suggestionsPosition === 'bottom') {
        this.$.suggestionsPanel.style.top = '';
        this.$.suggestionsPanel.style.bottom = '';
      }
    }
  },

  removeSelectedObject: function (selectedObject) {
    this.removeSelectedObjectByIndex(this._findObjectAlreadySelected(selectedObject));
  },

  removeSelectedObjectByIndex: function (objectIndex) {
    if (objectIndex >= 0) {
      this.arrayDelete('selectedObjects', this.selectedObjects[objectIndex]);
    }
  },

  appendSelectedObject: function (selectedObject) {
    if (!selectedObject) {
     return;
    }

    if (!this.selectedObjects) {
      this.selectedObjects = [];
    }

    if ((this.maxSelectedItems > 0) && (this.selectedObjects.length >= this.maxSelectedItems)) {
      return;
    }

    var previousObjectKeyValues = {
      key: selectedObject.key,
      text: selectedObject.text,
    };

    var eSelectingObject = this.fire('selecting-object', { selectedObject: selectedObject }, {cancelable: true});

    if (!eSelectingObject.defaultPrevented) {

      if ((selectedObject.key === previousObjectKeyValues.key)
          && (selectedObject.text !== previousObjectKeyValues.text)) {
          selectedObject.key = this._generateObjectKey(selectedObject.text);
      }

      if (this._findObjectAlreadySelected(selectedObject) < 0) {
          this.push('selectedObjects', selectedObject);
      }
    }
  },

  _onBlur: function() {
    this._paperInputContainerElement._handleValueAndAutoValidate(this._inputElement);
  },

  _keydown_backspace_handler: function (e) {
    if ((!this.inputValue) || (this.inputValue === '')) {
      this.removeSelectedObjectByIndex(this.selectedObjects.length - 1);
    }
  },

  _onIronInputValidate: function(event) {
    this.invalid = this._inputElement.invalid;
  },

  _override_paperInputContainer: function () {
    this._paperInputContainerElement._handleValue = this._override_paperInputContainer_handleValue;
    this._paperInputContainerElement._handleValueAndAutoValidate = this._override_paperInputContainer_handleValueAndAutoValidate;
  },

  _override_paperInputContainer_handleValue: function(inputElement) {
    var value = this.dataHost.inputValue;

    inputElement = this.dataHost._inputElement;

    // type="number" hack needed because this.value is empty until it's valid
    this._inputHasContent = (value || value === 0 || (inputElement.type === 'number' && !inputElement.checkValidity()) || this.dataHost.hasSelectedObjects);

    this.updateAddons({
      inputElement: inputElement,
      value: value,
      invalid: this.invalid
    });
  },

  _override_paperInputContainer_handleValueAndAutoValidate: function(inputElement) {
    inputElement = this.dataHost._inputElement;

    if (this.autoValidate) {
      var valid;

      if (inputElement.validate) {
        valid = inputElement.validate(this.inputValue);
      } else {
        valid = inputElement.checkValidity();
      }

      this.invalid = !valid;
    }

    // Call this last to notify the add-ons.
    this._handleValue(inputElement);
  },

  _onInputFocus: function (e) {
    this.fire('input-focused');

    if (this.searchOnGotFocus) {
      this._search(this._safeInputValue);
    }
  },

  clear: function() {
    this.selectedObjects = [];
  },

});
