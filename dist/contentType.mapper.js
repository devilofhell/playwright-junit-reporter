"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContentTypeMapper {
    getFileExtenion(contentType) {
        switch (contentType) {
            case 'image/png':
                return '.png';
            case 'text/plain':
                return '.txt';
            case 'text/html':
                return '.html';
            case 'video/webm':
                return '.webm';
            case 'application/zip':
                return '.zip';
            default:
                console.warn(`could not map filetype of: ${contentType} to a correct ending`);
                return '';
        }
    }
}
exports.default = new ContentTypeMapper();
