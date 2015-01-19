// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 192;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });



/* memory initializer */ allocate([1,0,0,0,0,0,0,0,130,128,0,0,0,0,0,0,138,128,0,0,0,0,0,128,0,128,0,128,0,0,0,128,139,128,0,0,0,0,0,0,1,0,0,128,0,0,0,0,129,128,0,128,0,0,0,128,9,128,0,0,0,0,0,128,138,0,0,0,0,0,0,0,136,0,0,0,0,0,0,0,9,128,0,128,0,0,0,0,10,0,0,128,0,0,0,0,139,128,0,128,0,0,0,0,139,0,0,0,0,0,0,128,137,128,0,0,0,0,0,128,3,128,0,0,0,0,0,128,2,128,0,0,0,0,0,128,128,0,0,0,0,0,0,128,10,128,0,0,0,0,0,0,10,0,0,128,0,0,0,128,129,128,0,128,0,0,0,128,128,128,0,0,0,0,0,128,1,0,0,128,0,0,0,0,8,128,0,128,0,0,0,128], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;

   
  Module["_memcpy"] = _memcpy;


  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;

  function _free() {
  }
  Module["_free"] = _free;

   
  Module["_strlen"] = _strlen;

  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
  
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
  
        if (!total) {
          // early out
          return callback(null);
        }
  
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
  
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
  
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
  
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat, node;
  
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
  
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
  
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
  
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
  
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          FS.FSNode.prototype = {};
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
  
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");


var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'use asm';
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);

  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var NaN=+env.NaN;
  var Infinity=+env.Infinity;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var asmPrintInt=env.asmPrintInt;
  var asmPrintFloat=env.asmPrintFloat;
  var Math_min=env.min;
  var invoke_ii=env.invoke_ii;
  var invoke_v=env.invoke_v;
  var invoke_iii=env.invoke_iii;
  var invoke_vi=env.invoke_vi;
  var _malloc=env._malloc;
  var ___setErrNo=env.___setErrNo;
  var _free=env._free;
  var _fflush=env._fflush;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
STACKTOP = (STACKTOP + 7)&-8;
  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1|0] = HEAP8[ptr+1|0];
  HEAP8[tempDoublePtr+2|0] = HEAP8[ptr+2|0];
  HEAP8[tempDoublePtr+3|0] = HEAP8[ptr+3|0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1|0] = HEAP8[ptr+1|0];
  HEAP8[tempDoublePtr+2|0] = HEAP8[ptr+2|0];
  HEAP8[tempDoublePtr+3|0] = HEAP8[ptr+3|0];
  HEAP8[tempDoublePtr+4|0] = HEAP8[ptr+4|0];
  HEAP8[tempDoublePtr+5|0] = HEAP8[ptr+5|0];
  HEAP8[tempDoublePtr+6|0] = HEAP8[ptr+6|0];
  HEAP8[tempDoublePtr+7|0] = HEAP8[ptr+7|0];
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}

function setTempRet1(value) {
  value = value|0;
  tempRet1 = value;
}

function setTempRet2(value) {
  value = value|0;
  tempRet2 = value;
}

function setTempRet3(value) {
  value = value|0;
  tempRet3 = value;
}

function setTempRet4(value) {
  value = value|0;
  tempRet4 = value;
}

function setTempRet5(value) {
  value = value|0;
  tempRet5 = value;
}

function setTempRet6(value) {
  value = value|0;
  tempRet6 = value;
}

function setTempRet7(value) {
  value = value|0;
  tempRet7 = value;
}

function setTempRet8(value) {
  value = value|0;
  tempRet8 = value;
}

function setTempRet9(value) {
  value = value|0;
  tempRet9 = value;
}
function runPostSets() {


}

function _hash($out,$outlen,$in,$inlen,$rate,$delim){
 $out=($out)|0;
 $outlen=($outlen)|0;
 $in=($in)|0;
 $inlen=($inlen)|0;
 $rate=($rate)|0;
 $delim=($delim)|0;
 var $a=0,$1=0,$3=0,$4=0,$or_cond=0,$5=0,$or_cond3=0,$7=0,$8=0,$_0512=0,$_0611=0,$9=0,$10=0,$11=0,$_05_lcssa=0,$_06_lcssa=0,$12=0,$13=0,$14=0,$15=0;
 var $16=0,$17=0,$18=0,$19=0,$_049=0,$_078=0,$20=0,$21=0,$22=0,$_04_lcssa=0,$_07_lcssa=0,$_0=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+200)|0;
 $a=((sp)|0);
 $1=($out|0)==0;
 if ($1) {
  $_0=-1;

  STACKTOP=sp;return (($_0)|0);
 }
 $3=($in|0)==0;
 $4=($inlen|0)!=0;
 $or_cond=$3&$4;
 $5=($rate>>>0)>((199)>>>0);
 $or_cond3=$or_cond|$5;
 if ($or_cond3) {
  $_0=-1;

  STACKTOP=sp;return (($_0)|0);
 }
 $7=(($a)|0);
 _memset((((($7)|0))|0), ((((0)|0))|0), ((((200)|0))|0))|0;
 $8=($inlen>>>0)<($rate>>>0);
 if ($8) {
  $_06_lcssa=$in;$_05_lcssa=$inlen;
 } else {
  $_0611=$in;$_0512=$inlen;
  while(1) {


   _xorin($7,$_0611,$rate);
   _keccakf($7);
   $9=(($_0611+$rate)|0);
   $10=((($_0512)-($rate))|0);
   $11=($10>>>0)<($rate>>>0);
   if ($11) {
    $_06_lcssa=$9;$_05_lcssa=$10;
    break;
   } else {
    $_0611=$9;$_0512=$10;
   }
  }
 }


 $12=(($a+$_05_lcssa)|0);
 $13=((HEAP8[($12)])|0);
 $14=$13^$delim;
 HEAP8[($12)]=$14;
 $15=((($rate)-(1))|0);
 $16=(($a+$15)|0);
 $17=((HEAP8[($16)])|0);
 $18=$17^-128;
 HEAP8[($16)]=$18;
 _xorin($7,$_06_lcssa,$_05_lcssa);
 _keccakf($7);
 $19=($outlen>>>0)<($rate>>>0);
 if ($19) {
  $_07_lcssa=$outlen;$_04_lcssa=$out;
 } else {
  $_078=$outlen;$_049=$out;
  while(1) {


   _setout($7,$_049,$rate);
   _keccakf($7);
   $20=(($_049+$rate)|0);
   $21=((($_078)-($rate))|0);
   $22=($21>>>0)<($rate>>>0);
   if ($22) {
    $_07_lcssa=$21;$_04_lcssa=$20;
    break;
   } else {
    $_078=$21;$_049=$20;
   }
  }
 }


 _setout($7,$_04_lcssa,$_07_lcssa);
 _memset((((($7)|0))|0), ((((0)|0))|0), ((((200)|0))|0))|0;
 $_0=0;

 STACKTOP=sp;return (($_0)|0);
}


function _sha3_256($out,$outlen,$in,$inlen){
 $out=($out)|0;
 $outlen=($outlen)|0;
 $in=($in)|0;
 $inlen=($inlen)|0;
 var $1=0,$3=0,$_0=0,label=0;

 $1=($outlen>>>0)>((32)>>>0);
 if ($1) {
  $_0=-1;

  return (($_0)|0);
 }
 $3=((_hash($out,$outlen,$in,$inlen,136,1))|0);
 $_0=$3;

 return (($_0)|0);
}


function _sha3_512($out,$outlen,$in,$inlen){
 $out=($out)|0;
 $outlen=($outlen)|0;
 $in=($in)|0;
 $inlen=($inlen)|0;
 var $1=0,$3=0,$_0=0,label=0;

 $1=($outlen>>>0)>((64)>>>0);
 if ($1) {
  $_0=-1;
 } else {
  $3=((_hash($out,$outlen,$in,$inlen,72,1))|0);
  $_0=$3;
 }

 return (($_0)|0);
}


function _fips202_sha3_256($out,$outlen,$in,$inlen){
 $out=($out)|0;
 $outlen=($outlen)|0;
 $in=($in)|0;
 $inlen=($inlen)|0;
 var $1=0,$3=0,$_0=0,label=0;

 $1=($outlen>>>0)>((32)>>>0);
 if ($1) {
  $_0=-1;

  return (($_0)|0);
 }
 $3=((_hash($out,$outlen,$in,$inlen,136,6))|0);
 $_0=$3;

 return (($_0)|0);
}


function _fips202_sha3_512($out,$outlen,$in,$inlen){
 $out=($out)|0;
 $outlen=($outlen)|0;
 $in=($in)|0;
 $inlen=($inlen)|0;
 var $1=0,$3=0,$_0=0,label=0;

 $1=($outlen>>>0)>((64)>>>0);
 if ($1) {
  $_0=-1;
 } else {
  $3=((_hash($out,$outlen,$in,$inlen,72,6))|0);
  $_0=$3;
 }

 return (($_0)|0);
}


function _xorin($dst,$src,$len){
 $dst=($dst)|0;
 $src=($src)|0;
 $len=($len)|0;
 var $1=0,$i_01=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,label=0;

 $1=($len|0)==0;
 if ($1) {
  return;
 } else {
  $i_01=0;
 }
 while(1) {

  $2=(($src+$i_01)|0);
  $3=((HEAP8[($2)])|0);
  $4=(($dst+$i_01)|0);
  $5=((HEAP8[($4)])|0);
  $6=$5^$3;
  HEAP8[($4)]=$6;
  $7=((($i_01)+(1))|0);
  $8=($7>>>0)<($len>>>0);
  if ($8) {
   $i_01=$7;
  } else {
   break;
  }
 }
 return;
}


function _keccakf($state){
 $state=($state)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0;
 var $21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0;
 var $41=0,$42=0,$43=0,$44=0,$45=0,$46=0,$47=0,$48=0,$49=0,$i_01=0,$ld$0$0=0,$51$0=0,$ld$1$1=0,$51$1=0,$ld$2$0=0,$52$0=0,$ld$3$1=0,$52$1=0,$53$0=0,$53$1=0;
 var $ld$4$0=0,$54$0=0,$ld$5$1=0,$54$1=0,$55$0=0,$55$1=0,$ld$6$0=0,$56$0=0,$ld$7$1=0,$56$1=0,$57$0=0,$57$1=0,$ld$8$0=0,$58$0=0,$ld$9$1=0,$58$1=0,$59$0=0,$59$1=0,$ld$10$0=0,$60$0=0;
 var $ld$11$1=0,$60$1=0,$ld$12$0=0,$61$0=0,$ld$13$1=0,$61$1=0,$62$0=0,$62$1=0,$ld$14$0=0,$63$0=0,$ld$15$1=0,$63$1=0,$64$0=0,$64$1=0,$ld$16$0=0,$65$0=0,$ld$17$1=0,$65$1=0,$66$0=0,$66$1=0;
 var $ld$18$0=0,$67$0=0,$ld$19$1=0,$67$1=0,$68$0=0,$68$1=0,$ld$20$0=0,$69$0=0,$ld$21$1=0,$69$1=0,$ld$22$0=0,$70$0=0,$ld$23$1=0,$70$1=0,$71$0=0,$71$1=0,$ld$24$0=0,$72$0=0,$ld$25$1=0,$72$1=0;
 var $73$0=0,$73$1=0,$ld$26$0=0,$74$0=0,$ld$27$1=0,$74$1=0,$75$0=0,$75$1=0,$ld$28$0=0,$76$0=0,$ld$29$1=0,$76$1=0,$77$0=0,$77$1=0,$ld$30$0=0,$78$0=0,$ld$31$1=0,$78$1=0,$ld$32$0=0,$79$0=0;
 var $ld$33$1=0,$79$1=0,$80$0=0,$80$1=0,$ld$34$0=0,$81$0=0,$ld$35$1=0,$81$1=0,$82$0=0,$82$1=0,$ld$36$0=0,$83$0=0,$ld$37$1=0,$83$1=0,$84$0=0,$84$1=0,$ld$38$0=0,$85$0=0,$ld$39$1=0,$85$1=0;
 var $86$0=0,$86$1=0,$ld$40$0=0,$87$0=0,$ld$41$1=0,$87$1=0,$ld$42$0=0,$88$0=0,$ld$43$1=0,$88$1=0,$89$0=0,$89$1=0,$ld$44$0=0,$90$0=0,$ld$45$1=0,$90$1=0,$91$0=0,$91$1=0,$ld$46$0=0,$92$0=0;
 var $ld$47$1=0,$92$1=0,$93$0=0,$93$1=0,$ld$48$0=0,$94$0=0,$ld$49$1=0,$94$1=0,$95$0=0,$95$1=0,$96$0=0,$96$1=0,$97$0=0,$97$1=0,$98$0=0,$98$1=0,$99$0=0,$99$1=0,$100$0=0,$100$1=0;
 var $st$50$0=0,$st$51$1=0,$ld$52$0=0,$101$0=0,$ld$53$1=0,$101$1=0,$102$0=0,$102$1=0,$st$54$0=0,$st$55$1=0,$ld$56$0=0,$103$0=0,$ld$57$1=0,$103$1=0,$104$0=0,$104$1=0,$st$58$0=0,$st$59$1=0,$ld$60$0=0,$105$0=0;
 var $ld$61$1=0,$105$1=0,$106$0=0,$106$1=0,$st$62$0=0,$st$63$1=0,$ld$64$0=0,$107$0=0,$ld$65$1=0,$107$1=0,$108$0=0,$108$1=0,$st$66$0=0,$st$67$1=0,$109$0=0,$109$1=0,$110$0=0,$110$1=0,$111$0=0,$111$1=0;
 var $112$0=0,$112$1=0,$ld$68$0=0,$113$0=0,$ld$69$1=0,$113$1=0,$114$0=0,$114$1=0,$st$70$0=0,$st$71$1=0,$ld$72$0=0,$115$0=0,$ld$73$1=0,$115$1=0,$116$0=0,$116$1=0,$st$74$0=0,$st$75$1=0,$ld$76$0=0,$117$0=0;
 var $ld$77$1=0,$117$1=0,$118$0=0,$118$1=0,$st$78$0=0,$st$79$1=0,$ld$80$0=0,$119$0=0,$ld$81$1=0,$119$1=0,$120$0=0,$120$1=0,$st$82$0=0,$st$83$1=0,$ld$84$0=0,$121$0=0,$ld$85$1=0,$121$1=0,$122$0=0,$122$1=0;
 var $st$86$0=0,$st$87$1=0,$123$0=0,$123$1=0,$124$0=0,$124$1=0,$125$0=0,$125$1=0,$126$0=0,$126$1=0,$ld$88$0=0,$127$0=0,$ld$89$1=0,$127$1=0,$128$0=0,$128$1=0,$st$90$0=0,$st$91$1=0,$ld$92$0=0,$129$0=0;
 var $ld$93$1=0,$129$1=0,$130$0=0,$130$1=0,$st$94$0=0,$st$95$1=0,$ld$96$0=0,$131$0=0,$ld$97$1=0,$131$1=0,$132$0=0,$132$1=0,$st$98$0=0,$st$99$1=0,$ld$100$0=0,$133$0=0,$ld$101$1=0,$133$1=0,$134$0=0,$134$1=0;
 var $st$102$0=0,$st$103$1=0,$ld$104$0=0,$135$0=0,$ld$105$1=0,$135$1=0,$136$0=0,$136$1=0,$st$106$0=0,$st$107$1=0,$137$0=0,$137$1=0,$138$0=0,$138$1=0,$139$0=0,$139$1=0,$140$0=0,$140$1=0,$ld$108$0=0,$141$0=0;
 var $ld$109$1=0,$141$1=0,$142$0=0,$142$1=0,$st$110$0=0,$st$111$1=0,$ld$112$0=0,$143$0=0,$ld$113$1=0,$143$1=0,$144$0=0,$144$1=0,$st$114$0=0,$st$115$1=0,$ld$116$0=0,$145$0=0,$ld$117$1=0,$145$1=0,$146$0=0,$146$1=0;
 var $st$118$0=0,$st$119$1=0,$ld$120$0=0,$147$0=0,$ld$121$1=0,$147$1=0,$148$0=0,$148$1=0,$st$122$0=0,$st$123$1=0,$ld$124$0=0,$149$0=0,$ld$125$1=0,$149$1=0,$150$0=0,$150$1=0,$st$126$0=0,$st$127$1=0,$151$0=0,$151$1=0;
 var $152$0=0,$152$1=0,$153$0=0,$153$1=0,$154$0=0,$154$1=0,$ld$128$0=0,$155$0=0,$ld$129$1=0,$155$1=0,$156$0=0,$156$1=0,$st$130$0=0,$st$131$1=0,$ld$132$0=0,$157$0=0,$ld$133$1=0,$157$1=0,$158$0=0,$158$1=0;
 var $st$134$0=0,$st$135$1=0,$ld$136$0=0,$159$0=0,$ld$137$1=0,$159$1=0,$160$0=0,$160$1=0,$st$138$0=0,$st$139$1=0,$ld$140$0=0,$161$0=0,$ld$141$1=0,$161$1=0,$162$0=0,$162$1=0,$st$142$0=0,$st$143$1=0,$ld$144$0=0,$163$0=0;
 var $ld$145$1=0,$163$1=0,$164$0=0,$164$1=0,$st$146$0=0,$st$147$1=0,$ld$148$0=0,$165$0=0,$ld$149$1=0,$165$1=0,$ld$150$0=0,$166$0=0,$ld$151$1=0,$166$1=0,$167$0=0,$167$1=0,$168$0=0,$168$1=0,$169$0=0,$169$1=0;
 var $st$152$0=0,$st$153$1=0,$ld$154$0=0,$170$0=0,$ld$155$1=0,$170$1=0,$171$0=0,$171$1=0,$172$0=0,$172$1=0,$173$0=0,$173$1=0,$st$156$0=0,$st$157$1=0,$ld$158$0=0,$174$0=0,$ld$159$1=0,$174$1=0,$175$0=0,$175$1=0;
 var $176$0=0,$176$1=0,$177$0=0,$177$1=0,$st$160$0=0,$st$161$1=0,$ld$162$0=0,$178$0=0,$ld$163$1=0,$178$1=0,$179$0=0,$179$1=0,$180$0=0,$180$1=0,$181$0=0,$181$1=0,$st$164$0=0,$st$165$1=0,$ld$166$0=0,$182$0=0;
 var $ld$167$1=0,$182$1=0,$183$0=0,$183$1=0,$184$0=0,$184$1=0,$185$0=0,$185$1=0,$st$168$0=0,$st$169$1=0,$ld$170$0=0,$186$0=0,$ld$171$1=0,$186$1=0,$187$0=0,$187$1=0,$188$0=0,$188$1=0,$189$0=0,$189$1=0;
 var $st$172$0=0,$st$173$1=0,$ld$174$0=0,$190$0=0,$ld$175$1=0,$190$1=0,$191$0=0,$191$1=0,$192$0=0,$192$1=0,$193$0=0,$193$1=0,$st$176$0=0,$st$177$1=0,$ld$178$0=0,$194$0=0,$ld$179$1=0,$194$1=0,$195$0=0,$195$1=0;
 var $196$0=0,$196$1=0,$197$0=0,$197$1=0,$st$180$0=0,$st$181$1=0,$ld$182$0=0,$198$0=0,$ld$183$1=0,$198$1=0,$199$0=0,$199$1=0,$200$0=0,$200$1=0,$201$0=0,$201$1=0,$st$184$0=0,$st$185$1=0,$ld$186$0=0,$202$0=0;
 var $ld$187$1=0,$202$1=0,$203$0=0,$203$1=0,$204$0=0,$204$1=0,$205$0=0,$205$1=0,$st$188$0=0,$st$189$1=0,$ld$190$0=0,$206$0=0,$ld$191$1=0,$206$1=0,$207$0=0,$207$1=0,$208$0=0,$208$1=0,$209$0=0,$209$1=0;
 var $st$192$0=0,$st$193$1=0,$ld$194$0=0,$210$0=0,$ld$195$1=0,$210$1=0,$211$0=0,$211$1=0,$212$0=0,$212$1=0,$213$0=0,$213$1=0,$st$196$0=0,$st$197$1=0,$ld$198$0=0,$214$0=0,$ld$199$1=0,$214$1=0,$215$0=0,$215$1=0;
 var $216$0=0,$216$1=0,$217$0=0,$217$1=0,$st$200$0=0,$st$201$1=0,$ld$202$0=0,$218$0=0,$ld$203$1=0,$218$1=0,$219$0=0,$219$1=0,$220$0=0,$220$1=0,$221$0=0,$221$1=0,$st$204$0=0,$st$205$1=0,$ld$206$0=0,$222$0=0;
 var $ld$207$1=0,$222$1=0,$223$0=0,$223$1=0,$224$0=0,$224$1=0,$225$0=0,$225$1=0,$st$208$0=0,$st$209$1=0,$ld$210$0=0,$226$0=0,$ld$211$1=0,$226$1=0,$227$0=0,$227$1=0,$228$0=0,$228$1=0,$229$0=0,$229$1=0;
 var $st$212$0=0,$st$213$1=0,$ld$214$0=0,$230$0=0,$ld$215$1=0,$230$1=0,$231$0=0,$231$1=0,$232$0=0,$232$1=0,$233$0=0,$233$1=0,$st$216$0=0,$st$217$1=0,$ld$218$0=0,$234$0=0,$ld$219$1=0,$234$1=0,$235$0=0,$235$1=0;
 var $236$0=0,$236$1=0,$237$0=0,$237$1=0,$st$220$0=0,$st$221$1=0,$ld$222$0=0,$238$0=0,$ld$223$1=0,$238$1=0,$239$0=0,$239$1=0,$240$0=0,$240$1=0,$241$0=0,$241$1=0,$st$224$0=0,$st$225$1=0,$ld$226$0=0,$242$0=0;
 var $ld$227$1=0,$242$1=0,$243$0=0,$243$1=0,$244$0=0,$244$1=0,$245$0=0,$245$1=0,$st$228$0=0,$st$229$1=0,$ld$230$0=0,$246$0=0,$ld$231$1=0,$246$1=0,$247$0=0,$247$1=0,$248$0=0,$248$1=0,$249$0=0,$249$1=0;
 var $st$232$0=0,$st$233$1=0,$ld$234$0=0,$250$0=0,$ld$235$1=0,$250$1=0,$251$0=0,$251$1=0,$252$0=0,$252$1=0,$253$0=0,$253$1=0,$st$236$0=0,$st$237$1=0,$ld$238$0=0,$254$0=0,$ld$239$1=0,$254$1=0,$255$0=0,$255$1=0;
 var $256$0=0,$256$1=0,$257$0=0,$257$1=0,$st$240$0=0,$st$241$1=0,$258$0=0,$258$1=0,$259$0=0,$259$1=0,$260$0=0,$260$1=0,$ld$242$0=0,$261$0=0,$ld$243$1=0,$261$1=0,$ld$244$0=0,$262$0=0,$ld$245$1=0,$262$1=0;
 var $ld$246$0=0,$263$0=0,$ld$247$1=0,$263$1=0,$ld$248$0=0,$264$0=0,$ld$249$1=0,$264$1=0,$$etemp$250$0=0,$$etemp$250$1=0,$265$0=0,$265$1=0,$266$0=0,$266$1=0,$267$0=0,$267$1=0,$st$251$0=0,$st$252$1=0,$$etemp$253$0=0,$$etemp$253$1=0;
 var $268$0=0,$268$1=0,$269$0=0,$269$1=0,$270$0=0,$270$1=0,$st$254$0=0,$st$255$1=0,$$etemp$256$0=0,$$etemp$256$1=0,$271$0=0,$271$1=0,$272$0=0,$272$1=0,$273$0=0,$273$1=0,$st$257$0=0,$st$258$1=0,$$etemp$259$0=0,$$etemp$259$1=0;
 var $274$0=0,$274$1=0,$275$0=0,$275$1=0,$276$0=0,$276$1=0,$st$260$0=0,$st$261$1=0,$$etemp$262$0=0,$$etemp$262$1=0,$277$0=0,$277$1=0,$278$0=0,$278$1=0,$279$0=0,$279$1=0,$st$263$0=0,$st$264$1=0,$ld$265$0=0,$280$0=0;
 var $ld$266$1=0,$280$1=0,$ld$267$0=0,$281$0=0,$ld$268$1=0,$281$1=0,$ld$269$0=0,$282$0=0,$ld$270$1=0,$282$1=0,$ld$271$0=0,$283$0=0,$ld$272$1=0,$283$1=0,$ld$273$0=0,$284$0=0,$ld$274$1=0,$284$1=0,$$etemp$275$0=0,$$etemp$275$1=0;
 var $285$0=0,$285$1=0,$286$0=0,$286$1=0,$287$0=0,$287$1=0,$st$276$0=0,$st$277$1=0,$$etemp$278$0=0,$$etemp$278$1=0,$288$0=0,$288$1=0,$289$0=0,$289$1=0,$290$0=0,$290$1=0,$st$279$0=0,$st$280$1=0,$$etemp$281$0=0,$$etemp$281$1=0;
 var $291$0=0,$291$1=0,$292$0=0,$292$1=0,$293$0=0,$293$1=0,$st$282$0=0,$st$283$1=0,$$etemp$284$0=0,$$etemp$284$1=0,$294$0=0,$294$1=0,$295$0=0,$295$1=0,$296$0=0,$296$1=0,$st$285$0=0,$st$286$1=0,$$etemp$287$0=0,$$etemp$287$1=0;
 var $297$0=0,$297$1=0,$298$0=0,$298$1=0,$299$0=0,$299$1=0,$st$288$0=0,$st$289$1=0,$ld$290$0=0,$300$0=0,$ld$291$1=0,$300$1=0,$ld$292$0=0,$301$0=0,$ld$293$1=0,$301$1=0,$ld$294$0=0,$302$0=0,$ld$295$1=0,$302$1=0;
 var $ld$296$0=0,$303$0=0,$ld$297$1=0,$303$1=0,$ld$298$0=0,$304$0=0,$ld$299$1=0,$304$1=0,$$etemp$300$0=0,$$etemp$300$1=0,$305$0=0,$305$1=0,$306$0=0,$306$1=0,$307$0=0,$307$1=0,$st$301$0=0,$st$302$1=0,$$etemp$303$0=0,$$etemp$303$1=0;
 var $308$0=0,$308$1=0,$309$0=0,$309$1=0,$310$0=0,$310$1=0,$st$304$0=0,$st$305$1=0,$$etemp$306$0=0,$$etemp$306$1=0,$311$0=0,$311$1=0,$312$0=0,$312$1=0,$313$0=0,$313$1=0,$st$307$0=0,$st$308$1=0,$$etemp$309$0=0,$$etemp$309$1=0;
 var $314$0=0,$314$1=0,$315$0=0,$315$1=0,$316$0=0,$316$1=0,$st$310$0=0,$st$311$1=0,$$etemp$312$0=0,$$etemp$312$1=0,$317$0=0,$317$1=0,$318$0=0,$318$1=0,$319$0=0,$319$1=0,$st$313$0=0,$st$314$1=0,$ld$315$0=0,$320$0=0;
 var $ld$316$1=0,$320$1=0,$ld$317$0=0,$321$0=0,$ld$318$1=0,$321$1=0,$ld$319$0=0,$322$0=0,$ld$320$1=0,$322$1=0,$ld$321$0=0,$323$0=0,$ld$322$1=0,$323$1=0,$ld$323$0=0,$324$0=0,$ld$324$1=0,$324$1=0,$$etemp$325$0=0,$$etemp$325$1=0;
 var $325$0=0,$325$1=0,$326$0=0,$326$1=0,$327$0=0,$327$1=0,$st$326$0=0,$st$327$1=0,$$etemp$328$0=0,$$etemp$328$1=0,$328$0=0,$328$1=0,$329$0=0,$329$1=0,$330$0=0,$330$1=0,$st$329$0=0,$st$330$1=0,$$etemp$331$0=0,$$etemp$331$1=0;
 var $331$0=0,$331$1=0,$332$0=0,$332$1=0,$333$0=0,$333$1=0,$st$332$0=0,$st$333$1=0,$$etemp$334$0=0,$$etemp$334$1=0,$334$0=0,$334$1=0,$335$0=0,$335$1=0,$336$0=0,$336$1=0,$st$335$0=0,$st$336$1=0,$$etemp$337$0=0,$$etemp$337$1=0;
 var $337$0=0,$337$1=0,$338$0=0,$338$1=0,$339$0=0,$339$1=0,$st$338$0=0,$st$339$1=0,$ld$340$0=0,$340$0=0,$ld$341$1=0,$340$1=0,$ld$342$0=0,$341$0=0,$ld$343$1=0,$341$1=0,$ld$344$0=0,$342$0=0,$ld$345$1=0,$342$1=0;
 var $ld$346$0=0,$343$0=0,$ld$347$1=0,$343$1=0,$ld$348$0=0,$344$0=0,$ld$349$1=0,$344$1=0,$$etemp$350$0=0,$$etemp$350$1=0,$345$0=0,$345$1=0,$346$0=0,$346$1=0,$347$0=0,$347$1=0,$st$351$0=0,$st$352$1=0,$$etemp$353$0=0,$$etemp$353$1=0;
 var $348$0=0,$348$1=0,$349$0=0,$349$1=0,$350$0=0,$350$1=0,$st$354$0=0,$st$355$1=0,$$etemp$356$0=0,$$etemp$356$1=0,$351$0=0,$351$1=0,$352$0=0,$352$1=0,$353$0=0,$353$1=0,$st$357$0=0,$st$358$1=0,$$etemp$359$0=0,$$etemp$359$1=0;
 var $354$0=0,$354$1=0,$355$0=0,$355$1=0,$356$0=0,$356$1=0,$st$360$0=0,$st$361$1=0,$$etemp$362$0=0,$$etemp$362$1=0,$357$0=0,$357$1=0,$358$0=0,$358$1=0,$359$0=0,$359$1=0,$st$363$0=0,$st$364$1=0,$360=0,$ld$365$0=0;
 var $361$0=0,$ld$366$1=0,$361$1=0,$ld$367$0=0,$362$0=0,$ld$368$1=0,$362$1=0,$363$0=0,$363$1=0,$st$369$0=0,$st$370$1=0,$364=0,$365=0,label=0;

 $1=$state;
 $2=(($state+40)|0);
 $3=$2;
 $4=(($state+80)|0);
 $5=$4;
 $6=(($state+120)|0);
 $7=$6;
 $8=(($state+160)|0);
 $9=$8;
 $10=(($state+8)|0);
 $11=$10;
 $12=(($state+48)|0);
 $13=$12;
 $14=(($state+88)|0);
 $15=$14;
 $16=(($state+128)|0);
 $17=$16;
 $18=(($state+168)|0);
 $19=$18;
 $20=(($state+16)|0);
 $21=$20;
 $22=(($state+56)|0);
 $23=$22;
 $24=(($state+96)|0);
 $25=$24;
 $26=(($state+136)|0);
 $27=$26;
 $28=(($state+176)|0);
 $29=$28;
 $30=(($state+24)|0);
 $31=$30;
 $32=(($state+64)|0);
 $33=$32;
 $34=(($state+104)|0);
 $35=$34;
 $36=(($state+144)|0);
 $37=$36;
 $38=(($state+184)|0);
 $39=$38;
 $40=(($state+32)|0);
 $41=$40;
 $42=(($state+72)|0);
 $43=$42;
 $44=(($state+112)|0);
 $45=$44;
 $46=(($state+152)|0);
 $47=$46;
 $48=(($state+192)|0);
 $49=$48;
 $i_01=0;
 while(1) {

  $ld$0$0=(($1)|0);
  $51$0=((HEAP32[(($ld$0$0)>>2)])|0);
  $ld$1$1=(($1+4)|0);
  $51$1=((HEAP32[(($ld$1$1)>>2)])|0);
  $ld$2$0=(($3)|0);
  $52$0=((HEAP32[(($ld$2$0)>>2)])|0);
  $ld$3$1=(($3+4)|0);
  $52$1=((HEAP32[(($ld$3$1)>>2)])|0);
  $53$0=$52$0^$51$0;
  $53$1=$52$1^$51$1;
  $ld$4$0=(($5)|0);
  $54$0=((HEAP32[(($ld$4$0)>>2)])|0);
  $ld$5$1=(($5+4)|0);
  $54$1=((HEAP32[(($ld$5$1)>>2)])|0);
  $55$0=$53$0^$54$0;
  $55$1=$53$1^$54$1;
  $ld$6$0=(($7)|0);
  $56$0=((HEAP32[(($ld$6$0)>>2)])|0);
  $ld$7$1=(($7+4)|0);
  $56$1=((HEAP32[(($ld$7$1)>>2)])|0);
  $57$0=$55$0^$56$0;
  $57$1=$55$1^$56$1;
  $ld$8$0=(($9)|0);
  $58$0=((HEAP32[(($ld$8$0)>>2)])|0);
  $ld$9$1=(($9+4)|0);
  $58$1=((HEAP32[(($ld$9$1)>>2)])|0);
  $59$0=$57$0^$58$0;
  $59$1=$57$1^$58$1;
  $ld$10$0=(($11)|0);
  $60$0=((HEAP32[(($ld$10$0)>>2)])|0);
  $ld$11$1=(($11+4)|0);
  $60$1=((HEAP32[(($ld$11$1)>>2)])|0);
  $ld$12$0=(($13)|0);
  $61$0=((HEAP32[(($ld$12$0)>>2)])|0);
  $ld$13$1=(($13+4)|0);
  $61$1=((HEAP32[(($ld$13$1)>>2)])|0);
  $62$0=$61$0^$60$0;
  $62$1=$61$1^$60$1;
  $ld$14$0=(($15)|0);
  $63$0=((HEAP32[(($ld$14$0)>>2)])|0);
  $ld$15$1=(($15+4)|0);
  $63$1=((HEAP32[(($ld$15$1)>>2)])|0);
  $64$0=$62$0^$63$0;
  $64$1=$62$1^$63$1;
  $ld$16$0=(($17)|0);
  $65$0=((HEAP32[(($ld$16$0)>>2)])|0);
  $ld$17$1=(($17+4)|0);
  $65$1=((HEAP32[(($ld$17$1)>>2)])|0);
  $66$0=$64$0^$65$0;
  $66$1=$64$1^$65$1;
  $ld$18$0=(($19)|0);
  $67$0=((HEAP32[(($ld$18$0)>>2)])|0);
  $ld$19$1=(($19+4)|0);
  $67$1=((HEAP32[(($ld$19$1)>>2)])|0);
  $68$0=$66$0^$67$0;
  $68$1=$66$1^$67$1;
  $ld$20$0=(($21)|0);
  $69$0=((HEAP32[(($ld$20$0)>>2)])|0);
  $ld$21$1=(($21+4)|0);
  $69$1=((HEAP32[(($ld$21$1)>>2)])|0);
  $ld$22$0=(($23)|0);
  $70$0=((HEAP32[(($ld$22$0)>>2)])|0);
  $ld$23$1=(($23+4)|0);
  $70$1=((HEAP32[(($ld$23$1)>>2)])|0);
  $71$0=$70$0^$69$0;
  $71$1=$70$1^$69$1;
  $ld$24$0=(($25)|0);
  $72$0=((HEAP32[(($ld$24$0)>>2)])|0);
  $ld$25$1=(($25+4)|0);
  $72$1=((HEAP32[(($ld$25$1)>>2)])|0);
  $73$0=$71$0^$72$0;
  $73$1=$71$1^$72$1;
  $ld$26$0=(($27)|0);
  $74$0=((HEAP32[(($ld$26$0)>>2)])|0);
  $ld$27$1=(($27+4)|0);
  $74$1=((HEAP32[(($ld$27$1)>>2)])|0);
  $75$0=$73$0^$74$0;
  $75$1=$73$1^$74$1;
  $ld$28$0=(($29)|0);
  $76$0=((HEAP32[(($ld$28$0)>>2)])|0);
  $ld$29$1=(($29+4)|0);
  $76$1=((HEAP32[(($ld$29$1)>>2)])|0);
  $77$0=$75$0^$76$0;
  $77$1=$75$1^$76$1;
  $ld$30$0=(($31)|0);
  $78$0=((HEAP32[(($ld$30$0)>>2)])|0);
  $ld$31$1=(($31+4)|0);
  $78$1=((HEAP32[(($ld$31$1)>>2)])|0);
  $ld$32$0=(($33)|0);
  $79$0=((HEAP32[(($ld$32$0)>>2)])|0);
  $ld$33$1=(($33+4)|0);
  $79$1=((HEAP32[(($ld$33$1)>>2)])|0);
  $80$0=$79$0^$78$0;
  $80$1=$79$1^$78$1;
  $ld$34$0=(($35)|0);
  $81$0=((HEAP32[(($ld$34$0)>>2)])|0);
  $ld$35$1=(($35+4)|0);
  $81$1=((HEAP32[(($ld$35$1)>>2)])|0);
  $82$0=$80$0^$81$0;
  $82$1=$80$1^$81$1;
  $ld$36$0=(($37)|0);
  $83$0=((HEAP32[(($ld$36$0)>>2)])|0);
  $ld$37$1=(($37+4)|0);
  $83$1=((HEAP32[(($ld$37$1)>>2)])|0);
  $84$0=$82$0^$83$0;
  $84$1=$82$1^$83$1;
  $ld$38$0=(($39)|0);
  $85$0=((HEAP32[(($ld$38$0)>>2)])|0);
  $ld$39$1=(($39+4)|0);
  $85$1=((HEAP32[(($ld$39$1)>>2)])|0);
  $86$0=$84$0^$85$0;
  $86$1=$84$1^$85$1;
  $ld$40$0=(($41)|0);
  $87$0=((HEAP32[(($ld$40$0)>>2)])|0);
  $ld$41$1=(($41+4)|0);
  $87$1=((HEAP32[(($ld$41$1)>>2)])|0);
  $ld$42$0=(($43)|0);
  $88$0=((HEAP32[(($ld$42$0)>>2)])|0);
  $ld$43$1=(($43+4)|0);
  $88$1=((HEAP32[(($ld$43$1)>>2)])|0);
  $89$0=$88$0^$87$0;
  $89$1=$88$1^$87$1;
  $ld$44$0=(($45)|0);
  $90$0=((HEAP32[(($ld$44$0)>>2)])|0);
  $ld$45$1=(($45+4)|0);
  $90$1=((HEAP32[(($ld$45$1)>>2)])|0);
  $91$0=$89$0^$90$0;
  $91$1=$89$1^$90$1;
  $ld$46$0=(($47)|0);
  $92$0=((HEAP32[(($ld$46$0)>>2)])|0);
  $ld$47$1=(($47+4)|0);
  $92$1=((HEAP32[(($ld$47$1)>>2)])|0);
  $93$0=$91$0^$92$0;
  $93$1=$91$1^$92$1;
  $ld$48$0=(($49)|0);
  $94$0=((HEAP32[(($ld$48$0)>>2)])|0);
  $ld$49$1=(($49+4)|0);
  $94$1=((HEAP32[(($ld$49$1)>>2)])|0);
  $95$0=$93$0^$94$0;
  $95$1=$93$1^$94$1;
  $96$0=($68$0<<1)|(0>>>31);
  $96$1=($68$1<<1)|($68$0>>>31);
  $97$0=($68$1>>>31)|(0<<1);
  $97$1=(0>>>31)|(0<<1);
  $98$0=$96$0|$97$0;
  $98$1=$96$1|$97$1;
  $99$0=$95$0^$98$0;
  $99$1=$95$1^$98$1;
  $100$0=$99$0^$51$0;
  $100$1=$99$1^$51$1;
  $st$50$0=(($1)|0);
  HEAP32[(($st$50$0)>>2)]=$100$0;
  $st$51$1=(($1+4)|0);
  HEAP32[(($st$51$1)>>2)]=$100$1;
  $ld$52$0=(($3)|0);
  $101$0=((HEAP32[(($ld$52$0)>>2)])|0);
  $ld$53$1=(($3+4)|0);
  $101$1=((HEAP32[(($ld$53$1)>>2)])|0);
  $102$0=$99$0^$101$0;
  $102$1=$99$1^$101$1;
  $st$54$0=(($3)|0);
  HEAP32[(($st$54$0)>>2)]=$102$0;
  $st$55$1=(($3+4)|0);
  HEAP32[(($st$55$1)>>2)]=$102$1;
  $ld$56$0=(($5)|0);
  $103$0=((HEAP32[(($ld$56$0)>>2)])|0);
  $ld$57$1=(($5+4)|0);
  $103$1=((HEAP32[(($ld$57$1)>>2)])|0);
  $104$0=$103$0^$99$0;
  $104$1=$103$1^$99$1;
  $st$58$0=(($5)|0);
  HEAP32[(($st$58$0)>>2)]=$104$0;
  $st$59$1=(($5+4)|0);
  HEAP32[(($st$59$1)>>2)]=$104$1;
  $ld$60$0=(($7)|0);
  $105$0=((HEAP32[(($ld$60$0)>>2)])|0);
  $ld$61$1=(($7+4)|0);
  $105$1=((HEAP32[(($ld$61$1)>>2)])|0);
  $106$0=$105$0^$99$0;
  $106$1=$105$1^$99$1;
  $st$62$0=(($7)|0);
  HEAP32[(($st$62$0)>>2)]=$106$0;
  $st$63$1=(($7+4)|0);
  HEAP32[(($st$63$1)>>2)]=$106$1;
  $ld$64$0=(($9)|0);
  $107$0=((HEAP32[(($ld$64$0)>>2)])|0);
  $ld$65$1=(($9+4)|0);
  $107$1=((HEAP32[(($ld$65$1)>>2)])|0);
  $108$0=$107$0^$99$0;
  $108$1=$107$1^$99$1;
  $st$66$0=(($9)|0);
  HEAP32[(($st$66$0)>>2)]=$108$0;
  $st$67$1=(($9+4)|0);
  HEAP32[(($st$67$1)>>2)]=$108$1;
  $109$0=($77$0<<1)|(0>>>31);
  $109$1=($77$1<<1)|($77$0>>>31);
  $110$0=($77$1>>>31)|(0<<1);
  $110$1=(0>>>31)|(0<<1);
  $111$0=$109$0|$110$0;
  $111$1=$109$1|$110$1;
  $112$0=$111$0^$59$0;
  $112$1=$111$1^$59$1;
  $ld$68$0=(($11)|0);
  $113$0=((HEAP32[(($ld$68$0)>>2)])|0);
  $ld$69$1=(($11+4)|0);
  $113$1=((HEAP32[(($ld$69$1)>>2)])|0);
  $114$0=$113$0^$112$0;
  $114$1=$113$1^$112$1;
  $st$70$0=(($11)|0);
  HEAP32[(($st$70$0)>>2)]=$114$0;
  $st$71$1=(($11+4)|0);
  HEAP32[(($st$71$1)>>2)]=$114$1;
  $ld$72$0=(($13)|0);
  $115$0=((HEAP32[(($ld$72$0)>>2)])|0);
  $ld$73$1=(($13+4)|0);
  $115$1=((HEAP32[(($ld$73$1)>>2)])|0);
  $116$0=$115$0^$112$0;
  $116$1=$115$1^$112$1;
  $st$74$0=(($13)|0);
  HEAP32[(($st$74$0)>>2)]=$116$0;
  $st$75$1=(($13+4)|0);
  HEAP32[(($st$75$1)>>2)]=$116$1;
  $ld$76$0=(($15)|0);
  $117$0=((HEAP32[(($ld$76$0)>>2)])|0);
  $ld$77$1=(($15+4)|0);
  $117$1=((HEAP32[(($ld$77$1)>>2)])|0);
  $118$0=$117$0^$112$0;
  $118$1=$117$1^$112$1;
  $st$78$0=(($15)|0);
  HEAP32[(($st$78$0)>>2)]=$118$0;
  $st$79$1=(($15+4)|0);
  HEAP32[(($st$79$1)>>2)]=$118$1;
  $ld$80$0=(($17)|0);
  $119$0=((HEAP32[(($ld$80$0)>>2)])|0);
  $ld$81$1=(($17+4)|0);
  $119$1=((HEAP32[(($ld$81$1)>>2)])|0);
  $120$0=$119$0^$112$0;
  $120$1=$119$1^$112$1;
  $st$82$0=(($17)|0);
  HEAP32[(($st$82$0)>>2)]=$120$0;
  $st$83$1=(($17+4)|0);
  HEAP32[(($st$83$1)>>2)]=$120$1;
  $ld$84$0=(($19)|0);
  $121$0=((HEAP32[(($ld$84$0)>>2)])|0);
  $ld$85$1=(($19+4)|0);
  $121$1=((HEAP32[(($ld$85$1)>>2)])|0);
  $122$0=$121$0^$112$0;
  $122$1=$121$1^$112$1;
  $st$86$0=(($19)|0);
  HEAP32[(($st$86$0)>>2)]=$122$0;
  $st$87$1=(($19+4)|0);
  HEAP32[(($st$87$1)>>2)]=$122$1;
  $123$0=($86$0<<1)|(0>>>31);
  $123$1=($86$1<<1)|($86$0>>>31);
  $124$0=($86$1>>>31)|(0<<1);
  $124$1=(0>>>31)|(0<<1);
  $125$0=$123$0|$124$0;
  $125$1=$123$1|$124$1;
  $126$0=$125$0^$68$0;
  $126$1=$125$1^$68$1;
  $ld$88$0=(($21)|0);
  $127$0=((HEAP32[(($ld$88$0)>>2)])|0);
  $ld$89$1=(($21+4)|0);
  $127$1=((HEAP32[(($ld$89$1)>>2)])|0);
  $128$0=$127$0^$126$0;
  $128$1=$127$1^$126$1;
  $st$90$0=(($21)|0);
  HEAP32[(($st$90$0)>>2)]=$128$0;
  $st$91$1=(($21+4)|0);
  HEAP32[(($st$91$1)>>2)]=$128$1;
  $ld$92$0=(($23)|0);
  $129$0=((HEAP32[(($ld$92$0)>>2)])|0);
  $ld$93$1=(($23+4)|0);
  $129$1=((HEAP32[(($ld$93$1)>>2)])|0);
  $130$0=$129$0^$126$0;
  $130$1=$129$1^$126$1;
  $st$94$0=(($23)|0);
  HEAP32[(($st$94$0)>>2)]=$130$0;
  $st$95$1=(($23+4)|0);
  HEAP32[(($st$95$1)>>2)]=$130$1;
  $ld$96$0=(($25)|0);
  $131$0=((HEAP32[(($ld$96$0)>>2)])|0);
  $ld$97$1=(($25+4)|0);
  $131$1=((HEAP32[(($ld$97$1)>>2)])|0);
  $132$0=$131$0^$126$0;
  $132$1=$131$1^$126$1;
  $st$98$0=(($25)|0);
  HEAP32[(($st$98$0)>>2)]=$132$0;
  $st$99$1=(($25+4)|0);
  HEAP32[(($st$99$1)>>2)]=$132$1;
  $ld$100$0=(($27)|0);
  $133$0=((HEAP32[(($ld$100$0)>>2)])|0);
  $ld$101$1=(($27+4)|0);
  $133$1=((HEAP32[(($ld$101$1)>>2)])|0);
  $134$0=$133$0^$126$0;
  $134$1=$133$1^$126$1;
  $st$102$0=(($27)|0);
  HEAP32[(($st$102$0)>>2)]=$134$0;
  $st$103$1=(($27+4)|0);
  HEAP32[(($st$103$1)>>2)]=$134$1;
  $ld$104$0=(($29)|0);
  $135$0=((HEAP32[(($ld$104$0)>>2)])|0);
  $ld$105$1=(($29+4)|0);
  $135$1=((HEAP32[(($ld$105$1)>>2)])|0);
  $136$0=$135$0^$126$0;
  $136$1=$135$1^$126$1;
  $st$106$0=(($29)|0);
  HEAP32[(($st$106$0)>>2)]=$136$0;
  $st$107$1=(($29+4)|0);
  HEAP32[(($st$107$1)>>2)]=$136$1;
  $137$0=($95$0<<1)|(0>>>31);
  $137$1=($95$1<<1)|($95$0>>>31);
  $138$0=($95$1>>>31)|(0<<1);
  $138$1=(0>>>31)|(0<<1);
  $139$0=$137$0|$138$0;
  $139$1=$137$1|$138$1;
  $140$0=$139$0^$77$0;
  $140$1=$139$1^$77$1;
  $ld$108$0=(($31)|0);
  $141$0=((HEAP32[(($ld$108$0)>>2)])|0);
  $ld$109$1=(($31+4)|0);
  $141$1=((HEAP32[(($ld$109$1)>>2)])|0);
  $142$0=$141$0^$140$0;
  $142$1=$141$1^$140$1;
  $st$110$0=(($31)|0);
  HEAP32[(($st$110$0)>>2)]=$142$0;
  $st$111$1=(($31+4)|0);
  HEAP32[(($st$111$1)>>2)]=$142$1;
  $ld$112$0=(($33)|0);
  $143$0=((HEAP32[(($ld$112$0)>>2)])|0);
  $ld$113$1=(($33+4)|0);
  $143$1=((HEAP32[(($ld$113$1)>>2)])|0);
  $144$0=$143$0^$140$0;
  $144$1=$143$1^$140$1;
  $st$114$0=(($33)|0);
  HEAP32[(($st$114$0)>>2)]=$144$0;
  $st$115$1=(($33+4)|0);
  HEAP32[(($st$115$1)>>2)]=$144$1;
  $ld$116$0=(($35)|0);
  $145$0=((HEAP32[(($ld$116$0)>>2)])|0);
  $ld$117$1=(($35+4)|0);
  $145$1=((HEAP32[(($ld$117$1)>>2)])|0);
  $146$0=$145$0^$140$0;
  $146$1=$145$1^$140$1;
  $st$118$0=(($35)|0);
  HEAP32[(($st$118$0)>>2)]=$146$0;
  $st$119$1=(($35+4)|0);
  HEAP32[(($st$119$1)>>2)]=$146$1;
  $ld$120$0=(($37)|0);
  $147$0=((HEAP32[(($ld$120$0)>>2)])|0);
  $ld$121$1=(($37+4)|0);
  $147$1=((HEAP32[(($ld$121$1)>>2)])|0);
  $148$0=$147$0^$140$0;
  $148$1=$147$1^$140$1;
  $st$122$0=(($37)|0);
  HEAP32[(($st$122$0)>>2)]=$148$0;
  $st$123$1=(($37+4)|0);
  HEAP32[(($st$123$1)>>2)]=$148$1;
  $ld$124$0=(($39)|0);
  $149$0=((HEAP32[(($ld$124$0)>>2)])|0);
  $ld$125$1=(($39+4)|0);
  $149$1=((HEAP32[(($ld$125$1)>>2)])|0);
  $150$0=$149$0^$140$0;
  $150$1=$149$1^$140$1;
  $st$126$0=(($39)|0);
  HEAP32[(($st$126$0)>>2)]=$150$0;
  $st$127$1=(($39+4)|0);
  HEAP32[(($st$127$1)>>2)]=$150$1;
  $151$0=($59$0<<1)|(0>>>31);
  $151$1=($59$1<<1)|($59$0>>>31);
  $152$0=($59$1>>>31)|(0<<1);
  $152$1=(0>>>31)|(0<<1);
  $153$0=$151$0|$152$0;
  $153$1=$151$1|$152$1;
  $154$0=$86$0^$153$0;
  $154$1=$86$1^$153$1;
  $ld$128$0=(($41)|0);
  $155$0=((HEAP32[(($ld$128$0)>>2)])|0);
  $ld$129$1=(($41+4)|0);
  $155$1=((HEAP32[(($ld$129$1)>>2)])|0);
  $156$0=$155$0^$154$0;
  $156$1=$155$1^$154$1;
  $st$130$0=(($41)|0);
  HEAP32[(($st$130$0)>>2)]=$156$0;
  $st$131$1=(($41+4)|0);
  HEAP32[(($st$131$1)>>2)]=$156$1;
  $ld$132$0=(($43)|0);
  $157$0=((HEAP32[(($ld$132$0)>>2)])|0);
  $ld$133$1=(($43+4)|0);
  $157$1=((HEAP32[(($ld$133$1)>>2)])|0);
  $158$0=$157$0^$154$0;
  $158$1=$157$1^$154$1;
  $st$134$0=(($43)|0);
  HEAP32[(($st$134$0)>>2)]=$158$0;
  $st$135$1=(($43+4)|0);
  HEAP32[(($st$135$1)>>2)]=$158$1;
  $ld$136$0=(($45)|0);
  $159$0=((HEAP32[(($ld$136$0)>>2)])|0);
  $ld$137$1=(($45+4)|0);
  $159$1=((HEAP32[(($ld$137$1)>>2)])|0);
  $160$0=$159$0^$154$0;
  $160$1=$159$1^$154$1;
  $st$138$0=(($45)|0);
  HEAP32[(($st$138$0)>>2)]=$160$0;
  $st$139$1=(($45+4)|0);
  HEAP32[(($st$139$1)>>2)]=$160$1;
  $ld$140$0=(($47)|0);
  $161$0=((HEAP32[(($ld$140$0)>>2)])|0);
  $ld$141$1=(($47+4)|0);
  $161$1=((HEAP32[(($ld$141$1)>>2)])|0);
  $162$0=$161$0^$154$0;
  $162$1=$161$1^$154$1;
  $st$142$0=(($47)|0);
  HEAP32[(($st$142$0)>>2)]=$162$0;
  $st$143$1=(($47+4)|0);
  HEAP32[(($st$143$1)>>2)]=$162$1;
  $ld$144$0=(($49)|0);
  $163$0=((HEAP32[(($ld$144$0)>>2)])|0);
  $ld$145$1=(($49+4)|0);
  $163$1=((HEAP32[(($ld$145$1)>>2)])|0);
  $164$0=$163$0^$154$0;
  $164$1=$163$1^$154$1;
  $st$146$0=(($49)|0);
  HEAP32[(($st$146$0)>>2)]=$164$0;
  $st$147$1=(($49+4)|0);
  HEAP32[(($st$147$1)>>2)]=$164$1;
  $ld$148$0=(($11)|0);
  $165$0=((HEAP32[(($ld$148$0)>>2)])|0);
  $ld$149$1=(($11+4)|0);
  $165$1=((HEAP32[(($ld$149$1)>>2)])|0);
  $ld$150$0=(($5)|0);
  $166$0=((HEAP32[(($ld$150$0)>>2)])|0);
  $ld$151$1=(($5+4)|0);
  $166$1=((HEAP32[(($ld$151$1)>>2)])|0);
  $167$0=($165$0<<1)|(0>>>31);
  $167$1=($165$1<<1)|($165$0>>>31);
  $168$0=($165$1>>>31)|(0<<1);
  $168$1=(0>>>31)|(0<<1);
  $169$0=$167$0|$168$0;
  $169$1=$167$1|$168$1;
  $st$152$0=(($5)|0);
  HEAP32[(($st$152$0)>>2)]=$169$0;
  $st$153$1=(($5+4)|0);
  HEAP32[(($st$153$1)>>2)]=$169$1;
  $ld$154$0=(($23)|0);
  $170$0=((HEAP32[(($ld$154$0)>>2)])|0);
  $ld$155$1=(($23+4)|0);
  $170$1=((HEAP32[(($ld$155$1)>>2)])|0);
  $171$0=($166$0<<3)|(0>>>29);
  $171$1=($166$1<<3)|($166$0>>>29);
  $172$0=($166$1>>>29)|(0<<3);
  $172$1=(0>>>29)|(0<<3);
  $173$0=$171$0|$172$0;
  $173$1=$171$1|$172$1;
  $st$156$0=(($23)|0);
  HEAP32[(($st$156$0)>>2)]=$173$0;
  $st$157$1=(($23+4)|0);
  HEAP32[(($st$157$1)>>2)]=$173$1;
  $ld$158$0=(($15)|0);
  $174$0=((HEAP32[(($ld$158$0)>>2)])|0);
  $ld$159$1=(($15+4)|0);
  $174$1=((HEAP32[(($ld$159$1)>>2)])|0);
  $175$0=($170$0<<6)|(0>>>26);
  $175$1=($170$1<<6)|($170$0>>>26);
  $176$0=($170$1>>>26)|(0<<6);
  $176$1=(0>>>26)|(0<<6);
  $177$0=$175$0|$176$0;
  $177$1=$175$1|$176$1;
  $st$160$0=(($15)|0);
  HEAP32[(($st$160$0)>>2)]=$177$0;
  $st$161$1=(($15+4)|0);
  HEAP32[(($st$161$1)>>2)]=$177$1;
  $ld$162$0=(($27)|0);
  $178$0=((HEAP32[(($ld$162$0)>>2)])|0);
  $ld$163$1=(($27+4)|0);
  $178$1=((HEAP32[(($ld$163$1)>>2)])|0);
  $179$0=($174$0<<10)|(0>>>22);
  $179$1=($174$1<<10)|($174$0>>>22);
  $180$0=($174$1>>>22)|(0<<10);
  $180$1=(0>>>22)|(0<<10);
  $181$0=$179$0|$180$0;
  $181$1=$179$1|$180$1;
  $st$164$0=(($27)|0);
  HEAP32[(($st$164$0)>>2)]=$181$0;
  $st$165$1=(($27+4)|0);
  HEAP32[(($st$165$1)>>2)]=$181$1;
  $ld$166$0=(($37)|0);
  $182$0=((HEAP32[(($ld$166$0)>>2)])|0);
  $ld$167$1=(($37+4)|0);
  $182$1=((HEAP32[(($ld$167$1)>>2)])|0);
  $183$0=($178$0<<15)|(0>>>17);
  $183$1=($178$1<<15)|($178$0>>>17);
  $184$0=($178$1>>>17)|(0<<15);
  $184$1=(0>>>17)|(0<<15);
  $185$0=$183$0|$184$0;
  $185$1=$183$1|$184$1;
  $st$168$0=(($37)|0);
  HEAP32[(($st$168$0)>>2)]=$185$0;
  $st$169$1=(($37+4)|0);
  HEAP32[(($st$169$1)>>2)]=$185$1;
  $ld$170$0=(($31)|0);
  $186$0=((HEAP32[(($ld$170$0)>>2)])|0);
  $ld$171$1=(($31+4)|0);
  $186$1=((HEAP32[(($ld$171$1)>>2)])|0);
  $187$0=($182$0<<21)|(0>>>11);
  $187$1=($182$1<<21)|($182$0>>>11);
  $188$0=($182$1>>>11)|(0<<21);
  $188$1=(0>>>11)|(0<<21);
  $189$0=$187$0|$188$0;
  $189$1=$187$1|$188$1;
  $st$172$0=(($31)|0);
  HEAP32[(($st$172$0)>>2)]=$189$0;
  $st$173$1=(($31+4)|0);
  HEAP32[(($st$173$1)>>2)]=$189$1;
  $ld$174$0=(($3)|0);
  $190$0=((HEAP32[(($ld$174$0)>>2)])|0);
  $ld$175$1=(($3+4)|0);
  $190$1=((HEAP32[(($ld$175$1)>>2)])|0);
  $191$0=($186$0<<28)|(0>>>4);
  $191$1=($186$1<<28)|($186$0>>>4);
  $192$0=($186$1>>>4)|(0<<28);
  $192$1=(0>>>4)|(0<<28);
  $193$0=$191$0|$192$0;
  $193$1=$191$1|$192$1;
  $st$176$0=(($3)|0);
  HEAP32[(($st$176$0)>>2)]=$193$0;
  $st$177$1=(($3+4)|0);
  HEAP32[(($st$177$1)>>2)]=$193$1;
  $ld$178$0=(($17)|0);
  $194$0=((HEAP32[(($ld$178$0)>>2)])|0);
  $ld$179$1=(($17+4)|0);
  $194$1=((HEAP32[(($ld$179$1)>>2)])|0);
  $195$0=(0<<4)|(0>>>28);
  $195$1=($190$0<<4)|(0>>>28);
  $196$0=($190$0>>>28)|($190$1<<4);
  $196$1=($190$1>>>28)|(0<<4);
  $197$0=$195$0|$196$0;
  $197$1=$195$1|$196$1;
  $st$180$0=(($17)|0);
  HEAP32[(($st$180$0)>>2)]=$197$0;
  $st$181$1=(($17+4)|0);
  HEAP32[(($st$181$1)>>2)]=$197$1;
  $ld$182$0=(($33)|0);
  $198$0=((HEAP32[(($ld$182$0)>>2)])|0);
  $ld$183$1=(($33+4)|0);
  $198$1=((HEAP32[(($ld$183$1)>>2)])|0);
  $199$0=(0<<13)|(0>>>19);
  $199$1=($194$0<<13)|(0>>>19);
  $200$0=($194$0>>>19)|($194$1<<13);
  $200$1=($194$1>>>19)|(0<<13);
  $201$0=$199$0|$200$0;
  $201$1=$199$1|$200$1;
  $st$184$0=(($33)|0);
  HEAP32[(($st$184$0)>>2)]=$201$0;
  $st$185$1=(($33+4)|0);
  HEAP32[(($st$185$1)>>2)]=$201$1;
  $ld$186$0=(($19)|0);
  $202$0=((HEAP32[(($ld$186$0)>>2)])|0);
  $ld$187$1=(($19+4)|0);
  $202$1=((HEAP32[(($ld$187$1)>>2)])|0);
  $203$0=(0<<23)|(0>>>9);
  $203$1=($198$0<<23)|(0>>>9);
  $204$0=($198$0>>>9)|($198$1<<23);
  $204$1=($198$1>>>9)|(0<<23);
  $205$0=$203$0|$204$0;
  $205$1=$203$1|$204$1;
  $st$188$0=(($19)|0);
  HEAP32[(($st$188$0)>>2)]=$205$0;
  $st$189$1=(($19+4)|0);
  HEAP32[(($st$189$1)>>2)]=$205$1;
  $ld$190$0=(($49)|0);
  $206$0=((HEAP32[(($ld$190$0)>>2)])|0);
  $ld$191$1=(($49+4)|0);
  $206$1=((HEAP32[(($ld$191$1)>>2)])|0);
  $207$0=($202$0<<2)|(0>>>30);
  $207$1=($202$1<<2)|($202$0>>>30);
  $208$0=($202$1>>>30)|(0<<2);
  $208$1=(0>>>30)|(0<<2);
  $209$0=$207$0|$208$0;
  $209$1=$207$1|$208$1;
  $st$192$0=(($49)|0);
  HEAP32[(($st$192$0)>>2)]=$209$0;
  $st$193$1=(($49+4)|0);
  HEAP32[(($st$193$1)>>2)]=$209$1;
  $ld$194$0=(($41)|0);
  $210$0=((HEAP32[(($ld$194$0)>>2)])|0);
  $ld$195$1=(($41+4)|0);
  $210$1=((HEAP32[(($ld$195$1)>>2)])|0);
  $211$0=($206$0<<14)|(0>>>18);
  $211$1=($206$1<<14)|($206$0>>>18);
  $212$0=($206$1>>>18)|(0<<14);
  $212$1=(0>>>18)|(0<<14);
  $213$0=$211$0|$212$0;
  $213$1=$211$1|$212$1;
  $st$196$0=(($41)|0);
  HEAP32[(($st$196$0)>>2)]=$213$0;
  $st$197$1=(($41+4)|0);
  HEAP32[(($st$197$1)>>2)]=$213$1;
  $ld$198$0=(($7)|0);
  $214$0=((HEAP32[(($ld$198$0)>>2)])|0);
  $ld$199$1=(($7+4)|0);
  $214$1=((HEAP32[(($ld$199$1)>>2)])|0);
  $215$0=($210$0<<27)|(0>>>5);
  $215$1=($210$1<<27)|($210$0>>>5);
  $216$0=($210$1>>>5)|(0<<27);
  $216$1=(0>>>5)|(0<<27);
  $217$0=$215$0|$216$0;
  $217$1=$215$1|$216$1;
  $st$200$0=(($7)|0);
  HEAP32[(($st$200$0)>>2)]=$217$0;
  $st$201$1=(($7+4)|0);
  HEAP32[(($st$201$1)>>2)]=$217$1;
  $ld$202$0=(($39)|0);
  $218$0=((HEAP32[(($ld$202$0)>>2)])|0);
  $ld$203$1=(($39+4)|0);
  $218$1=((HEAP32[(($ld$203$1)>>2)])|0);
  $219$0=(0<<9)|(0>>>23);
  $219$1=($214$0<<9)|(0>>>23);
  $220$0=($214$0>>>23)|($214$1<<9);
  $220$1=($214$1>>>23)|(0<<9);
  $221$0=$219$0|$220$0;
  $221$1=$219$1|$220$1;
  $st$204$0=(($39)|0);
  HEAP32[(($st$204$0)>>2)]=$221$0;
  $st$205$1=(($39+4)|0);
  HEAP32[(($st$205$1)>>2)]=$221$1;
  $ld$206$0=(($47)|0);
  $222$0=((HEAP32[(($ld$206$0)>>2)])|0);
  $ld$207$1=(($47+4)|0);
  $222$1=((HEAP32[(($ld$207$1)>>2)])|0);
  $223$0=(0<<24)|(0>>>8);
  $223$1=($218$0<<24)|(0>>>8);
  $224$0=($218$0>>>8)|($218$1<<24);
  $224$1=($218$1>>>8)|(0<<24);
  $225$0=$223$0|$224$0;
  $225$1=$223$1|$224$1;
  $st$208$0=(($47)|0);
  HEAP32[(($st$208$0)>>2)]=$225$0;
  $st$209$1=(($47+4)|0);
  HEAP32[(($st$209$1)>>2)]=$225$1;
  $ld$210$0=(($35)|0);
  $226$0=((HEAP32[(($ld$210$0)>>2)])|0);
  $ld$211$1=(($35+4)|0);
  $226$1=((HEAP32[(($ld$211$1)>>2)])|0);
  $227$0=($222$0<<8)|(0>>>24);
  $227$1=($222$1<<8)|($222$0>>>24);
  $228$0=($222$1>>>24)|(0<<8);
  $228$1=(0>>>24)|(0<<8);
  $229$0=$227$0|$228$0;
  $229$1=$227$1|$228$1;
  $st$212$0=(($35)|0);
  HEAP32[(($st$212$0)>>2)]=$229$0;
  $st$213$1=(($35+4)|0);
  HEAP32[(($st$213$1)>>2)]=$229$1;
  $ld$214$0=(($25)|0);
  $230$0=((HEAP32[(($ld$214$0)>>2)])|0);
  $ld$215$1=(($25+4)|0);
  $230$1=((HEAP32[(($ld$215$1)>>2)])|0);
  $231$0=($226$0<<25)|(0>>>7);
  $231$1=($226$1<<25)|($226$0>>>7);
  $232$0=($226$1>>>7)|(0<<25);
  $232$1=(0>>>7)|(0<<25);
  $233$0=$231$0|$232$0;
  $233$1=$231$1|$232$1;
  $st$216$0=(($25)|0);
  HEAP32[(($st$216$0)>>2)]=$233$0;
  $st$217$1=(($25+4)|0);
  HEAP32[(($st$217$1)>>2)]=$233$1;
  $ld$218$0=(($21)|0);
  $234$0=((HEAP32[(($ld$218$0)>>2)])|0);
  $ld$219$1=(($21+4)|0);
  $234$1=((HEAP32[(($ld$219$1)>>2)])|0);
  $235$0=(0<<11)|(0>>>21);
  $235$1=($230$0<<11)|(0>>>21);
  $236$0=($230$0>>>21)|($230$1<<11);
  $236$1=($230$1>>>21)|(0<<11);
  $237$0=$235$0|$236$0;
  $237$1=$235$1|$236$1;
  $st$220$0=(($21)|0);
  HEAP32[(($st$220$0)>>2)]=$237$0;
  $st$221$1=(($21+4)|0);
  HEAP32[(($st$221$1)>>2)]=$237$1;
  $ld$222$0=(($9)|0);
  $238$0=((HEAP32[(($ld$222$0)>>2)])|0);
  $ld$223$1=(($9+4)|0);
  $238$1=((HEAP32[(($ld$223$1)>>2)])|0);
  $239$0=(0<<30)|(0>>>2);
  $239$1=($234$0<<30)|(0>>>2);
  $240$0=($234$0>>>2)|($234$1<<30);
  $240$1=($234$1>>>2)|(0<<30);
  $241$0=$239$0|$240$0;
  $241$1=$239$1|$240$1;
  $st$224$0=(($9)|0);
  HEAP32[(($st$224$0)>>2)]=$241$0;
  $st$225$1=(($9+4)|0);
  HEAP32[(($st$225$1)>>2)]=$241$1;
  $ld$226$0=(($45)|0);
  $242$0=((HEAP32[(($ld$226$0)>>2)])|0);
  $ld$227$1=(($45+4)|0);
  $242$1=((HEAP32[(($ld$227$1)>>2)])|0);
  $243$0=($238$0<<18)|(0>>>14);
  $243$1=($238$1<<18)|($238$0>>>14);
  $244$0=($238$1>>>14)|(0<<18);
  $244$1=(0>>>14)|(0<<18);
  $245$0=$243$0|$244$0;
  $245$1=$243$1|$244$1;
  $st$228$0=(($45)|0);
  HEAP32[(($st$228$0)>>2)]=$245$0;
  $st$229$1=(($45+4)|0);
  HEAP32[(($st$229$1)>>2)]=$245$1;
  $ld$230$0=(($29)|0);
  $246$0=((HEAP32[(($ld$230$0)>>2)])|0);
  $ld$231$1=(($29+4)|0);
  $246$1=((HEAP32[(($ld$231$1)>>2)])|0);
  $247$0=(0<<7)|(0>>>25);
  $247$1=($242$0<<7)|(0>>>25);
  $248$0=($242$0>>>25)|($242$1<<7);
  $248$1=($242$1>>>25)|(0<<7);
  $249$0=$247$0|$248$0;
  $249$1=$247$1|$248$1;
  $st$232$0=(($29)|0);
  HEAP32[(($st$232$0)>>2)]=$249$0;
  $st$233$1=(($29+4)|0);
  HEAP32[(($st$233$1)>>2)]=$249$1;
  $ld$234$0=(($43)|0);
  $250$0=((HEAP32[(($ld$234$0)>>2)])|0);
  $ld$235$1=(($43+4)|0);
  $250$1=((HEAP32[(($ld$235$1)>>2)])|0);
  $251$0=(0<<29)|(0>>>3);
  $251$1=($246$0<<29)|(0>>>3);
  $252$0=($246$0>>>3)|($246$1<<29);
  $252$1=($246$1>>>3)|(0<<29);
  $253$0=$251$0|$252$0;
  $253$1=$251$1|$252$1;
  $st$236$0=(($43)|0);
  HEAP32[(($st$236$0)>>2)]=$253$0;
  $st$237$1=(($43+4)|0);
  HEAP32[(($st$237$1)>>2)]=$253$1;
  $ld$238$0=(($13)|0);
  $254$0=((HEAP32[(($ld$238$0)>>2)])|0);
  $ld$239$1=(($13+4)|0);
  $254$1=((HEAP32[(($ld$239$1)>>2)])|0);
  $255$0=($250$0<<20)|(0>>>12);
  $255$1=($250$1<<20)|($250$0>>>12);
  $256$0=($250$1>>>12)|(0<<20);
  $256$1=(0>>>12)|(0<<20);
  $257$0=$255$0|$256$0;
  $257$1=$255$1|$256$1;
  $st$240$0=(($13)|0);
  HEAP32[(($st$240$0)>>2)]=$257$0;
  $st$241$1=(($13+4)|0);
  HEAP32[(($st$241$1)>>2)]=$257$1;
  $258$0=(0<<12)|(0>>>20);
  $258$1=($254$0<<12)|(0>>>20);
  $259$0=($254$0>>>20)|($254$1<<12);
  $259$1=($254$1>>>20)|(0<<12);
  $260$0=$258$0|$259$0;
  $260$1=$258$1|$259$1;
  $ld$242$0=(($1)|0);
  $261$0=((HEAP32[(($ld$242$0)>>2)])|0);
  $ld$243$1=(($1+4)|0);
  $261$1=((HEAP32[(($ld$243$1)>>2)])|0);
  $ld$244$0=(($21)|0);
  $262$0=((HEAP32[(($ld$244$0)>>2)])|0);
  $ld$245$1=(($21+4)|0);
  $262$1=((HEAP32[(($ld$245$1)>>2)])|0);
  $ld$246$0=(($31)|0);
  $263$0=((HEAP32[(($ld$246$0)>>2)])|0);
  $ld$247$1=(($31+4)|0);
  $263$1=((HEAP32[(($ld$247$1)>>2)])|0);
  $ld$248$0=(($41)|0);
  $264$0=((HEAP32[(($ld$248$0)>>2)])|0);
  $ld$249$1=(($41+4)|0);
  $264$1=((HEAP32[(($ld$249$1)>>2)])|0);
  $$etemp$250$0=-1;
  $$etemp$250$1=-1;
  $265$0=$260$0^$$etemp$250$0;
  $265$1=$260$1^$$etemp$250$1;
  $266$0=$262$0&$265$0;
  $266$1=$262$1&$265$1;
  $267$0=$266$0^$261$0;
  $267$1=$266$1^$261$1;
  $st$251$0=(($1)|0);
  HEAP32[(($st$251$0)>>2)]=$267$0;
  $st$252$1=(($1+4)|0);
  HEAP32[(($st$252$1)>>2)]=$267$1;
  $$etemp$253$0=-1;
  $$etemp$253$1=-1;
  $268$0=$262$0^$$etemp$253$0;
  $268$1=$262$1^$$etemp$253$1;
  $269$0=$263$0&$268$0;
  $269$1=$263$1&$268$1;
  $270$0=$269$0^$260$0;
  $270$1=$269$1^$260$1;
  $st$254$0=(($11)|0);
  HEAP32[(($st$254$0)>>2)]=$270$0;
  $st$255$1=(($11+4)|0);
  HEAP32[(($st$255$1)>>2)]=$270$1;
  $$etemp$256$0=-1;
  $$etemp$256$1=-1;
  $271$0=$263$0^$$etemp$256$0;
  $271$1=$263$1^$$etemp$256$1;
  $272$0=$264$0&$271$0;
  $272$1=$264$1&$271$1;
  $273$0=$272$0^$262$0;
  $273$1=$272$1^$262$1;
  $st$257$0=(($21)|0);
  HEAP32[(($st$257$0)>>2)]=$273$0;
  $st$258$1=(($21+4)|0);
  HEAP32[(($st$258$1)>>2)]=$273$1;
  $$etemp$259$0=-1;
  $$etemp$259$1=-1;
  $274$0=$264$0^$$etemp$259$0;
  $274$1=$264$1^$$etemp$259$1;
  $275$0=$261$0&$274$0;
  $275$1=$261$1&$274$1;
  $276$0=$275$0^$263$0;
  $276$1=$275$1^$263$1;
  $st$260$0=(($31)|0);
  HEAP32[(($st$260$0)>>2)]=$276$0;
  $st$261$1=(($31+4)|0);
  HEAP32[(($st$261$1)>>2)]=$276$1;
  $$etemp$262$0=-1;
  $$etemp$262$1=-1;
  $277$0=$261$0^$$etemp$262$0;
  $277$1=$261$1^$$etemp$262$1;
  $278$0=$260$0&$277$0;
  $278$1=$260$1&$277$1;
  $279$0=$264$0^$278$0;
  $279$1=$264$1^$278$1;
  $st$263$0=(($41)|0);
  HEAP32[(($st$263$0)>>2)]=$279$0;
  $st$264$1=(($41+4)|0);
  HEAP32[(($st$264$1)>>2)]=$279$1;
  $ld$265$0=(($3)|0);
  $280$0=((HEAP32[(($ld$265$0)>>2)])|0);
  $ld$266$1=(($3+4)|0);
  $280$1=((HEAP32[(($ld$266$1)>>2)])|0);
  $ld$267$0=(($13)|0);
  $281$0=((HEAP32[(($ld$267$0)>>2)])|0);
  $ld$268$1=(($13+4)|0);
  $281$1=((HEAP32[(($ld$268$1)>>2)])|0);
  $ld$269$0=(($23)|0);
  $282$0=((HEAP32[(($ld$269$0)>>2)])|0);
  $ld$270$1=(($23+4)|0);
  $282$1=((HEAP32[(($ld$270$1)>>2)])|0);
  $ld$271$0=(($33)|0);
  $283$0=((HEAP32[(($ld$271$0)>>2)])|0);
  $ld$272$1=(($33+4)|0);
  $283$1=((HEAP32[(($ld$272$1)>>2)])|0);
  $ld$273$0=(($43)|0);
  $284$0=((HEAP32[(($ld$273$0)>>2)])|0);
  $ld$274$1=(($43+4)|0);
  $284$1=((HEAP32[(($ld$274$1)>>2)])|0);
  $$etemp$275$0=-1;
  $$etemp$275$1=-1;
  $285$0=$281$0^$$etemp$275$0;
  $285$1=$281$1^$$etemp$275$1;
  $286$0=$282$0&$285$0;
  $286$1=$282$1&$285$1;
  $287$0=$286$0^$280$0;
  $287$1=$286$1^$280$1;
  $st$276$0=(($3)|0);
  HEAP32[(($st$276$0)>>2)]=$287$0;
  $st$277$1=(($3+4)|0);
  HEAP32[(($st$277$1)>>2)]=$287$1;
  $$etemp$278$0=-1;
  $$etemp$278$1=-1;
  $288$0=$282$0^$$etemp$278$0;
  $288$1=$282$1^$$etemp$278$1;
  $289$0=$283$0&$288$0;
  $289$1=$283$1&$288$1;
  $290$0=$289$0^$281$0;
  $290$1=$289$1^$281$1;
  $st$279$0=(($13)|0);
  HEAP32[(($st$279$0)>>2)]=$290$0;
  $st$280$1=(($13+4)|0);
  HEAP32[(($st$280$1)>>2)]=$290$1;
  $$etemp$281$0=-1;
  $$etemp$281$1=-1;
  $291$0=$283$0^$$etemp$281$0;
  $291$1=$283$1^$$etemp$281$1;
  $292$0=$284$0&$291$0;
  $292$1=$284$1&$291$1;
  $293$0=$292$0^$282$0;
  $293$1=$292$1^$282$1;
  $st$282$0=(($23)|0);
  HEAP32[(($st$282$0)>>2)]=$293$0;
  $st$283$1=(($23+4)|0);
  HEAP32[(($st$283$1)>>2)]=$293$1;
  $$etemp$284$0=-1;
  $$etemp$284$1=-1;
  $294$0=$284$0^$$etemp$284$0;
  $294$1=$284$1^$$etemp$284$1;
  $295$0=$280$0&$294$0;
  $295$1=$280$1&$294$1;
  $296$0=$295$0^$283$0;
  $296$1=$295$1^$283$1;
  $st$285$0=(($33)|0);
  HEAP32[(($st$285$0)>>2)]=$296$0;
  $st$286$1=(($33+4)|0);
  HEAP32[(($st$286$1)>>2)]=$296$1;
  $$etemp$287$0=-1;
  $$etemp$287$1=-1;
  $297$0=$280$0^$$etemp$287$0;
  $297$1=$280$1^$$etemp$287$1;
  $298$0=$281$0&$297$0;
  $298$1=$281$1&$297$1;
  $299$0=$284$0^$298$0;
  $299$1=$284$1^$298$1;
  $st$288$0=(($43)|0);
  HEAP32[(($st$288$0)>>2)]=$299$0;
  $st$289$1=(($43+4)|0);
  HEAP32[(($st$289$1)>>2)]=$299$1;
  $ld$290$0=(($5)|0);
  $300$0=((HEAP32[(($ld$290$0)>>2)])|0);
  $ld$291$1=(($5+4)|0);
  $300$1=((HEAP32[(($ld$291$1)>>2)])|0);
  $ld$292$0=(($15)|0);
  $301$0=((HEAP32[(($ld$292$0)>>2)])|0);
  $ld$293$1=(($15+4)|0);
  $301$1=((HEAP32[(($ld$293$1)>>2)])|0);
  $ld$294$0=(($25)|0);
  $302$0=((HEAP32[(($ld$294$0)>>2)])|0);
  $ld$295$1=(($25+4)|0);
  $302$1=((HEAP32[(($ld$295$1)>>2)])|0);
  $ld$296$0=(($35)|0);
  $303$0=((HEAP32[(($ld$296$0)>>2)])|0);
  $ld$297$1=(($35+4)|0);
  $303$1=((HEAP32[(($ld$297$1)>>2)])|0);
  $ld$298$0=(($45)|0);
  $304$0=((HEAP32[(($ld$298$0)>>2)])|0);
  $ld$299$1=(($45+4)|0);
  $304$1=((HEAP32[(($ld$299$1)>>2)])|0);
  $$etemp$300$0=-1;
  $$etemp$300$1=-1;
  $305$0=$301$0^$$etemp$300$0;
  $305$1=$301$1^$$etemp$300$1;
  $306$0=$302$0&$305$0;
  $306$1=$302$1&$305$1;
  $307$0=$306$0^$300$0;
  $307$1=$306$1^$300$1;
  $st$301$0=(($5)|0);
  HEAP32[(($st$301$0)>>2)]=$307$0;
  $st$302$1=(($5+4)|0);
  HEAP32[(($st$302$1)>>2)]=$307$1;
  $$etemp$303$0=-1;
  $$etemp$303$1=-1;
  $308$0=$302$0^$$etemp$303$0;
  $308$1=$302$1^$$etemp$303$1;
  $309$0=$303$0&$308$0;
  $309$1=$303$1&$308$1;
  $310$0=$309$0^$301$0;
  $310$1=$309$1^$301$1;
  $st$304$0=(($15)|0);
  HEAP32[(($st$304$0)>>2)]=$310$0;
  $st$305$1=(($15+4)|0);
  HEAP32[(($st$305$1)>>2)]=$310$1;
  $$etemp$306$0=-1;
  $$etemp$306$1=-1;
  $311$0=$303$0^$$etemp$306$0;
  $311$1=$303$1^$$etemp$306$1;
  $312$0=$304$0&$311$0;
  $312$1=$304$1&$311$1;
  $313$0=$312$0^$302$0;
  $313$1=$312$1^$302$1;
  $st$307$0=(($25)|0);
  HEAP32[(($st$307$0)>>2)]=$313$0;
  $st$308$1=(($25+4)|0);
  HEAP32[(($st$308$1)>>2)]=$313$1;
  $$etemp$309$0=-1;
  $$etemp$309$1=-1;
  $314$0=$304$0^$$etemp$309$0;
  $314$1=$304$1^$$etemp$309$1;
  $315$0=$300$0&$314$0;
  $315$1=$300$1&$314$1;
  $316$0=$315$0^$303$0;
  $316$1=$315$1^$303$1;
  $st$310$0=(($35)|0);
  HEAP32[(($st$310$0)>>2)]=$316$0;
  $st$311$1=(($35+4)|0);
  HEAP32[(($st$311$1)>>2)]=$316$1;
  $$etemp$312$0=-1;
  $$etemp$312$1=-1;
  $317$0=$300$0^$$etemp$312$0;
  $317$1=$300$1^$$etemp$312$1;
  $318$0=$301$0&$317$0;
  $318$1=$301$1&$317$1;
  $319$0=$304$0^$318$0;
  $319$1=$304$1^$318$1;
  $st$313$0=(($45)|0);
  HEAP32[(($st$313$0)>>2)]=$319$0;
  $st$314$1=(($45+4)|0);
  HEAP32[(($st$314$1)>>2)]=$319$1;
  $ld$315$0=(($7)|0);
  $320$0=((HEAP32[(($ld$315$0)>>2)])|0);
  $ld$316$1=(($7+4)|0);
  $320$1=((HEAP32[(($ld$316$1)>>2)])|0);
  $ld$317$0=(($17)|0);
  $321$0=((HEAP32[(($ld$317$0)>>2)])|0);
  $ld$318$1=(($17+4)|0);
  $321$1=((HEAP32[(($ld$318$1)>>2)])|0);
  $ld$319$0=(($27)|0);
  $322$0=((HEAP32[(($ld$319$0)>>2)])|0);
  $ld$320$1=(($27+4)|0);
  $322$1=((HEAP32[(($ld$320$1)>>2)])|0);
  $ld$321$0=(($37)|0);
  $323$0=((HEAP32[(($ld$321$0)>>2)])|0);
  $ld$322$1=(($37+4)|0);
  $323$1=((HEAP32[(($ld$322$1)>>2)])|0);
  $ld$323$0=(($47)|0);
  $324$0=((HEAP32[(($ld$323$0)>>2)])|0);
  $ld$324$1=(($47+4)|0);
  $324$1=((HEAP32[(($ld$324$1)>>2)])|0);
  $$etemp$325$0=-1;
  $$etemp$325$1=-1;
  $325$0=$321$0^$$etemp$325$0;
  $325$1=$321$1^$$etemp$325$1;
  $326$0=$322$0&$325$0;
  $326$1=$322$1&$325$1;
  $327$0=$326$0^$320$0;
  $327$1=$326$1^$320$1;
  $st$326$0=(($7)|0);
  HEAP32[(($st$326$0)>>2)]=$327$0;
  $st$327$1=(($7+4)|0);
  HEAP32[(($st$327$1)>>2)]=$327$1;
  $$etemp$328$0=-1;
  $$etemp$328$1=-1;
  $328$0=$322$0^$$etemp$328$0;
  $328$1=$322$1^$$etemp$328$1;
  $329$0=$323$0&$328$0;
  $329$1=$323$1&$328$1;
  $330$0=$329$0^$321$0;
  $330$1=$329$1^$321$1;
  $st$329$0=(($17)|0);
  HEAP32[(($st$329$0)>>2)]=$330$0;
  $st$330$1=(($17+4)|0);
  HEAP32[(($st$330$1)>>2)]=$330$1;
  $$etemp$331$0=-1;
  $$etemp$331$1=-1;
  $331$0=$323$0^$$etemp$331$0;
  $331$1=$323$1^$$etemp$331$1;
  $332$0=$324$0&$331$0;
  $332$1=$324$1&$331$1;
  $333$0=$332$0^$322$0;
  $333$1=$332$1^$322$1;
  $st$332$0=(($27)|0);
  HEAP32[(($st$332$0)>>2)]=$333$0;
  $st$333$1=(($27+4)|0);
  HEAP32[(($st$333$1)>>2)]=$333$1;
  $$etemp$334$0=-1;
  $$etemp$334$1=-1;
  $334$0=$324$0^$$etemp$334$0;
  $334$1=$324$1^$$etemp$334$1;
  $335$0=$320$0&$334$0;
  $335$1=$320$1&$334$1;
  $336$0=$335$0^$323$0;
  $336$1=$335$1^$323$1;
  $st$335$0=(($37)|0);
  HEAP32[(($st$335$0)>>2)]=$336$0;
  $st$336$1=(($37+4)|0);
  HEAP32[(($st$336$1)>>2)]=$336$1;
  $$etemp$337$0=-1;
  $$etemp$337$1=-1;
  $337$0=$320$0^$$etemp$337$0;
  $337$1=$320$1^$$etemp$337$1;
  $338$0=$321$0&$337$0;
  $338$1=$321$1&$337$1;
  $339$0=$324$0^$338$0;
  $339$1=$324$1^$338$1;
  $st$338$0=(($47)|0);
  HEAP32[(($st$338$0)>>2)]=$339$0;
  $st$339$1=(($47+4)|0);
  HEAP32[(($st$339$1)>>2)]=$339$1;
  $ld$340$0=(($9)|0);
  $340$0=((HEAP32[(($ld$340$0)>>2)])|0);
  $ld$341$1=(($9+4)|0);
  $340$1=((HEAP32[(($ld$341$1)>>2)])|0);
  $ld$342$0=(($19)|0);
  $341$0=((HEAP32[(($ld$342$0)>>2)])|0);
  $ld$343$1=(($19+4)|0);
  $341$1=((HEAP32[(($ld$343$1)>>2)])|0);
  $ld$344$0=(($29)|0);
  $342$0=((HEAP32[(($ld$344$0)>>2)])|0);
  $ld$345$1=(($29+4)|0);
  $342$1=((HEAP32[(($ld$345$1)>>2)])|0);
  $ld$346$0=(($39)|0);
  $343$0=((HEAP32[(($ld$346$0)>>2)])|0);
  $ld$347$1=(($39+4)|0);
  $343$1=((HEAP32[(($ld$347$1)>>2)])|0);
  $ld$348$0=(($49)|0);
  $344$0=((HEAP32[(($ld$348$0)>>2)])|0);
  $ld$349$1=(($49+4)|0);
  $344$1=((HEAP32[(($ld$349$1)>>2)])|0);
  $$etemp$350$0=-1;
  $$etemp$350$1=-1;
  $345$0=$341$0^$$etemp$350$0;
  $345$1=$341$1^$$etemp$350$1;
  $346$0=$342$0&$345$0;
  $346$1=$342$1&$345$1;
  $347$0=$346$0^$340$0;
  $347$1=$346$1^$340$1;
  $st$351$0=(($9)|0);
  HEAP32[(($st$351$0)>>2)]=$347$0;
  $st$352$1=(($9+4)|0);
  HEAP32[(($st$352$1)>>2)]=$347$1;
  $$etemp$353$0=-1;
  $$etemp$353$1=-1;
  $348$0=$342$0^$$etemp$353$0;
  $348$1=$342$1^$$etemp$353$1;
  $349$0=$343$0&$348$0;
  $349$1=$343$1&$348$1;
  $350$0=$349$0^$341$0;
  $350$1=$349$1^$341$1;
  $st$354$0=(($19)|0);
  HEAP32[(($st$354$0)>>2)]=$350$0;
  $st$355$1=(($19+4)|0);
  HEAP32[(($st$355$1)>>2)]=$350$1;
  $$etemp$356$0=-1;
  $$etemp$356$1=-1;
  $351$0=$343$0^$$etemp$356$0;
  $351$1=$343$1^$$etemp$356$1;
  $352$0=$344$0&$351$0;
  $352$1=$344$1&$351$1;
  $353$0=$352$0^$342$0;
  $353$1=$352$1^$342$1;
  $st$357$0=(($29)|0);
  HEAP32[(($st$357$0)>>2)]=$353$0;
  $st$358$1=(($29+4)|0);
  HEAP32[(($st$358$1)>>2)]=$353$1;
  $$etemp$359$0=-1;
  $$etemp$359$1=-1;
  $354$0=$344$0^$$etemp$359$0;
  $354$1=$344$1^$$etemp$359$1;
  $355$0=$340$0&$354$0;
  $355$1=$340$1&$354$1;
  $356$0=$355$0^$343$0;
  $356$1=$355$1^$343$1;
  $st$360$0=(($39)|0);
  HEAP32[(($st$360$0)>>2)]=$356$0;
  $st$361$1=(($39+4)|0);
  HEAP32[(($st$361$1)>>2)]=$356$1;
  $$etemp$362$0=-1;
  $$etemp$362$1=-1;
  $357$0=$340$0^$$etemp$362$0;
  $357$1=$340$1^$$etemp$362$1;
  $358$0=$341$0&$357$0;
  $358$1=$341$1&$357$1;
  $359$0=$344$0^$358$0;
  $359$1=$344$1^$358$1;
  $st$363$0=(($49)|0);
  HEAP32[(($st$363$0)>>2)]=$359$0;
  $st$364$1=(($49+4)|0);
  HEAP32[(($st$364$1)>>2)]=$359$1;
  $360=((8+($i_01<<3))|0);
  $ld$365$0=(($360)|0);
  $361$0=((HEAP32[(($ld$365$0)>>2)])|0);
  $ld$366$1=(($360+4)|0);
  $361$1=((HEAP32[(($ld$366$1)>>2)])|0);
  $ld$367$0=(($1)|0);
  $362$0=((HEAP32[(($ld$367$0)>>2)])|0);
  $ld$368$1=(($1+4)|0);
  $362$1=((HEAP32[(($ld$368$1)>>2)])|0);
  $363$0=$362$0^$361$0;
  $363$1=$362$1^$361$1;
  $st$369$0=(($1)|0);
  HEAP32[(($st$369$0)>>2)]=$363$0;
  $st$370$1=(($1+4)|0);
  HEAP32[(($st$370$1)>>2)]=$363$1;
  $364=((($i_01)+(1))|0);
  $365=($364|0)<24;
  if ($365) {
   $i_01=$364;
  } else {
   break;
  }
 }
 return;
}


function _setout($src,$dst,$len){
 $src=($src)|0;
 $dst=($dst)|0;
 $len=($len)|0;
 var $1=0,$i_01=0,$2=0,$3=0,$4=0,$5=0,$6=0,label=0;

 $1=($len|0)==0;
 if ($1) {
  return;
 } else {
  $i_01=0;
 }
 while(1) {

  $2=(($src+$i_01)|0);
  $3=((HEAP8[($2)])|0);
  $4=(($dst+$i_01)|0);
  HEAP8[($4)]=$3;
  $5=((($i_01)+(1))|0);
  $6=($5>>>0)<($len>>>0);
  if ($6) {
   $i_01=$5;
  } else {
   break;
  }
 }
 return;
}


function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[(ptr)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[(ptr)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[(dest)]=((HEAP8[(src)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[(dest)]=((HEAP8[(src)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _strlen(ptr) {
    ptr = ptr|0;
    var curr = 0;
    curr = ptr;
    while (((HEAP8[(curr)])|0)) {
      curr = (curr + 1)|0;
    }
    return (curr - ptr)|0;
}


// EMSCRIPTEN_END_FUNCS

  
  function dynCall_ii(index,a1) {
    index = index|0;
    a1=a1|0;
    return FUNCTION_TABLE_ii[index&1](a1|0)|0;
  }


  function dynCall_v(index) {
    index = index|0;
    
    FUNCTION_TABLE_v[index&1]();
  }


  function dynCall_iii(index,a1,a2) {
    index = index|0;
    a1=a1|0; a2=a2|0;
    return FUNCTION_TABLE_iii[index&1](a1|0,a2|0)|0;
  }


  function dynCall_vi(index,a1) {
    index = index|0;
    a1=a1|0;
    FUNCTION_TABLE_vi[index&1](a1|0);
  }

function b0(p0) { p0 = p0|0; abort(0); return 0 }
  function b1() { ; abort(1);  }
  function b2(p0,p1) { p0 = p0|0;p1 = p1|0; abort(2); return 0 }
  function b3(p0) { p0 = p0|0; abort(3);  }
  // EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_ii = [b0,b0];
  
  var FUNCTION_TABLE_v = [b1,b1];
  
  var FUNCTION_TABLE_iii = [b2,b2];
  
  var FUNCTION_TABLE_vi = [b3,b3];
  

  return { _sha3_256: _sha3_256, _strlen: _strlen, _memset: _memset, _sha3_512: _sha3_512, _memcpy: _memcpy, _fips202_sha3_256: _fips202_sha3_256, _fips202_sha3_512: _fips202_sha3_512, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, setTempRet1: setTempRet1, setTempRet2: setTempRet2, setTempRet3: setTempRet3, setTempRet4: setTempRet4, setTempRet5: setTempRet5, setTempRet6: setTempRet6, setTempRet7: setTempRet7, setTempRet8: setTempRet8, setTempRet9: setTempRet9, dynCall_ii: dynCall_ii, dynCall_v: dynCall_v, dynCall_iii: dynCall_iii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_malloc": _malloc, "___setErrNo": ___setErrNo, "_free": _free, "_fflush": _fflush, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity }, buffer);
var _sha3_256 = Module["_sha3_256"] = asm["_sha3_256"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _memset = Module["_memset"] = asm["_memset"];
var _sha3_512 = Module["_sha3_512"] = asm["_sha3_512"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _fips202_sha3_256 = Module["_fips202_sha3_256"] = asm["_fips202_sha3_256"];
var _fips202_sha3_512 = Module["_fips202_sha3_512"] = asm["_fips202_sha3_512"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



var buf = Module._malloc(50000);
var bufsize = 50000;
var obuf = Module._malloc(512);

_s512 = Module.cwrap('sha3_512', 'number', ['number', 'number', 'number', 'number']);
_s256 = Module.cwrap('sha3_256', 'number', ['number', 'number', 'number', 'number']);
_fs512 = Module.cwrap('fips202_sha3_512', 'number', ['number', 'number', 'number', 'number']);
_fs256 = Module.cwrap('fips202_sha3_256', 'number', ['number', 'number', 'number', 'number']);

function h(v, hasher, sz) {
    if (typeof v == "string") {
        var inp = [];
        for (var i = 0; i < v.length; i++) inp.push(v.charCodeAt(i));
    }
    else inp = v;
    if (inp.length > bufsize) {
        buf = Module._malloc(inp.length);
        bufsize = inp.length;
    }
    Module.HEAPU8.set(inp, buf);
    hasher(obuf, sz, buf, v.length);
    var o = [];
    for (var i = 0; i < sz; i++) o.push(Module.getValue(obuf + i));
    return o;
}

function sha3_512(v) { return h(v, _s512, 64); }
function sha3_256(v) { return h(v, _s256, 32); }
function fips202_sha3_512(v) { return h(v, _fs512, 64); }
function fips202_sha3_256(v) { return h(v, _fs256, 32); }
