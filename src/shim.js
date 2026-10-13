import {Buffer} from 'buffer';
window.global=window;
window.Buffer=Buffer;
window.process=window.process||{env:{},browser:true,version:'',versions:{},nextTick:(f,...a)=>setTimeout(()=>f(...a),0)};
export {Buffer};
