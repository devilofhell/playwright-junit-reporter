"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monotonicTime = monotonicTime;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const base_1 = require("./base");
const utils_1 = require("playwright-core/lib/utils");
const contentType_mapper_1 = __importDefault(require("./contentType.mapper"));
function monotonicTime() {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1000 + (nanoseconds / 1000 | 0) / 1000;
}
class XrayJUnitReporter {
    config;
    suite;
    timestamp;
    startTime;
    totalTests = 0;
    totalFailures = 0;
    totalSkipped = 0;
    outputFile;
    stripANSIControlSequences = false;
    embedAnnotationsAsProperties = false;
    textContentAnnotations;
    embedAttachmentsAsProperty;
    removeTestCasesWithoutTestKey = false;
    requiredTestKeyRegex = RegExp('');
    constructor(options = {}) {
        this.outputFile = options.outputFile || reportOutputNameFromEnv();
        this.stripANSIControlSequences = options.stripANSIControlSequences || false;
        this.embedAnnotationsAsProperties = options.embedAnnotationsAsProperties || false;
        this.removeTestCasesWithoutTestKey = options.removeTestCasesWithoutTestKey || false;
        this.textContentAnnotations = options.textContentAnnotations || [];
        this.embedAttachmentsAsProperty = options.embedAttachmentsAsProperty;
        if (!options.requiredTestKeyRegex)
            this.requiredTestKeyRegex = RegExp('');
        else if (typeof options.requiredTestKeyRegex === 'string')
            this.requiredTestKeyRegex = RegExp(options.requiredTestKeyRegex);
        else
            this.requiredTestKeyRegex = options.requiredTestKeyRegex;
    }
    printsToStdio() {
        return !this.outputFile;
    }
    onBegin(config, suite) {
        this.config = config;
        this.suite = suite;
        this.timestamp = new Date();
        this.startTime = monotonicTime();
    }
    async onEnd(result) {
        const duration = monotonicTime() - this.startTime;
        const children = [];
        for (const projectSuite of this.suite.suites) {
            for (const fileSuite of projectSuite.suites)
                children.push(this._buildTestSuite(projectSuite.title, fileSuite));
        }
        const tokens = [];
        const self = this;
        const root = {
            name: 'testsuites',
            attributes: {
                id: process.env[`PLAYWRIGHT_JUNIT_SUITE_ID`] || '',
                name: process.env[`PLAYWRIGHT_JUNIT_SUITE_NAME`] || '',
                tests: self.totalTests,
                failures: self.totalFailures,
                skipped: self.totalSkipped,
                errors: 0,
                time: duration / 1000
            },
            children
        };
        serializeXML(root, tokens, this.stripANSIControlSequences);
        const reportString = tokens.join('\n');
        if (this.outputFile) {
            (0, utils_1.assert)(this.config.configFile || path_1.default.isAbsolute(this.outputFile), 'Expected fully resolved path if not using config file.');
            const outputFile = this.config.configFile ? path_1.default.resolve(path_1.default.dirname(this.config.configFile), this.outputFile) : this.outputFile;
            fs_1.default.mkdirSync(path_1.default.dirname(outputFile), { recursive: true });
            fs_1.default.writeFileSync(outputFile, reportString);
        }
        else {
            console.log(reportString);
        }
    }
    _buildTestSuite(projectName, suite) {
        let tests = 0;
        let skipped = 0;
        let failures = 0;
        let duration = 0;
        let children = [];
        suite.allTests().forEach(test => {
            ++tests;
            if (test.outcome() === 'skipped')
                ++skipped;
            if (!test.ok())
                ++failures;
            for (const result of test.results)
                duration += result.duration;
            this._addTestCase(suite.title, test, children);
        });
        this.totalTests += tests;
        this.totalSkipped += skipped;
        this.totalFailures += failures;
        if (this.removeTestCasesWithoutTestKey)
            children = removeTestCases(children, this.requiredTestKeyRegex);
        const entry = {
            name: 'testsuite',
            attributes: {
                name: suite.title,
                timestamp: this.timestamp.toISOString(),
                hostname: projectName,
                tests,
                failures,
                skipped,
                time: duration / 1000,
                errors: 0,
            },
            children
        };
        return entry;
    }
    _addTestCase(suiteName, test, entries) {
        const entry = {
            name: 'testcase',
            attributes: {
                // Skip root, project, file
                name: test.titlePath().slice(3).join(' › '),
                // filename
                classname: suiteName,
                time: (test.results.reduce((acc, value) => acc + value.duration, 0)) / 1000
            },
            children: []
        };
        entries.push(entry);
        // Xray Test Management supports testcase level properties, where additional metadata may be provided
        // some annotations are encoded as value attributes, other as cdata content; this implementation supports
        // Xray JUnit extensions but it also agnostic, so other tools can also take advantage of this format
        const properties = {
            name: 'properties',
            children: []
        };
        if (this.embedAnnotationsAsProperties && test.annotations) {
            for (const annotation of test.annotations) {
                if (this.textContentAnnotations?.includes(annotation.type)) {
                    const property = {
                        name: 'property',
                        attributes: {
                            name: annotation.type
                        },
                        text: annotation.description
                    };
                    properties.children?.push(property);
                }
                else {
                    const property = {
                        name: 'property',
                        attributes: {
                            name: annotation.type,
                            value: (annotation?.description ? annotation.description : '')
                        }
                    };
                    properties.children?.push(property);
                }
            }
        }
        const systemErr = [];
        // attachments are optionally embed as base64 encoded content on inner <item> elements
        if (this.embedAttachmentsAsProperty) {
            const evidence = {
                name: 'property',
                attributes: {
                    name: this.embedAttachmentsAsProperty
                },
                children: []
            };
            for (const result of test.results) {
                for (const attachment of result.attachments) {
                    let contents;
                    if (attachment.body) {
                        contents = attachment.body.toString('base64');
                    }
                    else {
                        if (!attachment.path)
                            continue;
                        try {
                            if (fs_1.default.existsSync(attachment.path))
                                contents = fs_1.default.readFileSync(attachment.path, { encoding: 'base64' });
                            else
                                systemErr.push(`\nWarning: attachment ${attachment.path} is missing`);
                        }
                        catch (e) {
                        }
                    }
                    if (contents) {
                        const attachmentName = attachment.name + ((attachment.path && !path_1.default.extname(attachment.name)) ? contentType_mapper_1.default.getFileExtenion(attachment.contentType) : '');
                        const item = {
                            name: 'item',
                            attributes: {
                                name: attachmentName
                            },
                            text: contents
                        };
                        evidence.children?.push(item);
                    }
                }
            }
            properties.children?.push(evidence);
        }
        if (properties.children?.length)
            entry.children.push(properties);
        if (test.outcome() === 'skipped') {
            entry.children.push({ name: 'skipped' });
            return;
        }
        if (!test.ok()) {
            entry.children.push({
                name: 'failure',
                attributes: {
                    message: `${path_1.default.basename(test.location.file)}:${test.location.line}:${test.location.column} ${test.title}`,
                    type: 'FAILURE',
                },
                text: (0, base_1.stripAnsiEscapes)((0, base_1.formatFailure)(this.config, test).message)
            });
        }
        const systemOut = [];
        for (const result of test.results) {
            systemOut.push(...result.stdout.map(item => item.toString()));
            systemErr.push(...result.stderr.map(item => item.toString()));
            if (!this.embedAttachmentsAsProperty) {
                for (const attachment of result.attachments) {
                    if (!attachment.path)
                        continue;
                    try {
                        const attachmentPath = path_1.default.relative(this.config.rootDir, attachment.path);
                        if (fs_1.default.existsSync(attachment.path))
                            systemOut.push(`\n[[ATTACHMENT|${attachmentPath}]]\n`);
                        else
                            systemErr.push(`\nWarning: attachment ${attachmentPath} is missing`);
                    }
                    catch (e) {
                    }
                }
            }
        }
        // Note: it is important to only produce a single system-out/system-err entry
        // so that parsers in the wild understand it.
        if (systemOut.length)
            entry.children.push({ name: 'system-out', text: systemOut.join('') });
        if (systemErr.length)
            entry.children.push({ name: 'system-err', text: systemErr.join('') });
    }
}
function serializeXML(entry, tokens, stripANSIControlSequences) {
    const attrs = [];
    for (const [name, value] of Object.entries(entry.attributes || {}))
        attrs.push(`${name}="${escape(String(value), stripANSIControlSequences, false)}"`);
    tokens.push(`<${entry.name}${attrs.length ? ' ' : ''}${attrs.join(' ')}>`);
    for (const child of entry.children || [])
        serializeXML(child, tokens, stripANSIControlSequences);
    if (entry.text)
        tokens.push(escape(entry.text, stripANSIControlSequences, true));
    tokens.push(`</${entry.name}>`);
}
function removeTestCases(entries, requiredPrefix) {
    let result = [];
    result = entries.filter(entry => {
        if (entry.name === 'testcase') {
            for (const child of entry.children) {
                // only looking for "property" children inside "properties"
                if (child.name !== 'properties')
                    continue;
                if (child.children) {
                    for (const property of child.children) {
                        if (property.attributes) {
                            if (property.attributes?.name === 'test_key' && requiredPrefix.test(property.attributes?.value.toString()))
                                return true;
                        }
                    }
                }
            }
        }
        return false;
    });
    return result;
}
// See https://en.wikipedia.org/wiki/Valid_characters_in_XML
const discouragedXMLCharacters = /[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f-\u0084\u0086-\u009f]/g;
function escape(text, stripANSIControlSequences, isCharacterData) {
    if (stripANSIControlSequences)
        text = (0, base_1.stripAnsiEscapes)(text);
    if (isCharacterData) {
        text = '<![CDATA[' + text.replace(/]]>/g, ']]&gt;') + ']]>';
    }
    else {
        const escapeRe = /[&"'<>]/g;
        text = text.replace(escapeRe, c => ({ '&': '&amp;', '"': '&quot;', "'": '&apos;', '<': '&lt;', '>': '&gt;' }[c]));
    }
    text = text.replace(discouragedXMLCharacters, '');
    return text;
}
function reportOutputNameFromEnv() {
    if (process.env[`PLAYWRIGHT_JUNIT_OUTPUT_NAME`])
        return path_1.default.resolve(process.cwd(), process.env[`PLAYWRIGHT_JUNIT_OUTPUT_NAME`]);
    return undefined;
}
exports.default = XrayJUnitReporter;
