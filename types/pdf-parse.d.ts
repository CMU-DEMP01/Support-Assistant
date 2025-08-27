declare module 'pdf-parse' {
  function pdf(buffer: Buffer | Uint8Array | ArrayBuffer): Promise<{ text: string }>;
  export = pdf;
}

declare module 'pdf-parse/lib/pdf-parse.js' {
  import pdf = require('pdf-parse');
  export default pdf;
}
