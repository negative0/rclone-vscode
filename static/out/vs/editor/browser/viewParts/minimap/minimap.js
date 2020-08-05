/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/globalMouseMoveMonitor", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/core/rgba", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/viewModel/viewModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/core/selection", "vs/base/browser/touch", "vs/editor/browser/viewParts/minimap/minimapCharRendererFactory", "vs/editor/common/model", "vs/base/common/functional", "vs/css!./minimap"], function (require, exports, dom, fastDomNode_1, globalMouseMoveMonitor_1, lifecycle_1, platform, strings, viewLayer_1, viewPart_1, editorOptions_1, range_1, rgba_1, minimapTokensColorTracker_1, viewModel_1, colorRegistry_1, themeService_1, selection_1, touch_1, minimapCharRendererFactory_1, model_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Minimap = void 0;
    /**
     * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
     */
    const MOUSE_DRAG_RESET_DISTANCE = 140;
    const GUTTER_DECORATION_WIDTH = 2;
    class MinimapOptions {
        constructor(configuration, theme, tokensColorTracker) {
            const options = configuration.options;
            const pixelRatio = options.get(113 /* pixelRatio */);
            const layoutInfo = options.get(115 /* layoutInfo */);
            const minimapLayout = layoutInfo.minimap;
            const fontInfo = options.get(36 /* fontInfo */);
            const minimapOpts = options.get(56 /* minimap */);
            this.renderMinimap = minimapLayout.renderMinimap;
            this.size = minimapOpts.size;
            this.minimapHeightIsEditorHeight = minimapLayout.minimapHeightIsEditorHeight;
            this.scrollBeyondLastLine = options.get(86 /* scrollBeyondLastLine */);
            this.showSlider = minimapOpts.showSlider;
            this.pixelRatio = pixelRatio;
            this.typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this.lineHeight = options.get(51 /* lineHeight */);
            this.minimapLeft = minimapLayout.minimapLeft;
            this.minimapWidth = minimapLayout.minimapWidth;
            this.minimapHeight = layoutInfo.height;
            this.canvasInnerWidth = minimapLayout.minimapCanvasInnerWidth;
            this.canvasInnerHeight = minimapLayout.minimapCanvasInnerHeight;
            this.canvasOuterWidth = minimapLayout.minimapCanvasOuterWidth;
            this.canvasOuterHeight = minimapLayout.minimapCanvasOuterHeight;
            this.isSampling = minimapLayout.minimapIsSampling;
            this.editorHeight = layoutInfo.height;
            this.fontScale = minimapLayout.minimapScale;
            this.minimapLineHeight = minimapLayout.minimapLineHeight;
            this.minimapCharWidth = 1 /* BASE_CHAR_WIDTH */ * this.fontScale;
            this.charRenderer = functional_1.once(() => minimapCharRendererFactory_1.MinimapCharRendererFactory.create(this.fontScale, fontInfo.fontFamily));
            this.backgroundColor = MinimapOptions._getMinimapBackground(theme, tokensColorTracker);
        }
        static _getMinimapBackground(theme, tokensColorTracker) {
            const themeColor = theme.getColor(colorRegistry_1.minimapBackground);
            if (themeColor) {
                return new rgba_1.RGBA8(themeColor.rgba.r, themeColor.rgba.g, themeColor.rgba.b, themeColor.rgba.a);
            }
            return tokensColorTracker.getColor(2 /* DefaultBackground */);
        }
        equals(other) {
            return (this.renderMinimap === other.renderMinimap
                && this.size === other.size
                && this.minimapHeightIsEditorHeight === other.minimapHeightIsEditorHeight
                && this.scrollBeyondLastLine === other.scrollBeyondLastLine
                && this.showSlider === other.showSlider
                && this.pixelRatio === other.pixelRatio
                && this.typicalHalfwidthCharacterWidth === other.typicalHalfwidthCharacterWidth
                && this.lineHeight === other.lineHeight
                && this.minimapLeft === other.minimapLeft
                && this.minimapWidth === other.minimapWidth
                && this.minimapHeight === other.minimapHeight
                && this.canvasInnerWidth === other.canvasInnerWidth
                && this.canvasInnerHeight === other.canvasInnerHeight
                && this.canvasOuterWidth === other.canvasOuterWidth
                && this.canvasOuterHeight === other.canvasOuterHeight
                && this.isSampling === other.isSampling
                && this.editorHeight === other.editorHeight
                && this.fontScale === other.fontScale
                && this.minimapLineHeight === other.minimapLineHeight
                && this.minimapCharWidth === other.minimapCharWidth
                && this.backgroundColor && this.backgroundColor.equals(other.backgroundColor));
        }
    }
    class MinimapLayout {
        constructor(scrollTop, scrollHeight, sliderNeeded, computedSliderRatio, sliderTop, sliderHeight, startLineNumber, endLineNumber) {
            this.scrollTop = scrollTop;
            this.scrollHeight = scrollHeight;
            this.sliderNeeded = sliderNeeded;
            this._computedSliderRatio = computedSliderRatio;
            this.sliderTop = sliderTop;
            this.sliderHeight = sliderHeight;
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
        }
        /**
         * Compute a desired `scrollPosition` such that the slider moves by `delta`.
         */
        getDesiredScrollTopFromDelta(delta) {
            const desiredSliderPosition = this.sliderTop + delta;
            return Math.round(desiredSliderPosition / this._computedSliderRatio);
        }
        getDesiredScrollTopFromTouchLocation(pageY) {
            return Math.round((pageY - this.sliderHeight / 2) / this._computedSliderRatio);
        }
        static create(options, viewportStartLineNumber, viewportEndLineNumber, viewportHeight, viewportContainsWhitespaceGaps, lineCount, realLineCount, scrollTop, scrollHeight, previousLayout) {
            const pixelRatio = options.pixelRatio;
            const minimapLineHeight = options.minimapLineHeight;
            const minimapLinesFitting = Math.floor(options.canvasInnerHeight / minimapLineHeight);
            const lineHeight = options.lineHeight;
            if (options.minimapHeightIsEditorHeight) {
                const logicalScrollHeight = (realLineCount * options.lineHeight
                    + (options.scrollBeyondLastLine ? viewportHeight - options.lineHeight : 0));
                const sliderHeight = Math.max(1, Math.floor(viewportHeight * viewportHeight / logicalScrollHeight));
                const maxMinimapSliderTop = Math.max(0, options.minimapHeight - sliderHeight);
                // The slider can move from 0 to `maxMinimapSliderTop`
                // in the same way `scrollTop` can move from 0 to `scrollHeight` - `viewportHeight`.
                const computedSliderRatio = (maxMinimapSliderTop) / (scrollHeight - viewportHeight);
                const sliderTop = (scrollTop * computedSliderRatio);
                const sliderNeeded = (maxMinimapSliderTop > 0);
                const maxLinesFitting = Math.floor(options.canvasInnerHeight / options.minimapLineHeight);
                return new MinimapLayout(scrollTop, scrollHeight, sliderNeeded, computedSliderRatio, sliderTop, sliderHeight, 1, Math.min(lineCount, maxLinesFitting));
            }
            // The visible line count in a viewport can change due to a number of reasons:
            //  a) with the same viewport width, different scroll positions can result in partial lines being visible:
            //    e.g. for a line height of 20, and a viewport height of 600
            //          * scrollTop = 0  => visible lines are [1, 30]
            //          * scrollTop = 10 => visible lines are [1, 31] (with lines 1 and 31 partially visible)
            //          * scrollTop = 20 => visible lines are [2, 31]
            //  b) whitespace gaps might make their way in the viewport (which results in a decrease in the visible line count)
            //  c) we could be in the scroll beyond last line case (which also results in a decrease in the visible line count, down to possibly only one line being visible)
            // We must first establish a desirable slider height.
            let sliderHeight;
            if (viewportContainsWhitespaceGaps && viewportEndLineNumber !== lineCount) {
                // case b) from above: there are whitespace gaps in the viewport.
                // In this case, the height of the slider directly reflects the visible line count.
                const viewportLineCount = viewportEndLineNumber - viewportStartLineNumber + 1;
                sliderHeight = Math.floor(viewportLineCount * minimapLineHeight / pixelRatio);
            }
            else {
                // The slider has a stable height
                const expectedViewportLineCount = viewportHeight / lineHeight;
                sliderHeight = Math.floor(expectedViewportLineCount * minimapLineHeight / pixelRatio);
            }
            let maxMinimapSliderTop;
            if (options.scrollBeyondLastLine) {
                // The minimap slider, when dragged all the way down, will contain the last line at its top
                maxMinimapSliderTop = (lineCount - 1) * minimapLineHeight / pixelRatio;
            }
            else {
                // The minimap slider, when dragged all the way down, will contain the last line at its bottom
                maxMinimapSliderTop = Math.max(0, lineCount * minimapLineHeight / pixelRatio - sliderHeight);
            }
            maxMinimapSliderTop = Math.min(options.minimapHeight - sliderHeight, maxMinimapSliderTop);
            // The slider can move from 0 to `maxMinimapSliderTop`
            // in the same way `scrollTop` can move from 0 to `scrollHeight` - `viewportHeight`.
            const computedSliderRatio = (maxMinimapSliderTop) / (scrollHeight - viewportHeight);
            const sliderTop = (scrollTop * computedSliderRatio);
            let extraLinesAtTheBottom = 0;
            if (options.scrollBeyondLastLine) {
                const expectedViewportLineCount = viewportHeight / lineHeight;
                extraLinesAtTheBottom = expectedViewportLineCount - 1;
            }
            if (minimapLinesFitting >= lineCount + extraLinesAtTheBottom) {
                // All lines fit in the minimap
                const startLineNumber = 1;
                const endLineNumber = lineCount;
                const sliderNeeded = (maxMinimapSliderTop > 0);
                return new MinimapLayout(scrollTop, scrollHeight, sliderNeeded, computedSliderRatio, sliderTop, sliderHeight, startLineNumber, endLineNumber);
            }
            else {
                let startLineNumber = Math.max(1, Math.floor(viewportStartLineNumber - sliderTop * pixelRatio / minimapLineHeight));
                // Avoid flickering caused by a partial viewport start line
                // by being consistent w.r.t. the previous layout decision
                if (previousLayout && previousLayout.scrollHeight === scrollHeight) {
                    if (previousLayout.scrollTop > scrollTop) {
                        // Scrolling up => never increase `startLineNumber`
                        startLineNumber = Math.min(startLineNumber, previousLayout.startLineNumber);
                    }
                    if (previousLayout.scrollTop < scrollTop) {
                        // Scrolling down => never decrease `startLineNumber`
                        startLineNumber = Math.max(startLineNumber, previousLayout.startLineNumber);
                    }
                }
                const endLineNumber = Math.min(lineCount, startLineNumber + minimapLinesFitting - 1);
                return new MinimapLayout(scrollTop, scrollHeight, true, computedSliderRatio, sliderTop, sliderHeight, startLineNumber, endLineNumber);
            }
        }
    }
    class MinimapLine {
        constructor(dy) {
            this.dy = dy;
        }
        onContentChanged() {
            this.dy = -1;
        }
        onTokensChanged() {
            this.dy = -1;
        }
    }
    MinimapLine.INVALID = new MinimapLine(-1);
    class RenderData {
        constructor(renderedLayout, imageData, lines) {
            this.renderedLayout = renderedLayout;
            this._imageData = imageData;
            this._renderedLines = new viewLayer_1.RenderedLinesCollection(() => MinimapLine.INVALID);
            this._renderedLines._set(renderedLayout.startLineNumber, lines);
        }
        /**
         * Check if the current RenderData matches accurately the new desired layout and no painting is needed.
         */
        linesEquals(layout) {
            if (!this.scrollEquals(layout)) {
                return false;
            }
            const tmp = this._renderedLines._get();
            const lines = tmp.lines;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].dy === -1) {
                    // This line is invalid
                    return false;
                }
            }
            return true;
        }
        /**
         * Check if the current RenderData matches the new layout's scroll position
         */
        scrollEquals(layout) {
            return this.renderedLayout.startLineNumber === layout.startLineNumber
                && this.renderedLayout.endLineNumber === layout.endLineNumber;
        }
        _get() {
            const tmp = this._renderedLines._get();
            return {
                imageData: this._imageData,
                rendLineNumberStart: tmp.rendLineNumberStart,
                lines: tmp.lines
            };
        }
        onLinesChanged(changeFromLineNumber, changeToLineNumber) {
            return this._renderedLines.onLinesChanged(changeFromLineNumber, changeToLineNumber);
        }
        onLinesDeleted(deleteFromLineNumber, deleteToLineNumber) {
            this._renderedLines.onLinesDeleted(deleteFromLineNumber, deleteToLineNumber);
        }
        onLinesInserted(insertFromLineNumber, insertToLineNumber) {
            this._renderedLines.onLinesInserted(insertFromLineNumber, insertToLineNumber);
        }
        onTokensChanged(ranges) {
            return this._renderedLines.onTokensChanged(ranges);
        }
    }
    /**
     * Some sort of double buffering.
     *
     * Keeps two buffers around that will be rotated for painting.
     * Always gives a buffer that is filled with the background color.
     */
    class MinimapBuffers {
        constructor(ctx, WIDTH, HEIGHT, background) {
            this._backgroundFillData = MinimapBuffers._createBackgroundFillData(WIDTH, HEIGHT, background);
            this._buffers = [
                ctx.createImageData(WIDTH, HEIGHT),
                ctx.createImageData(WIDTH, HEIGHT)
            ];
            this._lastUsedBuffer = 0;
        }
        getBuffer() {
            // rotate buffers
            this._lastUsedBuffer = 1 - this._lastUsedBuffer;
            const result = this._buffers[this._lastUsedBuffer];
            // fill with background color
            result.data.set(this._backgroundFillData);
            return result;
        }
        static _createBackgroundFillData(WIDTH, HEIGHT, background) {
            const backgroundR = background.r;
            const backgroundG = background.g;
            const backgroundB = background.b;
            const result = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
            let offset = 0;
            for (let i = 0; i < HEIGHT; i++) {
                for (let j = 0; j < WIDTH; j++) {
                    result[offset] = backgroundR;
                    result[offset + 1] = backgroundG;
                    result[offset + 2] = backgroundB;
                    result[offset + 3] = 255;
                    offset += 4;
                }
            }
            return result;
        }
    }
    class MinimapSamplingState {
        constructor(samplingRatio, minimapLines) {
            this.samplingRatio = samplingRatio;
            this.minimapLines = minimapLines;
        }
        static compute(options, viewLineCount, oldSamplingState) {
            if (options.renderMinimap === 0 /* None */ || !options.isSampling) {
                return [null, []];
            }
            // ratio is intentionally not part of the layout to avoid the layout changing all the time
            // so we need to recompute it again...
            const pixelRatio = options.pixelRatio;
            const lineHeight = options.lineHeight;
            const scrollBeyondLastLine = options.scrollBeyondLastLine;
            const { minimapLineCount } = editorOptions_1.EditorLayoutInfoComputer.computeContainedMinimapLineCount({
                viewLineCount: viewLineCount,
                scrollBeyondLastLine: scrollBeyondLastLine,
                height: options.editorHeight,
                lineHeight: lineHeight,
                pixelRatio: pixelRatio
            });
            const ratio = viewLineCount / minimapLineCount;
            const halfRatio = ratio / 2;
            if (!oldSamplingState || oldSamplingState.minimapLines.length === 0) {
                let result = [];
                result[0] = 1;
                if (minimapLineCount > 1) {
                    for (let i = 0, lastIndex = minimapLineCount - 1; i < lastIndex; i++) {
                        result[i] = Math.round(i * ratio + halfRatio);
                    }
                    result[minimapLineCount - 1] = viewLineCount;
                }
                return [new MinimapSamplingState(ratio, result), []];
            }
            const oldMinimapLines = oldSamplingState.minimapLines;
            const oldLength = oldMinimapLines.length;
            let result = [];
            let oldIndex = 0;
            let oldDeltaLineCount = 0;
            let minViewLineNumber = 1;
            const MAX_EVENT_COUNT = 10; // generate at most 10 events, if there are more than 10 changes, just flush all previous data
            let events = [];
            let lastEvent = null;
            for (let i = 0; i < minimapLineCount; i++) {
                const fromViewLineNumber = Math.max(minViewLineNumber, Math.round(i * ratio));
                const toViewLineNumber = Math.max(fromViewLineNumber, Math.round((i + 1) * ratio));
                while (oldIndex < oldLength && oldMinimapLines[oldIndex] < fromViewLineNumber) {
                    if (events.length < MAX_EVENT_COUNT) {
                        const oldMinimapLineNumber = oldIndex + 1 + oldDeltaLineCount;
                        if (lastEvent && lastEvent.type === 'deleted' && lastEvent._oldIndex === oldIndex - 1) {
                            lastEvent.deleteToLineNumber++;
                        }
                        else {
                            lastEvent = { type: 'deleted', _oldIndex: oldIndex, deleteFromLineNumber: oldMinimapLineNumber, deleteToLineNumber: oldMinimapLineNumber };
                            events.push(lastEvent);
                        }
                        oldDeltaLineCount--;
                    }
                    oldIndex++;
                }
                let selectedViewLineNumber;
                if (oldIndex < oldLength && oldMinimapLines[oldIndex] <= toViewLineNumber) {
                    // reuse the old sampled line
                    selectedViewLineNumber = oldMinimapLines[oldIndex];
                    oldIndex++;
                }
                else {
                    if (i === 0) {
                        selectedViewLineNumber = 1;
                    }
                    else if (i + 1 === minimapLineCount) {
                        selectedViewLineNumber = viewLineCount;
                    }
                    else {
                        selectedViewLineNumber = Math.round(i * ratio + halfRatio);
                    }
                    if (events.length < MAX_EVENT_COUNT) {
                        const oldMinimapLineNumber = oldIndex + 1 + oldDeltaLineCount;
                        if (lastEvent && lastEvent.type === 'inserted' && lastEvent._i === i - 1) {
                            lastEvent.insertToLineNumber++;
                        }
                        else {
                            lastEvent = { type: 'inserted', _i: i, insertFromLineNumber: oldMinimapLineNumber, insertToLineNumber: oldMinimapLineNumber };
                            events.push(lastEvent);
                        }
                        oldDeltaLineCount++;
                    }
                }
                result[i] = selectedViewLineNumber;
                minViewLineNumber = selectedViewLineNumber;
            }
            if (events.length < MAX_EVENT_COUNT) {
                while (oldIndex < oldLength) {
                    const oldMinimapLineNumber = oldIndex + 1 + oldDeltaLineCount;
                    if (lastEvent && lastEvent.type === 'deleted' && lastEvent._oldIndex === oldIndex - 1) {
                        lastEvent.deleteToLineNumber++;
                    }
                    else {
                        lastEvent = { type: 'deleted', _oldIndex: oldIndex, deleteFromLineNumber: oldMinimapLineNumber, deleteToLineNumber: oldMinimapLineNumber };
                        events.push(lastEvent);
                    }
                    oldDeltaLineCount--;
                    oldIndex++;
                }
            }
            else {
                // too many events, just give up
                events = [{ type: 'flush' }];
            }
            return [new MinimapSamplingState(ratio, result), events];
        }
        modelLineToMinimapLine(lineNumber) {
            return Math.min(this.minimapLines.length, Math.max(1, Math.round(lineNumber / this.samplingRatio)));
        }
        /**
         * Will return null if the model line ranges are not intersecting with a sampled model line.
         */
        modelLineRangeToMinimapLineRange(fromLineNumber, toLineNumber) {
            let fromLineIndex = this.modelLineToMinimapLine(fromLineNumber) - 1;
            while (fromLineIndex > 0 && this.minimapLines[fromLineIndex - 1] >= fromLineNumber) {
                fromLineIndex--;
            }
            let toLineIndex = this.modelLineToMinimapLine(toLineNumber) - 1;
            while (toLineIndex + 1 < this.minimapLines.length && this.minimapLines[toLineIndex + 1] <= toLineNumber) {
                toLineIndex++;
            }
            if (fromLineIndex === toLineIndex) {
                const sampledLineNumber = this.minimapLines[fromLineIndex];
                if (sampledLineNumber < fromLineNumber || sampledLineNumber > toLineNumber) {
                    // This line is not part of the sampled lines ==> nothing to do
                    return null;
                }
            }
            return [fromLineIndex + 1, toLineIndex + 1];
        }
        /**
         * Will always return a range, even if it is not intersecting with a sampled model line.
         */
        decorationLineRangeToMinimapLineRange(startLineNumber, endLineNumber) {
            let minimapLineStart = this.modelLineToMinimapLine(startLineNumber);
            let minimapLineEnd = this.modelLineToMinimapLine(endLineNumber);
            if (startLineNumber !== endLineNumber && minimapLineEnd === minimapLineStart) {
                if (minimapLineEnd === this.minimapLines.length) {
                    if (minimapLineStart > 1) {
                        minimapLineStart--;
                    }
                }
                else {
                    minimapLineEnd++;
                }
            }
            return [minimapLineStart, minimapLineEnd];
        }
        onLinesDeleted(e) {
            // have the mapping be sticky
            const deletedLineCount = e.toLineNumber - e.fromLineNumber + 1;
            let changeStartIndex = this.minimapLines.length;
            let changeEndIndex = 0;
            for (let i = this.minimapLines.length - 1; i >= 0; i--) {
                if (this.minimapLines[i] < e.fromLineNumber) {
                    break;
                }
                if (this.minimapLines[i] <= e.toLineNumber) {
                    // this line got deleted => move to previous available
                    this.minimapLines[i] = Math.max(1, e.fromLineNumber - 1);
                    changeStartIndex = Math.min(changeStartIndex, i);
                    changeEndIndex = Math.max(changeEndIndex, i);
                }
                else {
                    this.minimapLines[i] -= deletedLineCount;
                }
            }
            return [changeStartIndex, changeEndIndex];
        }
        onLinesInserted(e) {
            // have the mapping be sticky
            const insertedLineCount = e.toLineNumber - e.fromLineNumber + 1;
            for (let i = this.minimapLines.length - 1; i >= 0; i--) {
                if (this.minimapLines[i] < e.fromLineNumber) {
                    break;
                }
                this.minimapLines[i] += insertedLineCount;
            }
        }
    }
    class Minimap extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this.tokensColorTracker = minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance();
            this._selections = [];
            this._minimapSelections = null;
            this.options = new MinimapOptions(this._context.configuration, this._context.theme, this.tokensColorTracker);
            const [samplingState,] = MinimapSamplingState.compute(this.options, this._context.model.getLineCount(), null);
            this._samplingState = samplingState;
            this._shouldCheckSampling = false;
            this._actual = new InnerMinimap(context.theme, this);
        }
        dispose() {
            this._actual.dispose();
            super.dispose();
        }
        getDomNode() {
            return this._actual.getDomNode();
        }
        _onOptionsMaybeChanged() {
            const opts = new MinimapOptions(this._context.configuration, this._context.theme, this.tokensColorTracker);
            if (this.options.equals(opts)) {
                return false;
            }
            this.options = opts;
            this._recreateLineSampling();
            this._actual.onDidChangeOptions();
            return true;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            return this._onOptionsMaybeChanged();
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            this._minimapSelections = null;
            return this._actual.onSelectionChanged();
        }
        onDecorationsChanged(e) {
            if (e.affectsMinimap) {
                return this._actual.onDecorationsChanged();
            }
            return false;
        }
        onFlushed(e) {
            if (this._samplingState) {
                this._shouldCheckSampling = true;
            }
            return this._actual.onFlushed();
        }
        onLinesChanged(e) {
            if (this._samplingState) {
                const minimapLineRange = this._samplingState.modelLineRangeToMinimapLineRange(e.fromLineNumber, e.toLineNumber);
                if (minimapLineRange) {
                    return this._actual.onLinesChanged(minimapLineRange[0], minimapLineRange[1]);
                }
                else {
                    return false;
                }
            }
            else {
                return this._actual.onLinesChanged(e.fromLineNumber, e.toLineNumber);
            }
        }
        onLinesDeleted(e) {
            if (this._samplingState) {
                const [changeStartIndex, changeEndIndex] = this._samplingState.onLinesDeleted(e);
                if (changeStartIndex <= changeEndIndex) {
                    this._actual.onLinesChanged(changeStartIndex + 1, changeEndIndex + 1);
                }
                this._shouldCheckSampling = true;
                return true;
            }
            else {
                return this._actual.onLinesDeleted(e.fromLineNumber, e.toLineNumber);
            }
        }
        onLinesInserted(e) {
            if (this._samplingState) {
                this._samplingState.onLinesInserted(e);
                this._shouldCheckSampling = true;
                return true;
            }
            else {
                return this._actual.onLinesInserted(e.fromLineNumber, e.toLineNumber);
            }
        }
        onScrollChanged(e) {
            return this._actual.onScrollChanged();
        }
        onThemeChanged(e) {
            this._context.model.invalidateMinimapColorCache();
            this._actual.onThemeChanged();
            this._onOptionsMaybeChanged();
            return true;
        }
        onTokensChanged(e) {
            if (this._samplingState) {
                let ranges = [];
                for (const range of e.ranges) {
                    const minimapLineRange = this._samplingState.modelLineRangeToMinimapLineRange(range.fromLineNumber, range.toLineNumber);
                    if (minimapLineRange) {
                        ranges.push({ fromLineNumber: minimapLineRange[0], toLineNumber: minimapLineRange[1] });
                    }
                }
                if (ranges.length) {
                    return this._actual.onTokensChanged(ranges);
                }
                else {
                    return false;
                }
            }
            else {
                return this._actual.onTokensChanged(e.ranges);
            }
        }
        onTokensColorsChanged(e) {
            return this._actual.onTokensColorsChanged();
        }
        onZonesChanged(e) {
            return this._actual.onZonesChanged();
        }
        // --- end event handlers
        prepareRender(ctx) {
            if (this._shouldCheckSampling) {
                this._shouldCheckSampling = false;
                this._recreateLineSampling();
            }
        }
        render(ctx) {
            let viewportStartLineNumber = ctx.visibleRange.startLineNumber;
            let viewportEndLineNumber = ctx.visibleRange.endLineNumber;
            if (this._samplingState) {
                viewportStartLineNumber = this._samplingState.modelLineToMinimapLine(viewportStartLineNumber);
                viewportEndLineNumber = this._samplingState.modelLineToMinimapLine(viewportEndLineNumber);
            }
            const minimapCtx = {
                viewportContainsWhitespaceGaps: (ctx.viewportData.whitespaceViewportData.length > 0),
                scrollWidth: ctx.scrollWidth,
                scrollHeight: ctx.scrollHeight,
                viewportStartLineNumber: viewportStartLineNumber,
                viewportEndLineNumber: viewportEndLineNumber,
                scrollTop: ctx.scrollTop,
                scrollLeft: ctx.scrollLeft,
                viewportWidth: ctx.viewportWidth,
                viewportHeight: ctx.viewportHeight,
            };
            this._actual.render(minimapCtx);
        }
        //#region IMinimapModel
        _recreateLineSampling() {
            this._minimapSelections = null;
            const wasSampling = Boolean(this._samplingState);
            const [samplingState, events] = MinimapSamplingState.compute(this.options, this._context.model.getLineCount(), this._samplingState);
            this._samplingState = samplingState;
            if (wasSampling && this._samplingState) {
                // was sampling, is sampling
                for (const event of events) {
                    switch (event.type) {
                        case 'deleted':
                            this._actual.onLinesDeleted(event.deleteFromLineNumber, event.deleteToLineNumber);
                            break;
                        case 'inserted':
                            this._actual.onLinesInserted(event.insertFromLineNumber, event.insertToLineNumber);
                            break;
                        case 'flush':
                            this._actual.onFlushed();
                            break;
                    }
                }
            }
        }
        getLineCount() {
            if (this._samplingState) {
                return this._samplingState.minimapLines.length;
            }
            return this._context.model.getLineCount();
        }
        getRealLineCount() {
            return this._context.model.getLineCount();
        }
        getLineContent(lineNumber) {
            if (this._samplingState) {
                return this._context.model.getLineContent(this._samplingState.minimapLines[lineNumber - 1]);
            }
            return this._context.model.getLineContent(lineNumber);
        }
        getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed) {
            if (this._samplingState) {
                let result = [];
                for (let lineIndex = 0, lineCount = endLineNumber - startLineNumber + 1; lineIndex < lineCount; lineIndex++) {
                    if (needed[lineIndex]) {
                        result[lineIndex] = this._context.model.getViewLineData(this._samplingState.minimapLines[startLineNumber + lineIndex - 1]);
                    }
                    else {
                        result[lineIndex] = null;
                    }
                }
                return result;
            }
            return this._context.model.getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed).data;
        }
        getSelections() {
            if (this._minimapSelections === null) {
                if (this._samplingState) {
                    this._minimapSelections = [];
                    for (const selection of this._selections) {
                        const [minimapLineStart, minimapLineEnd] = this._samplingState.decorationLineRangeToMinimapLineRange(selection.startLineNumber, selection.endLineNumber);
                        this._minimapSelections.push(new selection_1.Selection(minimapLineStart, selection.startColumn, minimapLineEnd, selection.endColumn));
                    }
                }
                else {
                    this._minimapSelections = this._selections;
                }
            }
            return this._minimapSelections;
        }
        getMinimapDecorationsInViewport(startLineNumber, endLineNumber) {
            let visibleRange;
            if (this._samplingState) {
                const modelStartLineNumber = this._samplingState.minimapLines[startLineNumber - 1];
                const modelEndLineNumber = this._samplingState.minimapLines[endLineNumber - 1];
                visibleRange = new range_1.Range(modelStartLineNumber, 1, modelEndLineNumber, this._context.model.getLineMaxColumn(modelEndLineNumber));
            }
            else {
                visibleRange = new range_1.Range(startLineNumber, 1, endLineNumber, this._context.model.getLineMaxColumn(endLineNumber));
            }
            const decorations = this._context.model.getDecorationsInViewport(visibleRange);
            if (this._samplingState) {
                let result = [];
                for (const decoration of decorations) {
                    if (!decoration.options.minimap) {
                        continue;
                    }
                    const range = decoration.range;
                    const minimapStartLineNumber = this._samplingState.modelLineToMinimapLine(range.startLineNumber);
                    const minimapEndLineNumber = this._samplingState.modelLineToMinimapLine(range.endLineNumber);
                    result.push(new viewModel_1.ViewModelDecoration(new range_1.Range(minimapStartLineNumber, range.startColumn, minimapEndLineNumber, range.endColumn), decoration.options));
                }
                return result;
            }
            return decorations;
        }
        getOptions() {
            return this._context.model.getTextModelOptions();
        }
        revealLineNumber(lineNumber) {
            if (this._samplingState) {
                lineNumber = this._samplingState.minimapLines[lineNumber - 1];
            }
            this._context.model.revealRange('mouse', false, new range_1.Range(lineNumber, 1, lineNumber, 1), 1 /* Center */, 0 /* Smooth */);
        }
        setScrollTop(scrollTop) {
            this._context.model.setScrollPosition({
                scrollTop: scrollTop
            }, 1 /* Immediate */);
        }
    }
    exports.Minimap = Minimap;
    class InnerMinimap extends lifecycle_1.Disposable {
        constructor(theme, model) {
            super();
            this._renderDecorations = false;
            this._gestureInProgress = false;
            this._theme = theme;
            this._model = model;
            this._lastRenderData = null;
            this._buffers = null;
            this._selectionColor = this._theme.getColor(colorRegistry_1.minimapSelection);
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._domNode, 8 /* Minimap */);
            this._domNode.setClassName(this._getMinimapDomNodeClassName());
            this._domNode.setPosition('absolute');
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._shadow = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._shadow.setClassName('minimap-shadow-hidden');
            this._domNode.appendChild(this._shadow);
            this._canvas = fastDomNode_1.createFastDomNode(document.createElement('canvas'));
            this._canvas.setPosition('absolute');
            this._canvas.setLeft(0);
            this._domNode.appendChild(this._canvas);
            this._decorationsCanvas = fastDomNode_1.createFastDomNode(document.createElement('canvas'));
            this._decorationsCanvas.setPosition('absolute');
            this._decorationsCanvas.setClassName('minimap-decorations-layer');
            this._decorationsCanvas.setLeft(0);
            this._domNode.appendChild(this._decorationsCanvas);
            this._slider = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._slider.setPosition('absolute');
            this._slider.setClassName('minimap-slider');
            this._slider.setLayerHinting(true);
            this._slider.setContain('strict');
            this._domNode.appendChild(this._slider);
            this._sliderHorizontal = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._sliderHorizontal.setPosition('absolute');
            this._sliderHorizontal.setClassName('minimap-slider-horizontal');
            this._slider.appendChild(this._sliderHorizontal);
            this._applyLayout();
            this._mouseDownListener = dom.addStandardDisposableListener(this._domNode.domNode, 'mousedown', (e) => {
                e.preventDefault();
                const renderMinimap = this._model.options.renderMinimap;
                if (renderMinimap === 0 /* None */) {
                    return;
                }
                if (!this._lastRenderData) {
                    return;
                }
                if (this._model.options.size !== 'proportional') {
                    if (e.leftButton && this._lastRenderData) {
                        // pretend the click occured in the center of the slider
                        const position = dom.getDomNodePagePosition(this._slider.domNode);
                        const initialPosY = position.top + position.height / 2;
                        this._startSliderDragging(e.buttons, e.posx, initialPosY, e.posy, this._lastRenderData.renderedLayout);
                    }
                    return;
                }
                const minimapLineHeight = this._model.options.minimapLineHeight;
                const internalOffsetY = (this._model.options.canvasInnerHeight / this._model.options.canvasOuterHeight) * e.browserEvent.offsetY;
                const lineIndex = Math.floor(internalOffsetY / minimapLineHeight);
                let lineNumber = lineIndex + this._lastRenderData.renderedLayout.startLineNumber;
                lineNumber = Math.min(lineNumber, this._model.getLineCount());
                this._model.revealLineNumber(lineNumber);
            });
            this._sliderMouseMoveMonitor = new globalMouseMoveMonitor_1.GlobalMouseMoveMonitor();
            this._sliderMouseDownListener = dom.addStandardDisposableListener(this._slider.domNode, 'mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.leftButton && this._lastRenderData) {
                    this._startSliderDragging(e.buttons, e.posx, e.posy, e.posy, this._lastRenderData.renderedLayout);
                }
            });
            this._gestureDisposable = touch_1.Gesture.addTarget(this._domNode.domNode);
            this._sliderTouchStartListener = dom.addDisposableListener(this._domNode.domNode, touch_1.EventType.Start, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this._lastRenderData) {
                    this._slider.toggleClassName('active', true);
                    this._gestureInProgress = true;
                    this.scrollDueToTouchEvent(e);
                }
            }, { passive: false });
            this._sliderTouchMoveListener = dom.addDisposableListener(this._domNode.domNode, touch_1.EventType.Change, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this._lastRenderData && this._gestureInProgress) {
                    this.scrollDueToTouchEvent(e);
                }
            }, { passive: false });
            this._sliderTouchEndListener = dom.addStandardDisposableListener(this._domNode.domNode, touch_1.EventType.End, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._gestureInProgress = false;
                this._slider.toggleClassName('active', false);
            });
        }
        _startSliderDragging(initialButtons, initialPosX, initialPosY, posy, initialSliderState) {
            this._slider.toggleClassName('active', true);
            const handleMouseMove = (posy, posx) => {
                const mouseOrthogonalDelta = Math.abs(posx - initialPosX);
                if (platform.isWindows && mouseOrthogonalDelta > MOUSE_DRAG_RESET_DISTANCE) {
                    // The mouse has wondered away from the scrollbar => reset dragging
                    this._model.setScrollTop(initialSliderState.scrollTop);
                    return;
                }
                const mouseDelta = posy - initialPosY;
                this._model.setScrollTop(initialSliderState.getDesiredScrollTopFromDelta(mouseDelta));
            };
            if (posy !== initialPosY) {
                handleMouseMove(posy, initialPosX);
            }
            this._sliderMouseMoveMonitor.startMonitoring(this._slider.domNode, initialButtons, globalMouseMoveMonitor_1.standardMouseMoveMerger, (mouseMoveData) => handleMouseMove(mouseMoveData.posy, mouseMoveData.posx), () => {
                this._slider.toggleClassName('active', false);
            });
        }
        scrollDueToTouchEvent(touch) {
            const startY = this._domNode.domNode.getBoundingClientRect().top;
            const scrollTop = this._lastRenderData.renderedLayout.getDesiredScrollTopFromTouchLocation(touch.pageY - startY);
            this._model.setScrollTop(scrollTop);
        }
        dispose() {
            this._mouseDownListener.dispose();
            this._sliderMouseMoveMonitor.dispose();
            this._sliderMouseDownListener.dispose();
            this._gestureDisposable.dispose();
            this._sliderTouchStartListener.dispose();
            this._sliderTouchMoveListener.dispose();
            this._sliderTouchEndListener.dispose();
            super.dispose();
        }
        _getMinimapDomNodeClassName() {
            if (this._model.options.showSlider === 'always') {
                return 'minimap slider-always';
            }
            return 'minimap slider-mouseover';
        }
        getDomNode() {
            return this._domNode;
        }
        _applyLayout() {
            this._domNode.setLeft(this._model.options.minimapLeft);
            this._domNode.setWidth(this._model.options.minimapWidth);
            this._domNode.setHeight(this._model.options.minimapHeight);
            this._shadow.setHeight(this._model.options.minimapHeight);
            this._canvas.setWidth(this._model.options.canvasOuterWidth);
            this._canvas.setHeight(this._model.options.canvasOuterHeight);
            this._canvas.domNode.width = this._model.options.canvasInnerWidth;
            this._canvas.domNode.height = this._model.options.canvasInnerHeight;
            this._decorationsCanvas.setWidth(this._model.options.canvasOuterWidth);
            this._decorationsCanvas.setHeight(this._model.options.canvasOuterHeight);
            this._decorationsCanvas.domNode.width = this._model.options.canvasInnerWidth;
            this._decorationsCanvas.domNode.height = this._model.options.canvasInnerHeight;
            this._slider.setWidth(this._model.options.minimapWidth);
        }
        _getBuffer() {
            if (!this._buffers) {
                if (this._model.options.canvasInnerWidth > 0 && this._model.options.canvasInnerHeight > 0) {
                    this._buffers = new MinimapBuffers(this._canvas.domNode.getContext('2d'), this._model.options.canvasInnerWidth, this._model.options.canvasInnerHeight, this._model.options.backgroundColor);
                }
            }
            return this._buffers ? this._buffers.getBuffer() : null;
        }
        // ---- begin view event handlers
        onDidChangeOptions() {
            this._lastRenderData = null;
            this._buffers = null;
            this._applyLayout();
            this._domNode.setClassName(this._getMinimapDomNodeClassName());
        }
        onSelectionChanged() {
            this._renderDecorations = true;
            return true;
        }
        onDecorationsChanged() {
            this._renderDecorations = true;
            return true;
        }
        onFlushed() {
            this._lastRenderData = null;
            return true;
        }
        onLinesChanged(changeFromLineNumber, changeToLineNumber) {
            if (this._lastRenderData) {
                return this._lastRenderData.onLinesChanged(changeFromLineNumber, changeToLineNumber);
            }
            return false;
        }
        onLinesDeleted(deleteFromLineNumber, deleteToLineNumber) {
            if (this._lastRenderData) {
                this._lastRenderData.onLinesDeleted(deleteFromLineNumber, deleteToLineNumber);
            }
            return true;
        }
        onLinesInserted(insertFromLineNumber, insertToLineNumber) {
            if (this._lastRenderData) {
                this._lastRenderData.onLinesInserted(insertFromLineNumber, insertToLineNumber);
            }
            return true;
        }
        onScrollChanged() {
            this._renderDecorations = true;
            return true;
        }
        onThemeChanged() {
            this._selectionColor = this._theme.getColor(colorRegistry_1.minimapSelection);
            this._renderDecorations = true;
            return true;
        }
        onTokensChanged(ranges) {
            if (this._lastRenderData) {
                return this._lastRenderData.onTokensChanged(ranges);
            }
            return false;
        }
        onTokensColorsChanged() {
            this._lastRenderData = null;
            this._buffers = null;
            return true;
        }
        onZonesChanged() {
            this._lastRenderData = null;
            return true;
        }
        // --- end event handlers
        render(renderingCtx) {
            const renderMinimap = this._model.options.renderMinimap;
            if (renderMinimap === 0 /* None */) {
                this._shadow.setClassName('minimap-shadow-hidden');
                this._sliderHorizontal.setWidth(0);
                this._sliderHorizontal.setHeight(0);
                return;
            }
            if (renderingCtx.scrollLeft + renderingCtx.viewportWidth >= renderingCtx.scrollWidth) {
                this._shadow.setClassName('minimap-shadow-hidden');
            }
            else {
                this._shadow.setClassName('minimap-shadow-visible');
            }
            const layout = MinimapLayout.create(this._model.options, renderingCtx.viewportStartLineNumber, renderingCtx.viewportEndLineNumber, renderingCtx.viewportHeight, renderingCtx.viewportContainsWhitespaceGaps, this._model.getLineCount(), this._model.getRealLineCount(), renderingCtx.scrollTop, renderingCtx.scrollHeight, this._lastRenderData ? this._lastRenderData.renderedLayout : null);
            this._slider.setDisplay(layout.sliderNeeded ? 'block' : 'none');
            this._slider.setTop(layout.sliderTop);
            this._slider.setHeight(layout.sliderHeight);
            // Compute horizontal slider coordinates
            const scrollLeftChars = renderingCtx.scrollLeft / this._model.options.typicalHalfwidthCharacterWidth;
            const horizontalSliderLeft = Math.min(this._model.options.minimapWidth, Math.round(scrollLeftChars * this._model.options.minimapCharWidth / this._model.options.pixelRatio));
            this._sliderHorizontal.setLeft(horizontalSliderLeft);
            this._sliderHorizontal.setWidth(this._model.options.minimapWidth - horizontalSliderLeft);
            this._sliderHorizontal.setTop(0);
            this._sliderHorizontal.setHeight(layout.sliderHeight);
            this.renderDecorations(layout);
            this._lastRenderData = this.renderLines(layout);
        }
        renderDecorations(layout) {
            if (this._renderDecorations) {
                this._renderDecorations = false;
                const selections = this._model.getSelections();
                const decorations = this._model.getMinimapDecorationsInViewport(layout.startLineNumber, layout.endLineNumber);
                const { canvasInnerWidth, canvasInnerHeight } = this._model.options;
                const lineHeight = this._model.options.minimapLineHeight;
                const characterWidth = this._model.options.minimapCharWidth;
                const tabSize = this._model.getOptions().tabSize;
                const canvasContext = this._decorationsCanvas.domNode.getContext('2d');
                canvasContext.clearRect(0, 0, canvasInnerWidth, canvasInnerHeight);
                const lineOffsetMap = new Map();
                for (let i = 0; i < selections.length; i++) {
                    const selection = selections[i];
                    for (let line = selection.startLineNumber; line <= selection.endLineNumber; line++) {
                        this.renderDecorationOnLine(canvasContext, lineOffsetMap, selection, this._selectionColor, layout, line, lineHeight, lineHeight, tabSize, characterWidth);
                    }
                }
                // Loop over decorations, ignoring those that don't have the minimap property set and rendering rectangles for each line the decoration spans
                for (let i = 0; i < decorations.length; i++) {
                    const decoration = decorations[i];
                    if (!decoration.options.minimap) {
                        continue;
                    }
                    const decorationColor = decoration.options.minimap.getColor(this._theme);
                    for (let line = decoration.range.startLineNumber; line <= decoration.range.endLineNumber; line++) {
                        switch (decoration.options.minimap.position) {
                            case model_1.MinimapPosition.Inline:
                                this.renderDecorationOnLine(canvasContext, lineOffsetMap, decoration.range, decorationColor, layout, line, lineHeight, lineHeight, tabSize, characterWidth);
                                continue;
                            case model_1.MinimapPosition.Gutter:
                                const y = (line - layout.startLineNumber) * lineHeight;
                                const x = 2;
                                this.renderDecoration(canvasContext, decorationColor, x, y, GUTTER_DECORATION_WIDTH, lineHeight);
                                continue;
                        }
                    }
                }
            }
        }
        renderDecorationOnLine(canvasContext, lineOffsetMap, decorationRange, decorationColor, layout, lineNumber, height, lineHeight, tabSize, charWidth) {
            const y = (lineNumber - layout.startLineNumber) * lineHeight;
            // Skip rendering the line if it's vertically outside our viewport
            if (y + height < 0 || y > this._model.options.canvasInnerHeight) {
                return;
            }
            // Cache line offset data so that it is only read once per line
            let lineIndexToXOffset = lineOffsetMap.get(lineNumber);
            const isFirstDecorationForLine = !lineIndexToXOffset;
            if (!lineIndexToXOffset) {
                const lineData = this._model.getLineContent(lineNumber);
                lineIndexToXOffset = [editorOptions_1.MINIMAP_GUTTER_WIDTH];
                for (let i = 1; i < lineData.length + 1; i++) {
                    const charCode = lineData.charCodeAt(i - 1);
                    const dx = charCode === 9 /* Tab */
                        ? tabSize * charWidth
                        : strings.isFullWidthCharacter(charCode)
                            ? 2 * charWidth
                            : charWidth;
                    lineIndexToXOffset[i] = lineIndexToXOffset[i - 1] + dx;
                }
                lineOffsetMap.set(lineNumber, lineIndexToXOffset);
            }
            const { startColumn, endColumn, startLineNumber, endLineNumber } = decorationRange;
            const x = startLineNumber === lineNumber ? lineIndexToXOffset[startColumn - 1] : editorOptions_1.MINIMAP_GUTTER_WIDTH;
            const endColumnForLine = endLineNumber > lineNumber ? lineIndexToXOffset.length - 1 : endColumn - 1;
            if (endColumnForLine > 0) {
                // If the decoration starts at the last character of the column and spans over it, ensure it has a width
                const width = lineIndexToXOffset[endColumnForLine] - x || 2;
                this.renderDecoration(canvasContext, decorationColor, x, y, width, height);
            }
            if (isFirstDecorationForLine) {
                this.renderLineHighlight(canvasContext, decorationColor, y, height);
            }
        }
        renderLineHighlight(canvasContext, decorationColor, y, height) {
            canvasContext.fillStyle = decorationColor && decorationColor.transparent(0.5).toString() || '';
            canvasContext.fillRect(editorOptions_1.MINIMAP_GUTTER_WIDTH, y, canvasContext.canvas.width, height);
        }
        renderDecoration(canvasContext, decorationColor, x, y, width, height) {
            canvasContext.fillStyle = decorationColor && decorationColor.toString() || '';
            canvasContext.fillRect(x, y, width, height);
        }
        renderLines(layout) {
            const startLineNumber = layout.startLineNumber;
            const endLineNumber = layout.endLineNumber;
            const minimapLineHeight = this._model.options.minimapLineHeight;
            // Check if nothing changed w.r.t. lines from last frame
            if (this._lastRenderData && this._lastRenderData.linesEquals(layout)) {
                const _lastData = this._lastRenderData._get();
                // Nice!! Nothing changed from last frame
                return new RenderData(layout, _lastData.imageData, _lastData.lines);
            }
            // Oh well!! We need to repaint some lines...
            const imageData = this._getBuffer();
            if (!imageData) {
                // 0 width or 0 height canvas, nothing to do
                return null;
            }
            // Render untouched lines by using last rendered data.
            let [_dirtyY1, _dirtyY2, needed] = InnerMinimap._renderUntouchedLines(imageData, startLineNumber, endLineNumber, minimapLineHeight, this._lastRenderData);
            // Fetch rendering info from view model for rest of lines that need rendering.
            const lineInfo = this._model.getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed);
            const tabSize = this._model.getOptions().tabSize;
            const background = this._model.options.backgroundColor;
            const tokensColorTracker = this._model.tokensColorTracker;
            const useLighterFont = tokensColorTracker.backgroundIsLight();
            const renderMinimap = this._model.options.renderMinimap;
            const charRenderer = this._model.options.charRenderer();
            const fontScale = this._model.options.fontScale;
            const minimapCharWidth = this._model.options.minimapCharWidth;
            const baseCharHeight = (renderMinimap === 1 /* Text */ ? 2 /* BASE_CHAR_HEIGHT */ : 2 /* BASE_CHAR_HEIGHT */ + 1);
            const renderMinimapLineHeight = baseCharHeight * fontScale;
            const innerLinePadding = (minimapLineHeight > renderMinimapLineHeight ? Math.floor((minimapLineHeight - renderMinimapLineHeight) / 2) : 0);
            // Render the rest of lines
            let dy = 0;
            const renderedLines = [];
            for (let lineIndex = 0, lineCount = endLineNumber - startLineNumber + 1; lineIndex < lineCount; lineIndex++) {
                if (needed[lineIndex]) {
                    InnerMinimap._renderLine(imageData, background, useLighterFont, renderMinimap, minimapCharWidth, tokensColorTracker, charRenderer, dy, innerLinePadding, tabSize, lineInfo[lineIndex], fontScale, minimapLineHeight);
                }
                renderedLines[lineIndex] = new MinimapLine(dy);
                dy += minimapLineHeight;
            }
            const dirtyY1 = (_dirtyY1 === -1 ? 0 : _dirtyY1);
            const dirtyY2 = (_dirtyY2 === -1 ? imageData.height : _dirtyY2);
            const dirtyHeight = dirtyY2 - dirtyY1;
            // Finally, paint to the canvas
            const ctx = this._canvas.domNode.getContext('2d');
            ctx.putImageData(imageData, 0, 0, 0, dirtyY1, imageData.width, dirtyHeight);
            // Save rendered data for reuse on next frame if possible
            return new RenderData(layout, imageData, renderedLines);
        }
        static _renderUntouchedLines(target, startLineNumber, endLineNumber, minimapLineHeight, lastRenderData) {
            const needed = [];
            if (!lastRenderData) {
                for (let i = 0, len = endLineNumber - startLineNumber + 1; i < len; i++) {
                    needed[i] = true;
                }
                return [-1, -1, needed];
            }
            const _lastData = lastRenderData._get();
            const lastTargetData = _lastData.imageData.data;
            const lastStartLineNumber = _lastData.rendLineNumberStart;
            const lastLines = _lastData.lines;
            const lastLinesLength = lastLines.length;
            const WIDTH = target.width;
            const targetData = target.data;
            const maxDestPixel = (endLineNumber - startLineNumber + 1) * minimapLineHeight * WIDTH * 4;
            let dirtyPixel1 = -1; // the pixel offset up to which all the data is equal to the prev frame
            let dirtyPixel2 = -1; // the pixel offset after which all the data is equal to the prev frame
            let copySourceStart = -1;
            let copySourceEnd = -1;
            let copyDestStart = -1;
            let copyDestEnd = -1;
            let dest_dy = 0;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineIndex = lineNumber - startLineNumber;
                const lastLineIndex = lineNumber - lastStartLineNumber;
                const source_dy = (lastLineIndex >= 0 && lastLineIndex < lastLinesLength ? lastLines[lastLineIndex].dy : -1);
                if (source_dy === -1) {
                    needed[lineIndex] = true;
                    dest_dy += minimapLineHeight;
                    continue;
                }
                const sourceStart = source_dy * WIDTH * 4;
                const sourceEnd = (source_dy + minimapLineHeight) * WIDTH * 4;
                const destStart = dest_dy * WIDTH * 4;
                const destEnd = (dest_dy + minimapLineHeight) * WIDTH * 4;
                if (copySourceEnd === sourceStart && copyDestEnd === destStart) {
                    // contiguous zone => extend copy request
                    copySourceEnd = sourceEnd;
                    copyDestEnd = destEnd;
                }
                else {
                    if (copySourceStart !== -1) {
                        // flush existing copy request
                        targetData.set(lastTargetData.subarray(copySourceStart, copySourceEnd), copyDestStart);
                        if (dirtyPixel1 === -1 && copySourceStart === 0 && copySourceStart === copyDestStart) {
                            dirtyPixel1 = copySourceEnd;
                        }
                        if (dirtyPixel2 === -1 && copySourceEnd === maxDestPixel && copySourceStart === copyDestStart) {
                            dirtyPixel2 = copySourceStart;
                        }
                    }
                    copySourceStart = sourceStart;
                    copySourceEnd = sourceEnd;
                    copyDestStart = destStart;
                    copyDestEnd = destEnd;
                }
                needed[lineIndex] = false;
                dest_dy += minimapLineHeight;
            }
            if (copySourceStart !== -1) {
                // flush existing copy request
                targetData.set(lastTargetData.subarray(copySourceStart, copySourceEnd), copyDestStart);
                if (dirtyPixel1 === -1 && copySourceStart === 0 && copySourceStart === copyDestStart) {
                    dirtyPixel1 = copySourceEnd;
                }
                if (dirtyPixel2 === -1 && copySourceEnd === maxDestPixel && copySourceStart === copyDestStart) {
                    dirtyPixel2 = copySourceStart;
                }
            }
            const dirtyY1 = (dirtyPixel1 === -1 ? -1 : dirtyPixel1 / (WIDTH * 4));
            const dirtyY2 = (dirtyPixel2 === -1 ? -1 : dirtyPixel2 / (WIDTH * 4));
            return [dirtyY1, dirtyY2, needed];
        }
        static _renderLine(target, backgroundColor, useLighterFont, renderMinimap, charWidth, colorTracker, minimapCharRenderer, dy, innerLinePadding, tabSize, lineData, fontScale, minimapLineHeight) {
            const content = lineData.content;
            const tokens = lineData.tokens;
            const maxDx = target.width - charWidth;
            const force1pxHeight = (minimapLineHeight === 1);
            let dx = editorOptions_1.MINIMAP_GUTTER_WIDTH;
            let charIndex = 0;
            let tabsCharDelta = 0;
            for (let tokenIndex = 0, tokensLen = tokens.getCount(); tokenIndex < tokensLen; tokenIndex++) {
                const tokenEndIndex = tokens.getEndOffset(tokenIndex);
                const tokenColorId = tokens.getForeground(tokenIndex);
                const tokenColor = colorTracker.getColor(tokenColorId);
                for (; charIndex < tokenEndIndex; charIndex++) {
                    if (dx > maxDx) {
                        // hit edge of minimap
                        return;
                    }
                    const charCode = content.charCodeAt(charIndex);
                    if (charCode === 9 /* Tab */) {
                        const insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        // No need to render anything since tab is invisible
                        dx += insertSpacesCount * charWidth;
                    }
                    else if (charCode === 32 /* Space */) {
                        // No need to render anything since space is invisible
                        dx += charWidth;
                    }
                    else {
                        // Render twice for a full width character
                        const count = strings.isFullWidthCharacter(charCode) ? 2 : 1;
                        for (let i = 0; i < count; i++) {
                            if (renderMinimap === 2 /* Blocks */) {
                                minimapCharRenderer.blockRenderChar(target, dx, dy + innerLinePadding, tokenColor, backgroundColor, useLighterFont, force1pxHeight);
                            }
                            else { // RenderMinimap.Text
                                minimapCharRenderer.renderChar(target, dx, dy + innerLinePadding, charCode, tokenColor, backgroundColor, fontScale, useLighterFont, force1pxHeight);
                            }
                            dx += charWidth;
                            if (dx > maxDx) {
                                // hit edge of minimap
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    themeService_1.registerThemingParticipant((theme, collector) => {
        const minimapBackgroundValue = theme.getColor(colorRegistry_1.minimapBackground);
        if (minimapBackgroundValue) {
            collector.addRule(`.monaco-editor .minimap > canvas { opacity: ${minimapBackgroundValue.rgba.a}; will-change: opacity; }`);
        }
        const sliderBackground = theme.getColor(colorRegistry_1.minimapSliderBackground);
        if (sliderBackground) {
            collector.addRule(`.monaco-editor .minimap-slider .minimap-slider-horizontal { background: ${sliderBackground}; }`);
        }
        const sliderHoverBackground = theme.getColor(colorRegistry_1.minimapSliderHoverBackground);
        if (sliderHoverBackground) {
            collector.addRule(`.monaco-editor .minimap-slider:hover .minimap-slider-horizontal { background: ${sliderHoverBackground}; }`);
        }
        const sliderActiveBackground = theme.getColor(colorRegistry_1.minimapSliderActiveBackground);
        if (sliderActiveBackground) {
            collector.addRule(`.monaco-editor .minimap-slider.active .minimap-slider-horizontal { background: ${sliderActiveBackground}; }`);
        }
        const shadow = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.monaco-editor .minimap-shadow-visible { box-shadow: ${shadow} -6px 0 6px -6px inset; }`);
        }
    });
});
//# __sourceMappingURL=minimap.js.map