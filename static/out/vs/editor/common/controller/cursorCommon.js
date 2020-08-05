/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModel", "vs/editor/common/modes/languageConfigurationRegistry"], function (require, exports, errors_1, strings, position_1, range_1, selection_1, textModel_1, languageConfigurationRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isQuote = exports.CursorColumns = exports.EditOperationResult = exports.CursorState = exports.PartialViewCursorState = exports.PartialModelCursorState = exports.CursorContext = exports.SingleCursorState = exports.CursorConfiguration = exports.EditOperationType = exports.RevealTarget = void 0;
    var RevealTarget;
    (function (RevealTarget) {
        RevealTarget[RevealTarget["Primary"] = 0] = "Primary";
        RevealTarget[RevealTarget["TopMost"] = 1] = "TopMost";
        RevealTarget[RevealTarget["BottomMost"] = 2] = "BottomMost";
    })(RevealTarget = exports.RevealTarget || (exports.RevealTarget = {}));
    /**
     * This is an operation type that will be recorded for undo/redo purposes.
     * The goal is to introduce an undo stop when the controller switches between different operation types.
     */
    var EditOperationType;
    (function (EditOperationType) {
        EditOperationType[EditOperationType["Other"] = 0] = "Other";
        EditOperationType[EditOperationType["Typing"] = 1] = "Typing";
        EditOperationType[EditOperationType["DeletingLeft"] = 2] = "DeletingLeft";
        EditOperationType[EditOperationType["DeletingRight"] = 3] = "DeletingRight";
    })(EditOperationType = exports.EditOperationType || (exports.EditOperationType = {}));
    const autoCloseAlways = () => true;
    const autoCloseNever = () => false;
    const autoCloseBeforeWhitespace = (chr) => (chr === ' ' || chr === '\t');
    function appendEntry(target, key, value) {
        if (target.has(key)) {
            target.get(key).push(value);
        }
        else {
            target.set(key, [value]);
        }
    }
    class CursorConfiguration {
        constructor(languageIdentifier, modelOptions, configuration) {
            this._languageIdentifier = languageIdentifier;
            const options = configuration.options;
            const layoutInfo = options.get(115 /* layoutInfo */);
            this.readOnly = options.get(72 /* readOnly */);
            this.tabSize = modelOptions.tabSize;
            this.indentSize = modelOptions.indentSize;
            this.insertSpaces = modelOptions.insertSpaces;
            this.lineHeight = options.get(51 /* lineHeight */);
            this.pageSize = Math.max(1, Math.floor(layoutInfo.height / this.lineHeight) - 2);
            this.useTabStops = options.get(103 /* useTabStops */);
            this.wordSeparators = options.get(104 /* wordSeparators */);
            this.emptySelectionClipboard = options.get(26 /* emptySelectionClipboard */);
            this.copyWithSyntaxHighlighting = options.get(16 /* copyWithSyntaxHighlighting */);
            this.multiCursorMergeOverlapping = options.get(60 /* multiCursorMergeOverlapping */);
            this.multiCursorPaste = options.get(62 /* multiCursorPaste */);
            this.autoClosingBrackets = options.get(5 /* autoClosingBrackets */);
            this.autoClosingQuotes = options.get(7 /* autoClosingQuotes */);
            this.autoClosingOvertype = options.get(6 /* autoClosingOvertype */);
            this.autoSurround = options.get(10 /* autoSurround */);
            this.autoIndent = options.get(8 /* autoIndent */);
            this.autoClosingPairsOpen2 = new Map();
            this.autoClosingPairsClose2 = new Map();
            this.surroundingPairs = {};
            this._electricChars = null;
            this.shouldAutoCloseBefore = {
                quote: CursorConfiguration._getShouldAutoClose(languageIdentifier, this.autoClosingQuotes),
                bracket: CursorConfiguration._getShouldAutoClose(languageIdentifier, this.autoClosingBrackets)
            };
            let autoClosingPairs = CursorConfiguration._getAutoClosingPairs(languageIdentifier);
            if (autoClosingPairs) {
                for (const pair of autoClosingPairs) {
                    appendEntry(this.autoClosingPairsOpen2, pair.open.charAt(pair.open.length - 1), pair);
                    if (pair.close.length === 1) {
                        appendEntry(this.autoClosingPairsClose2, pair.close, pair);
                    }
                }
            }
            let surroundingPairs = CursorConfiguration._getSurroundingPairs(languageIdentifier);
            if (surroundingPairs) {
                for (const pair of surroundingPairs) {
                    this.surroundingPairs[pair.open] = pair.close;
                }
            }
        }
        static shouldRecreate(e) {
            return (e.hasChanged(115 /* layoutInfo */)
                || e.hasChanged(104 /* wordSeparators */)
                || e.hasChanged(26 /* emptySelectionClipboard */)
                || e.hasChanged(60 /* multiCursorMergeOverlapping */)
                || e.hasChanged(62 /* multiCursorPaste */)
                || e.hasChanged(5 /* autoClosingBrackets */)
                || e.hasChanged(7 /* autoClosingQuotes */)
                || e.hasChanged(6 /* autoClosingOvertype */)
                || e.hasChanged(10 /* autoSurround */)
                || e.hasChanged(103 /* useTabStops */)
                || e.hasChanged(51 /* lineHeight */)
                || e.hasChanged(72 /* readOnly */));
        }
        get electricChars() {
            if (!this._electricChars) {
                this._electricChars = {};
                let electricChars = CursorConfiguration._getElectricCharacters(this._languageIdentifier);
                if (electricChars) {
                    for (const char of electricChars) {
                        this._electricChars[char] = true;
                    }
                }
            }
            return this._electricChars;
        }
        normalizeIndentation(str) {
            return textModel_1.TextModel.normalizeIndentation(str, this.indentSize, this.insertSpaces);
        }
        static _getElectricCharacters(languageIdentifier) {
            try {
                return languageConfigurationRegistry_1.LanguageConfigurationRegistry.getElectricCharacters(languageIdentifier.id);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                return null;
            }
        }
        static _getAutoClosingPairs(languageIdentifier) {
            try {
                return languageConfigurationRegistry_1.LanguageConfigurationRegistry.getAutoClosingPairs(languageIdentifier.id);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                return null;
            }
        }
        static _getShouldAutoClose(languageIdentifier, autoCloseConfig) {
            switch (autoCloseConfig) {
                case 'beforeWhitespace':
                    return autoCloseBeforeWhitespace;
                case 'languageDefined':
                    return CursorConfiguration._getLanguageDefinedShouldAutoClose(languageIdentifier);
                case 'always':
                    return autoCloseAlways;
                case 'never':
                    return autoCloseNever;
            }
        }
        static _getLanguageDefinedShouldAutoClose(languageIdentifier) {
            try {
                const autoCloseBeforeSet = languageConfigurationRegistry_1.LanguageConfigurationRegistry.getAutoCloseBeforeSet(languageIdentifier.id);
                return c => autoCloseBeforeSet.indexOf(c) !== -1;
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                return autoCloseNever;
            }
        }
        static _getSurroundingPairs(languageIdentifier) {
            try {
                return languageConfigurationRegistry_1.LanguageConfigurationRegistry.getSurroundingPairs(languageIdentifier.id);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                return null;
            }
        }
    }
    exports.CursorConfiguration = CursorConfiguration;
    /**
     * Represents the cursor state on either the model or on the view model.
     */
    class SingleCursorState {
        constructor(selectionStart, selectionStartLeftoverVisibleColumns, position, leftoverVisibleColumns) {
            this.selectionStart = selectionStart;
            this.selectionStartLeftoverVisibleColumns = selectionStartLeftoverVisibleColumns;
            this.position = position;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
            this.selection = SingleCursorState._computeSelection(this.selectionStart, this.position);
        }
        equals(other) {
            return (this.selectionStartLeftoverVisibleColumns === other.selectionStartLeftoverVisibleColumns
                && this.leftoverVisibleColumns === other.leftoverVisibleColumns
                && this.position.equals(other.position)
                && this.selectionStart.equalsRange(other.selectionStart));
        }
        hasSelection() {
            return (!this.selection.isEmpty() || !this.selectionStart.isEmpty());
        }
        move(inSelectionMode, lineNumber, column, leftoverVisibleColumns) {
            if (inSelectionMode) {
                // move just position
                return new SingleCursorState(this.selectionStart, this.selectionStartLeftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
            else {
                // move everything
                return new SingleCursorState(new range_1.Range(lineNumber, column, lineNumber, column), leftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
        }
        static _computeSelection(selectionStart, position) {
            let startLineNumber, startColumn, endLineNumber, endColumn;
            if (selectionStart.isEmpty()) {
                startLineNumber = selectionStart.startLineNumber;
                startColumn = selectionStart.startColumn;
                endLineNumber = position.lineNumber;
                endColumn = position.column;
            }
            else {
                if (position.isBeforeOrEqual(selectionStart.getStartPosition())) {
                    startLineNumber = selectionStart.endLineNumber;
                    startColumn = selectionStart.endColumn;
                    endLineNumber = position.lineNumber;
                    endColumn = position.column;
                }
                else {
                    startLineNumber = selectionStart.startLineNumber;
                    startColumn = selectionStart.startColumn;
                    endLineNumber = position.lineNumber;
                    endColumn = position.column;
                }
            }
            return new selection_1.Selection(startLineNumber, startColumn, endLineNumber, endColumn);
        }
    }
    exports.SingleCursorState = SingleCursorState;
    class CursorContext {
        constructor(model, coordinatesConverter, cursorConfig) {
            this.model = model;
            this.coordinatesConverter = coordinatesConverter;
            this.cursorConfig = cursorConfig;
        }
    }
    exports.CursorContext = CursorContext;
    class PartialModelCursorState {
        constructor(modelState) {
            this.modelState = modelState;
            this.viewState = null;
        }
    }
    exports.PartialModelCursorState = PartialModelCursorState;
    class PartialViewCursorState {
        constructor(viewState) {
            this.modelState = null;
            this.viewState = viewState;
        }
    }
    exports.PartialViewCursorState = PartialViewCursorState;
    class CursorState {
        constructor(modelState, viewState) {
            this.modelState = modelState;
            this.viewState = viewState;
        }
        static fromModelState(modelState) {
            return new PartialModelCursorState(modelState);
        }
        static fromViewState(viewState) {
            return new PartialViewCursorState(viewState);
        }
        static fromModelSelection(modelSelection) {
            const selectionStartLineNumber = modelSelection.selectionStartLineNumber;
            const selectionStartColumn = modelSelection.selectionStartColumn;
            const positionLineNumber = modelSelection.positionLineNumber;
            const positionColumn = modelSelection.positionColumn;
            const modelState = new SingleCursorState(new range_1.Range(selectionStartLineNumber, selectionStartColumn, selectionStartLineNumber, selectionStartColumn), 0, new position_1.Position(positionLineNumber, positionColumn), 0);
            return CursorState.fromModelState(modelState);
        }
        static fromModelSelections(modelSelections) {
            let states = [];
            for (let i = 0, len = modelSelections.length; i < len; i++) {
                states[i] = this.fromModelSelection(modelSelections[i]);
            }
            return states;
        }
        equals(other) {
            return (this.viewState.equals(other.viewState) && this.modelState.equals(other.modelState));
        }
    }
    exports.CursorState = CursorState;
    class EditOperationResult {
        constructor(type, commands, opts) {
            this.type = type;
            this.commands = commands;
            this.shouldPushStackElementBefore = opts.shouldPushStackElementBefore;
            this.shouldPushStackElementAfter = opts.shouldPushStackElementAfter;
        }
    }
    exports.EditOperationResult = EditOperationResult;
    /**
     * Common operations that work and make sense both on the model and on the view model.
     */
    class CursorColumns {
        static visibleColumnFromColumn(lineContent, column, tabSize) {
            const lineContentLength = lineContent.length;
            const endOffset = column - 1 < lineContentLength ? column - 1 : lineContentLength;
            let result = 0;
            let i = 0;
            while (i < endOffset) {
                const codePoint = strings.getNextCodePoint(lineContent, endOffset, i);
                i += (codePoint >= 65536 /* UNICODE_SUPPLEMENTARY_PLANE_BEGIN */ ? 2 : 1);
                if (codePoint === 9 /* Tab */) {
                    result = CursorColumns.nextRenderTabStop(result, tabSize);
                }
                else {
                    let graphemeBreakType = strings.getGraphemeBreakType(codePoint);
                    while (i < endOffset) {
                        const nextCodePoint = strings.getNextCodePoint(lineContent, endOffset, i);
                        const nextGraphemeBreakType = strings.getGraphemeBreakType(nextCodePoint);
                        if (strings.breakBetweenGraphemeBreakType(graphemeBreakType, nextGraphemeBreakType)) {
                            break;
                        }
                        i += (nextCodePoint >= 65536 /* UNICODE_SUPPLEMENTARY_PLANE_BEGIN */ ? 2 : 1);
                        graphemeBreakType = nextGraphemeBreakType;
                    }
                    if (strings.isFullWidthCharacter(codePoint) || strings.isEmojiImprecise(codePoint)) {
                        result = result + 2;
                    }
                    else {
                        result = result + 1;
                    }
                }
            }
            return result;
        }
        static toStatusbarColumn(lineContent, column, tabSize) {
            const lineContentLength = lineContent.length;
            const endOffset = column - 1 < lineContentLength ? column - 1 : lineContentLength;
            let result = 0;
            let i = 0;
            while (i < endOffset) {
                const codePoint = strings.getNextCodePoint(lineContent, endOffset, i);
                i += (codePoint >= 65536 /* UNICODE_SUPPLEMENTARY_PLANE_BEGIN */ ? 2 : 1);
                if (codePoint === 9 /* Tab */) {
                    result = CursorColumns.nextRenderTabStop(result, tabSize);
                }
                else {
                    result = result + 1;
                }
            }
            return result + 1;
        }
        static visibleColumnFromColumn2(config, model, position) {
            return this.visibleColumnFromColumn(model.getLineContent(position.lineNumber), position.column, config.tabSize);
        }
        static columnFromVisibleColumn(lineContent, visibleColumn, tabSize) {
            if (visibleColumn <= 0) {
                return 1;
            }
            const lineLength = lineContent.length;
            let beforeVisibleColumn = 0;
            let beforeColumn = 1;
            let i = 0;
            while (i < lineLength) {
                const codePoint = strings.getNextCodePoint(lineContent, lineLength, i);
                i += (codePoint >= 65536 /* UNICODE_SUPPLEMENTARY_PLANE_BEGIN */ ? 2 : 1);
                let afterVisibleColumn;
                if (codePoint === 9 /* Tab */) {
                    afterVisibleColumn = CursorColumns.nextRenderTabStop(beforeVisibleColumn, tabSize);
                }
                else {
                    let graphemeBreakType = strings.getGraphemeBreakType(codePoint);
                    while (i < lineLength) {
                        const nextCodePoint = strings.getNextCodePoint(lineContent, lineLength, i);
                        const nextGraphemeBreakType = strings.getGraphemeBreakType(nextCodePoint);
                        if (strings.breakBetweenGraphemeBreakType(graphemeBreakType, nextGraphemeBreakType)) {
                            break;
                        }
                        i += (nextCodePoint >= 65536 /* UNICODE_SUPPLEMENTARY_PLANE_BEGIN */ ? 2 : 1);
                        graphemeBreakType = nextGraphemeBreakType;
                    }
                    if (strings.isFullWidthCharacter(codePoint) || strings.isEmojiImprecise(codePoint)) {
                        afterVisibleColumn = beforeVisibleColumn + 2;
                    }
                    else {
                        afterVisibleColumn = beforeVisibleColumn + 1;
                    }
                }
                const afterColumn = i + 1;
                if (afterVisibleColumn >= visibleColumn) {
                    const beforeDelta = visibleColumn - beforeVisibleColumn;
                    const afterDelta = afterVisibleColumn - visibleColumn;
                    if (afterDelta < beforeDelta) {
                        return afterColumn;
                    }
                    else {
                        return beforeColumn;
                    }
                }
                beforeVisibleColumn = afterVisibleColumn;
                beforeColumn = afterColumn;
            }
            // walked the entire string
            return lineLength + 1;
        }
        static columnFromVisibleColumn2(config, model, lineNumber, visibleColumn) {
            let result = this.columnFromVisibleColumn(model.getLineContent(lineNumber), visibleColumn, config.tabSize);
            let minColumn = model.getLineMinColumn(lineNumber);
            if (result < minColumn) {
                return minColumn;
            }
            let maxColumn = model.getLineMaxColumn(lineNumber);
            if (result > maxColumn) {
                return maxColumn;
            }
            return result;
        }
        /**
         * ATTENTION: This works with 0-based columns (as oposed to the regular 1-based columns)
         */
        static nextRenderTabStop(visibleColumn, tabSize) {
            return visibleColumn + tabSize - visibleColumn % tabSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as oposed to the regular 1-based columns)
         */
        static nextIndentTabStop(visibleColumn, indentSize) {
            return visibleColumn + indentSize - visibleColumn % indentSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as oposed to the regular 1-based columns)
         */
        static prevRenderTabStop(column, tabSize) {
            return column - 1 - (column - 1) % tabSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as oposed to the regular 1-based columns)
         */
        static prevIndentTabStop(column, indentSize) {
            return column - 1 - (column - 1) % indentSize;
        }
    }
    exports.CursorColumns = CursorColumns;
    function isQuote(ch) {
        return (ch === '\'' || ch === '"' || ch === '`');
    }
    exports.isQuote = isQuote;
});
//# __sourceMappingURL=cursorCommon.js.map