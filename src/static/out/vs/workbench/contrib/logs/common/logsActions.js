/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls, actions_1, log_1, quickInput_1, uri_1, files_1, environmentService_1, resources_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWindowSessionLogFileAction = exports.SetLogLevelAction = void 0;
    let SetLogLevelAction = class SetLogLevelAction extends actions_1.Action {
        constructor(id, label, quickInputService, logService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.logService = logService;
        }
        run() {
            const current = this.logService.getLevel();
            const entries = [
                { label: nls.localize('trace', "Trace"), level: log_1.LogLevel.Trace, description: this.getDescription(log_1.LogLevel.Trace, current) },
                { label: nls.localize('debug', "Debug"), level: log_1.LogLevel.Debug, description: this.getDescription(log_1.LogLevel.Debug, current) },
                { label: nls.localize('info', "Info"), level: log_1.LogLevel.Info, description: this.getDescription(log_1.LogLevel.Info, current) },
                { label: nls.localize('warn', "Warning"), level: log_1.LogLevel.Warning, description: this.getDescription(log_1.LogLevel.Warning, current) },
                { label: nls.localize('err', "Error"), level: log_1.LogLevel.Error, description: this.getDescription(log_1.LogLevel.Error, current) },
                { label: nls.localize('critical', "Critical"), level: log_1.LogLevel.Critical, description: this.getDescription(log_1.LogLevel.Critical, current) },
                { label: nls.localize('off', "Off"), level: log_1.LogLevel.Off, description: this.getDescription(log_1.LogLevel.Off, current) },
            ];
            return this.quickInputService.pick(entries, { placeHolder: nls.localize('selectLogLevel', "Select log level"), activeItem: entries[this.logService.getLevel()] }).then(entry => {
                if (entry) {
                    this.logService.setLevel(entry.level);
                }
            });
        }
        getDescription(level, current) {
            if (log_1.DEFAULT_LOG_LEVEL === level && current === level) {
                return nls.localize('default and current', "Default & Current");
            }
            if (log_1.DEFAULT_LOG_LEVEL === level) {
                return nls.localize('default', "Default");
            }
            if (current === level) {
                return nls.localize('current', "Current");
            }
            return undefined;
        }
    };
    SetLogLevelAction.ID = 'workbench.action.setLogLevel';
    SetLogLevelAction.LABEL = nls.localize('setLogLevel', "Set Log Level...");
    SetLogLevelAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, log_1.ILogService)
    ], SetLogLevelAction);
    exports.SetLogLevelAction = SetLogLevelAction;
    let OpenWindowSessionLogFileAction = class OpenWindowSessionLogFileAction extends actions_1.Action {
        constructor(id, label, environmentService, fileService, quickInputService, editorService) {
            super(id, label);
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.editorService = editorService;
        }
        async run() {
            const sessionResult = await this.quickInputService.pick(this.getSessions().then(sessions => sessions.map((s, index) => ({
                id: s.toString(),
                label: resources_1.basename(s),
                description: index === 0 ? nls.localize('current', "Current") : undefined
            }))), {
                canPickMany: false,
                placeHolder: nls.localize('sessions placeholder', "Select Session")
            });
            if (sessionResult) {
                const logFileResult = await this.quickInputService.pick(this.getLogFiles(uri_1.URI.parse(sessionResult.id)).then(logFiles => logFiles.map(s => ({
                    id: s.toString(),
                    label: resources_1.basename(s)
                }))), {
                    canPickMany: false,
                    placeHolder: nls.localize('log placeholder', "Select Log file")
                });
                if (logFileResult) {
                    return this.editorService.openEditor({ resource: uri_1.URI.parse(logFileResult.id) }).then(() => undefined);
                }
            }
        }
        async getSessions() {
            const logsPath = uri_1.URI.file(this.environmentService.logsPath).with({ scheme: this.environmentService.logFile.scheme });
            const result = [logsPath];
            const stat = await this.fileService.resolve(resources_1.dirname(logsPath));
            if (stat.children) {
                result.push(...stat.children
                    .filter(stat => !resources_1.isEqual(stat.resource, logsPath) && stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name))
                    .sort()
                    .reverse()
                    .map(d => d.resource));
            }
            return result;
        }
        async getLogFiles(session) {
            const stat = await this.fileService.resolve(session);
            if (stat.children) {
                return stat.children.filter(stat => !stat.isDirectory).map(stat => stat.resource);
            }
            return [];
        }
    };
    OpenWindowSessionLogFileAction.ID = 'workbench.action.openSessionLogFile';
    OpenWindowSessionLogFileAction.LABEL = nls.localize('openSessionLogFile', "Open Window Log File (Session)...");
    OpenWindowSessionLogFileAction = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, editorService_1.IEditorService)
    ], OpenWindowSessionLogFileAction);
    exports.OpenWindowSessionLogFileAction = OpenWindowSessionLogFileAction;
});
//# __sourceMappingURL=logsActions.js.map