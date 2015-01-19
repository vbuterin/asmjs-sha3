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
