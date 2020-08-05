/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicon", "vs/base/common/event"], function (require, exports, codicon_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.stripCodicons = exports.renderCodicons = exports.markdownUnescapeCodicons = exports.markdownEscapeEscapedCodicons = exports.escapeCodicons = exports.Codicon = exports.registerIcon = exports.iconRegistry = void 0;
    class Registry {
        constructor() {
            this._icons = new Map();
            this._onDidRegister = new event_1.Emitter();
        }
        add(icon) {
            if (!this._icons.has(icon.id)) {
                this._icons.set(icon.id, icon);
                this._onDidRegister.fire(icon);
            }
            else {
                console.error(`Duplicate registration of codicon ${icon.id}`);
            }
        }
        get(id) {
            return this._icons.get(id);
        }
        get all() {
            return this._icons.values();
        }
        get onDidRegister() {
            return this._onDidRegister.event;
        }
    }
    const _registry = new Registry();
    exports.iconRegistry = _registry;
    function registerIcon(id, def, description) {
        return new Codicon(id, def);
    }
    exports.registerIcon = registerIcon;
    class Codicon {
        constructor(id, definition, description) {
            this.id = id;
            this.definition = definition;
            this.description = description;
            _registry.add(this);
        }
        get classNames() { return 'codicon codicon-' + this.id; }
        get cssSelector() { return '.codicon.codicon-' + this.id; }
    }
    exports.Codicon = Codicon;
    (function (Codicon) {
        // built-in icons, with image name
        Codicon.add = new Codicon('add', { character: '\\ea60' });
        Codicon.plus = new Codicon('plus', { character: '\\ea60' });
        Codicon.gistNew = new Codicon('gist-new', { character: '\\ea60' });
        Codicon.repoCreate = new Codicon('repo-create', { character: '\\ea60' });
        Codicon.lightbulb = new Codicon('lightbulb', { character: '\\ea61' });
        Codicon.lightBulb = new Codicon('light-bulb', { character: '\\ea61' });
        Codicon.repo = new Codicon('repo', { character: '\\ea62' });
        Codicon.repoDelete = new Codicon('repo-delete', { character: '\\ea62' });
        Codicon.gistFork = new Codicon('gist-fork', { character: '\\ea63' });
        Codicon.repoForked = new Codicon('repo-forked', { character: '\\ea63' });
        Codicon.gitPullRequest = new Codicon('git-pull-request', { character: '\\ea64' });
        Codicon.gitPullRequestAbandoned = new Codicon('git-pull-request-abandoned', { character: '\\ea64' });
        Codicon.recordKeys = new Codicon('record-keys', { character: '\\ea65' });
        Codicon.keyboard = new Codicon('keyboard', { character: '\\ea65' });
        Codicon.tag = new Codicon('tag', { character: '\\ea66' });
        Codicon.tagAdd = new Codicon('tag-add', { character: '\\ea66' });
        Codicon.tagRemove = new Codicon('tag-remove', { character: '\\ea66' });
        Codicon.person = new Codicon('person', { character: '\\ea67' });
        Codicon.personAdd = new Codicon('person-add', { character: '\\ea67' });
        Codicon.personFollow = new Codicon('person-follow', { character: '\\ea67' });
        Codicon.personOutline = new Codicon('person-outline', { character: '\\ea67' });
        Codicon.personFilled = new Codicon('person-filled', { character: '\\ea67' });
        Codicon.gitBranch = new Codicon('git-branch', { character: '\\ea68' });
        Codicon.gitBranchCreate = new Codicon('git-branch-create', { character: '\\ea68' });
        Codicon.gitBranchDelete = new Codicon('git-branch-delete', { character: '\\ea68' });
        Codicon.sourceControl = new Codicon('source-control', { character: '\\ea68' });
        Codicon.mirror = new Codicon('mirror', { character: '\\ea69' });
        Codicon.mirrorPublic = new Codicon('mirror-public', { character: '\\ea69' });
        Codicon.star = new Codicon('star', { character: '\\ea6a' });
        Codicon.starAdd = new Codicon('star-add', { character: '\\ea6a' });
        Codicon.starDelete = new Codicon('star-delete', { character: '\\ea6a' });
        Codicon.starEmpty = new Codicon('star-empty', { character: '\\ea6a' });
        Codicon.comment = new Codicon('comment', { character: '\\ea6b' });
        Codicon.commentAdd = new Codicon('comment-add', { character: '\\ea6b' });
        Codicon.alert = new Codicon('alert', { character: '\\ea6c' });
        Codicon.warning = new Codicon('warning', { character: '\\ea6c' });
        Codicon.search = new Codicon('search', { character: '\\ea6d' });
        Codicon.searchSave = new Codicon('search-save', { character: '\\ea6d' });
        Codicon.logOut = new Codicon('log-out', { character: '\\ea6e' });
        Codicon.signOut = new Codicon('sign-out', { character: '\\ea6e' });
        Codicon.logIn = new Codicon('log-in', { character: '\\ea6f' });
        Codicon.signIn = new Codicon('sign-in', { character: '\\ea6f' });
        Codicon.eye = new Codicon('eye', { character: '\\ea70' });
        Codicon.eyeUnwatch = new Codicon('eye-unwatch', { character: '\\ea70' });
        Codicon.eyeWatch = new Codicon('eye-watch', { character: '\\ea70' });
        Codicon.circleFilled = new Codicon('circle-filled', { character: '\\ea71' });
        Codicon.primitiveDot = new Codicon('primitive-dot', { character: '\\ea71' });
        Codicon.closeDirty = new Codicon('close-dirty', { character: '\\ea71' });
        Codicon.debugBreakpoint = new Codicon('debug-breakpoint', { character: '\\ea71' });
        Codicon.debugBreakpointDisabled = new Codicon('debug-breakpoint-disabled', { character: '\\ea71' });
        Codicon.debugHint = new Codicon('debug-hint', { character: '\\ea71' });
        Codicon.primitiveSquare = new Codicon('primitive-square', { character: '\\ea72' });
        Codicon.edit = new Codicon('edit', { character: '\\ea73' });
        Codicon.pencil = new Codicon('pencil', { character: '\\ea73' });
        Codicon.info = new Codicon('info', { character: '\\ea74' });
        Codicon.issueOpened = new Codicon('issue-opened', { character: '\\ea74' });
        Codicon.gistPrivate = new Codicon('gist-private', { character: '\\ea75' });
        Codicon.gitForkPrivate = new Codicon('git-fork-private', { character: '\\ea75' });
        Codicon.lock = new Codicon('lock', { character: '\\ea75' });
        Codicon.mirrorPrivate = new Codicon('mirror-private', { character: '\\ea75' });
        Codicon.close = new Codicon('close', { character: '\\ea76' });
        Codicon.removeClose = new Codicon('remove-close', { character: '\\ea76' });
        Codicon.x = new Codicon('x', { character: '\\ea76' });
        Codicon.repoSync = new Codicon('repo-sync', { character: '\\ea77' });
        Codicon.sync = new Codicon('sync', { character: '\\ea77' });
        Codicon.clone = new Codicon('clone', { character: '\\ea78' });
        Codicon.desktopDownload = new Codicon('desktop-download', { character: '\\ea78' });
        Codicon.beaker = new Codicon('beaker', { character: '\\ea79' });
        Codicon.microscope = new Codicon('microscope', { character: '\\ea79' });
        Codicon.vm = new Codicon('vm', { character: '\\ea7a' });
        Codicon.deviceDesktop = new Codicon('device-desktop', { character: '\\ea7a' });
        Codicon.file = new Codicon('file', { character: '\\ea7b' });
        Codicon.fileText = new Codicon('file-text', { character: '\\ea7b' });
        Codicon.more = new Codicon('more', { character: '\\ea7c' });
        Codicon.ellipsis = new Codicon('ellipsis', { character: '\\ea7c' });
        Codicon.kebabHorizontal = new Codicon('kebab-horizontal', { character: '\\ea7c' });
        Codicon.mailReply = new Codicon('mail-reply', { character: '\\ea7d' });
        Codicon.reply = new Codicon('reply', { character: '\\ea7d' });
        Codicon.organization = new Codicon('organization', { character: '\\ea7e' });
        Codicon.organizationFilled = new Codicon('organization-filled', { character: '\\ea7e' });
        Codicon.organizationOutline = new Codicon('organization-outline', { character: '\\ea7e' });
        Codicon.newFile = new Codicon('new-file', { character: '\\ea7f' });
        Codicon.fileAdd = new Codicon('file-add', { character: '\\ea7f' });
        Codicon.newFolder = new Codicon('new-folder', { character: '\\ea80' });
        Codicon.fileDirectoryCreate = new Codicon('file-directory-create', { character: '\\ea80' });
        Codicon.trash = new Codicon('trash', { character: '\\ea81' });
        Codicon.trashcan = new Codicon('trashcan', { character: '\\ea81' });
        Codicon.history = new Codicon('history', { character: '\\ea82' });
        Codicon.clock = new Codicon('clock', { character: '\\ea82' });
        Codicon.folder = new Codicon('folder', { character: '\\ea83' });
        Codicon.fileDirectory = new Codicon('file-directory', { character: '\\ea83' });
        Codicon.symbolFolder = new Codicon('symbol-folder', { character: '\\ea83' });
        Codicon.logoGithub = new Codicon('logo-github', { character: '\\ea84' });
        Codicon.markGithub = new Codicon('mark-github', { character: '\\ea84' });
        Codicon.github = new Codicon('github', { character: '\\ea84' });
        Codicon.terminal = new Codicon('terminal', { character: '\\ea85' });
        Codicon.console = new Codicon('console', { character: '\\ea85' });
        Codicon.repl = new Codicon('repl', { character: '\\ea85' });
        Codicon.zap = new Codicon('zap', { character: '\\ea86' });
        Codicon.symbolEvent = new Codicon('symbol-event', { character: '\\ea86' });
        Codicon.error = new Codicon('error', { character: '\\ea87' });
        Codicon.stop = new Codicon('stop', { character: '\\ea87' });
        Codicon.variable = new Codicon('variable', { character: '\\ea88' });
        Codicon.symbolVariable = new Codicon('symbol-variable', { character: '\\ea88' });
        Codicon.array = new Codicon('array', { character: '\\ea8a' });
        Codicon.symbolArray = new Codicon('symbol-array', { character: '\\ea8a' });
        Codicon.symbolModule = new Codicon('symbol-module', { character: '\\ea8b' });
        Codicon.symbolPackage = new Codicon('symbol-package', { character: '\\ea8b' });
        Codicon.symbolNamespace = new Codicon('symbol-namespace', { character: '\\ea8b' });
        Codicon.symbolObject = new Codicon('symbol-object', { character: '\\ea8b' });
        Codicon.symbolMethod = new Codicon('symbol-method', { character: '\\ea8c' });
        Codicon.symbolFunction = new Codicon('symbol-function', { character: '\\ea8c' });
        Codicon.symbolConstructor = new Codicon('symbol-constructor', { character: '\\ea8c' });
        Codicon.symbolBoolean = new Codicon('symbol-boolean', { character: '\\ea8f' });
        Codicon.symbolNull = new Codicon('symbol-null', { character: '\\ea8f' });
        Codicon.symbolNumeric = new Codicon('symbol-numeric', { character: '\\ea90' });
        Codicon.symbolNumber = new Codicon('symbol-number', { character: '\\ea90' });
        Codicon.symbolStructure = new Codicon('symbol-structure', { character: '\\ea91' });
        Codicon.symbolStruct = new Codicon('symbol-struct', { character: '\\ea91' });
        Codicon.symbolParameter = new Codicon('symbol-parameter', { character: '\\ea92' });
        Codicon.symbolTypeParameter = new Codicon('symbol-type-parameter', { character: '\\ea92' });
        Codicon.symbolKey = new Codicon('symbol-key', { character: '\\ea93' });
        Codicon.symbolText = new Codicon('symbol-text', { character: '\\ea93' });
        Codicon.symbolReference = new Codicon('symbol-reference', { character: '\\ea94' });
        Codicon.goToFile = new Codicon('go-to-file', { character: '\\ea94' });
        Codicon.symbolEnum = new Codicon('symbol-enum', { character: '\\ea95' });
        Codicon.symbolValue = new Codicon('symbol-value', { character: '\\ea95' });
        Codicon.symbolRuler = new Codicon('symbol-ruler', { character: '\\ea96' });
        Codicon.symbolUnit = new Codicon('symbol-unit', { character: '\\ea96' });
        Codicon.activateBreakpoints = new Codicon('activate-breakpoints', { character: '\\ea97' });
        Codicon.archive = new Codicon('archive', { character: '\\ea98' });
        Codicon.arrowBoth = new Codicon('arrow-both', { character: '\\ea99' });
        Codicon.arrowDown = new Codicon('arrow-down', { character: '\\ea9a' });
        Codicon.arrowLeft = new Codicon('arrow-left', { character: '\\ea9b' });
        Codicon.arrowRight = new Codicon('arrow-right', { character: '\\ea9c' });
        Codicon.arrowSmallDown = new Codicon('arrow-small-down', { character: '\\ea9d' });
        Codicon.arrowSmallLeft = new Codicon('arrow-small-left', { character: '\\ea9e' });
        Codicon.arrowSmallRight = new Codicon('arrow-small-right', { character: '\\ea9f' });
        Codicon.arrowSmallUp = new Codicon('arrow-small-up', { character: '\\eaa0' });
        Codicon.arrowUp = new Codicon('arrow-up', { character: '\\eaa1' });
        Codicon.bell = new Codicon('bell', { character: '\\eaa2' });
        Codicon.bold = new Codicon('bold', { character: '\\eaa3' });
        Codicon.book = new Codicon('book', { character: '\\eaa4' });
        Codicon.bookmark = new Codicon('bookmark', { character: '\\eaa5' });
        Codicon.debugBreakpointConditionalUnverified = new Codicon('debug-breakpoint-conditional-unverified', { character: '\\eaa6' });
        Codicon.debugBreakpointConditional = new Codicon('debug-breakpoint-conditional', { character: '\\eaa7' });
        Codicon.debugBreakpointConditionalDisabled = new Codicon('debug-breakpoint-conditional-disabled', { character: '\\eaa7' });
        Codicon.debugBreakpointDataUnverified = new Codicon('debug-breakpoint-data-unverified', { character: '\\eaa8' });
        Codicon.debugBreakpointData = new Codicon('debug-breakpoint-data', { character: '\\eaa9' });
        Codicon.debugBreakpointDataDisabled = new Codicon('debug-breakpoint-data-disabled', { character: '\\eaa9' });
        Codicon.debugBreakpointLogUnverified = new Codicon('debug-breakpoint-log-unverified', { character: '\\eaaa' });
        Codicon.debugBreakpointLog = new Codicon('debug-breakpoint-log', { character: '\\eaab' });
        Codicon.debugBreakpointLogDisabled = new Codicon('debug-breakpoint-log-disabled', { character: '\\eaab' });
        Codicon.briefcase = new Codicon('briefcase', { character: '\\eaac' });
        Codicon.broadcast = new Codicon('broadcast', { character: '\\eaad' });
        Codicon.browser = new Codicon('browser', { character: '\\eaae' });
        Codicon.bug = new Codicon('bug', { character: '\\eaaf' });
        Codicon.calendar = new Codicon('calendar', { character: '\\eab0' });
        Codicon.caseSensitive = new Codicon('case-sensitive', { character: '\\eab1' });
        Codicon.check = new Codicon('check', { character: '\\eab2' });
        Codicon.checklist = new Codicon('checklist', { character: '\\eab3' });
        Codicon.chevronDown = new Codicon('chevron-down', { character: '\\eab4' });
        Codicon.chevronLeft = new Codicon('chevron-left', { character: '\\eab5' });
        Codicon.chevronRight = new Codicon('chevron-right', { character: '\\eab6' });
        Codicon.chevronUp = new Codicon('chevron-up', { character: '\\eab7' });
        Codicon.chromeClose = new Codicon('chrome-close', { character: '\\eab8' });
        Codicon.chromeMaximize = new Codicon('chrome-maximize', { character: '\\eab9' });
        Codicon.chromeMinimize = new Codicon('chrome-minimize', { character: '\\eaba' });
        Codicon.chromeRestore = new Codicon('chrome-restore', { character: '\\eabb' });
        Codicon.circleOutline = new Codicon('circle-outline', { character: '\\eabc' });
        Codicon.debugBreakpointUnverified = new Codicon('debug-breakpoint-unverified', { character: '\\eabc' });
        Codicon.circleSlash = new Codicon('circle-slash', { character: '\\eabd' });
        Codicon.circuitBoard = new Codicon('circuit-board', { character: '\\eabe' });
        Codicon.clearAll = new Codicon('clear-all', { character: '\\eabf' });
        Codicon.clippy = new Codicon('clippy', { character: '\\eac0' });
        Codicon.closeAll = new Codicon('close-all', { character: '\\eac1' });
        Codicon.cloudDownload = new Codicon('cloud-download', { character: '\\eac2' });
        Codicon.cloudUpload = new Codicon('cloud-upload', { character: '\\eac3' });
        Codicon.code = new Codicon('code', { character: '\\eac4' });
        Codicon.collapseAll = new Codicon('collapse-all', { character: '\\eac5' });
        Codicon.colorMode = new Codicon('color-mode', { character: '\\eac6' });
        Codicon.commentDiscussion = new Codicon('comment-discussion', { character: '\\eac7' });
        Codicon.compareChanges = new Codicon('compare-changes', { character: '\\eafd' });
        Codicon.creditCard = new Codicon('credit-card', { character: '\\eac9' });
        Codicon.dash = new Codicon('dash', { character: '\\eacc' });
        Codicon.dashboard = new Codicon('dashboard', { character: '\\eacd' });
        Codicon.database = new Codicon('database', { character: '\\eace' });
        Codicon.debugContinue = new Codicon('debug-continue', { character: '\\eacf' });
        Codicon.debugDisconnect = new Codicon('debug-disconnect', { character: '\\ead0' });
        Codicon.debugPause = new Codicon('debug-pause', { character: '\\ead1' });
        Codicon.debugRestart = new Codicon('debug-restart', { character: '\\ead2' });
        Codicon.debugStart = new Codicon('debug-start', { character: '\\ead3' });
        Codicon.debugStepInto = new Codicon('debug-step-into', { character: '\\ead4' });
        Codicon.debugStepOut = new Codicon('debug-step-out', { character: '\\ead5' });
        Codicon.debugStepOver = new Codicon('debug-step-over', { character: '\\ead6' });
        Codicon.debugStop = new Codicon('debug-stop', { character: '\\ead7' });
        Codicon.debug = new Codicon('debug', { character: '\\ead8' });
        Codicon.deviceCameraVideo = new Codicon('device-camera-video', { character: '\\ead9' });
        Codicon.deviceCamera = new Codicon('device-camera', { character: '\\eada' });
        Codicon.deviceMobile = new Codicon('device-mobile', { character: '\\eadb' });
        Codicon.diffAdded = new Codicon('diff-added', { character: '\\eadc' });
        Codicon.diffIgnored = new Codicon('diff-ignored', { character: '\\eadd' });
        Codicon.diffModified = new Codicon('diff-modified', { character: '\\eade' });
        Codicon.diffRemoved = new Codicon('diff-removed', { character: '\\eadf' });
        Codicon.diffRenamed = new Codicon('diff-renamed', { character: '\\eae0' });
        Codicon.diff = new Codicon('diff', { character: '\\eae1' });
        Codicon.discard = new Codicon('discard', { character: '\\eae2' });
        Codicon.editorLayout = new Codicon('editor-layout', { character: '\\eae3' });
        Codicon.emptyWindow = new Codicon('empty-window', { character: '\\eae4' });
        Codicon.exclude = new Codicon('exclude', { character: '\\eae5' });
        Codicon.extensions = new Codicon('extensions', { character: '\\eae6' });
        Codicon.eyeClosed = new Codicon('eye-closed', { character: '\\eae7' });
        Codicon.fileBinary = new Codicon('file-binary', { character: '\\eae8' });
        Codicon.fileCode = new Codicon('file-code', { character: '\\eae9' });
        Codicon.fileMedia = new Codicon('file-media', { character: '\\eaea' });
        Codicon.filePdf = new Codicon('file-pdf', { character: '\\eaeb' });
        Codicon.fileSubmodule = new Codicon('file-submodule', { character: '\\eaec' });
        Codicon.fileSymlinkDirectory = new Codicon('file-symlink-directory', { character: '\\eaed' });
        Codicon.fileSymlinkFile = new Codicon('file-symlink-file', { character: '\\eaee' });
        Codicon.fileZip = new Codicon('file-zip', { character: '\\eaef' });
        Codicon.files = new Codicon('files', { character: '\\eaf0' });
        Codicon.filter = new Codicon('filter', { character: '\\eaf1' });
        Codicon.flame = new Codicon('flame', { character: '\\eaf2' });
        Codicon.foldDown = new Codicon('fold-down', { character: '\\eaf3' });
        Codicon.foldUp = new Codicon('fold-up', { character: '\\eaf4' });
        Codicon.fold = new Codicon('fold', { character: '\\eaf5' });
        Codicon.folderActive = new Codicon('folder-active', { character: '\\eaf6' });
        Codicon.folderOpened = new Codicon('folder-opened', { character: '\\eaf7' });
        Codicon.gear = new Codicon('gear', { character: '\\eaf8' });
        Codicon.gift = new Codicon('gift', { character: '\\eaf9' });
        Codicon.gistSecret = new Codicon('gist-secret', { character: '\\eafa' });
        Codicon.gist = new Codicon('gist', { character: '\\eafb' });
        Codicon.gitCommit = new Codicon('git-commit', { character: '\\eafc' });
        Codicon.gitCompare = new Codicon('git-compare', { character: '\\eafd' });
        Codicon.gitMerge = new Codicon('git-merge', { character: '\\eafe' });
        Codicon.githubAction = new Codicon('github-action', { character: '\\eaff' });
        Codicon.githubAlt = new Codicon('github-alt', { character: '\\eb00' });
        Codicon.globe = new Codicon('globe', { character: '\\eb01' });
        Codicon.grabber = new Codicon('grabber', { character: '\\eb02' });
        Codicon.graph = new Codicon('graph', { character: '\\eb03' });
        Codicon.gripper = new Codicon('gripper', { character: '\\eb04' });
        Codicon.heart = new Codicon('heart', { character: '\\eb05' });
        Codicon.home = new Codicon('home', { character: '\\eb06' });
        Codicon.horizontalRule = new Codicon('horizontal-rule', { character: '\\eb07' });
        Codicon.hubot = new Codicon('hubot', { character: '\\eb08' });
        Codicon.inbox = new Codicon('inbox', { character: '\\eb09' });
        Codicon.issueClosed = new Codicon('issue-closed', { character: '\\eb0a' });
        Codicon.issueReopened = new Codicon('issue-reopened', { character: '\\eb0b' });
        Codicon.issues = new Codicon('issues', { character: '\\eb0c' });
        Codicon.italic = new Codicon('italic', { character: '\\eb0d' });
        Codicon.jersey = new Codicon('jersey', { character: '\\eb0e' });
        Codicon.json = new Codicon('json', { character: '\\eb0f' });
        Codicon.kebabVertical = new Codicon('kebab-vertical', { character: '\\eb10' });
        Codicon.key = new Codicon('key', { character: '\\eb11' });
        Codicon.law = new Codicon('law', { character: '\\eb12' });
        Codicon.lightbulbAutofix = new Codicon('lightbulb-autofix', { character: '\\eb13' });
        Codicon.linkExternal = new Codicon('link-external', { character: '\\eb14' });
        Codicon.link = new Codicon('link', { character: '\\eb15' });
        Codicon.listOrdered = new Codicon('list-ordered', { character: '\\eb16' });
        Codicon.listUnordered = new Codicon('list-unordered', { character: '\\eb17' });
        Codicon.liveShare = new Codicon('live-share', { character: '\\eb18' });
        Codicon.loading = new Codicon('loading', { character: '\\eb19' });
        Codicon.location = new Codicon('location', { character: '\\eb1a' });
        Codicon.mailRead = new Codicon('mail-read', { character: '\\eb1b' });
        Codicon.mail = new Codicon('mail', { character: '\\eb1c' });
        Codicon.markdown = new Codicon('markdown', { character: '\\eb1d' });
        Codicon.megaphone = new Codicon('megaphone', { character: '\\eb1e' });
        Codicon.mention = new Codicon('mention', { character: '\\eb1f' });
        Codicon.milestone = new Codicon('milestone', { character: '\\eb20' });
        Codicon.mortarBoard = new Codicon('mortar-board', { character: '\\eb21' });
        Codicon.move = new Codicon('move', { character: '\\eb22' });
        Codicon.multipleWindows = new Codicon('multiple-windows', { character: '\\eb23' });
        Codicon.mute = new Codicon('mute', { character: '\\eb24' });
        Codicon.noNewline = new Codicon('no-newline', { character: '\\eb25' });
        Codicon.note = new Codicon('note', { character: '\\eb26' });
        Codicon.octoface = new Codicon('octoface', { character: '\\eb27' });
        Codicon.openPreview = new Codicon('open-preview', { character: '\\eb28' });
        Codicon.package_ = new Codicon('package', { character: '\\eb29' });
        Codicon.paintcan = new Codicon('paintcan', { character: '\\eb2a' });
        Codicon.pin = new Codicon('pin', { character: '\\eb2b' });
        Codicon.play = new Codicon('play', { character: '\\eb2c' });
        Codicon.run = new Codicon('run', { character: '\\eb2c' });
        Codicon.plug = new Codicon('plug', { character: '\\eb2d' });
        Codicon.preserveCase = new Codicon('preserve-case', { character: '\\eb2e' });
        Codicon.preview = new Codicon('preview', { character: '\\eb2f' });
        Codicon.project = new Codicon('project', { character: '\\eb30' });
        Codicon.pulse = new Codicon('pulse', { character: '\\eb31' });
        Codicon.question = new Codicon('question', { character: '\\eb32' });
        Codicon.quote = new Codicon('quote', { character: '\\eb33' });
        Codicon.radioTower = new Codicon('radio-tower', { character: '\\eb34' });
        Codicon.reactions = new Codicon('reactions', { character: '\\eb35' });
        Codicon.references = new Codicon('references', { character: '\\eb36' });
        Codicon.refresh = new Codicon('refresh', { character: '\\eb37' });
        Codicon.regex = new Codicon('regex', { character: '\\eb38' });
        Codicon.remoteExplorer = new Codicon('remote-explorer', { character: '\\eb39' });
        Codicon.remote = new Codicon('remote', { character: '\\eb3a' });
        Codicon.remove = new Codicon('remove', { character: '\\eb3b' });
        Codicon.replaceAll = new Codicon('replace-all', { character: '\\eb3c' });
        Codicon.replace = new Codicon('replace', { character: '\\eb3d' });
        Codicon.repoClone = new Codicon('repo-clone', { character: '\\eb3e' });
        Codicon.repoForcePush = new Codicon('repo-force-push', { character: '\\eb3f' });
        Codicon.repoPull = new Codicon('repo-pull', { character: '\\eb40' });
        Codicon.repoPush = new Codicon('repo-push', { character: '\\eb41' });
        Codicon.report = new Codicon('report', { character: '\\eb42' });
        Codicon.requestChanges = new Codicon('request-changes', { character: '\\eb43' });
        Codicon.rocket = new Codicon('rocket', { character: '\\eb44' });
        Codicon.rootFolderOpened = new Codicon('root-folder-opened', { character: '\\eb45' });
        Codicon.rootFolder = new Codicon('root-folder', { character: '\\eb46' });
        Codicon.rss = new Codicon('rss', { character: '\\eb47' });
        Codicon.ruby = new Codicon('ruby', { character: '\\eb48' });
        Codicon.saveAll = new Codicon('save-all', { character: '\\eb49' });
        Codicon.saveAs = new Codicon('save-as', { character: '\\eb4a' });
        Codicon.save = new Codicon('save', { character: '\\eb4b' });
        Codicon.screenFull = new Codicon('screen-full', { character: '\\eb4c' });
        Codicon.screenNormal = new Codicon('screen-normal', { character: '\\eb4d' });
        Codicon.searchStop = new Codicon('search-stop', { character: '\\eb4e' });
        Codicon.server = new Codicon('server', { character: '\\eb50' });
        Codicon.settingsGear = new Codicon('settings-gear', { character: '\\eb51' });
        Codicon.settings = new Codicon('settings', { character: '\\eb52' });
        Codicon.shield = new Codicon('shield', { character: '\\eb53' });
        Codicon.smiley = new Codicon('smiley', { character: '\\eb54' });
        Codicon.sortPrecedence = new Codicon('sort-precedence', { character: '\\eb55' });
        Codicon.splitHorizontal = new Codicon('split-horizontal', { character: '\\eb56' });
        Codicon.splitVertical = new Codicon('split-vertical', { character: '\\eb57' });
        Codicon.squirrel = new Codicon('squirrel', { character: '\\eb58' });
        Codicon.starFull = new Codicon('star-full', { character: '\\eb59' });
        Codicon.starHalf = new Codicon('star-half', { character: '\\eb5a' });
        Codicon.symbolClass = new Codicon('symbol-class', { character: '\\eb5b' });
        Codicon.symbolColor = new Codicon('symbol-color', { character: '\\eb5c' });
        Codicon.symbolConstant = new Codicon('symbol-constant', { character: '\\eb5d' });
        Codicon.symbolEnumMember = new Codicon('symbol-enum-member', { character: '\\eb5e' });
        Codicon.symbolField = new Codicon('symbol-field', { character: '\\eb5f' });
        Codicon.symbolFile = new Codicon('symbol-file', { character: '\\eb60' });
        Codicon.symbolInterface = new Codicon('symbol-interface', { character: '\\eb61' });
        Codicon.symbolKeyword = new Codicon('symbol-keyword', { character: '\\eb62' });
        Codicon.symbolMisc = new Codicon('symbol-misc', { character: '\\eb63' });
        Codicon.symbolOperator = new Codicon('symbol-operator', { character: '\\eb64' });
        Codicon.symbolProperty = new Codicon('symbol-property', { character: '\\eb65' });
        Codicon.wrench = new Codicon('wrench', { character: '\\eb65' });
        Codicon.wrenchSubaction = new Codicon('wrench-subaction', { character: '\\eb65' });
        Codicon.symbolSnippet = new Codicon('symbol-snippet', { character: '\\eb66' });
        Codicon.tasklist = new Codicon('tasklist', { character: '\\eb67' });
        Codicon.telescope = new Codicon('telescope', { character: '\\eb68' });
        Codicon.textSize = new Codicon('text-size', { character: '\\eb69' });
        Codicon.threeBars = new Codicon('three-bars', { character: '\\eb6a' });
        Codicon.thumbsdown = new Codicon('thumbsdown', { character: '\\eb6b' });
        Codicon.thumbsup = new Codicon('thumbsup', { character: '\\eb6c' });
        Codicon.tools = new Codicon('tools', { character: '\\eb6d' });
        Codicon.triangleDown = new Codicon('triangle-down', { character: '\\eb6e' });
        Codicon.triangleLeft = new Codicon('triangle-left', { character: '\\eb6f' });
        Codicon.triangleRight = new Codicon('triangle-right', { character: '\\eb70' });
        Codicon.triangleUp = new Codicon('triangle-up', { character: '\\eb71' });
        Codicon.twitter = new Codicon('twitter', { character: '\\eb72' });
        Codicon.unfold = new Codicon('unfold', { character: '\\eb73' });
        Codicon.unlock = new Codicon('unlock', { character: '\\eb74' });
        Codicon.unmute = new Codicon('unmute', { character: '\\eb75' });
        Codicon.unverified = new Codicon('unverified', { character: '\\eb76' });
        Codicon.verified = new Codicon('verified', { character: '\\eb77' });
        Codicon.versions = new Codicon('versions', { character: '\\eb78' });
        Codicon.vmActive = new Codicon('vm-active', { character: '\\eb79' });
        Codicon.vmOutline = new Codicon('vm-outline', { character: '\\eb7a' });
        Codicon.vmRunning = new Codicon('vm-running', { character: '\\eb7b' });
        Codicon.watch = new Codicon('watch', { character: '\\eb7c' });
        Codicon.whitespace = new Codicon('whitespace', { character: '\\eb7d' });
        Codicon.wholeWord = new Codicon('whole-word', { character: '\\eb7e' });
        Codicon.window = new Codicon('window', { character: '\\eb7f' });
        Codicon.wordWrap = new Codicon('word-wrap', { character: '\\eb80' });
        Codicon.zoomIn = new Codicon('zoom-in', { character: '\\eb81' });
        Codicon.zoomOut = new Codicon('zoom-out', { character: '\\eb82' });
        Codicon.listFilter = new Codicon('list-filter', { character: '\\eb83' });
        Codicon.listFlat = new Codicon('list-flat', { character: '\\eb84' });
        Codicon.listSelection = new Codicon('list-selection', { character: '\\eb85' });
        Codicon.selection = new Codicon('selection', { character: '\\eb85' });
        Codicon.listTree = new Codicon('list-tree', { character: '\\eb86' });
        Codicon.debugBreakpointFunctionUnverified = new Codicon('debug-breakpoint-function-unverified', { character: '\\eb87' });
        Codicon.debugBreakpointFunction = new Codicon('debug-breakpoint-function', { character: '\\eb88' });
        Codicon.debugBreakpointFunctionDisabled = new Codicon('debug-breakpoint-function-disabled', { character: '\\eb88' });
        Codicon.debugStackframeActive = new Codicon('debug-stackframe-active', { character: '\\eb89' });
        Codicon.debugStackframeDot = new Codicon('debug-stackframe-dot', { character: '\\eb8a' });
        Codicon.debugStackframe = new Codicon('debug-stackframe', { character: '\\eb8b' });
        Codicon.debugStackframeFocused = new Codicon('debug-stackframe-focused', { character: '\\eb8b' });
        Codicon.debugBreakpointUnsupported = new Codicon('debug-breakpoint-unsupported', { character: '\\eb8c' });
        Codicon.symbolString = new Codicon('symbol-string', { character: '\\eb8d' });
        Codicon.debugReverseContinue = new Codicon('debug-reverse-continue', { character: '\\eb8e' });
        Codicon.debugStepBack = new Codicon('debug-step-back', { character: '\\eb8f' });
        Codicon.debugRestartFrame = new Codicon('debug-restart-frame', { character: '\\eb90' });
        Codicon.callIncoming = new Codicon('call-incoming', { character: '\\eb92' });
        Codicon.callOutgoing = new Codicon('call-outgoing', { character: '\\eb93' });
        Codicon.menu = new Codicon('menu', { character: '\\eb94' });
        Codicon.expandAll = new Codicon('expand-all', { character: '\\eb95' });
        Codicon.feedback = new Codicon('feedback', { character: '\\eb96' });
        Codicon.groupByRefType = new Codicon('group-by-ref-type', { character: '\\eb97' });
        Codicon.ungroupByRefType = new Codicon('ungroup-by-ref-type', { character: '\\eb98' });
        Codicon.account = new Codicon('account', { character: '\\eb99' });
        Codicon.bellDot = new Codicon('bell-dot', { character: '\\eb9a' });
        Codicon.debugConsole = new Codicon('debug-console', { character: '\\eb9b' });
        Codicon.library = new Codicon('library', { character: '\\eb9c' });
        Codicon.output = new Codicon('output', { character: '\\eb9d' });
        Codicon.runAll = new Codicon('run-all', { character: '\\eb9e' });
        Codicon.syncIgnored = new Codicon('sync-ignored', { character: '\\eb9f' });
        Codicon.pinned = new Codicon('pinned', { character: '\\eba0' });
        Codicon.githubInverted = new Codicon('github-inverted', { character: '\\eba1' });
        Codicon.debugAlt = new Codicon('debug-alt', { character: '\\eb91' });
        Codicon.serverProcess = new Codicon('server-process', { character: '\\eba2' });
        Codicon.serverEnvironment = new Codicon('server-environment', { character: '\\eba3' });
        Codicon.pass = new Codicon('pass', { character: '\\eba4' });
        Codicon.stopCircle = new Codicon('stop-circle', { character: '\\eba5' });
        Codicon.playCircle = new Codicon('play-circle', { character: '\\eba6' });
        Codicon.record = new Codicon('record', { character: '\\eba7' });
    })(Codicon = exports.Codicon || (exports.Codicon = {}));
    const escapeCodiconsRegex = /(\\)?\$\([a-z0-9\-]+?(?:~[a-z0-9\-]*?)?\)/gi;
    function escapeCodicons(text) {
        return text.replace(escapeCodiconsRegex, (match, escaped) => escaped ? match : `\\${match}`);
    }
    exports.escapeCodicons = escapeCodicons;
    const markdownEscapedCodiconsRegex = /\\\$\([a-z0-9\-]+?(?:~[a-z0-9\-]*?)?\)/gi;
    function markdownEscapeEscapedCodicons(text) {
        // Need to add an extra \ for escaping in markdown
        return text.replace(markdownEscapedCodiconsRegex, match => `\\${match}`);
    }
    exports.markdownEscapeEscapedCodicons = markdownEscapeEscapedCodicons;
    const markdownUnescapeCodiconsRegex = /(\\)?\$\\\(([a-z0-9\-]+?(?:~[a-z0-9\-]*?)?)\\\)/gi;
    function markdownUnescapeCodicons(text) {
        return text.replace(markdownUnescapeCodiconsRegex, (match, escaped, codicon) => escaped ? match : `$(${codicon})`);
    }
    exports.markdownUnescapeCodicons = markdownUnescapeCodicons;
    const renderCodiconsRegex = /(\\)?\$\((([a-z0-9\-]+?)(?:~([a-z0-9\-]*?))?)\)/gi;
    function renderCodicons(text) {
        return text.replace(renderCodiconsRegex, (_, escaped, codicon, name, animation) => {
            // If the class for codicons is changed, it should also be updated in src\vs\base\browser\markdownRenderer.ts
            return escaped
                ? `$(${codicon})`
                : `<span class="codicon codicon-${name}${animation ? ` codicon-animation-${animation}` : ''}"></span>`;
        });
    }
    exports.renderCodicons = renderCodicons;
    const stripCodiconsRegex = /(\s)?(\\)?\$\([a-z0-9\-]+?(?:~[a-z0-9\-]*?)?\)(\s)?/gi;
    function stripCodicons(text) {
        if (text.indexOf(codicon_1.codiconStartMarker) === -1) {
            return text;
        }
        return text.replace(stripCodiconsRegex, (match, preWhitespace, escaped, postWhitespace) => escaped ? match : preWhitespace || postWhitespace || '');
    }
    exports.stripCodicons = stripCodicons;
});
//# __sourceMappingURL=codicons.js.map