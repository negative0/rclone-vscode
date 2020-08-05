/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/common/commands/replaceCommand", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModelSearch", "vs/editor/contrib/find/findDecorations", "vs/editor/contrib/find/replaceAllCommand", "vs/editor/contrib/find/replacePattern", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays"], function (require, exports, async_1, lifecycle_1, replaceCommand_1, position_1, range_1, selection_1, textModelSearch_1, findDecorations_1, replaceAllCommand_1, replacePattern_1, contextkey_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindModelBoundToEditorModel = exports.MATCHES_LIMIT = exports.FIND_IDS = exports.ToggleSearchScopeKeybinding = exports.ToggleRegexKeybinding = exports.ToggleWholeWordKeybinding = exports.ToggleCaseSensitiveKeybinding = exports.CONTEXT_REPLACE_INPUT_FOCUSED = exports.CONTEXT_FIND_INPUT_FOCUSED = exports.CONTEXT_FIND_WIDGET_NOT_VISIBLE = exports.CONTEXT_FIND_WIDGET_VISIBLE = void 0;
    exports.CONTEXT_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('findWidgetVisible', false);
    exports.CONTEXT_FIND_WIDGET_NOT_VISIBLE = exports.CONTEXT_FIND_WIDGET_VISIBLE.toNegated();
    // Keep ContextKey use of 'Focussed' to not break when clauses
    exports.CONTEXT_FIND_INPUT_FOCUSED = new contextkey_1.RawContextKey('findInputFocussed', false);
    exports.CONTEXT_REPLACE_INPUT_FOCUSED = new contextkey_1.RawContextKey('replaceInputFocussed', false);
    exports.ToggleCaseSensitiveKeybinding = {
        primary: 512 /* Alt */ | 33 /* KEY_C */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */ }
    };
    exports.ToggleWholeWordKeybinding = {
        primary: 512 /* Alt */ | 53 /* KEY_W */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 53 /* KEY_W */ }
    };
    exports.ToggleRegexKeybinding = {
        primary: 512 /* Alt */ | 48 /* KEY_R */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 48 /* KEY_R */ }
    };
    exports.ToggleSearchScopeKeybinding = {
        primary: 512 /* Alt */ | 42 /* KEY_L */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 42 /* KEY_L */ }
    };
    exports.FIND_IDS = {
        StartFindAction: 'actions.find',
        StartFindWithSelection: 'actions.findWithSelection',
        NextMatchFindAction: 'editor.action.nextMatchFindAction',
        PreviousMatchFindAction: 'editor.action.previousMatchFindAction',
        NextSelectionMatchFindAction: 'editor.action.nextSelectionMatchFindAction',
        PreviousSelectionMatchFindAction: 'editor.action.previousSelectionMatchFindAction',
        StartFindReplaceAction: 'editor.action.startFindReplaceAction',
        CloseFindWidgetCommand: 'closeFindWidget',
        ToggleCaseSensitiveCommand: 'toggleFindCaseSensitive',
        ToggleWholeWordCommand: 'toggleFindWholeWord',
        ToggleRegexCommand: 'toggleFindRegex',
        ToggleSearchScopeCommand: 'toggleFindInSelection',
        TogglePreserveCaseCommand: 'togglePreserveCase',
        ReplaceOneAction: 'editor.action.replaceOne',
        ReplaceAllAction: 'editor.action.replaceAll',
        SelectAllMatchesAction: 'editor.action.selectAllMatches'
    };
    exports.MATCHES_LIMIT = 19999;
    const RESEARCH_DELAY = 240;
    class FindModelBoundToEditorModel {
        constructor(editor, state) {
            this._toDispose = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._state = state;
            this._isDisposed = false;
            this._startSearchingTimer = new async_1.TimeoutTimer();
            this._decorations = new findDecorations_1.FindDecorations(editor);
            this._toDispose.add(this._decorations);
            this._updateDecorationsScheduler = new async_1.RunOnceScheduler(() => this.research(false), 100);
            this._toDispose.add(this._updateDecorationsScheduler);
            this._toDispose.add(this._editor.onDidChangeCursorPosition((e) => {
                if (e.reason === 3 /* Explicit */
                    || e.reason === 5 /* Undo */
                    || e.reason === 6 /* Redo */) {
                    this._decorations.setStartPosition(this._editor.getPosition());
                }
            }));
            this._ignoreModelContentChanged = false;
            this._toDispose.add(this._editor.onDidChangeModelContent((e) => {
                if (this._ignoreModelContentChanged) {
                    return;
                }
                if (e.isFlush) {
                    // a model.setValue() was called
                    this._decorations.reset();
                }
                this._decorations.setStartPosition(this._editor.getPosition());
                this._updateDecorationsScheduler.schedule();
            }));
            this._toDispose.add(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this.research(false, this._state.searchScope);
        }
        dispose() {
            this._isDisposed = true;
            lifecycle_1.dispose(this._startSearchingTimer);
            this._toDispose.dispose();
        }
        _onStateChanged(e) {
            if (this._isDisposed) {
                // The find model is disposed during a find state changed event
                return;
            }
            if (!this._editor.hasModel()) {
                // The find model will be disposed momentarily
                return;
            }
            if (e.searchString || e.isReplaceRevealed || e.isRegex || e.wholeWord || e.matchCase || e.searchScope) {
                let model = this._editor.getModel();
                if (model.isTooLargeForSyncing()) {
                    this._startSearchingTimer.cancel();
                    this._startSearchingTimer.setIfNotSet(() => {
                        if (e.searchScope) {
                            this.research(e.moveCursor, this._state.searchScope);
                        }
                        else {
                            this.research(e.moveCursor);
                        }
                    }, RESEARCH_DELAY);
                }
                else {
                    if (e.searchScope) {
                        this.research(e.moveCursor, this._state.searchScope);
                    }
                    else {
                        this.research(e.moveCursor);
                    }
                }
            }
        }
        static _getSearchRange(model, findScope) {
            // If we have set now or before a find scope, use it for computing the search range
            if (findScope) {
                return findScope;
            }
            return model.getFullModelRange();
        }
        research(moveCursor, newFindScope) {
            let findScope = null;
            if (typeof newFindScope !== 'undefined') {
                findScope = newFindScope;
            }
            else {
                findScope = this._decorations.getFindScope();
            }
            if (findScope !== null) {
                if (findScope.startLineNumber !== findScope.endLineNumber) {
                    if (findScope.endColumn === 1) {
                        findScope = new range_1.Range(findScope.startLineNumber, 1, findScope.endLineNumber - 1, this._editor.getModel().getLineMaxColumn(findScope.endLineNumber - 1));
                    }
                    else {
                        // multiline find scope => expand to line starts / ends
                        findScope = new range_1.Range(findScope.startLineNumber, 1, findScope.endLineNumber, this._editor.getModel().getLineMaxColumn(findScope.endLineNumber));
                    }
                }
            }
            let findMatches = this._findMatches(findScope, false, exports.MATCHES_LIMIT);
            this._decorations.set(findMatches, findScope);
            const editorSelection = this._editor.getSelection();
            let currentMatchesPosition = this._decorations.getCurrentMatchesPosition(editorSelection);
            if (currentMatchesPosition === 0 && findMatches.length > 0) {
                // current selection is not on top of a match
                // try to find its nearest result from the top of the document
                const matchAfterSelection = arrays_1.findFirstInSorted(findMatches.map(match => match.range), range => range_1.Range.compareRangesUsingStarts(range, editorSelection) >= 0);
                currentMatchesPosition = matchAfterSelection > 0 ? matchAfterSelection - 1 + 1 /** match position is one based */ : currentMatchesPosition;
            }
            this._state.changeMatchInfo(currentMatchesPosition, this._decorations.getCount(), undefined);
            if (moveCursor) {
                this._moveToNextMatch(this._decorations.getStartPosition());
            }
        }
        _hasMatches() {
            return (this._state.matchesCount > 0);
        }
        _cannotFind() {
            if (!this._hasMatches()) {
                let findScope = this._decorations.getFindScope();
                if (findScope) {
                    // Reveal the selection so user is reminded that 'selection find' is on.
                    this._editor.revealRangeInCenterIfOutsideViewport(findScope, 0 /* Smooth */);
                }
                return true;
            }
            return false;
        }
        _setCurrentFindMatch(match) {
            let matchesPosition = this._decorations.setCurrentFindMatch(match);
            this._state.changeMatchInfo(matchesPosition, this._decorations.getCount(), match);
            this._editor.setSelection(match);
            this._editor.revealRangeInCenterIfOutsideViewport(match, 0 /* Smooth */);
        }
        _prevSearchPosition(before) {
            let isUsingLineStops = this._state.isRegex && (this._state.searchString.indexOf('^') >= 0
                || this._state.searchString.indexOf('$') >= 0);
            let { lineNumber, column } = before;
            let model = this._editor.getModel();
            if (isUsingLineStops || column === 1) {
                if (lineNumber === 1) {
                    lineNumber = model.getLineCount();
                }
                else {
                    lineNumber--;
                }
                column = model.getLineMaxColumn(lineNumber);
            }
            else {
                column--;
            }
            return new position_1.Position(lineNumber, column);
        }
        _moveToPrevMatch(before, isRecursed = false) {
            if (!this._state.canNavigateBack()) {
                return;
            }
            if (this._decorations.getCount() < exports.MATCHES_LIMIT) {
                let prevMatchRange = this._decorations.matchBeforePosition(before);
                if (prevMatchRange && prevMatchRange.isEmpty() && prevMatchRange.getStartPosition().equals(before)) {
                    before = this._prevSearchPosition(before);
                    prevMatchRange = this._decorations.matchBeforePosition(before);
                }
                if (prevMatchRange) {
                    this._setCurrentFindMatch(prevMatchRange);
                }
                return;
            }
            if (this._cannotFind()) {
                return;
            }
            let findScope = this._decorations.getFindScope();
            let searchRange = FindModelBoundToEditorModel._getSearchRange(this._editor.getModel(), findScope);
            // ...(----)...|...
            if (searchRange.getEndPosition().isBefore(before)) {
                before = searchRange.getEndPosition();
            }
            // ...|...(----)...
            if (before.isBefore(searchRange.getStartPosition())) {
                before = searchRange.getEndPosition();
            }
            let { lineNumber, column } = before;
            let model = this._editor.getModel();
            let position = new position_1.Position(lineNumber, column);
            let prevMatch = model.findPreviousMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(104 /* wordSeparators */) : null, false);
            if (prevMatch && prevMatch.range.isEmpty() && prevMatch.range.getStartPosition().equals(position)) {
                // Looks like we're stuck at this position, unacceptable!
                position = this._prevSearchPosition(position);
                prevMatch = model.findPreviousMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(104 /* wordSeparators */) : null, false);
            }
            if (!prevMatch) {
                // there is precisely one match and selection is on top of it
                return;
            }
            if (!isRecursed && !searchRange.containsRange(prevMatch.range)) {
                return this._moveToPrevMatch(prevMatch.range.getStartPosition(), true);
            }
            this._setCurrentFindMatch(prevMatch.range);
        }
        moveToPrevMatch() {
            this._moveToPrevMatch(this._editor.getSelection().getStartPosition());
        }
        _nextSearchPosition(after) {
            let isUsingLineStops = this._state.isRegex && (this._state.searchString.indexOf('^') >= 0
                || this._state.searchString.indexOf('$') >= 0);
            let { lineNumber, column } = after;
            let model = this._editor.getModel();
            if (isUsingLineStops || column === model.getLineMaxColumn(lineNumber)) {
                if (lineNumber === model.getLineCount()) {
                    lineNumber = 1;
                }
                else {
                    lineNumber++;
                }
                column = 1;
            }
            else {
                column++;
            }
            return new position_1.Position(lineNumber, column);
        }
        _moveToNextMatch(after) {
            if (!this._state.canNavigateForward()) {
                return;
            }
            if (this._decorations.getCount() < exports.MATCHES_LIMIT) {
                let nextMatchRange = this._decorations.matchAfterPosition(after);
                if (nextMatchRange && nextMatchRange.isEmpty() && nextMatchRange.getStartPosition().equals(after)) {
                    // Looks like we're stuck at this position, unacceptable!
                    after = this._nextSearchPosition(after);
                    nextMatchRange = this._decorations.matchAfterPosition(after);
                }
                if (nextMatchRange) {
                    this._setCurrentFindMatch(nextMatchRange);
                }
                return;
            }
            let nextMatch = this._getNextMatch(after, false, true);
            if (nextMatch) {
                this._setCurrentFindMatch(nextMatch.range);
            }
        }
        _getNextMatch(after, captureMatches, forceMove, isRecursed = false) {
            if (this._cannotFind()) {
                return null;
            }
            let findScope = this._decorations.getFindScope();
            let searchRange = FindModelBoundToEditorModel._getSearchRange(this._editor.getModel(), findScope);
            // ...(----)...|...
            if (searchRange.getEndPosition().isBefore(after)) {
                after = searchRange.getStartPosition();
            }
            // ...|...(----)...
            if (after.isBefore(searchRange.getStartPosition())) {
                after = searchRange.getStartPosition();
            }
            let { lineNumber, column } = after;
            let model = this._editor.getModel();
            let position = new position_1.Position(lineNumber, column);
            let nextMatch = model.findNextMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(104 /* wordSeparators */) : null, captureMatches);
            if (forceMove && nextMatch && nextMatch.range.isEmpty() && nextMatch.range.getStartPosition().equals(position)) {
                // Looks like we're stuck at this position, unacceptable!
                position = this._nextSearchPosition(position);
                nextMatch = model.findNextMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(104 /* wordSeparators */) : null, captureMatches);
            }
            if (!nextMatch) {
                // there is precisely one match and selection is on top of it
                return null;
            }
            if (!isRecursed && !searchRange.containsRange(nextMatch.range)) {
                return this._getNextMatch(nextMatch.range.getEndPosition(), captureMatches, forceMove, true);
            }
            return nextMatch;
        }
        moveToNextMatch() {
            this._moveToNextMatch(this._editor.getSelection().getEndPosition());
        }
        _getReplacePattern() {
            if (this._state.isRegex) {
                return replacePattern_1.parseReplaceString(this._state.replaceString);
            }
            return replacePattern_1.ReplacePattern.fromStaticValue(this._state.replaceString);
        }
        replace() {
            if (!this._hasMatches()) {
                return;
            }
            let replacePattern = this._getReplacePattern();
            let selection = this._editor.getSelection();
            let nextMatch = this._getNextMatch(selection.getStartPosition(), true, false);
            if (nextMatch) {
                if (selection.equalsRange(nextMatch.range)) {
                    // selection sits on a find match => replace it!
                    let replaceString = replacePattern.buildReplaceString(nextMatch.matches, this._state.preserveCase);
                    let command = new replaceCommand_1.ReplaceCommand(selection, replaceString);
                    this._executeEditorCommand('replace', command);
                    this._decorations.setStartPosition(new position_1.Position(selection.startLineNumber, selection.startColumn + replaceString.length));
                    this.research(true);
                }
                else {
                    this._decorations.setStartPosition(this._editor.getPosition());
                    this._setCurrentFindMatch(nextMatch.range);
                }
            }
        }
        _findMatches(findScope, captureMatches, limitResultCount) {
            let searchRange = FindModelBoundToEditorModel._getSearchRange(this._editor.getModel(), findScope);
            return this._editor.getModel().findMatches(this._state.searchString, searchRange, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(104 /* wordSeparators */) : null, captureMatches, limitResultCount);
        }
        replaceAll() {
            if (!this._hasMatches()) {
                return;
            }
            const findScope = this._decorations.getFindScope();
            if (findScope === null && this._state.matchesCount >= exports.MATCHES_LIMIT) {
                // Doing a replace on the entire file that is over ${MATCHES_LIMIT} matches
                this._largeReplaceAll();
            }
            else {
                this._regularReplaceAll(findScope);
            }
            this.research(false);
        }
        _largeReplaceAll() {
            const searchParams = new textModelSearch_1.SearchParams(this._state.searchString, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(104 /* wordSeparators */) : null);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return;
            }
            let searchRegex = searchData.regex;
            if (!searchRegex.multiline) {
                let mod = 'mu';
                if (searchRegex.ignoreCase) {
                    mod += 'i';
                }
                if (searchRegex.global) {
                    mod += 'g';
                }
                searchRegex = new RegExp(searchRegex.source, mod);
            }
            const model = this._editor.getModel();
            const modelText = model.getValue(1 /* LF */);
            const fullModelRange = model.getFullModelRange();
            const replacePattern = this._getReplacePattern();
            let resultText;
            const preserveCase = this._state.preserveCase;
            if (replacePattern.hasReplacementPatterns || preserveCase) {
                resultText = modelText.replace(searchRegex, function () {
                    return replacePattern.buildReplaceString(arguments, preserveCase);
                });
            }
            else {
                resultText = modelText.replace(searchRegex, replacePattern.buildReplaceString(null, preserveCase));
            }
            let command = new replaceCommand_1.ReplaceCommandThatPreservesSelection(fullModelRange, resultText, this._editor.getSelection());
            this._executeEditorCommand('replaceAll', command);
        }
        _regularReplaceAll(findScope) {
            const replacePattern = this._getReplacePattern();
            // Get all the ranges (even more than the highlighted ones)
            let matches = this._findMatches(findScope, replacePattern.hasReplacementPatterns || this._state.preserveCase, 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
            let replaceStrings = [];
            for (let i = 0, len = matches.length; i < len; i++) {
                replaceStrings[i] = replacePattern.buildReplaceString(matches[i].matches, this._state.preserveCase);
            }
            let command = new replaceAllCommand_1.ReplaceAllCommand(this._editor.getSelection(), matches.map(m => m.range), replaceStrings);
            this._executeEditorCommand('replaceAll', command);
        }
        selectAllMatches() {
            if (!this._hasMatches()) {
                return;
            }
            let findScope = this._decorations.getFindScope();
            // Get all the ranges (even more than the highlighted ones)
            let matches = this._findMatches(findScope, false, 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
            let selections = matches.map(m => new selection_1.Selection(m.range.startLineNumber, m.range.startColumn, m.range.endLineNumber, m.range.endColumn));
            // If one of the ranges is the editor selection, then maintain it as primary
            let editorSelection = this._editor.getSelection();
            for (let i = 0, len = selections.length; i < len; i++) {
                let sel = selections[i];
                if (sel.equalsRange(editorSelection)) {
                    selections = [editorSelection].concat(selections.slice(0, i)).concat(selections.slice(i + 1));
                    break;
                }
            }
            this._editor.setSelections(selections);
        }
        _executeEditorCommand(source, command) {
            try {
                this._ignoreModelContentChanged = true;
                this._editor.pushUndoStop();
                this._editor.executeCommand(source, command);
                this._editor.pushUndoStop();
            }
            finally {
                this._ignoreModelContentChanged = false;
            }
        }
    }
    exports.FindModelBoundToEditorModel = FindModelBoundToEditorModel;
});
//# __sourceMappingURL=findModel.js.map