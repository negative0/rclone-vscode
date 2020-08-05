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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/common/contributions", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/output/common/output", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/logs/common/logsDataCleaner"], function (require, exports, nls, path_1, platform_1, actions_1, actions_2, logsActions_1, Constants, contributions_1, environmentService_1, files_1, uri_1, output_1, lifecycle_1, log_1, resources_1, platform_2, instantiation_1, logsDataCleaner_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    const devCategory = nls.localize('developer', "Developer");
    workbenchActionsRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(logsActions_1.SetLogLevelAction), 'Developer: Set Log Level...', devCategory);
    let LogOutputChannels = class LogOutputChannels extends lifecycle_1.Disposable {
        constructor(environmentService, logService, fileService, instantiationService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.registerCommonContributions();
            if (platform_2.isWeb) {
                this.registerWebContributions();
            }
            else {
                this.registerNativeContributions();
            }
        }
        registerCommonContributions() {
            this.registerLogChannel(Constants.userDataSyncLogChannelId, nls.localize('userDataSyncLog', "Preferences Sync"), this.environmentService.userDataSyncLogResource);
            this.registerLogChannel(Constants.rendererLogChannelId, nls.localize('rendererLog', "Window"), this.environmentService.logFile);
        }
        registerWebContributions() {
            this.instantiationService.createInstance(logsDataCleaner_1.LogsDataCleaner);
            const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
            const devCategory = nls.localize('developer', "Developer");
            workbenchActionsRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(logsActions_1.OpenWindowSessionLogFileAction), 'Developer: Open Window Log File (Session)...', devCategory);
        }
        registerNativeContributions() {
            this.registerLogChannel(Constants.mainLogChannelId, nls.localize('mainLog', "Main"), uri_1.URI.file(path_1.join(this.environmentService.logsPath, `main.log`)));
            this.registerLogChannel(Constants.sharedLogChannelId, nls.localize('sharedLog', "Shared"), uri_1.URI.file(path_1.join(this.environmentService.logsPath, `sharedprocess.log`)));
            const registerTelemetryChannel = (level) => {
                if (level === log_1.LogLevel.Trace && !platform_1.Registry.as(output_1.Extensions.OutputChannels).getChannel(Constants.telemetryLogChannelId)) {
                    this.registerLogChannel(Constants.telemetryLogChannelId, nls.localize('telemetryLog', "Telemetry"), uri_1.URI.file(path_1.join(this.environmentService.logsPath, `telemetry.log`)));
                }
            };
            registerTelemetryChannel(this.logService.getLevel());
            this.logService.onDidChangeLogLevel(registerTelemetryChannel);
        }
        async registerLogChannel(id, label, file) {
            await files_1.whenProviderRegistered(file, this.fileService);
            const outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
            const exists = await this.fileService.exists(file);
            if (exists) {
                outputChannelRegistry.registerChannel({ id, label, file, log: true });
                return;
            }
            const watcher = this.fileService.watch(resources_1.dirname(file));
            const disposable = this.fileService.onDidFilesChange(e => {
                if (e.contains(file, 1 /* ADDED */) || e.contains(file, 0 /* UPDATED */)) {
                    watcher.dispose();
                    disposable.dispose();
                    outputChannelRegistry.registerChannel({ id, label, file, log: true });
                }
            });
        }
    };
    LogOutputChannels = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, files_1.IFileService),
        __param(3, instantiation_1.IInstantiationService)
    ], LogOutputChannels);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogOutputChannels, 3 /* Restored */);
});
//# __sourceMappingURL=logs.contribution.js.map