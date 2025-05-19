export type FileExtension = 'image/png' | 'text/plain' | 'text/html' | 'video/webm' | 'application/zip';
declare class ContentTypeMapper {
    getFileExtenion(contentType: FileExtension): string;
}
declare const _default: ContentTypeMapper;
export default _default;
