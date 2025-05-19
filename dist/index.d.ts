/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { FullConfig, FullResult, Reporter, Suite } from '@playwright/test/reporter';
export declare function monotonicTime(): number;
declare class XrayJUnitReporter implements Reporter {
    private config;
    private suite;
    private timestamp;
    private startTime;
    private totalTests;
    private totalFailures;
    private totalSkipped;
    private outputFile;
    private stripANSIControlSequences;
    private embedAnnotationsAsProperties;
    private textContentAnnotations;
    private embedAttachmentsAsProperty;
    private removeTestCasesWithoutTestKey;
    private requiredTestKeyRegex;
    constructor(options?: {
        outputFile?: string;
        stripANSIControlSequences?: boolean;
        embedAnnotationsAsProperties?: boolean;
        removeTestCasesWithoutTestKey?: boolean;
        textContentAnnotations?: string[];
        embedAttachmentsAsProperty?: string;
        requiredTestKeyRegex?: RegExp | string;
    });
    printsToStdio(): boolean;
    onBegin(config: FullConfig, suite: Suite): void;
    onEnd(result: FullResult): Promise<void>;
    private _buildTestSuite;
    private _addTestCase;
}
export default XrayJUnitReporter;
