/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/editor/browser/config/configuration", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/config/editorOptions", "vs/editor/common/core/lineTokens", "vs/editor/common/core/position", "vs/editor/common/view/editorColorRegistry", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel/viewModel", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/codicons", "vs/css!./media/diffReview"], function (require, exports, nls, dom, fastDomNode_1, actionbar_1, scrollableElement_1, actions_1, lifecycle_1, configuration_1, editorExtensions_1, codeEditorService_1, editorOptions_1, lineTokens_1, position_1, editorColorRegistry_1, viewLineRenderer_1, viewModel_1, contextkey_1, colorRegistry_1, themeService_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffReview = void 0;
    const DIFF_LINES_PADDING = 3;
    var DiffEntryType;
    (function (DiffEntryType) {
        DiffEntryType[DiffEntryType["Equal"] = 0] = "Equal";
        DiffEntryType[DiffEntryType["Insert"] = 1] = "Insert";
        DiffEntryType[DiffEntryType["Delete"] = 2] = "Delete";
    })(DiffEntryType || (DiffEntryType = {}));
    class DiffEntry {
        constructor(originalLineStart, originalLineEnd, modifiedLineStart, modifiedLineEnd) {
            this.originalLineStart = originalLineStart;
            this.originalLineEnd = originalLineEnd;
            this.modifiedLineStart = modifiedLineStart;
            this.modifiedLineEnd = modifiedLineEnd;
        }
        getType() {
            if (this.originalLineStart === 0) {
                return 1 /* Insert */;
            }
            if (this.modifiedLineStart === 0) {
                return 2 /* Delete */;
            }
            return 0 /* Equal */;
        }
    }
    class Diff {
        constructor(entries) {
            this.entries = entries;
        }
    }
    const diffReviewInsertIcon = codicons_1.registerIcon('diff-review-insert', codicons_1.Codicon.add);
    const diffReviewRemoveIcon = codicons_1.registerIcon('diff-review-remove', codicons_1.Codicon.remove);
    const diffReviewCloseIcon = codicons_1.registerIcon('diff-review-close', codicons_1.Codicon.close);
    class DiffReview extends lifecycle_1.Disposable {
        constructor(diffEditor) {
            super();
            this._width = 0;
            this._diffEditor = diffEditor;
            this._isVisible = false;
            this.shadow = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.shadow.setClassName('diff-review-shadow');
            this.actionBarContainer = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.actionBarContainer.setClassName('diff-review-actions');
            this._actionBar = this._register(new actionbar_1.ActionBar(this.actionBarContainer.domNode));
            this._actionBar.push(new actions_1.Action('diffreview.close', nls.localize('label.close', "Close"), 'close-diff-review ' + diffReviewCloseIcon.classNames, true, () => {
                this.hide();
                return Promise.resolve(null);
            }), { label: false, icon: true });
            this.domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.domNode.setClassName('diff-review monaco-editor-background');
            this._content = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._content.setClassName('diff-review-content');
            this._content.setAttribute('role', 'code');
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this._content.domNode, {}));
            this.domNode.domNode.appendChild(this.scrollbar.getDomNode());
            this._register(diffEditor.onDidUpdateDiff(() => {
                if (!this._isVisible) {
                    return;
                }
                this._diffs = this._compute();
                this._render();
            }));
            this._register(diffEditor.getModifiedEditor().onDidChangeCursorPosition(() => {
                if (!this._isVisible) {
                    return;
                }
                this._render();
            }));
            this._register(dom.addStandardDisposableListener(this.domNode.domNode, 'click', (e) => {
                e.preventDefault();
                let row = dom.findParentWithClass(e.target, 'diff-review-row');
                if (row) {
                    this._goToRow(row);
                }
            }));
            this._register(dom.addStandardDisposableListener(this.domNode.domNode, 'keydown', (e) => {
                if (e.equals(18 /* DownArrow */)
                    || e.equals(2048 /* CtrlCmd */ | 18 /* DownArrow */)
                    || e.equals(512 /* Alt */ | 18 /* DownArrow */)) {
                    e.preventDefault();
                    this._goToRow(this._getNextRow());
                }
                if (e.equals(16 /* UpArrow */)
                    || e.equals(2048 /* CtrlCmd */ | 16 /* UpArrow */)
                    || e.equals(512 /* Alt */ | 16 /* UpArrow */)) {
                    e.preventDefault();
                    this._goToRow(this._getPrevRow());
                }
                if (e.equals(9 /* Escape */)
                    || e.equals(2048 /* CtrlCmd */ | 9 /* Escape */)
                    || e.equals(512 /* Alt */ | 9 /* Escape */)
                    || e.equals(1024 /* Shift */ | 9 /* Escape */)) {
                    e.preventDefault();
                    this.hide();
                }
                if (e.equals(10 /* Space */)
                    || e.equals(3 /* Enter */)) {
                    e.preventDefault();
                    this.accept();
                }
            }));
            this._diffs = [];
            this._currentDiff = null;
        }
        prev() {
            let index = 0;
            if (!this._isVisible) {
                this._diffs = this._compute();
            }
            if (this._isVisible) {
                let currentIndex = -1;
                for (let i = 0, len = this._diffs.length; i < len; i++) {
                    if (this._diffs[i] === this._currentDiff) {
                        currentIndex = i;
                        break;
                    }
                }
                index = (this._diffs.length + currentIndex - 1);
            }
            else {
                index = this._findDiffIndex(this._diffEditor.getPosition());
            }
            if (this._diffs.length === 0) {
                // Nothing to do
                return;
            }
            index = index % this._diffs.length;
            const entries = this._diffs[index].entries;
            this._diffEditor.setPosition(new position_1.Position(entries[0].modifiedLineStart, 1));
            this._diffEditor.setSelection({ startColumn: 1, startLineNumber: entries[0].modifiedLineStart, endColumn: 1073741824 /* MAX_SAFE_SMALL_INTEGER */, endLineNumber: entries[entries.length - 1].modifiedLineEnd });
            this._isVisible = true;
            this._diffEditor.doLayout();
            this._render();
            this._goToRow(this._getNextRow());
        }
        next() {
            let index = 0;
            if (!this._isVisible) {
                this._diffs = this._compute();
            }
            if (this._isVisible) {
                let currentIndex = -1;
                for (let i = 0, len = this._diffs.length; i < len; i++) {
                    if (this._diffs[i] === this._currentDiff) {
                        currentIndex = i;
                        break;
                    }
                }
                index = (currentIndex + 1);
            }
            else {
                index = this._findDiffIndex(this._diffEditor.getPosition());
            }
            if (this._diffs.length === 0) {
                // Nothing to do
                return;
            }
            index = index % this._diffs.length;
            const entries = this._diffs[index].entries;
            this._diffEditor.setPosition(new position_1.Position(entries[0].modifiedLineStart, 1));
            this._diffEditor.setSelection({ startColumn: 1, startLineNumber: entries[0].modifiedLineStart, endColumn: 1073741824 /* MAX_SAFE_SMALL_INTEGER */, endLineNumber: entries[entries.length - 1].modifiedLineEnd });
            this._isVisible = true;
            this._diffEditor.doLayout();
            this._render();
            this._goToRow(this._getNextRow());
        }
        accept() {
            let jumpToLineNumber = -1;
            let current = this._getCurrentFocusedRow();
            if (current) {
                let lineNumber = parseInt(current.getAttribute('data-line'), 10);
                if (!isNaN(lineNumber)) {
                    jumpToLineNumber = lineNumber;
                }
            }
            this.hide();
            if (jumpToLineNumber !== -1) {
                this._diffEditor.setPosition(new position_1.Position(jumpToLineNumber, 1));
                this._diffEditor.revealPosition(new position_1.Position(jumpToLineNumber, 1), 1 /* Immediate */);
            }
        }
        hide() {
            this._isVisible = false;
            this._diffEditor.updateOptions({ readOnly: false });
            this._diffEditor.focus();
            this._diffEditor.doLayout();
            this._render();
        }
        _getPrevRow() {
            let current = this._getCurrentFocusedRow();
            if (!current) {
                return this._getFirstRow();
            }
            if (current.previousElementSibling) {
                return current.previousElementSibling;
            }
            return current;
        }
        _getNextRow() {
            let current = this._getCurrentFocusedRow();
            if (!current) {
                return this._getFirstRow();
            }
            if (current.nextElementSibling) {
                return current.nextElementSibling;
            }
            return current;
        }
        _getFirstRow() {
            return this.domNode.domNode.querySelector('.diff-review-row');
        }
        _getCurrentFocusedRow() {
            let result = document.activeElement;
            if (result && /diff-review-row/.test(result.className)) {
                return result;
            }
            return null;
        }
        _goToRow(row) {
            let prev = this._getCurrentFocusedRow();
            row.tabIndex = 0;
            row.focus();
            if (prev && prev !== row) {
                prev.tabIndex = -1;
            }
            this.scrollbar.scanDomNode();
        }
        isVisible() {
            return this._isVisible;
        }
        layout(top, width, height) {
            this._width = width;
            this.shadow.setTop(top - 6);
            this.shadow.setWidth(width);
            this.shadow.setHeight(this._isVisible ? 6 : 0);
            this.domNode.setTop(top);
            this.domNode.setWidth(width);
            this.domNode.setHeight(height);
            this._content.setHeight(height);
            this._content.setWidth(width);
            if (this._isVisible) {
                this.actionBarContainer.setAttribute('aria-hidden', 'false');
                this.actionBarContainer.setDisplay('block');
            }
            else {
                this.actionBarContainer.setAttribute('aria-hidden', 'true');
                this.actionBarContainer.setDisplay('none');
            }
        }
        _compute() {
            const lineChanges = this._diffEditor.getLineChanges();
            if (!lineChanges || lineChanges.length === 0) {
                return [];
            }
            const originalModel = this._diffEditor.getOriginalEditor().getModel();
            const modifiedModel = this._diffEditor.getModifiedEditor().getModel();
            if (!originalModel || !modifiedModel) {
                return [];
            }
            return DiffReview._mergeAdjacent(lineChanges, originalModel.getLineCount(), modifiedModel.getLineCount());
        }
        static _mergeAdjacent(lineChanges, originalLineCount, modifiedLineCount) {
            if (!lineChanges || lineChanges.length === 0) {
                return [];
            }
            let diffs = [], diffsLength = 0;
            for (let i = 0, len = lineChanges.length; i < len; i++) {
                const lineChange = lineChanges[i];
                const originalStart = lineChange.originalStartLineNumber;
                const originalEnd = lineChange.originalEndLineNumber;
                const modifiedStart = lineChange.modifiedStartLineNumber;
                const modifiedEnd = lineChange.modifiedEndLineNumber;
                let r = [], rLength = 0;
                // Emit before anchors
                {
                    const originalEqualAbove = (originalEnd === 0 ? originalStart : originalStart - 1);
                    const modifiedEqualAbove = (modifiedEnd === 0 ? modifiedStart : modifiedStart - 1);
                    // Make sure we don't step into the previous diff
                    let minOriginal = 1;
                    let minModified = 1;
                    if (i > 0) {
                        const prevLineChange = lineChanges[i - 1];
                        if (prevLineChange.originalEndLineNumber === 0) {
                            minOriginal = prevLineChange.originalStartLineNumber + 1;
                        }
                        else {
                            minOriginal = prevLineChange.originalEndLineNumber + 1;
                        }
                        if (prevLineChange.modifiedEndLineNumber === 0) {
                            minModified = prevLineChange.modifiedStartLineNumber + 1;
                        }
                        else {
                            minModified = prevLineChange.modifiedEndLineNumber + 1;
                        }
                    }
                    let fromOriginal = originalEqualAbove - DIFF_LINES_PADDING + 1;
                    let fromModified = modifiedEqualAbove - DIFF_LINES_PADDING + 1;
                    if (fromOriginal < minOriginal) {
                        const delta = minOriginal - fromOriginal;
                        fromOriginal = fromOriginal + delta;
                        fromModified = fromModified + delta;
                    }
                    if (fromModified < minModified) {
                        const delta = minModified - fromModified;
                        fromOriginal = fromOriginal + delta;
                        fromModified = fromModified + delta;
                    }
                    r[rLength++] = new DiffEntry(fromOriginal, originalEqualAbove, fromModified, modifiedEqualAbove);
                }
                // Emit deleted lines
                {
                    if (originalEnd !== 0) {
                        r[rLength++] = new DiffEntry(originalStart, originalEnd, 0, 0);
                    }
                }
                // Emit inserted lines
                {
                    if (modifiedEnd !== 0) {
                        r[rLength++] = new DiffEntry(0, 0, modifiedStart, modifiedEnd);
                    }
                }
                // Emit after anchors
                {
                    const originalEqualBelow = (originalEnd === 0 ? originalStart + 1 : originalEnd + 1);
                    const modifiedEqualBelow = (modifiedEnd === 0 ? modifiedStart + 1 : modifiedEnd + 1);
                    // Make sure we don't step into the next diff
                    let maxOriginal = originalLineCount;
                    let maxModified = modifiedLineCount;
                    if (i + 1 < len) {
                        const nextLineChange = lineChanges[i + 1];
                        if (nextLineChange.originalEndLineNumber === 0) {
                            maxOriginal = nextLineChange.originalStartLineNumber;
                        }
                        else {
                            maxOriginal = nextLineChange.originalStartLineNumber - 1;
                        }
                        if (nextLineChange.modifiedEndLineNumber === 0) {
                            maxModified = nextLineChange.modifiedStartLineNumber;
                        }
                        else {
                            maxModified = nextLineChange.modifiedStartLineNumber - 1;
                        }
                    }
                    let toOriginal = originalEqualBelow + DIFF_LINES_PADDING - 1;
                    let toModified = modifiedEqualBelow + DIFF_LINES_PADDING - 1;
                    if (toOriginal > maxOriginal) {
                        const delta = maxOriginal - toOriginal;
                        toOriginal = toOriginal + delta;
                        toModified = toModified + delta;
                    }
                    if (toModified > maxModified) {
                        const delta = maxModified - toModified;
                        toOriginal = toOriginal + delta;
                        toModified = toModified + delta;
                    }
                    r[rLength++] = new DiffEntry(originalEqualBelow, toOriginal, modifiedEqualBelow, toModified);
                }
                diffs[diffsLength++] = new Diff(r);
            }
            // Merge adjacent diffs
            let curr = diffs[0].entries;
            let r = [], rLength = 0;
            for (let i = 1, len = diffs.length; i < len; i++) {
                const thisDiff = diffs[i].entries;
                const currLast = curr[curr.length - 1];
                const thisFirst = thisDiff[0];
                if (currLast.getType() === 0 /* Equal */
                    && thisFirst.getType() === 0 /* Equal */
                    && thisFirst.originalLineStart <= currLast.originalLineEnd) {
                    // We are dealing with equal lines that overlap
                    curr[curr.length - 1] = new DiffEntry(currLast.originalLineStart, thisFirst.originalLineEnd, currLast.modifiedLineStart, thisFirst.modifiedLineEnd);
                    curr = curr.concat(thisDiff.slice(1));
                    continue;
                }
                r[rLength++] = new Diff(curr);
                curr = thisDiff;
            }
            r[rLength++] = new Diff(curr);
            return r;
        }
        _findDiffIndex(pos) {
            const lineNumber = pos.lineNumber;
            for (let i = 0, len = this._diffs.length; i < len; i++) {
                const diff = this._diffs[i].entries;
                const lastModifiedLine = diff[diff.length - 1].modifiedLineEnd;
                if (lineNumber <= lastModifiedLine) {
                    return i;
                }
            }
            return 0;
        }
        _render() {
            const originalOptions = this._diffEditor.getOriginalEditor().getOptions();
            const modifiedOptions = this._diffEditor.getModifiedEditor().getOptions();
            const originalModel = this._diffEditor.getOriginalEditor().getModel();
            const modifiedModel = this._diffEditor.getModifiedEditor().getModel();
            const originalModelOpts = originalModel.getOptions();
            const modifiedModelOpts = modifiedModel.getOptions();
            if (!this._isVisible || !originalModel || !modifiedModel) {
                dom.clearNode(this._content.domNode);
                this._currentDiff = null;
                this.scrollbar.scanDomNode();
                return;
            }
            this._diffEditor.updateOptions({ readOnly: true });
            const diffIndex = this._findDiffIndex(this._diffEditor.getPosition());
            if (this._diffs[diffIndex] === this._currentDiff) {
                return;
            }
            this._currentDiff = this._diffs[diffIndex];
            const diffs = this._diffs[diffIndex].entries;
            let container = document.createElement('div');
            container.className = 'diff-review-table';
            container.setAttribute('role', 'list');
            container.setAttribute('aria-label', 'Difference review. Use "Stage | Unstage | Revert Selected Ranges" commands');
            configuration_1.Configuration.applyFontInfoSlow(container, modifiedOptions.get(36 /* fontInfo */));
            let minOriginalLine = 0;
            let maxOriginalLine = 0;
            let minModifiedLine = 0;
            let maxModifiedLine = 0;
            for (let i = 0, len = diffs.length; i < len; i++) {
                const diffEntry = diffs[i];
                const originalLineStart = diffEntry.originalLineStart;
                const originalLineEnd = diffEntry.originalLineEnd;
                const modifiedLineStart = diffEntry.modifiedLineStart;
                const modifiedLineEnd = diffEntry.modifiedLineEnd;
                if (originalLineStart !== 0 && ((minOriginalLine === 0 || originalLineStart < minOriginalLine))) {
                    minOriginalLine = originalLineStart;
                }
                if (originalLineEnd !== 0 && ((maxOriginalLine === 0 || originalLineEnd > maxOriginalLine))) {
                    maxOriginalLine = originalLineEnd;
                }
                if (modifiedLineStart !== 0 && ((minModifiedLine === 0 || modifiedLineStart < minModifiedLine))) {
                    minModifiedLine = modifiedLineStart;
                }
                if (modifiedLineEnd !== 0 && ((maxModifiedLine === 0 || modifiedLineEnd > maxModifiedLine))) {
                    maxModifiedLine = modifiedLineEnd;
                }
            }
            let header = document.createElement('div');
            header.className = 'diff-review-row';
            let cell = document.createElement('div');
            cell.className = 'diff-review-cell diff-review-summary';
            const originalChangedLinesCnt = maxOriginalLine - minOriginalLine + 1;
            const modifiedChangedLinesCnt = maxModifiedLine - minModifiedLine + 1;
            cell.appendChild(document.createTextNode(`${diffIndex + 1}/${this._diffs.length}: @@ -${minOriginalLine},${originalChangedLinesCnt} +${minModifiedLine},${modifiedChangedLinesCnt} @@`));
            header.setAttribute('data-line', String(minModifiedLine));
            const getAriaLines = (lines) => {
                if (lines === 0) {
                    return nls.localize('no_lines_changed', "no lines changed");
                }
                else if (lines === 1) {
                    return nls.localize('one_line_changed', "1 line changed");
                }
                else {
                    return nls.localize('more_lines_changed', "{0} lines changed", lines);
                }
            };
            const originalChangedLinesCntAria = getAriaLines(originalChangedLinesCnt);
            const modifiedChangedLinesCntAria = getAriaLines(modifiedChangedLinesCnt);
            header.setAttribute('aria-label', nls.localize({
                key: 'header',
                comment: [
                    'This is the ARIA label for a git diff header.',
                    'A git diff header looks like this: @@ -154,12 +159,39 @@.',
                    'That encodes that at original line 154 (which is now line 159), 12 lines were removed/changed with 39 lines.',
                    'Variables 0 and 1 refer to the diff index out of total number of diffs.',
                    'Variables 2 and 4 will be numbers (a line number).',
                    'Variables 3 and 5 will be "no lines changed", "1 line changed" or "X lines changed", localized separately.'
                ]
            }, "Difference {0} of {1}: original line {2}, {3}, modified line {4}, {5}", (diffIndex + 1), this._diffs.length, minOriginalLine, originalChangedLinesCntAria, minModifiedLine, modifiedChangedLinesCntAria));
            header.appendChild(cell);
            // @@ -504,7 +517,7 @@
            header.setAttribute('role', 'listitem');
            container.appendChild(header);
            const lineHeight = modifiedOptions.get(51 /* lineHeight */);
            let modLine = minModifiedLine;
            for (let i = 0, len = diffs.length; i < len; i++) {
                const diffEntry = diffs[i];
                DiffReview._renderSection(container, diffEntry, modLine, lineHeight, this._width, originalOptions, originalModel, originalModelOpts, modifiedOptions, modifiedModel, modifiedModelOpts);
                if (diffEntry.modifiedLineStart !== 0) {
                    modLine = diffEntry.modifiedLineEnd;
                }
            }
            dom.clearNode(this._content.domNode);
            this._content.domNode.appendChild(container);
            this.scrollbar.scanDomNode();
        }
        static _renderSection(dest, diffEntry, modLine, lineHeight, width, originalOptions, originalModel, originalModelOpts, modifiedOptions, modifiedModel, modifiedModelOpts) {
            const type = diffEntry.getType();
            let rowClassName = 'diff-review-row';
            let lineNumbersExtraClassName = '';
            const spacerClassName = 'diff-review-spacer';
            let spacerIcon = null;
            switch (type) {
                case 1 /* Insert */:
                    rowClassName = 'diff-review-row line-insert';
                    lineNumbersExtraClassName = ' char-insert';
                    spacerIcon = diffReviewInsertIcon;
                    break;
                case 2 /* Delete */:
                    rowClassName = 'diff-review-row line-delete';
                    lineNumbersExtraClassName = ' char-delete';
                    spacerIcon = diffReviewRemoveIcon;
                    break;
            }
            const originalLineStart = diffEntry.originalLineStart;
            const originalLineEnd = diffEntry.originalLineEnd;
            const modifiedLineStart = diffEntry.modifiedLineStart;
            const modifiedLineEnd = diffEntry.modifiedLineEnd;
            const cnt = Math.max(modifiedLineEnd - modifiedLineStart, originalLineEnd - originalLineStart);
            const originalLayoutInfo = originalOptions.get(115 /* layoutInfo */);
            const originalLineNumbersWidth = originalLayoutInfo.glyphMarginWidth + originalLayoutInfo.lineNumbersWidth;
            const modifiedLayoutInfo = modifiedOptions.get(115 /* layoutInfo */);
            const modifiedLineNumbersWidth = 10 + modifiedLayoutInfo.glyphMarginWidth + modifiedLayoutInfo.lineNumbersWidth;
            for (let i = 0; i <= cnt; i++) {
                const originalLine = (originalLineStart === 0 ? 0 : originalLineStart + i);
                const modifiedLine = (modifiedLineStart === 0 ? 0 : modifiedLineStart + i);
                const row = document.createElement('div');
                row.style.minWidth = width + 'px';
                row.className = rowClassName;
                row.setAttribute('role', 'listitem');
                if (modifiedLine !== 0) {
                    modLine = modifiedLine;
                }
                row.setAttribute('data-line', String(modLine));
                let cell = document.createElement('div');
                cell.className = 'diff-review-cell';
                cell.style.height = `${lineHeight}px`;
                row.appendChild(cell);
                const originalLineNumber = document.createElement('span');
                originalLineNumber.style.width = (originalLineNumbersWidth + 'px');
                originalLineNumber.style.minWidth = (originalLineNumbersWidth + 'px');
                originalLineNumber.className = 'diff-review-line-number' + lineNumbersExtraClassName;
                if (originalLine !== 0) {
                    originalLineNumber.appendChild(document.createTextNode(String(originalLine)));
                }
                else {
                    originalLineNumber.innerHTML = '&#160;';
                }
                cell.appendChild(originalLineNumber);
                const modifiedLineNumber = document.createElement('span');
                modifiedLineNumber.style.width = (modifiedLineNumbersWidth + 'px');
                modifiedLineNumber.style.minWidth = (modifiedLineNumbersWidth + 'px');
                modifiedLineNumber.style.paddingRight = '10px';
                modifiedLineNumber.className = 'diff-review-line-number' + lineNumbersExtraClassName;
                if (modifiedLine !== 0) {
                    modifiedLineNumber.appendChild(document.createTextNode(String(modifiedLine)));
                }
                else {
                    modifiedLineNumber.innerHTML = '&#160;';
                }
                cell.appendChild(modifiedLineNumber);
                const spacer = document.createElement('span');
                spacer.className = spacerClassName;
                if (spacerIcon) {
                    const spacerCodicon = document.createElement('span');
                    spacerCodicon.className = spacerIcon.classNames;
                    spacerCodicon.innerHTML = '&#160;&#160;';
                    spacer.appendChild(spacerCodicon);
                }
                else {
                    spacer.innerHTML = '&#160;&#160;';
                }
                cell.appendChild(spacer);
                let lineContent;
                if (modifiedLine !== 0) {
                    cell.insertAdjacentHTML('beforeend', this._renderLine(modifiedModel, modifiedOptions, modifiedModelOpts.tabSize, modifiedLine));
                    lineContent = modifiedModel.getLineContent(modifiedLine);
                }
                else {
                    cell.insertAdjacentHTML('beforeend', this._renderLine(originalModel, originalOptions, originalModelOpts.tabSize, originalLine));
                    lineContent = originalModel.getLineContent(originalLine);
                }
                if (lineContent.length === 0) {
                    lineContent = nls.localize('blankLine', "blank");
                }
                let ariaLabel = '';
                switch (type) {
                    case 0 /* Equal */:
                        if (originalLine === modifiedLine) {
                            ariaLabel = nls.localize({ key: 'unchangedLine', comment: ['The placholders are contents of the line and should not be translated.'] }, "{0} unchanged line {1}", lineContent, originalLine);
                        }
                        else {
                            ariaLabel = nls.localize('equalLine', "{0} original line {1} modified line {2}", lineContent, originalLine, modifiedLine);
                        }
                        break;
                    case 1 /* Insert */:
                        ariaLabel = nls.localize('insertLine', "+ {0} modified line {1}", lineContent, modifiedLine);
                        break;
                    case 2 /* Delete */:
                        ariaLabel = nls.localize('deleteLine', "- {0} original line {1}", lineContent, originalLine);
                        break;
                }
                row.setAttribute('aria-label', ariaLabel);
                dest.appendChild(row);
            }
        }
        static _renderLine(model, options, tabSize, lineNumber) {
            const lineContent = model.getLineContent(lineNumber);
            const fontInfo = options.get(36 /* fontInfo */);
            const defaultMetadata = ((0 /* None */ << 11 /* FONT_STYLE_OFFSET */)
                | (1 /* DefaultForeground */ << 14 /* FOREGROUND_OFFSET */)
                | (2 /* DefaultBackground */ << 23 /* BACKGROUND_OFFSET */)) >>> 0;
            const tokens = new Uint32Array(2);
            tokens[0] = lineContent.length;
            tokens[1] = defaultMetadata;
            const lineTokens = new lineTokens_1.LineTokens(tokens, lineContent);
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(lineContent, model.mightContainNonBasicASCII());
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, model.mightContainRTL());
            const r = viewLineRenderer_1.renderViewLine2(new viewLineRenderer_1.RenderLineInput((fontInfo.isMonospace && !options.get(24 /* disableMonospaceOptimizations */)), fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, [], tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, options.get(95 /* stopRenderingLineAfter */), options.get(80 /* renderWhitespace */), options.get(74 /* renderControlCharacters */), options.get(37 /* fontLigatures */) !== editorOptions_1.EditorFontLigatures.OFF, null));
            return r.html;
        }
    }
    exports.DiffReview = DiffReview;
    // theming
    themeService_1.registerThemingParticipant((theme, collector) => {
        const lineNumbers = theme.getColor(editorColorRegistry_1.editorLineNumbers);
        if (lineNumbers) {
            collector.addRule(`.monaco-diff-editor .diff-review-line-number { color: ${lineNumbers}; }`);
        }
        const shadow = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.monaco-diff-editor .diff-review-shadow { box-shadow: ${shadow} 0 -6px 6px -6px inset; }`);
        }
    });
    class DiffReviewNext extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.diffReview.next',
                label: nls.localize('editor.action.diffReview.next', "Go to Next Difference"),
                alias: 'Go to Next Difference',
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                kbOpts: {
                    kbExpr: null,
                    primary: 65 /* F7 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor) {
                diffEditor.diffReviewNext();
            }
        }
    }
    class DiffReviewPrev extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.diffReview.prev',
                label: nls.localize('editor.action.diffReview.prev', "Go to Previous Difference"),
                alias: 'Go to Previous Difference',
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                kbOpts: {
                    kbExpr: null,
                    primary: 1024 /* Shift */ | 65 /* F7 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor) {
                diffEditor.diffReviewPrev();
            }
        }
    }
    function findFocusedDiffEditor(accessor) {
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const diffEditors = codeEditorService.listDiffEditors();
        const activeCodeEditor = codeEditorService.getActiveCodeEditor();
        if (!activeCodeEditor) {
            return null;
        }
        for (let i = 0, len = diffEditors.length; i < len; i++) {
            const diffEditor = diffEditors[i];
            if (diffEditor.getModifiedEditor().getId() === activeCodeEditor.getId() || diffEditor.getOriginalEditor().getId() === activeCodeEditor.getId()) {
                return diffEditor;
            }
        }
        return null;
    }
    editorExtensions_1.registerEditorAction(DiffReviewNext);
    editorExtensions_1.registerEditorAction(DiffReviewPrev);
});
//# __sourceMappingURL=diffReview.js.map