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
import type { FullConfig, TestCase, Suite, TestResult, FullResult, TestStep, Location, Reporter } from '@playwright/test/reporter';
import type { FullProject } from '@playwright/test';
export type TestResultOutput = {
    chunk: string | Buffer;
    type: 'stdout' | 'stderr';
};
export declare const kOutputSymbol: unique symbol;
export interface SuitePrivate extends Suite {
    _fileId: string | undefined;
    _parallelMode: 'default' | 'serial' | 'parallel';
}
export interface TestError {
    /**
     * Error location in the source code.
     */
    location?: Location;
    /**
     * Error message. Set when [Error] (or its subclass) has been thrown.
     */
    message?: string;
    /**
     * Source code snippet with highlighted error.
     */
    snippet?: string;
    /**
     * Error stack. Set when [Error] (or its subclass) has been thrown.
     */
    stack?: string;
    /**
     * The value that was thrown. Set when anything except the [Error] (or its subclass) has been thrown.
     */
    value?: string;
}
type Annotation = {
    title: string;
    message: string;
    location?: Location;
};
type ErrorDetails = {
    message: string;
    location?: Location;
};
type TestSummary = {
    skipped: number;
    expected: number;
    interrupted: TestCase[];
    unexpected: TestCase[];
    flaky: TestCase[];
    failuresToPrint: TestCase[];
    fatalErrors: TestError[];
};
export declare class BaseReporter implements Reporter {
    duration: number;
    config: FullConfig;
    suite: Suite;
    totalTestCount: number;
    result: FullResult;
    private fileDurations;
    private monotonicStartTime;
    private _omitFailures;
    private readonly _ttyWidthForTest;
    private _fatalErrors;
    constructor(options?: {
        omitFailures?: boolean;
    });
    onBegin(config: FullConfig, suite: Suite): void;
    onStdOut(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
    onStdErr(chunk: string | Buffer, test?: TestCase, result?: TestResult): void;
    private _appendOutput;
    onTestEnd(test: TestCase, result: TestResult): void;
    onError(error: TestError): void;
    onEnd(result: FullResult): Promise<void>;
    protected ttyWidth(): number;
    protected fitToScreen(line: string, prefix?: string): string;
    protected generateStartingMessage(): string;
    protected getSlowTests(): [string, number][];
    protected generateSummaryMessage({ skipped, expected, interrupted, unexpected, flaky, fatalErrors }: TestSummary): string;
    protected generateSummary(): TestSummary;
    epilogue(full: boolean): void;
    private _printFailures;
    private _printSlowTests;
    private _printSummary;
    willRetry(test: TestCase): boolean;
}
export declare function formatFailure(config: FullConfig, test: TestCase, options?: {
    index?: number;
    includeStdio?: boolean;
    includeAttachments?: boolean;
}): {
    message: string;
    annotations: Annotation[];
};
export declare function formatResultFailure(config: FullConfig, test: TestCase, result: TestResult, initialIndent: string, highlightCode: boolean): ErrorDetails[];
export declare function relativeFilePath(config: FullConfig, file: string): string;
export declare function stepSuffix(step: TestStep | undefined): string;
export declare function formatTestTitle(config: FullConfig, test: TestCase, step?: TestStep, omitLocation?: boolean): string;
export declare function formatError(config: FullConfig, error: TestError, highlightCode: boolean): ErrorDetails;
export declare function addSnippetToError(config: FullConfig, error: TestError, file?: string): void;
export declare function separator(text?: string): string;
export declare function prepareErrorStack(stack: string): {
    message: string;
    stackLines: string[];
    location?: Location;
};
export declare function stripAnsiEscapes(str: string): string;
export declare function uniqueProjectIds(projects: FullProject[]): Map<FullProject, string>;
export {};
