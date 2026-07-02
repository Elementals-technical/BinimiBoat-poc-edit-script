/**
 * @typedef {Object} DragPlane
 * @property {'horizontal'|'vertical'} orientation
 * @property {{x:number,y:number,z:number}} origin
 * @property {{x:number,z:number}} size        usable-прямокутник (напівширини рахуються від origin)
 * @property {'onStart'|'live'|'onEnd'} updateMode
 *
 * @typedef {Object} DragBinding
 * @property {string} productId
 * @property {'productCenter'|'boundingBoxCenter'|'customNode'} handleType
 * @property {string} [nodeName]
 */
export {};
