require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":1,"ieee754":4,"isarray":3}],3:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"Alert":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'c12553sxCxG/on0Bz7rkX0f', 'Alert');
// scripts/components/Alert.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _alert: null,
        _btnOK: null,
        _btnCancel: null,
        _title: null,
        _content: null,
        _onok: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._alert = cc.find("Canvas/alert");
        this._title = cc.find("Canvas/alert/title").getComponent(cc.Label);
        this._content = cc.find("Canvas/alert/content").getComponent(cc.Label);
        this._btnOK = cc.find("Canvas/alert/btn_ok");
        this._btnCancel = cc.find("Canvas/alert/btn_cancel");
        cc.vv.utils.addClickEvent(this._btnOK, this.node, "Alert", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._btnCancel, this.node, "Alert", "onBtnClicked");
        this._alert.active = false;
        cc.vv.alert = this;
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "btn_ok") {
            if (this._onok) {
                this._onok();
            }
        }
        this._alert.active = false;
        this._onok = null;
    },
    show: function show(title, content, onok, needcancel) {
        this._alert.active = true;
        this._onok = onok;
        this._title.string = title;
        this._content.string = content;
        if (needcancel) {
            this._btnCancel.active = true;
            this._btnOK.x = -150;
            this._btnCancel.x = 150;
        } else {
            this._btnCancel.active = false;
            this._btnOK.x = 0;
        }
    },
    onDestory: function onDestory() {
        if (cc.vv) {
            cc.vv.alert = null;
        }
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"Announcement":[function(require,module,exports){
"use strict";
cc._RFpush(module, '09575MN/CxH97HxpSlbuo85', 'Announcement');
// scripts/components/Announcement.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        ima1: {
            type: cc.SpriteFrame,
            default: null
        },
        ima2: {
            type: cc.SpriteFrame,
            default: null
        },
        lContent: cc.Node,
        rContent: cc.Node
    },
    onLoad: function onLoad() {},
    onBtnSwitch: function onBtnSwitch(event) {
        for (var i = 0; i < this.lContent.children.length; i++) {
            if (i == event.target.getSiblingIndex()) {
                this.lContent.children[i].getComponent("cc.Sprite").spriteFrame = this.ima1;
                this.rContent.children[i].active = true;
            } else {
                this.lContent.children[i].getComponent("cc.Sprite").spriteFrame = this.ima2;
                this.rContent.children[i].active = false;
            }
        }
    },
    refreshAnnouncement: function refreshAnnouncement() {
        for (var i = 0; i < this.lContent.children.length; i++) {
            cc.vv.utils.addClickEvent(this.lContent.children[i], this.node, "Announcement", "onBtnSwitch");
        };
    },
    getAnnouncement: function getAnnouncement() {
        var self = this;
        var fn = function fn(ret) {
            if (ret.errcode) {
                console.log("没有公告");
            } else {
                var i = 0;
                var y = self.lContent.children[0].y;
                var h = self.lContent.children[0].height;
                var node1 = self.lContent.children[0];
                var node2 = self.rContent.children[0];
                self.lContent.removeAllChildren();
                self.rContent.removeAllChildren();
                for (var key in ret) {
                    var n1 = cc.instantiate(node1);
                    var n2 = cc.instantiate(node2);
                    n1.getChildByName('label').getComponent(cc.Label).string = ret[key].title;
                    n2.getChildByName('notice_title2').getChildByName('label').getComponent(cc.Label).string = ret[key].title;
                    n2.getChildByName('richtext').getComponent(cc.RichText).string = ret[key].content;
                    n1.y = y - i * (20 + h);
                    if (i != 0) {
                        n2.active = false;
                        n1.getComponent("cc.Sprite").spriteFrame = self.ima2;
                    } else {
                        n2.active = true;
                        n1.getComponent("cc.Sprite").spriteFrame = self.ima1;
                    }
                    self.lContent.addChild(n1);
                    self.rContent.addChild(n2);
                    i++;
                }
                self.refreshAnnouncement();
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_announcement", data, fn);
    },
    onBtnClose: function onBtnClose() {
        this.node.active = false;
    },
    update: function update(dt) {}
});

cc._RFpop();
},{}],"AnysdkMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'f58cea6lrpDZJSNs2BGBqxN', 'AnysdkMgr');
// scripts/AnysdkMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _isCapturing: false
    },
    // use this for initialization
    onLoad: function onLoad() {},
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
    init: function init() {
        this.ANDROID_API = "com/vivigames/scmj/WXAPI";
        this.IOS_API = "AppController";
    },
    login: function login() {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "Login", "()V");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "login");
        } else {
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },
    share: function share(title, desc) {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(this.ANDROID_API, "Share", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", cc.vv.SI.appweb, title, desc);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(this.IOS_API, "share:shareTitle:shareDesc:", cc.vv.SI.appweb, title, desc);
        } else {
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },
    shareResult: function shareResult() {
        if (this._isCapturing) {
            return;
        }
        this._isCapturing = true;
        var size = cc.director.getWinSize();
        var currentDate = new Date();
        var fileName = "result_share.jpg";
        var fullPath = jsb.fileUtils.getWritablePath() + fileName;
        if (jsb.fileUtils.isFileExist(fullPath)) {
            jsb.fileUtils.removeFile(fullPath);
        }
        var texture = new cc.RenderTexture(Math.floor(size.width), Math.floor(size.height));
        texture.setPosition(cc.p(size.width / 2, size.height / 2));
        texture.begin();
        cc.director.getRunningScene().visit();
        texture.end();
        texture.saveToFile(fileName, cc.IMAGE_FORMAT_JPG);
        var self = this;
        var tryTimes = 0;
        var fn = function fn() {
            if (jsb.fileUtils.isFileExist(fullPath)) {
                var height = 100;
                var scale = height / size.height;
                var width = Math.floor(size.width * scale);
                if (cc.sys.os == cc.sys.OS_ANDROID) {
                    jsb.reflection.callStaticMethod(self.ANDROID_API, "ShareIMG", "(Ljava/lang/String;II)V", fullPath, width, height);
                } else if (cc.sys.os == cc.sys.OS_IOS) {
                    jsb.reflection.callStaticMethod(self.IOS_API, "shareIMG:width:height:", fullPath, width, height);
                } else {
                    console.log("platform:" + cc.sys.os + " dosn't implement share.");
                }
                self._isCapturing = false;
            } else {
                tryTimes++;
                if (tryTimes > 10) {
                    console.log("time out...");
                    return;
                }
                setTimeout(fn, 50);
            }
        };
        setTimeout(fn, 50);
    },
    onLoginResp: function onLoginResp(code, uid, roomid) {
        var fn = function fn(ret) {
            if (ret.errcode == 0) {
                console.log("返回的微信账号信息是:" + ret.account, ret.sign, ret.shareRoomId);
                cc.sys.localStorage.setItem("wx_account", ret.account);
                cc.sys.localStorage.setItem("wx_sign", ret.sign);
            }
            cc.vv.userMgr.onAuth(ret);
        };
        console.log("向微信发送验证请求");
        cc.vv.http.sendRequest("/wechat_auth", {
            code: code,
            uid: uid,
            os: cc.sys.os,
            roomid: roomid
        }, fn);
    }
});

cc._RFpop();
},{}],"AudioMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '55caepcpvFK5r0Ax5f8jss4', 'AudioMgr');
// scripts/AudioMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        bgmVolume: 1.0,
        sfxVolume: 1.0,
        bgmAudioID: -1
    },
    // use this for initialization
    init: function init() {
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t != null && t > 0) {
            this.bgmVolume = parseFloat(t);
        } else {
            cc.sys.localStorage.setItem("bgmVolume", 1.0);
        };
        var t = cc.sys.localStorage.getItem("sfxVolume");
        if (t != null && t > 0) {
            this.sfxVolume = parseFloat(t);
        } else {
            cc.sys.localStorage.setItem("sfxVolume", 1.0);
        };
        cc.game.on(cc.game.EVENT_HIDE, function () {
            console.log("cc.audioEngine.pauseAll");
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            console.log("cc.audioEngine.resumeAll");
            cc.audioEngine.resumeAll();
        });
    },
    getUrl: function getUrl(url) {
        return cc.url.raw("resources/sounds/" + url);
    },
    playBGM: function playBGM(url) {
        var audioUrl = this.getUrl(url);
        console.log(audioUrl);
        if (this.bgmAudioID >= 0) {
            cc.audioEngine.stop(this.bgmAudioID);
        }
        this.bgmAudioID = cc.audioEngine.play(audioUrl, true, this.bgmVolume);
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (t == null) {
            t = 0;
        }
        console.log('当前音量是多少' + t);
        this.setBGMVolume(t);
        // alert("当前的id是--"+this.bgmAudioID);
    },
    playSFX: function playSFX(url) {
        var audioUrl = this.getUrl(url);
        if (this.sfxVolume > 0) {
            var audioId = cc.audioEngine.play(audioUrl, false, this.sfxVolume);
        }
    },

    setSFXVolume: function setSFXVolume(v) {
        if (this.sfxVolume != v) {
            cc.sys.localStorage.setItem("sfxVolume", v);
            this.sfxVolume = v;
        }
    },
    setBGMVolume: function setBGMVolume(v, force) {
        if (this.bgmAudioID >= 0) {
            if (v > 0) {
                cc.audioEngine.resume(this.bgmAudioID);
            } else {
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }
        if (this.bgmVolume != v || force) {
            cc.sys.localStorage.setItem("bgmVolume", v);
            this.bgmVolume = v;
            cc.audioEngine.setVolume(this.bgmAudioID, v);
        }
    },
    pauseAll: function pauseAll() {
        cc.audioEngine.pauseAll();
    },
    resumeAll: function resumeAll() {
        cc.audioEngine.resumeAll();
    }
});

cc._RFpop();
},{}],"ChargeType":[function(require,module,exports){
"use strict";
cc._RFpush(module, '13f26e/5eVFWbY53112nuHF', 'ChargeType');
// scripts/components/ChargeType.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _charge: null,
        // 标题
        _title: null,
        // 确认按钮
        _btnOK: null,
        // 取消按钮
        _btnCancel: null,
        // 输入框
        _editbox: null,
        // 显示输入的金币数量
        _content: null,
        // 显示兑换率
        _rateTxt: null,
        _chargeCnt: null,
        _rate: 1,
        _costRMB: 0,
        // 最少充值数量
        _MINCOST: 1,
        _MAXCOSTRMB: 99999,
        _payParam: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initUI();
        //FIXME:  当前的兑换率是
        this.refreshInfo();
        cc.vv.chargeType = this;
    },
    initUI: function initUI() {
        this._charge = cc.find("Canvas/zuanshiChange");
        this._btnOK = cc.find("Canvas/zuanshiChange/yes").getComponent(cc.Button);
        this._btnCancel = cc.find("Canvas/zuanshiChange/no").getComponent(cc.Button);
        this._editbox = cc.find("Canvas/zuanshiChange/editbox").getComponent(cc.EditBox);
    },
    onCloseBtnClicked: function onCloseBtnClicked() {
        console.log("关闭界面");
        this._editbox.string = "";
        this._charge.active = false;
        cc.vv.wc.hide();
    },
    onConfirmBtnClicked: function onConfirmBtnClicked() {
        this.refreshInfo();
        // 验证是不是整数，不是整数要求重新输入
        console.log("金额是", this._costRMB);
        var flag = this.validateIntNum(this._costRMB);
        if (!flag) {
            var str = "请输入整数金额,且最小充值金额" + this._MINCOST + "元";
            cc.vv.alert.show("注意", str);
        } else {
            var fn = function fn(ret) {
                cc.vv.wc.hide();
                if (ret == null) {
                    cc.vv.alert.show("注意", "充值失败请稍后重试");
                    return;
                }
                this.sendChargeRequest(ret);
                cc.vv.wc.show("正在充值，请稍后");
            };
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                userid: cc.vv.userMgr.userId,
                costRMB: this._costRMB,
                ship_type: 1
            };
            cc.vv.wc.show("正在充值，请稍后");
            cc.vv.http.sendRequest("/go_to_charge", data, fn.bind(this));
        }
    },
    show: function show() {
        this._charge.active = true;
    },
    refreshInfo: function refreshInfo() {
        this._rate = 1 || cc.vv.userMgr.chargerate;
        this._costRMB = Number(this._editbox.string);
        console.log('this.cost', this._costRMB);
        // this._chargeCnt = (this._chargeCnt * this._rate).toFixed(0);
        // if (!this._costRMB) {
        //     this._content.string = "您当前未输入充值金额";
        // } else {
        //     this._content.string = "您输入的金额是:" + this._costRMB;
        // }
    },
    // 判断是不是输入的正确的金额
    validateIntNum: function validateIntNum(val) {
        var patten = /^[1-9]\d*$/;
        var flag = patten.test(val);
        if (!flag) {
            return false;
        } else {
            console.log("当前输入的数字是正整数", val, this._MINCOST);
            return val >= this._MINCOST;
        }
    },
    // 发送申请充值请求
    sendChargeRequest: function sendChargeRequest(data) {
        if (data == null) {
            cc.vv.alert.show("注意", "充值失败请稍后重试");
            return;
        }
        console.log("发送 充值请求");
        var url = "http://mj.yajugame.com/manage1/?/go/index/payDo/";
        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <= 207) {
                var httpStatus = xhr.statusText;
                var response = JSON.parse(xhr.responseText);
                console.log("返回！！！！！" + response.errmsg + "response.errcode:" + response.errcode);
                if (response.errcode == 0) {
                    var ret = response.errmsg;
                    console.log("返回的结果是!!!!!!" + ret);
                    this._payParam = ret;
                    if (!cc.sys.isNative) {
                        console.log("是H5游戏");
                        window.pay(this._payParam);
                    }
                    // 接收完后，隐藏充值窗口
                    this.onCloseBtnClicked();
                } else {
                    cc.vv.alert.show("注意", "充值失败请稍后重试");
                    cc.vv.wc.hide();
                    console.log("返回的结果出错");
                }
            } else {
                console.log("无结果返回");
            }
        }.bind(this);
        xhr.timeout = 5000; // 5 seconds for timeout
        var req = JSON.stringify(data);
        xhr.send(req);
    }
});

cc._RFpop();
},{}],"Charge":[function(require,module,exports){
"use strict";
cc._RFpush(module, '5102696ophLmZJO8XdAVsYZ', 'Charge');
// scripts/components/Charge.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _charge: null,
        // 标题
        _title: null,
        // 确认按钮
        _btnOK: null,
        // 取消按钮
        _btnCancel: null,
        // 输入框
        _editbox: null,
        // 显示输入的金币数量
        _content: null,
        // 显示兑换率
        _rateTxt: null,
        _chargeCnt: null,
        _rate: 1,
        _costRMB: 0,
        // 最少充值数量
        _MINCOST: 1,
        _MAXCOSTRMB: 99999,
        _payParam: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initUI();
        //FIXME:  当前的兑换率是
        this.refreshInfo();
        cc.vv.charge = this;
    },
    initUI: function initUI() {
        this._charge = cc.find("Canvas/charge");
        this._title = cc.find("Canvas/charge/title").getComponent(cc.Label);
        this._btnOK = cc.find("Canvas/charge/btn_ok").getComponent(cc.Button);
        this._btnCancel = cc.find("Canvas/charge/btn_cancel").getComponent(cc.Button);
        this._editbox = cc.find("Canvas/charge/editbox").getComponent(cc.EditBox);
        this._content = cc.find("Canvas/charge/content").getComponent(cc.Label);
        this._rateTxt = cc.find("Canvas/charge/rate").getComponent(cc.Label);
    },
    onCloseBtnClicked: function onCloseBtnClicked() {
        console.log("关闭界面");
        this._editbox.string = "";
        this._charge.active = false;
        cc.vv.wc.hide();
    },
    onConfirmBtnClicked: function onConfirmBtnClicked() {
        this.refreshInfo();
        // 验证是不是整数，不是整数要求重新输入
        console.log("金额是", this._costRMB);
        var flag = this.validateIntNum(this._costRMB);
        if (!flag) {
            var str = "请输入整数金额,且最小充值金额" + this._MINCOST + "元";
            cc.vv.alert.show("注意", str);
        } else {
            var fn = function fn(ret) {
                cc.vv.wc.hide();
                if (ret == null) {
                    cc.vv.alert.show("注意", "充值失败请稍后重试");
                    return;
                }
                this.sendChargeRequest(ret);
                cc.vv.wc.show("正在充值，请稍后");
            };
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                userid: cc.vv.userMgr.userId,
                costRMB: this._costRMB,
                ship_type: 0
            };
            cc.vv.wc.show("正在充值，请稍后");
            cc.vv.http.sendRequest("/go_to_charge", data, fn.bind(this));
        }
    },
    show: function show() {
        this._charge.active = true;
    },
    refreshInfo: function refreshInfo() {
        this._rate = 1 || cc.vv.userMgr.chargerate;
        this._costRMB = Number(this._editbox.string);
        console.log('this.cost', this._costRMB);
        // this._chargeCnt = (this._chargeCnt * this._rate).toFixed(0);
        if (!this._costRMB) {
            this._content.string = "您当前未输入充值金额";
        } else {
            this._content.string = "您输入的金额是:" + this._costRMB;
        }
    },
    // 判断是不是输入的正确的金额
    validateIntNum: function validateIntNum(val) {
        var patten = /^[1-9]\d*$/;
        var flag = patten.test(val);
        if (!flag) {
            return false;
        } else {
            console.log("当前输入的数字是正整数", val, this._MINCOST);
            return val >= this._MINCOST;
        }
    },
    // 发送申请充值请求
    sendChargeRequest: function sendChargeRequest(data) {
        if (data == null) {
            cc.vv.alert.show("注意", "充值失败请稍后重试");
            return;
        }
        console.log("发送 充值请求");
        var url = "http://mj.yajugame.com/manage1/?/go/index/payDo/";
        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <= 207) {
                var httpStatus = xhr.statusText;
                var response = JSON.parse(xhr.responseText);
                console.log("返回！！！！！" + response.errmsg + "response.errcode:" + response.errcode);
                if (response.errcode == 0) {
                    var ret = response.errmsg;
                    console.log("返回的结果是!!!!!!" + ret);
                    this._payParam = ret;
                    if (!cc.sys.isNative) {
                        console.log("是H5游戏");
                        window.pay(this._payParam);
                    }
                    // 接收完后，隐藏充值窗口
                    this.onCloseBtnClicked();
                } else {
                    cc.vv.alert.show("注意", "充值失败请稍后重试");
                    cc.vv.wc.hide();
                    console.log("返回的结果出错");
                }
            } else {
                console.log("无结果返回");
            }
        }.bind(this);
        xhr.timeout = 5000; // 5 seconds for timeout
        var req = JSON.stringify(data);
        xhr.send(req);
    }
});

cc._RFpop();
},{}],"Chat":[function(require,module,exports){
"use strict";
cc._RFpush(module, '58f27rxustNsYlRX3fryN8X', 'Chat');
// scripts/components/Chat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _chatRoot: null,
        _tabQuick: null,
        _tabEmoji: null,
        _iptChat: null,
        _quickChatInfo: null,
        _btnChat: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        cc.vv.chat = this;
        this._btnChat = this.node.getChildByName("btn_chat");
        this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {
            index: 0,
            content: "快点啊，都等到我花儿都谢谢了！",
            sound: "fix_msg_1.mp3"
        };
        this._quickChatInfo["item1"] = {
            index: 1,
            content: "怎么又断线了，网络怎么这么差啊！",
            sound: "fix_msg_2.mp3"
        };
        this._quickChatInfo["item2"] = {
            index: 2,
            content: "不要走，决战到天亮！",
            sound: "fix_msg_3.mp3"
        };
        this._quickChatInfo["item3"] = {
            index: 3,
            content: "你的牌打得也太好了！",
            sound: "fix_msg_4.mp3"
        };
        this._quickChatInfo["item4"] = {
            index: 4,
            content: "你是妹妹还是哥哥啊？",
            sound: "fix_msg_5.mp3"
        };
        this._quickChatInfo["item5"] = {
            index: 5,
            content: "和你合作真是太愉快了！",
            sound: "fix_msg_6.mp3"
        };
        this._quickChatInfo["item6"] = {
            index: 6,
            content: "大家好，很高兴见到各位！",
            sound: "fix_msg_7.mp3"
        };
        this._quickChatInfo["item7"] = {
            index: 7,
            content: "各位，真是不好意思，我得离开一会儿。",
            sound: "fix_msg_8.mp3"
        };
        this._quickChatInfo["item8"] = {
            index: 8,
            content: "不要吵了，专心玩游戏吧！",
            sound: "fix_msg_9.mp3"
        };
    },
    getQuickChatInfo: function getQuickChatInfo(index) {
        var key = "item" + index;
        return this._quickChatInfo[key];
    },

    onBtnChatClicked: function onBtnChatClicked() {
        this._chatRoot.active = true;
    },
    onBgClicked: function onBgClicked() {
        this._chatRoot.active = false;
    },
    onTabClicked: function onTabClicked(event) {
        if (event.target.name == "tabQuick") {
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        } else if (event.target.name == "tabEmoji") {
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    onQuickChatItemClicked: function onQuickChatItemClicked(event) {
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat", info.index);
    },
    onEmojiItemClicked: function onEmojiItemClicked(event) {
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji", event.target.name);
    },
    onBtnSendChatClicked: function onBtnSendChatClicked() {
        this._chatRoot.active = false;
        if (this._iptChat.string == "") {
            return;
        }
        cc.vv.net.send("chat", this._iptChat.string);
        this._iptChat.string = "";
    }
});

cc._RFpop();
},{}],"CheckBox":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'dc9e5hcegFBFpbh0CwUFw8V', 'CheckBox');
// scripts/components/CheckBox.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        target: cc.Node,
        sprite: cc.SpriteFrame,
        checkedSprite: cc.SpriteFrame,
        checked: false
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.refresh();
    },
    onClicked: function onClicked() {
        this.checked = !this.checked;
        this.refresh();
    },
    refresh: function refresh() {
        var targetSprite = this.target.getComponent(cc.Sprite);
        if (this.checked) {
            targetSprite.spriteFrame = this.checkedSprite;
        } else {
            targetSprite.spriteFrame = this.sprite;
        }
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"Collapse":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'a0204tG1oNHzbCpkxGvdJW8', 'Collapse');
// scripts/Collapse.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        bthLQ1: cc.Node,
        bthLQ2: cc.Node,
        bthLQ3: cc.Node,
        bthLQ4: cc.Node,
        bthSC1: cc.Node,
        bthSC2: cc.Node,
        left_content: cc.Node,
        right_content: cc.Node,
        ima1: {
            type: cc.SpriteFrame,
            default: null
        },
        ima2: {
            type: cc.SpriteFrame,
            default: null
        }
    },
    // use this for initialization
    onLoad: function onLoad() {
        cc.vv.utils.addClickEvent(this.bthLQ1, this.node, "Collapse", "onBtnLq");
        cc.vv.utils.addClickEvent(this.bthLQ3, this.node, "Collapse", "onBtnLq");
        for (var i = 0; i < this.left_content.children.length; i++) {
            cc.vv.utils.addClickEvent(this.left_content.children[i], this.node, "Collapse", "onBtnSwitch");
        };
    },
    onBtnSwitch: function onBtnSwitch(event) {
        for (var i = 0; i < this.left_content.children.length; i++) {
            if (i == event.target.getSiblingIndex()) {
                this.left_content.children[i].getComponent("cc.Sprite").spriteFrame = this.ima1;
                this.right_content.children[i].active = true;
            } else {
                this.left_content.children[i].getComponent("cc.Sprite").spriteFrame = this.ima2;
                this.right_content.children[i].active = false;
            }
        }
    },
    refreshBtns: function refreshBtns() {
        if (cc.vv.userMgr.collapse_prise >= 2) {
            this.bthLQ1.active = false;
            this.bthLQ2.active = true;
            this.bthLQ3.active = false;
            this.bthLQ4.active = true;
        } else {
            if (cc.vv.userMgr.collapse_prise == 1) {
                if (parseInt(cc.vv.userMgr.gems) < 10000) {
                    this.bthLQ1.active = false;
                    this.bthLQ2.active = true;
                    this.bthLQ3.active = true;
                    this.bthLQ4.active = false;
                } else {
                    this.bthLQ1.active = false;
                    this.bthLQ2.active = true;
                    this.bthLQ3.active = false;
                    this.bthLQ4.active = true;
                }
            }
            if (cc.vv.userMgr.collapse_prise <= 0) {
                if (parseInt(cc.vv.userMgr.gems) < 10000) {
                    this.bthLQ1.active = true;
                    this.bthLQ2.active = false;
                    this.bthLQ3.active = false;
                    this.bthLQ4.active = true;
                } else {
                    this.bthLQ1.active = false;
                    this.bthLQ2.active = true;
                    this.bthLQ3.active = false;
                    this.bthLQ4.active = true;
                }
            }
        }
        if (cc.vv.userMgr.is_first_charge == 1) {
            this.bthSC1.active = true;
            this.bthSC2.active = false;
        } else {
            this.bthSC1.active = false;
            this.bthSC2.active = true;
        }
    },
    onBtnLq: function onBtnLq() {
        var self = this;
        var fn = function fn(ret) {
            if (ret.errcode == 0) {
                cc.vv.userMgr.gems = ret.gems;
                cc.vv.userMgr.coins = ret.coins;
                cc.vv.userMgr.collapse_prise = ret.collapse_prise;
            }
            self.refreshBtns();
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_collapse", data, fn);
    },
    onBtnSC: function onBtnSC() {
        var self = this;
        var fn = function fn(ret) {
            if (ret.errcode == 0) {
                cc.vv.userMgr.gems = ret.gems;
                cc.vv.userMgr.coins = ret.coins;
                cc.vv.userMgr.is_first_charge = ret.is_first_charge;
            }
            self.refreshBtns();
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_first_charge", data, fn);
    },
    update: function update(dt) {}
});

cc._RFpop();
},{}],"CqNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '86cf71G/4VA35+lnYHmSM6a', 'CqNetMgr');
// scripts/CqNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log("login_result===>", data);
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.room_type = data.conf.room_type;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                self.cq_data = data.data;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            console.log("login_finished");
            cc.director.loadScene("caiquan");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.cqDispatchEvent("disconnect");
        });
        cc.vv.net.addHandler("cq_begin_push", function (data) {
            console.log("cq_begin_push");
            self.cqDispatchEvent("cq_begin", data);
        });
        cc.vv.net.addHandler("cq_new_user_comes_push", function (data) {
            console.log("cq_new_user_comes_push", data);
            self.cq_data = data.data;
            self.cqDispatchEvent("cq_new_user", data);
        });
        cc.vv.net.addHandler("cq_game_over_push", function (data) {
            console.log("cq_game_over_push", data);
            self.cqDispatchEvent("cq_game_over", data);
        });
        cc.vv.net.addHandler("cq_game_time_push", function (data) {
            // console.log("cq_game_time_push", data);
            self.cqDispatchEvent("cq_game_time", data);
        });
        cc.vv.net.addHandler("cq_exit_notify_push", function (data) {
            var userId = data;
            self.cqDispatchEvent("cq_exit_notify", userId);
        });
        cc.vv.net.addHandler("cq_dispress_push", function (data) {
            var userId = data;
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
            self.cq_data = null;
            self.cqDispatchEvent("cq_dispress", userId);
        });
        cc.vv.net.addHandler("cq_loser_notify_push", function (data) {
            var userId = data;
            if (cc.vv.userMgr.userId == userId) {
                self.roomId = null;
                self.room_type = -1;
                self.turn = -1;
                self.seats = null;
                self.cq_data = null;
            }
            self.cqDispatchEvent("cq_loser_notify", userId);
        });
        cc.vv.net.addHandler("cq_winner_notify_push", function (data) {
            var userId = data;
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
            self.cq_data = null;
            self.cqDispatchEvent("cq_winner_notify", userId);
        });
        cc.vv.net.addHandler("cq_chuquan_notify_push", function (data) {
            self.cqDispatchEvent("cq_chuquan_notify", data);
        });
    }
});

cc._RFpop();
},{}],"CreateRoom":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'eec07HsL4pBn5/PiT3SYBew', 'CreateRoom');
// scripts/components/CreateRoom.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _difenxuanze: null,
        _zimo: null,
        _wanfaxuanze: null,
        _jushuxuanze: null,
        _dianganghua: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._difenxuanze = [];
        var t = this.node.getChildByName("difenxuanze");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._difenxuanze.push(n);
            }
        }
        console.log(this._difenxuanze);
        this._wanfaxuanze = [];
        var t = this.node.getChildByName("wanfaxuanze");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("CheckBox");
            if (n != null) {
                this._wanfaxuanze.push(n);
            }
        }
        console.log(this._wanfaxuanze);
        this._jushuxuanze = [];
        var t = this.node.getChildByName("xuanzejushu");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._jushuxuanze.push(n);
            }
        }
    },
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    onBtnOK: function onBtnOK() {
        this.node.active = false;
        this.createRoom();
    },
    createRoom: function createRoom() {
        var self = this;
        var onCreate = function onCreate(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2222) {
                    cc.vv.alert.show("提示", "金币不足，创建房间失败!");
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = 0;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var difen = 0;
        for (var i = 0; i < self._difenxuanze.length; ++i) {
            if (self._difenxuanze[i].checked) {
                difen = i;
                break;
            }
        }
        var yikouxiang = self._wanfaxuanze[0].checked;
        var yipaoduoxiang = self._wanfaxuanze[1].checked;
        // 类型选择一口香，默认设置不可修改
        var type = "ykx";
        var jushuxuanze = 0;
        for (var i = 0; i < self._jushuxuanze.length; ++i) {
            if (self._jushuxuanze[i].checked) {
                jushuxuanze = i;
                break;
            }
        }
        var conf = {
            room_type: 0, //0代表麻将房间
            type: type,
            difen: difen,
            jushuxuanze: jushuxuanze,
            yipaoduoxiang: yipaoduoxiang
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        console.log(data);
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, onCreate);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"DnChat":[function(require,module,exports){
"use strict";
cc._RFpush(module, '4f140eGiLhFPKjLpkkOkFGo', 'DnChat');
// scripts/components/DnChat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _chatRoot: null,
        _tabQuick: null,
        _tabEmoji: null,
        _iptChat: null,
        _quickChatInfo: null,
        _btnChat: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        cc.vv.zjhchat = this;
        // this._btnChat = this.node.getChildByName("xinxi");
        // this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {
            index: 0,
            content: "快点啊，都等到我花儿都谢谢了！",
            sound: "fix_msg_1.mp3"
        };
        this._quickChatInfo["item1"] = {
            index: 1,
            content: "怎么又断线了，网络怎么这么差啊！",
            sound: "fix_msg_2.mp3"
        };
        this._quickChatInfo["item2"] = {
            index: 2,
            content: "不要走，决战到天亮！",
            sound: "fix_msg_3.mp3"
        };
        this._quickChatInfo["item3"] = {
            index: 3,
            content: "你的牌打得也太好了！",
            sound: "fix_msg_4.mp3"
        };
        this._quickChatInfo["item4"] = {
            index: 4,
            content: "你是妹妹还是哥哥啊？",
            sound: "fix_msg_5.mp3"
        };
        this._quickChatInfo["item5"] = {
            index: 5,
            content: "和你合作真是太愉快了！",
            sound: "fix_msg_6.mp3"
        };
        this._quickChatInfo["item6"] = {
            index: 6,
            content: "大家好，很高兴见到各位！",
            sound: "fix_msg_7.mp3"
        };
        this._quickChatInfo["item7"] = {
            index: 7,
            content: "各位，真是不好意思，我得离开一会儿。",
            sound: "fix_msg_8.mp3"
        };
        this._quickChatInfo["item8"] = {
            index: 8,
            content: "不要吵了，专心玩游戏吧！",
            sound: "fix_msg_9.mp3"
        };
    },
    getQuickChatInfo: function getQuickChatInfo(index) {
        var key = "item" + index;
        return this._quickChatInfo[key];
    },

    onBtnChatClicked: function onBtnChatClicked() {
        this._chatRoot.active = true;
    },
    onBgClicked: function onBgClicked() {
        this._chatRoot.active = false;
    },
    onTabClicked: function onTabClicked(event) {
        if (event.target.name == "tabQuick") {
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        } else if (event.target.name == "tabEmoji") {
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    onQuickChatItemClicked: function onQuickChatItemClicked(event) {
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat", info.index);
    },
    onEmojiItemClicked: function onEmojiItemClicked(event) {
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji", event.target.name);
    },
    onBtnSendChatClicked: function onBtnSendChatClicked() {
        this._chatRoot.active = false;
        if (this._iptChat.string == "") {
            return;
        }
        cc.vv.net.send("chat", this._iptChat.string);
        this._iptChat.string = "";
    }
});

cc._RFpop();
},{}],"DnNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'b88c0v9pnZPgKkHlfIEBTYl', 'DnNetMgr');
// scripts/DnNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log("login_result===>", data);
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.room_type = data.conf.room_type;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                self.cq_data = data.data;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            console.log("login_finished");
            cc.director.loadScene("dngame");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("exit_notify_push", function (data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
        cc.vv.net.addHandler("not_exit_push", function (data) {
            self.dispatchEvent("not_exit", data);
        });
        cc.vv.net.addHandler("count_down_push", function (data) {
            self.dispatchEvent("count_down", data);
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            self.dispatchEvent("exit_room");
            if (self.roomId == null) {
                cc.director.loadScene("newhall");
                self.room_type = -1;
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    self.roomId = null;
                    self.room_type = -1;
                }
            }
        });
        // 新人加入房间
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
        //游戏初始化 
        cc.vv.net.addHandler("game_initInfo_push", function (data) {
            var gameInfo = data.gameInfo;
            self.dispatchEvent('game_init', gameInfo);
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            var data = data;
            self.dispatchEvent('game_begin', data);
        });
        cc.vv.net.addHandler("game_b_OneQzEnd", function (data) {
            var data = data;
            self.dispatchEvent('show_qiang', data);
        });
        cc.vv.net.addHandler("game_zhuangSelected_push", function (data) {
            var data = data;
            self.dispatchEvent('game_zhuangSelected', data);
        });
        cc.vv.net.addHandler("game_myXzBegin_push", function (data) {
            var data = data;
            self.dispatchEvent('game_myXzBegin', data);
        });
        cc.vv.net.addHandler("game_myHoldsUpdate_push", function (data) {
            var data = data;
            self.dispatchEvent('game_myHoldsUpdate', data);
        });
        cc.vv.net.addHandler("game_myXzEnd_push", function (data) {
            var data = data;
            self.dispatchEvent('game_myXzEnd', data);
        });
        cc.vv.net.addHandler("game_b_OneXzEnd", function (data) {
            var data = data;
            self.dispatchEvent('show_beiShuText', data);
        });
        cc.vv.net.addHandler("game_b_OneSnEnd", function (data) {
            var data = data;
            self.dispatchEvent('game_b_OneSnEnd', data);
        });
        cc.vv.net.addHandler("game_showAllUser_push", function (data) {
            var data = data;
            self.dispatchEvent('game_showAllUser', data);
        });
    }
});

cc._RFpop();
},{}],"DzpkChat":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'e962ci+LvxH+IxIaKKQZ1Ly', 'DzpkChat');
// scripts/components/DzpkChat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _chatRoot: null,
        _tabQuick: null,
        _tabEmoji: null,
        _iptChat: null,
        _quickChatInfo: null,
        _btnChat: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        cc.vv.zjhchat = this;
        // this._btnChat = this.node.getChildByName("xinxi");
        // this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {
            index: 0,
            content: "快点啊，都等到我花儿都谢谢了！",
            sound: "fix_msg_1.mp3"
        };
        this._quickChatInfo["item1"] = {
            index: 1,
            content: "怎么又断线了，网络怎么这么差啊！",
            sound: "fix_msg_2.mp3"
        };
        this._quickChatInfo["item2"] = {
            index: 2,
            content: "不要走，决战到天亮！",
            sound: "fix_msg_3.mp3"
        };
        this._quickChatInfo["item3"] = {
            index: 3,
            content: "你的牌打得也太好了！",
            sound: "fix_msg_4.mp3"
        };
        this._quickChatInfo["item4"] = {
            index: 4,
            content: "你是妹妹还是哥哥啊？",
            sound: "fix_msg_5.mp3"
        };
        this._quickChatInfo["item5"] = {
            index: 5,
            content: "和你合作真是太愉快了！",
            sound: "fix_msg_6.mp3"
        };
        this._quickChatInfo["item6"] = {
            index: 6,
            content: "大家好，很高兴见到各位！",
            sound: "fix_msg_7.mp3"
        };
        this._quickChatInfo["item7"] = {
            index: 7,
            content: "各位，真是不好意思，我得离开一会儿。",
            sound: "fix_msg_8.mp3"
        };
        this._quickChatInfo["item8"] = {
            index: 8,
            content: "不要吵了，专心玩游戏吧！",
            sound: "fix_msg_9.mp3"
        };
    },
    getQuickChatInfo: function getQuickChatInfo(index) {
        var key = "item" + index;
        return this._quickChatInfo[key];
    },

    onBtnChatClicked: function onBtnChatClicked() {
        this._chatRoot.active = true;
    },
    onBgClicked: function onBgClicked() {
        this._chatRoot.active = false;
    },
    onTabClicked: function onTabClicked(event) {
        if (event.target.name == "tabQuick") {
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        } else if (event.target.name == "tabEmoji") {
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    onQuickChatItemClicked: function onQuickChatItemClicked(event) {
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat", info.index);
    },
    onEmojiItemClicked: function onEmojiItemClicked(event) {
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji", event.target.name);
    },
    onBtnSendChatClicked: function onBtnSendChatClicked() {
        this._chatRoot.active = false;
        if (this._iptChat.string == "") {
            return;
        }
        cc.vv.net.send("chat", this._iptChat.string);
        this._iptChat.string = "";
    }
});

cc._RFpop();
},{}],"DzpkNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'bf725IY7KRKX7l9fK/74VIp', 'DzpkNetMgr');
// scripts/DzpkNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        seatIndex: -1,
        seats: null,
        turn: -1,
        button: -1,
        chu: -1,
        maxNumOfGames: 0,
        numOfGames: 0,
        isOver: false,
        consume_num: 0
    },
    reset: function reset() {
        this.turn = -1;
        this.chu = -1;
        this.button = -1;
        this.curaction = null;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].op = null;
            this.seats[i].ready = false;
        }
    },
    clear: function clear() {},
    getSeatIndexByID: function getSeatIndexByID(userId) {
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            if (s.userid == userId) {
                return i;
            }
        }
        return -1;
    },
    isOwner: function isOwner() {
        return this.seatIndex == 0;
    },
    getSeatByID: function getSeatByID(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },
    getSelfData: function getSelfData() {
        return this.seats[this.seatIndex];
    },
    getLocalIndex: function getLocalIndex(index) {
        var ret = (index - this.seatIndex + 5) % 5;
        return ret;
    },
    getLocalIndexByUserId: function getLocalIndexByUserId(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var ret = this.getLocalIndex(seatIndex);
        return ret;
    },
    dispatchEvent: function dispatchEvent(event, data) {
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },
    initHandlers: function initHandlers(GameNet) {
        var self = this;
        cc.vv.net.addHandler("login_result", function (data) {
            if (data.errcode === 0) {
                var data = data.data;
                cc.vv.gameNetMgr.roomId = data.roomid;
                cc.vv.gameNetMgr.room_type = data.conf.room_type;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                self.consume_num = data.scene.consume_num ? data.scene.consume_num : 50;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            cc.director.loadScene("dzpkgame");
        });
        cc.vv.net.addHandler("socket_MyHolds", function (data) {
            if (data && data.length > 0) {
                self.dispatchEvent("socket_MyHolds", data);
            }
        });
        cc.vv.net.addHandler("count_down_push", function (data) {
            self.dispatchEvent("count_down", data);
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            self.dispatchEvent("game_begin", data);
        });
        cc.vv.net.addHandler("game_diChiUpdate_push", function (data) {
            self.dispatchEvent("game_diChiUpdate", data);
        });
        cc.vv.net.addHandler("game_myInfo_push", function (data) {
            var seat = self.getSeatByID(data.userid);
            seat.score = data.money;
            self.dispatchEvent("game_myInfo", data);
        });
        cc.vv.net.addHandler("game_myTurn_push", function (data) {
            self.dispatchEvent("game_myTurn", data);
        });
        cc.vv.net.addHandler("game_oneClickGuo_push", function (data) {
            self.dispatchEvent("game_oneGuo", data);
        });
        cc.vv.net.addHandler("game_oneGen_push", function (data) {
            var seat = self.getSeatByID(data.userid);
            seat.score = data.money;
            self.dispatchEvent("game_oneGen", data);
        });
        cc.vv.net.addHandler("game_oneAllIn_push", function (data) {
            var seat = self.getSeatByID(data.userid);
            seat.score = data.money;
            self.dispatchEvent("game_oneAllIn", data);
        });
        cc.vv.net.addHandler("game_oneQuit_push", function (data) {
            self.dispatchEvent("game_oneQuit", data);
        });
        cc.vv.net.addHandler("game_playersInNewCircle_push", function (data) {
            self.dispatchEvent("game_playersInNewCircle", data);
        });
        cc.vv.net.addHandler("game_newCircle_push", function (data) {
            self.dispatchEvent("game_newCircle", data);
        });
        cc.vv.net.addHandler("game_turnChanged_push", function (data) {
            if (cc.vv.userMgr.userId != data) {
                self.dispatchEvent("game_turnChanged", data);
            }
        });
        cc.vv.net.addHandler("game_caculateResult_push", function (data) {
            for (var i = 0; i < data.length; i++) {
                if (cc.vv.userMgr.userId == data[i].userid && data[i].isWinner) {
                    self.dispatchEvent("game_winner", data);
                } else if (cc.vv.userMgr.userId == data[i].userid && !data[i].isWinner) {
                    self.dispatchEvent("game_loser", data);
                }
            };
            self.dispatchEvent("game_caculateResult", data);
        });
        cc.vv.net.addHandler("game_myARGStatusChanged_push", function (data) {
            self.dispatchEvent("game_myARGStatusChanged", data);
        });
        cc.vv.net.addHandler("game_over", function (data) {
            self.dispatchEvent("game_over", data);
        });
        cc.vv.net.addHandler("game_gameInfoById_push", function (data) {
            if (data) self.dispatchEvent("game_gameInfoById", data);
        });
        cc.vv.net.addHandler("game_userInfoById_push", function (data) {
            self.dispatchEvent("game_userInfoById", data);
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
            self.dispatchEvent("exit_result", data);
        });
        cc.vv.net.addHandler("exit_notify_push", function (data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            self.dispatchEvent("exit_room");
            if (self.roomId == null) {
                cc.director.loadScene("newhall");
                self.room_type = -1;
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    self.roomId = null;
                    self.room_type = -1;
                }
            }
        });
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
        // 新人加入房间
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
                self.seats[seatIndex].ready = data.ready;
                self.seats[seatIndex].score = data.score;
                self.seats[seatIndex].status = data.status;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
    }
});

cc._RFpop();
},{}],"Folds":[function(require,module,exports){
"use strict";
cc._RFpush(module, '0bf63eiZEFMWbW03o8heqa5', 'Folds');
// scripts/components/Folds.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _folds: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initView();
        this.initEventHandler();
        this.initAllFolds();
    },
    initView: function initView() {
        this._folds = {};
        var game = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var sideName = sides[i];
            var sideRoot = game.getChildByName(sideName);
            var folds = [];
            var foldRoot = sideRoot.getChildByName("folds");
            for (var j = 0; j < foldRoot.children.length; ++j) {
                var n = foldRoot.children[j];
                n.active = false;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = null;
                folds.push(sprite);
            }
            this._folds[sideName] = folds;
        }
        this.hideAllFolds();
    },
    hideAllFolds: function hideAllFolds() {
        for (var k in this._folds) {
            var f = this._folds[i];
            for (var i in f) {
                f[i].node.active = false;
            }
        }
    },
    initEventHandler: function initEventHandler() {
        var self = this;
        this.node.on('game_begin', function (data) {
            self.initAllFolds();
        });
        this.node.on('game_sync', function (data) {
            self.initAllFolds();
        });
        this.node.on('game_chupai_notify', function (data) {
            self.initFolds(data.detail);
        });
        this.node.on('guo_notify', function (data) {
            self.initFolds(data.detail);
        });
    },
    initAllFolds: function initAllFolds() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.initFolds(seats[i]);
        }
    },
    initFolds: function initFolds(seatData) {
        var folds = seatData.folds;
        if (folds == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var foldsSprites = this._folds[side];
        for (var i = 0; i < folds.length; ++i) {
            var index = i;
            if (side == "right" || side == "up") {
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];
            this.setSpriteFrameByMJID(pre, sprite, folds[i]);
            if (side == "myself" && i == folds.length - 1) {
                //如果是最后一个
                var target_node = sprite.node;
                var old_x = target_node.x;
                var old_y = target_node.y;
                var pos = {
                    x: 0,
                    y: 0
                };
                var folds_diff_x = cc.find("Canvas/game/myself/folds").x;
                if (pos) {
                    target_node.x = pos.x / 0.8 - folds_diff_x / 0.8; //移到出牌位置
                    target_node.y = 70;
                    var action = cc.moveTo(0.2, cc.p(old_x, old_y));
                    target_node.runAction(action);
                }
            } else {
                sprite.node.active = true;
            }
        }
        for (var i = folds.length; i < foldsSprites.length; ++i) {
            var index = i;
            if (side == "right" || side == "up") {
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },
    setSpriteFrameByMJID: function setSpriteFrameByMJID(pre, sprite, mjid) {
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
        sprite.node.active = true;
    }
});

cc._RFpop();
},{}],"GameNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '9545659TARKZLMoHGqXoY2N', 'GameNetMgr');
// scripts/GameNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        dataEventHandler: null,
        cqEventHandler: null,
        roomId: null,
        maxNumOfGames: 0,
        numOfGames: 0,
        numOfMJ: 0,
        seatIndex: -1,
        seats: null,
        turn: -1,
        button: -1,
        chupai: -1,
        gamestate: "",
        isOver: false,
        dissoveData: null,
        room_type: -1,
        cq_data: null
    },
    reset: function reset() {
        this.turn = -1;
        this.chupai = -1;
        this.button = -1;
        this.gamestate = "";
        this.curaction = null;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].holds = [];
            this.seats[i].folds = [];
            this.seats[i].pengs = [];
            this.seats[i].caiShen = [];
            this.seats[i].chis = [];
            this.seats[i].angangs = [];
            this.seats[i].diangangs = [];
            this.seats[i].wangangs = [];
            this.seats[i].ready = false;
            this.seats[i].hued = false;
            this.seats[i].tinged = false;
        }
    },
    clear: function clear() {
        this.dataEventHandler = null;
        this.cqEventHandler = null;
        if (this.isOver == null) {
            this.seats = null;
            this.roomId = null;
            this.room_type = -1;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
        }
    },
    dispatchEvent: function dispatchEvent(event, data) {
        if (event == 'test') console.log(this.dataEventHandler);
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },
    cqDispatchEvent: function cqDispatchEvent(event, data) {
        if (this.cqEventHandler) {
            // console.log('cqDispatchEvent',data);
            this.cqEventHandler.emit(event, data);
        }
    },

    getSeatIndexByID: function getSeatIndexByID(userId) {
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            if (s.userid == userId) {
                return i;
            }
        }
        return -1;
    },
    isOwner: function isOwner() {
        return this.seatIndex == 0;
    },
    getSeatByID: function getSeatByID(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },
    getSelfData: function getSelfData() {
        return this.seats[this.seatIndex];
    },
    getLocalIndex: function getLocalIndex(index) {
        var ret = (index - this.seatIndex + 4) % 4;
        return ret;
    },
    getLocalIndexZJH: function getLocalIndexZJH(index) {
        var ret = (index - this.seatIndex + 5) % 5;
        return ret;
    },
    getLocalIndexByUserIdZJH: function getLocalIndexByUserIdZJH(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var ret = this.getLocalIndexZJH(seatIndex);
        return ret;
    },
    prepareReplay: function prepareReplay(roomInfo, detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.turn = detailOfGame.base_info.button;
        this.room_type = 0;
        var baseInfo = detailOfGame.base_info;
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            s.seatindex = i;
            s.score = null;
            s.holds = baseInfo.game_seats[i];
            s.pengs = [];
            s.caiShen = [];
            s.chis = [];
            s.extraPais = [];
            s.angangs = [];
            s.diangangs = [];
            s.wangangs = [];
            s.folds = [];
            console.log(s);
            if (cc.vv.userMgr.userId == s.userid) {
                this.seatIndex = i;
            }
        }
        this.conf = {
            type: baseInfo.type
        };
        if (this.conf.type == null) {
            this.conf.type == "ykx";
        }
    },
    getWanfa: function getWanfa() {
        var conf = this.conf;
        if (conf) {
            var strArr = [];
            if (conf.maxGames) {
                strArr.push(conf.maxGames + "局");
            }
            if (conf.baseScore) {
                strArr.push(" 底分:" + conf.baseScore);
            }
            if (conf.yipaoduoxiang == true) {
                strArr.push(" 一炮多响");
            }
            return strArr.join(" ");
        }
        return "";
    },
    requireByGame: function requireByGame() {
        // var gameHandler = require('');
        // gameHandler.initEvents();
    },
    initHandlers: function initHandlers(type) {
        cc.vv.net.handlers = {};
        var self = this;
        var t;
        if (type == 2) {
            t = require('ZjhNetMgr');
        } else if (type == 1) {
            t = require('CqNetMgr');
        } else if (type == 0) {
            t = require('MjNetMgr');
        } else if (type == 3) {
            t = require('DnNetMgr');
        } else if (type == 4) {
            t = require('DzpkNetMgr');
        } else if (type == 100) {
            t = require('JbsNetMgr');
        }
        cc.vv.NetMgr = new t();
        cc.vv.NetMgr.initHandlers(self);
    },
    doGuo: function doGuo(seatIndex, pai) {
        var seatData = this.seats[seatIndex];
        var folds = seatData.folds;
        if (folds) {
            folds.push(pai);
        }
        this.dispatchEvent('guo_notify', seatData);
    },
    doMopai: function doMopai(seatIndex, pai) {
        var seatData = this.seats[seatIndex];
        if (seatData.holds) {
            seatData.holds.push(pai);
            this.dispatchEvent('game_mopai', {
                seatIndex: seatIndex,
                pai: pai
            });
        }
    },
    doChupai: function doChupai(seatIndex, pai) {
        this.chupai = pai;
        var seatData = this.seats[seatIndex];
        if (seatData.holds) {
            var idx = seatData.holds.indexOf(pai);
            seatData.holds.splice(idx, 1);
        }
        this.dispatchEvent('game_chupai_notify', {
            seatData: seatData,
            pai: pai
        });
    },
    doPeng: function doPeng(seatIndex, pai, extraPengPai) {
        console.log("doPeng", extraPengPai);
        var seatData = this.seats[seatIndex];
        //移除手牌
        if (seatData.holds) {
            for (var i = 0; i < 2; ++i) {
                var idx = seatData.holds.indexOf(pai);
                seatData.holds.splice(idx, 1);
            }
        }
        //更新碰牌数据
        var pengs = seatData.pengs;
        pengs.push(pai);
        if (extraPengPai != null && extraPengPai.length > 0) {
            seatData.extraPais = extraPengPai;
        }
        // console.log('------------------------------------');
        // console.log("玩家的手中多余的牌是", seatData.extraPais);
        // console.log('------------------------------------');
        this.dispatchEvent('peng_notify', seatData);
    },
    doChi: function doChi(seatIndex, pai, chiArray, extraPai) {
        var seatData = this.seats[seatIndex];
        //移除手牌
        // console.log("吃牌回掉函数");
        if (seatData.holds) {
            for (var i = 0; i < 2; ++i) {
                var idx = seatData.holds.indexOf(chiArray[i]);
                if (idx != -1) {
                    seatData.holds.splice(idx, 1);
                }
            }
            var chis = seatData.chis;
            chiArray.push(pai);
            chiArray.sort(function (a, b) {
                return a - b;
            });
            chis.push(chiArray);
        }
        if (extraPai != null && extraPai.length > 0) {
            seatData.extraPais = extraPai;
        }
        this.dispatchEvent('chi_notify', seatData);
    },
    getGangType: function getGangType(seatData, pai) {
        if (seatData.pengs.indexOf(pai) != -1) {
            return "wangang";
        } else {
            var cnt = 0;
            for (var i = 0; i < seatData.holds.length; ++i) {
                if (seatData.holds[i] == pai) {
                    cnt++;
                }
            }
            if (cnt == 3) {
                return "diangang";
            } else {
                return "angang";
            }
        }
    },
    doGang: function doGang(seatIndex, pai, gangtype) {
        var seatData = this.seats[seatIndex];
        if (!gangtype) {
            gangtype = this.getGangType(seatData, pai);
        }
        if (gangtype == "wangang") {
            if (seatData.pengs.indexOf(pai) != -1) {
                var idx = seatData.pengs.indexOf(pai);
                if (idx != -1) {
                    seatData.pengs.splice(idx, 1);
                }
            }
            seatData.wangangs.push(pai);
        }
        if (seatData.holds) {
            for (var i = 0; i <= 4; ++i) {
                var idx = seatData.holds.indexOf(pai);
                if (idx == -1) {
                    //如果没有找到，表示移完了，直接跳出循环
                    break;
                }
                seatData.holds.splice(idx, 1);
            }
        }
        if (gangtype == "angang") {
            if (!seatData.angangs) {
                seatData.angangs = [];
            }
            seatData.angangs.push(pai);
        } else if (gangtype == "diangang") {
            if (!seatData.diangangs) {
                seatData.diangangs = [];
            }
            seatData.diangangs.push(pai);
        }
        this.dispatchEvent('gang_notify', {
            seatData: seatData,
            gangtype: gangtype
        });
    },
    // 财神
    doCaiShen: function doCaiShen(seatIndex, pai) {
        console.log("财神!docaishen", seatIndex, pai);
        var seatData = this.seats[seatIndex];
        // 移除手牌
        if (seatData.holds) {
            var idx = seatData.holds.indexOf(pai);
            seatData.holds.splice(idx, 1);
        }
        var caiShen = seatData.caiShen;
        caiShen.push(pai);
        this.dispatchEvent('game_caishen_notify', seatData);
    },
    doHu: function doHu(data) {
        this.dispatchEvent('hupai', data);
    },
    doTurnChange: function doTurnChange(si) {
        var data = {
            last: this.turn,
            turn: si
        };
        this.turn = si;
        this.dispatchEvent('game_chupai', data);
    },
    connectGameServer: function connectGameServer(data) {
        this.initHandlers(cc.vv.userMgr.room_type);
        this.dissoveData = null;
        cc.vv.net.ip = data.ip + ":" + data.port;
        console.log(cc.vv.net.ip);
        var self = this;
        var onConnectOK = function onConnectOK() {
            console.log("onConnectOK");
            var sd = {
                token: data.token,
                roomid: data.roomid,
                time: data.time,
                sign: data.sign
            };
            console.log("login============");
            cc.vv.net.send("login", sd);
        };
        var onConnectFailed = function onConnectFailed() {
            console.log("failed.");
            cc.vv.wc.hide();
        };
        cc.vv.wc.show("正在进入房间");
        cc.vv.net.connect(onConnectOK, onConnectFailed);
    },
    connectMatchServer: function connectMatchServer(connect_data, match_data) {
        this.initHandlers(100); //锦标赛的type设为100
        cc.vv.net.ip = connect_data.ip + ":" + connect_data.port;
        var self = this;
        var onConnectOK = function onConnectOK() {
            if (match_data) {
                match_data.userid = cc.vv.userMgr.userId;
            }
            cc.vv.net.send("login", match_data);
            cc.vv.wc.hide();
            cc.vv.alert.show("提示", "进入比赛队列成功！比赛人数一满您将直接进入游戏！");
        };
        var onConnectFailed = function onConnectFailed() {
            cc.vv.wc.hide();
            cc.vv.alert.show("注意", "进入比赛队列失败！");
        };

        cc.vv.wc.show("正在进入比赛队列");
        cc.vv.net.connect(onConnectOK, onConnectFailed);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{"CqNetMgr":"CqNetMgr","DnNetMgr":"DnNetMgr","DzpkNetMgr":"DzpkNetMgr","JbsNetMgr":"JbsNetMgr","MjNetMgr":"MjNetMgr","ZjhNetMgr":"ZjhNetMgr"}],"GameOver":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'facfdljnx5F+rFDAq5Qbmqa', 'GameOver');
// scripts/components/GameOver.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _gameover: null,
        _gameresult: null,
        _seats: [],
        _isGameEnd: false,
        _pingju: null,
        _win: null,
        _lose: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        if (cc.vv.gameNetMgr.conf == null) {
            return;
        }
        this._gameover = this.node.getChildByName("game_over");
        this._gameover.active = false;
        this._pingju = this._gameover.getChildByName("pingju");
        this._win = this._gameover.getChildByName("win");
        this._lose = this._gameover.getChildByName("lose");
        this._liuju = this._gameover.getChildByName("huangzhuang");
        this._gameresult = this.node.getChildByName("game_result");
        var wanfa = this._gameover.getChildByName("wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
        var listRoot = this._gameover.getChildByName("result_list");
        for (var i = 1; i <= 4; ++i) {
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            var viewdata = {};
            viewdata.username = sn.getChildByName('username').getComponent(cc.Label);
            viewdata.reason = sn.getChildByName('reason').getComponent(cc.Label);
            var f = sn.getChildByName('fan');
            if (f != null) {
                viewdata.fan = f.getComponent(cc.Label);
            }
            viewdata.score = sn.getChildByName('score').getComponent(cc.Label);
            viewdata.hu = sn.getChildByName('hu');
            viewdata.mahjongs = sn.getChildByName('pai');
            viewdata.zhuang = sn.getChildByName('zhuang');
            viewdata.hupai = sn.getChildByName('hupai');
            viewdata.hua = sn.getChildByName('hua');
            viewdata._pengandgang = [];
            this._seats.push(viewdata);
        }
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_over', function (data) {
            self.onGameOver(data.detail);
        });
        this.node.on('game_end', function (data) {
            self._isGameEnd = true;
        });
    },
    onGameOver: function onGameOver(data) {
        console.log(data);
        if (data.length == 0) {
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._pingju.active = false;
        this._win.active = false;
        this._lose.active = false;
        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        var isLiuJu = data[cc.vv.gameNetMgr.seatIndex].isLiuJu;
        if (isLiuJu) {
            this._liuju.active = true;
        } else {
            if (myscore > 0) {
                this._win.active = true;
            } else if (myscore < 0) {
                this._lose.active = true;
            } else {
                this._pingju.active = true;
            }
        }
        //显示玩家信息
        for (var i = 0; i < 4; ++i) {
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            //胡牌的玩家才显示 是否清一色 根xn的字样
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
            var numOfGen = userData.numofgen;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            for (var j = 0; j < userData.actions.length; ++j) {
                var ac = userData.actions[j];
                if (ac.type == "zimo" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "hu" || ac.type == "gangpaohu" || ac.type == "qiangganghu" || ac.type == "chadajiao") {
                    if (ac.type == "zimo") {
                        actionArr.push("自摸");
                    } else if (ac.type == "ganghua") {
                        actionArr.push("杠上花");
                    }
                    hued = true;
                } else if (ac.type == "fangpao") {
                    actionArr.push("放炮");
                } else if (ac.type == "angang") {
                    actionArr.push("暗杠");
                } else if (ac.type == "diangang") {
                    actionArr.push("明杠");
                }
            }
            if (hued) {
                if (userData.isHaoQiDui) {
                    actionArr.push("豪七对");
                } else if (userData.pattern == "therity") {
                    actionArr.push("十三幺");
                } else {
                    if (userData.pattern == "7pairs") {
                        actionArr.push("七对");
                    }
                    if (userData.qingyise) {
                        actionArr.push("清一色");
                    }
                    if (userData.menqing) {
                        actionArr.push("门清");
                    }
                    if (userData.haidihu) {
                        actionArr.push("海底捞月");
                    }
                    if (userData.isFourOne) {
                        actionArr.push("四归一");
                    }
                    if (userData.zhuoWuKui) {
                        actionArr.push("捉五魁");
                    }
                    if (userData.hunyise) {
                        actionArr.push("混一色");
                    }
                    if (userData.baZhang) {
                        actionArr.push("八张");
                    }
                    if (userData.laoShao) {
                        actionArr.push("老少");
                    }
                    if (userData.yiTiaoLong) {
                        actionArr.push("一条龙");
                    }
                    if (userData.xiaoLian) {
                        actionArr.push("小连");
                    }
                    if (userData.daLian) {
                        actionArr.push("大连");
                    }
                    if (userData.huCnt == 1) {
                        actionArr.push("单吊");
                    }
                    if (userData.xiaoGao) {
                        actionArr.push("小高");
                    }
                    if (userData.daGao) {
                        actionArr.push("大高");
                    }
                    if (userData.queMen) {
                        actionArr.push("缺门");
                    }
                    if (userData.kezi) {
                        actionArr.push("刻");
                    }
                    if (userData.pengpenghu) {
                        actionArr.push("碰碰胡");
                    }
                    var lianZhuangNum = parseInt(userData.lianZhuangNum) - 1;
                    if (lianZhuangNum > 0) {
                        actionArr.push("连庄" + lianZhuangNum + "次");
                    }
                }
            }
            for (var o = 0; o < 3; ++o) {
                seatView.hu.children[o].active = false;
            }
            //FIXME 隐藏第几个胡牌的
            if (userData.huorder >= 0) {
                seatView.hu.children[userData.huorder].active = true;
            }
            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");
            //胡牌的玩家才有番
            var fan = 0;
            if (hued) {
                fan = userData.fan;
            }
            seatView.fan.string = fan + "番";
            //
            if (userData.score > 0) {
                seatView.score.string = "+" + userData.score;
            } else {
                seatView.score.string = userData.score;
            }
            var hupai = -1;
            if (hued) {
                hupai = userData.hupai;
                //从手牌中剔除胡的那张牌 
                var hu_index = userData.holds.indexOf(hupai);
                userData.holds.splice(hu_index, 1);
            }
            cc.vv.mahjongmgr.sortMJ(userData.holds);
            //胡牌不参与排序
            if (hued) {
                userData.holds.push(hupai);
            }
            //隐藏所有牌
            for (var k = 0; k < seatView.mahjongs.childrenCount; ++k) {
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
            var lackingNum = (userData.pengs.length + numOfGangs + userData.chis.length) * 3;
            //显示相关的牌
            for (var k = 0; k < userData.holds.length; ++k) {
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            }
            for (var k = 0; k < seatView._pengandgang.length; ++k) {
                seatView._pengandgang[k].active = false;
            }
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, "angang");
                index++;
            }
            var gangs = userData.diangangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, "diangang");
                index++;
            }
            var gangs = userData.wangangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, "wangang");
                index++;
            }
            //初始化碰牌
            var pengs = userData.pengs;
            if (pengs) {
                for (var k = 0; k < pengs.length; ++k) {
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView, index, mjid, "peng");
                    index++;
                }
            }
            //初始化吃牌
            var chis = userData.chis;
            if (chis) {
                for (var k = 0; k < chis.length; ++k) {
                    var mjids = chis[k];
                    if (mjids) {
                        this.initPengAndGangs(seatView, index, mjids, "chi");
                        index++;
                    }
                }
            }
            //初始化花牌
            var hua = userData.caiShen;
            this.initHua(seatView, hua);
        }
    },

    initHua: function initHua(seatView, mjids) {
        for (var i = 0; i < seatView.hua.children.length; i++) {
            seatView.hua.children[i].active = false;
        }
        if (mjids) {
            for (var i = 0; i < mjids.length; i++) {
                seatView.hua.children[i].active = true;
                seatView.hua.children[i].getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjids[i]);
            }
        }
    },
    initPengAndGangs: function initPengAndGangs(seatView, index, mjid, flag) {
        var pgroot = null;
        if (seatView._pengandgang.length <= index) {
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        } else {
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") {
                var isGang = flag != "peng" && flag != "chi";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if (flag == "angang") {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
                    sprite.node.scaleX = 1.4;
                    sprite.node.scaleY = 1.4;
                } else {
                    if (flag == "chi") {
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid[s]);
                    } else {
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid);
                    }
                }
            } else {
                if (flag == "chi") {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid[s]);
                } else {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid);
                }
            }
        }
        pgroot.x = index * 55 * 3 + index * 10;
    },
    onBtnReadyClicked: function onBtnReadyClicked() {
        console.log("onBtnReadyClicked");
        if (this._isGameEnd) {
            this._gameresult.active = true;
        } else {
            cc.vv.net.send('ready');
        }
        this._gameover.active = false;
    },
    onBtnShareClicked: function onBtnShareClicked() {
        console.log("onBtnShareClicked");
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"GameResult":[function(require,module,exports){
"use strict";
cc._RFpush(module, '2b08d8pm0VBDLYlZIdfLuPS', 'GameResult');
// scripts/components/GameResult.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _gameresult: null,
        _seats: []
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._gameresult = this.node.getChildByName("game_result");
        //this._gameresult.active = false;
        var seats = this._gameresult.getChildByName("seats");
        for (var i = 0; i < seats.children.length; ++i) {
            this._seats.push(seats.children[i].getComponent("Seat"));
        }
        var btnClose = cc.find("Canvas/game_result/btnClose");
        if (btnClose) {
            cc.vv.utils.addClickEvent(btnClose, this.node, "GameResult", "onBtnCloseClicked");
        }
        var btnShare = cc.find("Canvas/game_result/btnShare");
        if (btnShare) {
            cc.vv.utils.addClickEvent(btnShare, this.node, "GameResult", "onBtnShareClicked");
        }
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end', function (data) {
            self.onGameEnd(data.detail);
        });
    },
    showResult: function showResult(seat, info, isZuiJiaPaoShou) {
        seat.node.getChildByName("zuijiapaoshou").active = isZuiJiaPaoShou;
        seat.node.getChildByName("zimocishu").getComponent(cc.Label).string = info.numzimo;
        seat.node.getChildByName("jiepaocishu").getComponent(cc.Label).string = info.numjiepao;
        seat.node.getChildByName("dianpaocishu").getComponent(cc.Label).string = info.numdianpao;
        seat.node.getChildByName("angangcishu").getComponent(cc.Label).string = info.numangang;
        seat.node.getChildByName("minggangcishu").getComponent(cc.Label).string = info.numminggang;
        // seat.node.getChildByName("chajiaocishu").getComponent(cc.Label).string = info.numchadajiao;
    },
    onGameEnd: function onGameEnd(endinfo) {
        var seats = cc.vv.gameNetMgr.seats;
        var maxscore = -1;
        var maxdianpao = 0;
        var dianpaogaoshou = -1;
        for (var i = 0; i < seats.length; ++i) {
            var seat = seats[i];
            if (seat.score > maxscore) {
                maxscore = seat.score;
            }
            if (endinfo[i].numdianpao > maxdianpao) {
                maxdianpao = endinfo[i].numdianpao;
                dianpaogaoshou = i;
            }
        }
        for (var i = 0; i < seats.length; ++i) {
            var seat = seats[i];
            var isBigwin = false;
            if (seat.score > 0) {
                isBigwin = seat.score == maxscore;
            }
            this._seats[i].setInfo(seat.name, seat.score, isBigwin);
            this._seats[i].setID(seat.userid);
            var isZuiJiaPaoShou = dianpaogaoshou == i;
            this.showResult(this._seats[i], endinfo[i], isZuiJiaPaoShou);
        }
    },
    onBtnCloseClicked: function onBtnCloseClicked() {
        //刷新客户端金币和钻石
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
        cc.director.loadScene("newhall");
    },
    onBtnShareClicked: function onBtnShareClicked() {
        cc.vv.share.show();
        // cc.vv.anysdkMgr.shareResult();
    }
});

cc._RFpop();
},{}],"Global":[function(require,module,exports){
"use strict";
cc._RFpush(module, '24e30ZJLgdH3rs1R1CvqN8U', 'Global');
// scripts/Global.js

"use strict";

var Global = cc.Class({
    extends: cc.Component,
    statics: {
        isstarted: false,
        netinited: false,
        userguid: 0,
        nickname: "",
        money: 0,
        lv: 0,
        roomId: 0
    }
});

cc._RFpop();
},{}],"HTTP":[function(require,module,exports){
"use strict";
cc._RFpush(module, '90ae61J525JQIt5taF3Nce2', 'HTTP');
// scripts/HTTP.js

"use strict";

// 包头麻将调试地址
var URL = "http://116.62.193.47:9009";
// var URL = "http://121.196.213.165:9009";
// var URL = "http://127.0.0.1:9009";
cc.VERSION = 20170320;
var HTTP = cc.Class({
    extends: cc.Component,
    statics: {
        sessionId: 0,
        userId: 0,
        master_url: URL,
        url: URL,
        sendRequest: function sendRequest(path, data, handler, extraUrl) {
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 5000;
            var str = "?";
            for (var k in data) {
                if (str != "?") {
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if (extraUrl == null) {
                extraUrl = HTTP.url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            // console.log("RequestURL:" + requestURL);
            xhr.open("GET", requestURL, true);
            if (cc.sys.isNative) {
                xhr.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                    // console.log("http res("+ xhr.responseText.length + "):" + xhr.responseText);
                    try {
                        var ret = JSON.parse(xhr.responseText);
                        if (handler !== null) {
                            handler(ret);
                        } /* code */
                    } catch (e) {
                        console.log("err:" + e);
                        //handler(null);
                    } finally {
                        if (cc.vv && cc.vv.wc) {
                            //       cc.vv.wc.hide();
                        }
                    }
                }
            };
            if (cc.vv && cc.vv.wc) {
                //cc.vv.wc.show();
            }
            xhr.send();
            return xhr;
        }
    }
});

cc._RFpop();
},{}],"Hall":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6edb3jjx+FBepS1mk1xKDF2', 'Hall');
// scripts/components/Hall.js

"use strict";

var Net = require("Net");
var Global = require("Global");
cc.Class({
    extends: cc.Component,
    properties: {
        lblName: cc.Label,
        lblGems: cc.Label,
        lblID: cc.Label,
        lblNotice: cc.Label,
        joinGameWin: cc.Node,
        applyAgentWin: cc.Node,
        createRoomWin: cc.Node,
        settingsWin: cc.Node,
        helpWin: cc.Node,
        shareWin: cc.Node,
        btnJoinGame: cc.Node,
        btnReturnGame: cc.Node,
        sprHeadImg: cc.Sprite,
        effAnimation: cc.Node,
        _lastCheckTime: 0
    },
    initNetHandlers: function initNetHandlers() {
        var self = this;
    },
    onShare: function onShare() {
        cc.vv.anysdkMgr.share("亚巨包头麻将", "亚巨包头麻将");
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("login");
            return;
        }
        this.preLoad();
        this.initLabels();
        this.effNode = cc.find("Canvas/eff");
        // 如果未创建房间，创建按钮显示特效
        // 如果存在房间，返回房间显示特效            
        var pos = cc.v2(310, 53);
        this.playBtnEff(true, pos);
        if (cc.vv.gameNetMgr.roomId) {
            this.btnJoinGame.active = false;
            this.btnReturnGame.active = true;
            pos = cc.v2(310, 53);
        } else {
            this.btnJoinGame.active = true;
            this.btnReturnGame.active = false;
            pos = cc.v2(86, -108);
        }
        // 播放按钮特效
        this.playBtnEff(true, pos);
        var roomId = cc.vv.userMgr.oldRoomId;
        if (roomId != null) {
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }
        var imgLoader = this.sprHeadImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        cc.vv.utils.addClickEvent(this.sprHeadImg.node, this.node, "Hall", "onBtnClicked");
        this.initButtonHandler("Canvas/right_bottom/btn_shezhi");
        this.initButtonHandler("Canvas/right_bottom/btn_help");
        this.initButtonHandler("Canvas/right_bottom/btn_share_wx");
        this.helpWin.addComponent("OnBack");
        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version: null,
                msg: "数据请求中..."
            };
        }
        if (!cc.vv.userMgr.gemstip) {
            cc.vv.userMgr.gemstip = {
                version: null,
                msg: "数据请求中..."
            };
        }
        this.lblNotice.string = cc.vv.userMgr.notice.msg;
        this.refreshInfo();
        this.refreshNotice();
        this.refreshGemsTip();
        // cc.vv.audioMgr.playBGM("bgMain.mp3");
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        this.initEventHandlers();
    },
    refreshInfo: function refreshInfo() {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (ret.gems != null) {
                    this.lblGems.string = cc.vv.utils.showJinbi(ret.gems);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },
    refreshGemsTip: function refreshGemsTip() {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.gemstip.version = ret.version;
                cc.vv.userMgr.gemstip.msg = ret.msg.replace("<newline>", "\n");
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "fkgm",
            version: cc.vv.userMgr.gemstip.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    refreshNotice: function refreshNotice() {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.lblNotice.string = ret.msg;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "notice",
            version: cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    initButtonHandler: function initButtonHandler(btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "Hall", "onBtnClicked");
    },
    preLoad: function preLoad() {
        cc.loader.loadResDir("textures/images", function (err, assets) {
            cc.loader.loadResDir("textures/MJRoom", function (err, assets) {
                cc.loader.loadResDir("textures/MJ", function (err, assets) {});
            });
        });
    },
    initLabels: function initLabels() {
        this.lblName.string = cc.vv.userMgr.userName;
        this.lblGems.string = cc.vv.utils.showJinbi(cc.vv.userMgr.gems);
        this.lblID.string = "ID:" + cc.vv.userMgr.userId;
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "btn_shezhi") {
            this.settingsWin.active = true;
        } else if (event.target.name == "btn_help") {
            this.helpWin.active = true;
        } else if (event.target.name == "btn_share_wx") {
            cc.vv.share.show();
        }
    },
    onApplyAgentClicked: function onApplyAgentClicked() {
        this.applyAgentWin.active = true;
    },
    onApplyAgentBtnBack: function onApplyAgentBtnBack() {
        this.applyAgentWin.active = false;
    },
    onJoinGameClicked: function onJoinGameClicked() {
        this.joinGameWin.active = true;
    },
    onReturnGameClicked: function onReturnGameClicked() {
        cc.director.loadScene("mjgame");
    },
    onBtnAddGemsClicked: function onBtnAddGemsClicked() {
        console.log("点击充值按钮");
        cc.vv.charge.show();
    },
    onCreateRoomClicked: function onCreateRoomClicked() {
        if (cc.vv.gameNetMgr.roomId != null) {
            cc.vv.alert.show("提示", "房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked");
        this.createRoomWin.active = true;
    },
    initEventHandlers: function initEventHandlers() {
        this.node.on('update_gems', function (event) {
            if (event.detail.gems != null) {
                var str = event.detail.gems;
                this.lblGems.string = cc.vv.utils.showJinbi(str);
            }
        }.bind(this));
    },
    // 获得更新消息
    getRefreshInfo: function getRefreshInfo() {
        var fn = function fn(ret) {
            if (ret == null) {
                console.log('消息是空的');
                return;
            }
            if (ret.userid == cc.vv.userMgr.userId) {
                if (ret.gems != null) {
                    this.lblGems.string = cc.vv.utils.showJinbi(ret.gems);
                }
            }
        };
        this._lastCheckTime = Date.now();
        cc.vv.http.sendRequest("/need_refresh", {
            userid: cc.vv.userMgr.userId
        }, fn.bind(this));
    },
    // 播放按钮特效
    playBtnEff: function playBtnEff(flag, pos) {
        if (flag) {
            this.btnEff = this.effAnimation.getComponent(cc.Animation);
            // this.effAnimation.getComponent(cc.Node).getPosition();
            this.effNode.setPosition(pos);
            var animState = this.btnEff.play('anniu');
            animState.speed = 0.3;
            animState.wrapMode = cc.WrapMode.Loop;
            animState.repeatCount = Infinity;
        }
    },
    gotoNewHall: function gotoNewHall() {
        cc.director.loadScene("newhall");
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (Date.now() - this._lastCheckTime > 30000) {
            this.getRefreshInfo();
        };
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;
        // 如果当前自己有房间，不能直接进入分享过来的房间
        if (cc.vv && cc.vv.userMgr.roomData != null) {
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        } else {
            // 如果当前没有房间，且分享过来的房间号不是空的话，可以进入房间
            if (cc.vv && cc.vv.userMgr.shareRoomId != null) {
                cc.vv.userMgr.roomData = null;
                var roomid = cc.vv.userMgr.shareRoomId;
                cc.vv.userMgr.shareRoomId = null;
                cc.vv.userMgr.enterRoom(roomid, function (ret) {
                    if (ret.errcode != 0) {
                        var content = "房间[" + roomid + "]不存在，请重新输入!";
                        if (ret.errcode == 4) {
                            content = "房间[" + roomid + "]已满!";
                        }
                        cc.vv.alert.show("提示", content);
                    }
                }.bind(this));
            }
        }
    }
});

cc._RFpop();
},{"Global":"Global","Net":"Net"}],"History":[function(require,module,exports){
(function (Buffer){
"use strict";
cc._RFpush(module, '4d7bci0LUxMT6MJKXJDj89w', 'History');
// scripts/components/History.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        HistoryItemPrefab: {
            default: null,
            type: cc.Prefab
        },
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _history: null,
        _viewlist: null,
        _content: null,
        _viewitemTemp: null,
        _historyData: null,
        _curRoomInfo: null,
        _emptyTip: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._history = this.node.getChildByName("history");
        this._history.active = false;
        this._emptyTip = this._history.getChildByName("emptyTip");
        this._emptyTip.active = true;
        this._viewlist = this._history.getChildByName("viewlist");
        this._content = cc.find("view/content", this._viewlist);
        this._viewitemTemp = this._content.children[0];
        this._content.removeChild(this._viewitemTemp);
        var node = cc.find("Canvas/right_bottom/btn_zhanji");
        this.addClickEvent(node, this.node, "History", "onBtnHistoryClicked");
        var node = cc.find("Canvas/history/btn_back");
        this.addClickEvent(node, this.node, "History", "onBtnBackClicked");
    },
    addClickEvent: function addClickEvent(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    onBtnBackClicked: function onBtnBackClicked() {
        if (this._curRoomInfo == null) {
            this._historyData = null;
            this._history.active = false;
        } else {
            this.initRoomHistoryList(this._historyData);
        }
    },
    onBtnHistoryClicked: function onBtnHistoryClicked() {
        console.log('点击战绩按钮');
        this._history.active = true;
        var self = this;
        cc.vv.userMgr.getHistoryList(function (data) {
            data.sort(function (a, b) {
                return a.time < b.time;
            });
            self._historyData = data;
            for (var i = 0; i < data.length; ++i) {
                for (var j = 0; j < 4; ++j) {
                    var s = data[i].seats[j];
                    s.name = new Buffer(s.name, 'base64').toString();
                }
            }
            self.initRoomHistoryList(data);
        });
    },
    dateFormat: function dateFormat(time) {
        var date = new Date(time);
        var datetime = "{0}-{1}-{2} {3}:{4}:{5}";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        month = month >= 10 ? month : "0" + month;
        var day = date.getDate();
        day = day >= 10 ? day : "0" + day;
        var h = date.getHours();
        h = h >= 10 ? h : "0" + h;
        var m = date.getMinutes();
        m = m >= 10 ? m : "0" + m;
        var s = date.getSeconds();
        s = s >= 10 ? s : "0" + s;
        datetime = datetime.format(year, month, day, h, m, s);
        return datetime;
    },
    initRoomHistoryList: function initRoomHistoryList(data) {
        for (var i = 0; i < data.length; ++i) {
            var node = this.getViewItem(i);
            node.idx = i;
            var titleId = "" + (i + 1);
            node.getChildByName("title").getComponent(cc.Label).string = titleId;
            node.getChildByName("roomNo").getComponent(cc.Label).string = "房间ID:" + data[i].id;
            var datetime = this.dateFormat(data[i].time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime;
            var btnOp = node.getChildByName("btnOp");
            btnOp.idx = i;
            btnOp.getChildByName("Label").getComponent(cc.Label).string = "详情";
            for (var j = 0; j < 4; ++j) {
                var s = data[i].seats[j];
                var info = s.name + ":" + s.score;
                //console.log(info);
                node.getChildByName("info" + j).getComponent(cc.Label).string = info;
            }
        }
        this._emptyTip.active = data.length == 0;
        this.shrinkContent(data.length);
        this._curRoomInfo = null;
    },
    initGameHistoryList: function initGameHistoryList(roomInfo, data) {
        data.sort(function (a, b) {
            return a.create_time < b.create_time;
        });
        for (var i = 0; i < data.length; ++i) {
            var node = this.getViewItem(i);
            var idx = data.length - i - 1;
            node.idx = idx;
            var titleId = "" + (idx + 1);
            node.getChildByName("title").getComponent(cc.Label).string = titleId;
            node.getChildByName("roomNo").getComponent(cc.Label).string = "房间ID:" + roomInfo.id;
            var datetime = this.dateFormat(data[i].create_time * 1000);
            node.getChildByName("time").getComponent(cc.Label).string = datetime;
            var btnOp = node.getChildByName("btnOp");
            btnOp.idx = idx;
            btnOp.getChildByName("Label").getComponent(cc.Label).string = "回放";
            var result = JSON.parse(data[i].result);
            for (var j = 0; j < 4; ++j) {
                var s = roomInfo.seats[j];
                var info = s.name + ":" + result[j];
                //console.log(info);
                node.getChildByName("info" + j).getComponent(cc.Label).string = info;
            }
        }
        this.shrinkContent(data.length);
        this._curRoomInfo = roomInfo;
    },
    getViewItem: function getViewItem(index) {
        var content = this._content;
        if (content.childrenCount > index) {
            return content.children[index];
        }
        var node = cc.instantiate(this._viewitemTemp);
        content.addChild(node);
        return node;
    },
    shrinkContent: function shrinkContent(num) {
        while (this._content.childrenCount > num) {
            var lastOne = this._content.children[this._content.childrenCount - 1];
            this._content.removeChild(lastOne, true);
        }
    },
    getGameListOfRoom: function getGameListOfRoom(idx) {
        var self = this;
        var roomInfo = this._historyData[idx];
        cc.vv.userMgr.getGamesOfRoom(roomInfo.uuid, function (data) {
            if (data != null && data.length > 0) {
                self.initGameHistoryList(roomInfo, data);
            }
        });
    },
    getDetailOfGame: function getDetailOfGame(idx) {
        var self = this;
        var roomUUID = this._curRoomInfo.uuid;
        cc.vv.userMgr.getDetailOfGame(roomUUID, idx, function (data) {
            data.base_info = JSON.parse(data.base_info);
            data.action_records = JSON.parse(data.action_records);
            cc.vv.gameNetMgr.prepareReplay(self._curRoomInfo, data);
            cc.vv.replayMgr.init(data);
            cc.director.loadScene("mjgame");
        });
    },
    onViewItemClicked: function onViewItemClicked(event) {
        var idx = event.target.idx;
        console.log(idx);
        if (this._curRoomInfo == null) {
            this.getGameListOfRoom(idx);
        } else {
            this.getDetailOfGame(idx);
        }
    },
    onBtnOpClicked: function onBtnOpClicked(event) {
        var idx = event.target.parent.idx;
        console.log(idx);
        if (this._curRoomInfo == null) {
            this.getGameListOfRoom(idx);
        } else {
            this.getDetailOfGame(idx);
        }
    }
});

cc._RFpop();
}).call(this,require("buffer").Buffer)
},{"buffer":2}],"ImageLoader":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'ed057Bgp8FHlJbGI+ljAN7d', 'ImageLoader');
// scripts/components/ImageLoader.js

'use strict';

function loadImage(url, code, callback) {
    cc.loader.load(url, function (err, tex) {
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code, spriteFrame);
    });
};

function getBaseInfo(userid, callback) {
    if (cc.vv.baseInfoMap == null) {
        cc.vv.baseInfoMap = {};
    }
    if (cc.vv.baseInfoMap[userid] != null) {
        callback(userid, cc.vv.baseInfoMap[userid]);
    } else {
        cc.vv.http.sendRequest('/base_info', {
            userid: userid
        }, function (ret) {
            var url = null;
            if (ret.headimgurl) {
                url = ret.headimgurl;
            }
            var info = {
                name: ret.name,
                sex: ret.sex,
                url: url
            };
            cc.vv.baseInfoMap[userid] = info;
            callback(userid, info);
        }, cc.vv.http.master_url);
    }
};
cc.Class({
    extends: cc.Component,
    properties: {},
    // use this for initialization
    onLoad: function onLoad() {
        this.setupSpriteFrame();
    },
    setUserID: function setUserID(userid, ttype) {
        if (!userid) {
            return;
        }
        if (cc.vv.images == null) {
            cc.vv.images = {};
        }
        var self = this;
        // 如果指定类型为1表示显示二维码信息
        if (ttype == 1) {
            var yaoqing = 'btmj' + cc.vv.userMgr.yaoqing_key;
            var roomid = cc.vv.userMgr.shareRoomId || cc.vv.gameNetMgr.roomId || "000000";
            var url = 'http://mj.yajugame.com/manage1/?/member/user/qrcode_app/';
            if (!yaoqing) {
                return;
            }
            url = url + yaoqing + '/' + roomid + '.png';
            loadImage(url, userid, function (err, spriteFrame) {
                self._spriteFrame = spriteFrame;
                self.setupSpriteFrame();
            });
        } else {
            getBaseInfo(userid, function (code, info) {
                if (info && info.url) {
                    loadImage(info.url, userid, function (err, spriteFrame) {
                        self._spriteFrame = spriteFrame;
                        self.setupSpriteFrame();
                    });
                }
            });
        }
    },
    setupSpriteFrame: function setupSpriteFrame() {
        if (this._spriteFrame) {
            var spr = this.getComponent(cc.Sprite);
            if (spr) {
                spr.spriteFrame = this._spriteFrame;
            }
        }
    }
});

cc._RFpop();
},{}],"JbsNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'd4522T19FRDDZLEYIwuCL4T', 'JbsNetMgr');
// scripts/JbsNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("create_match_finish", function (data) {
            console.log("create_match_finish", data);
            //达到开始比赛条件
            cc.vv.userMgr.enterRoom(data.roomid);
        });
        cc.vv.net.addHandler("match_result", function (data) {
            console.log("match_result", data);
            //处理一轮比赛结果
            if (!data) {
                return;
            }
            var msg = '该轮比赛结束，';
            if (data.isWin) {
                msg += '恭喜进入下一轮！';
            } else {
                msg += '您已被淘汰！';
            }
            cc.vv.alert.show('提示', msg);
        });
        cc.vv.net.addHandler("match_over", function (data) {
            console.log("match_over", data);
            //处理整个比赛结果
            if (!data) {
                return;
            }
            var msg = '锦标赛结束，';
            var ranking = data.ranking; //排名
            if (ranking == 1) {
                msg += '恭喜获得冠军';
            } else if (ranking == 2) {
                msg += '恭喜获得第二名';
            } else if (ranking == 3) {
                msg += '恭喜获得第三名';
            }

            // var reward_num = data.reward_num;
            // var reward_type = data.reward_type;
            // if (reward_type == 1) {
            //     msg += reward_num + '金币！';
            // } else if (reward_type == 2) {
            //     msg += reward_num + '钻石！';
            // }
            cc.vv.alert.show('提示', msg);
        });
    }
});

cc._RFpop();
},{}],"Jbs":[function(require,module,exports){
"use strict";
cc._RFpush(module, '857c5r5HgpOQpuzO6ITUKu3', 'Jbs');
// scripts/components/Jbs.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {},
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._btnClose = this.node.getChildByName("btnClose"); //返回按钮
        this._zjhmatch = this.node.getChildByName("zjhmatch"); //扎金花界面
        this._dnmatch = this.node.getChildByName("dnmatch"); //斗牛界面
        this._mjmatch = this.node.getChildByName("mjmatch"); //麻将界面
        this._detail = this.node.getChildByName('detail'); //比赛详情界面
        this._detail_rule = this._detail.getChildByName('rule'); //规则详情
        this._detail_reward = this._detail.getChildByName('reward'); //奖励详情
        this._detail_record = this._detail.getChildByName('record'); //战绩详情
        cc.vv.utils.addClickEvent(this._btnClose, this.node, "Jbs", "onBtnClose");
        this.initEventWanfa(this._zjhmatch);
        this.initEventWanfa(this._dnmatch);
        this.initEventWanfa(this._mjmatch);
        this.initEventDetail(this._detail_rule);
        this.initEventDetail(this._detail_reward);
        this.initEventDetail(this._detail_record);
    },
    onBtnClose: function onBtnClose() {
        this.node.active = false;
    },
    onBtnWanfa: function onBtnWanfa(event) {
        var name = event.target.name;
        name = name.replace("jbs_", "");
        if (name.indexOf("_") > -1) {
            //可点击
            name = name.replace("_", "");
            switch (name) {
                case 'dou':
                    //斗牛
                    this._dnmatch.active = true;
                    break;
                case 'ma':
                    //麻将
                    this._mjmatch.active = true;
                    break;
                case 'zha':
                    //扎金花
                    this._zjhmatch.active = true;
                    break;
            }
            //隐藏当前panel
            event.target.parent.parent.active = false;
        }
    },
    onBtnDetailChange: function onBtnDetailChange(event) {
        var name = event.target.name;
        name = name.replace("_button", "");
        this._detail_rule.active = false;
        this._detail_reward.active = false;
        this._detail_record.active = false;

        switch (name) {
            case 'rule':
                //规则
                this._detail_rule.active = true;
                break;
            case 'reward':
                //奖励
                this._detail_reward.active = true;
                break;
            case 'record':
                //战绩
                this._detail_record.active = true;
                break;
        }
    },
    onBtnBaoMing: function onBtnBaoMing(event) {
        var self = this;
        var btn = event.target;
        var match_data = btn.data;
        var send_data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userid: cc.vv.userMgr.userId,
            match_id: match_data['id']
        };
        cc.vv.http.sendRequest("/jinbiao_room", send_data, function (ret) {
            if (!ret || ret.errcode != 0) {
                if (ret.errmsg) {
                    cc.vv.alert.show('注意', ret.errmsg);
                } else {
                    cc.vv.alert.show('注意', '报名失败，不满足报名条件');
                }
                return;
            };
            //刷新客户端金币和钻石
            cc.vv.userMgr.getGemsAndCoins(function (data) {
                cc.vv.userMgr.gems = data.gems;
                cc.vv.userMgr.coins = data.coins;
            });
            var connect_data = {
                ip: ret.ip,
                port: ret.port
            };
            cc.vv.gameNetMgr.connectMatchServer(connect_data, match_data);
            self.node.active = false; //报名后，自动隐藏报名界面，用于再次打开的时候可以刷新数据
        });
    },
    //退赛按钮
    onBtnTuiSai: function onBtnTuiSai(event) {
        var self = this;
        var match_id = event.target.data['match_id'];
        var send_data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userid: cc.vv.userMgr.userId,
            match_id: match_id
        };
        cc.vv.http.sendRequest("/tuisai", send_data, function (ret) {
            if (!ret || ret.errcode != 0) {
                if (ret.errmsg) {
                    cc.vv.alert.show('注意', ret.errmsg);
                } else {
                    cc.vv.alert.show('注意', '退赛失败');
                }
                return;
            };

            //刷新客户端金币和钻石
            cc.vv.userMgr.getGemsAndCoins(function (data) {
                cc.vv.userMgr.gems = data.gems;
                cc.vv.userMgr.coins = data.coins;
            });
            var connect_data = {
                ip: ret.ip,
                port: ret.port
            };
            self._detail.active = false;
            self.node.active = false; //报名后，自动隐藏报名界面，用于再次打开的时候可以刷新数据
            cc.vv.alert.show('提示', '退赛成功，80%报名费已返还！');
        });
    },
    //顶部按钮切换页面
    initEventWanfa: function initEventWanfa(target) {
        var children = target.getChildByName('jbs_wanfa').children;
        var hasMaJiang = true;
        if (cc.vv.userMgr.modules && cc.vv.userMgr.modules.indexOf(2) == -1) {
            //没有麻将
            hasMaJiang = false;
        }
        for (var i in children) {
            var child = children[i];
            if (!hasMaJiang && child.name.indexOf('jbs_ma') > -1) {
                //如果不包含麻将，就隐藏麻将按钮
                child.active = false;
            }
            cc.vv.utils.addClickEvent(child, this.node, "Jbs", "onBtnWanfa", true);
        }
    },
    //详情顶部按钮切换
    initEventDetail: function initEventDetail(target) {
        var rule_button = target.getChildByName('rule_button');
        var reward_button = target.getChildByName('reward_button');
        var record_button = target.getChildByName('record_button');
        cc.vv.utils.addClickEvent(rule_button, this.node, "Jbs", "onBtnDetailChange", true);
        cc.vv.utils.addClickEvent(reward_button, this.node, "Jbs", "onBtnDetailChange", true);
        cc.vv.utils.addClickEvent(record_button, this.node, "Jbs", "onBtnDetailChange", true);
    },
    //刷新报名界面数据
    freshMatch: function freshMatch(matchDatas) {
        var self = this;
        if (!matchDatas) return;
        for (var i in matchDatas) {
            var matchData = matchDatas[i];
            var target = null;
            switch (i) {
                case 'zha':
                    target = self._zjhmatch;
                    break;
                case 'dou':
                    target = self._dnmatch;
                    break;
                case 'ma':
                    target = self._mjmatch;
                    break;
            }
            var content = target.getChildByName('scrollview').getChildByName('view').getChildByName('content');
            for (var j in matchData) {
                var data = matchData[j];
                var list = content.children[j];
                var info = list.getChildByName('info');
                info.getChildByName('label').getComponent(cc.Label).string = data.name; //比赛名称

                var layout = list.getChildByName('layout');
                layout.data = data;
                cc.vv.utils.addClickEvent(layout, self.node, "Jbs", "showBaoMingDetail", true); //给报名信息添加点击事件，显示详细信息

                var num_in_match = 13;
                if (data['num_in_match'] != null && typeof data['num_in_match'] != 'undefined') {
                    num_in_match = data['num_in_match'];
                }
                info.getChildByName('hasEnter').getChildByName('num').getComponent(cc.Label).string = num_in_match + '人'; //已经加入的人数
                info.getChildByName('enough').getComponent(cc.Label).string = '满' + data.enterNum + '人开赛';

                var baoming_btn = list.getChildByName('button'); //报名按钮
                baoming_btn.data = data;
                cc.vv.utils.addClickEvent(baoming_btn, self.node, "Jbs", "onBtnBaoMing", true); //给报名按钮添加点击事件
                baoming_btn.getChildByName('label').getComponent(cc.Label).string = data.fee; //显示报名费

                var yibaoming_btn = list.getChildByName('yibaoming'); //已报名按钮
                yibaoming_btn.getChildByName('label').getComponent(cc.Label).string = data.fee; //显示报名费

                var is_ing = num_in_match == data.enterNum;
                var jbs_ing = list.getChildByName('jbs_ing');
                var is_bao_ming = data['is_bao_ming'];
                if (is_bao_ming) {
                    baoming_btn.active = false;
                    jbs_ing.active = false;
                    yibaoming_btn.active = true;
                } else if (is_ing) {
                    baoming_btn.active = false;
                    jbs_ing.active = true;
                    yibaoming_btn.active = false;
                } else {
                    baoming_btn.active = true;
                    yibaoming_btn.active = false;
                    jbs_ing.active = false;
                }
            }
        }
    },
    showMatchList: function showMatchList(matchData) {
        this.node.active = true;
        console.log('matchData', matchData);

        this.freshMatch(matchData);
    },
    showBaoMingDetail: function showBaoMingDetail(event) {
        var data = event.target.data;
        console.log('showDetails===>', data);
        if (data) {
            this._detail.active = true;
            var view = this._detail_rule.getChildByName('scrollview').getChildByName('view');
            var rule_content = view.getChildByName('rule_content');
            var num = rule_content.getChildByName('num');
            var fee = rule_content.getChildByName('fee');
            var description = rule_content.getChildByName('description');
            num.getComponent(cc.Label).string = "开赛人数：" + data.enterNum + "人";
            var fee_type;
            if (data.feeType == 2) {
                fee_type = "钻石";
            } else {
                fee_type = "金币";
            }
            fee.getComponent(cc.Label).string = "报名费用：" + data.fee + fee_type;
            // description.getComponent(cc.Label).string = 
            var reward_view = this._detail_reward.getChildByName('scrollview').getChildByName('view');
            var info = reward_view.getChildByName('content').getChildByName('info');
            var first = info.getChildByName('first').getChildByName('reward');
            first.getComponent(cc.Label).string = data.rewardFirst + fee_type;
            var second = info.getChildByName('second').getChildByName('reward');
            second.getComponent(cc.Label).string = data.rewardSecond + fee_type;
            var third = info.getChildByName('third').getChildByName('reward');
            third.getComponent(cc.Label).string = data.rewardThird + fee_type;

            var tuisai_btn = this._detail_rule.getChildByName('jbs_tuisai');
            if (data.is_bao_ming && data.num_in_match != data.enterNum) {
                cc.vv.utils.addClickEvent(tuisai_btn, this.node, "Jbs", "onBtnTuiSai", true);
                tuisai_btn.active = true;
                tuisai_btn.data = {
                    match_id: data.id
                };
            } else {
                tuisai_btn.active = false;
            }
        }
    },
    hideBaoMingDetail: function hideBaoMingDetail() {
        this._detail.active = false;
    }
});

cc._RFpop();
},{}],"JoinGameInput":[function(require,module,exports){
"use strict";
cc._RFpush(module, '10a1c8jz95Ju4NnpkOWUfin', 'JoinGameInput');
// scripts/components/JoinGameInput.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        nums: {
            default: [],
            type: [cc.Label]
        },
        _inputIndex: 0
    },
    // use this for initialization
    onLoad: function onLoad() {},
    onEnable: function onEnable() {
        this.onResetClicked();
    },
    onInputFinished: function onInputFinished(roomId) {
        cc.vv.userMgr.enterRoom(roomId, function (ret) {
            if (ret.errcode == 0) {
                this.node.active = false;
            } else {
                var content = "房间[" + roomId + "]不存在，请重新输入!";
                if (ret.errcode == 4) {
                    content = "房间[" + roomId + "]已满!";
                }
                cc.vv.alert.show("提示", content);
                this.onResetClicked();
            }
        }.bind(this));
    },
    onInput: function onInput(num) {
        if (this._inputIndex >= this.nums.length) {
            return;
        }
        this.nums[this._inputIndex].string = num;
        this._inputIndex += 1;
        if (this._inputIndex == this.nums.length) {
            var roomId = this.parseRoomID();
            console.log("ok:" + roomId);
            this.onInputFinished(roomId);
        }
    },
    onN0Clicked: function onN0Clicked() {
        this.onInput(0);
    },
    onN1Clicked: function onN1Clicked() {
        this.onInput(1);
    },
    onN2Clicked: function onN2Clicked() {
        this.onInput(2);
    },
    onN3Clicked: function onN3Clicked() {
        this.onInput(3);
    },
    onN4Clicked: function onN4Clicked() {
        this.onInput(4);
    },
    onN5Clicked: function onN5Clicked() {
        this.onInput(5);
    },
    onN6Clicked: function onN6Clicked() {
        this.onInput(6);
    },
    onN7Clicked: function onN7Clicked() {
        this.onInput(7);
    },
    onN8Clicked: function onN8Clicked() {
        this.onInput(8);
    },
    onN9Clicked: function onN9Clicked() {
        this.onInput(9);
    },
    onResetClicked: function onResetClicked() {
        for (var i = 0; i < this.nums.length; ++i) {
            this.nums[i].string = "";
        }
        this._inputIndex = 0;
    },
    onDelClicked: function onDelClicked() {
        if (this._inputIndex > 0) {
            this._inputIndex -= 1;
            this.nums[this._inputIndex].string = "";
        }
    },
    onCloseClicked: function onCloseClicked() {
        this.node.active = false;
    },
    parseRoomID: function parseRoomID() {
        var str = "";
        for (var i = 0; i < this.nums.length; ++i) {
            str += this.nums[i].string;
        }
        return str;
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"Login":[function(require,module,exports){
"use strict";
cc._RFpush(module, '572a7Qfh69N9ZLXkNthANfi', 'Login');
// scripts/components/Login.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

String.prototype.format = function (args) {
    if (arguments.length > 0) {
        var result = this;
        if (arguments.length == 1 && (typeof args === "undefined" ? "undefined" : _typeof(args)) == "object") {
            for (var key in args) {
                var reg = new RegExp("({" + key + "})", "g");
                result = result.replace(reg, args[key]);
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == undefined) {
                    return "";
                } else {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    } else {
        return this;
    }
};
cc.Class({
    extends: cc.Component,
    properties: {
        _stateStr: '',
        _progress: 0.0,
        _isLoading: true,
        btnWechatLogin: cc.Node,
        loadingbar: {
            default: null,
            type: cc.ProgressBar
        },
        _time: 0,
        i: 0
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.loadingbar.progress = 0;
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        this.initMgr();
        if (!cc.vv) {
            this.initMgr();
        }
        cc.vv.http.url = cc.vv.http.master_url;
        this.btnWechatLogin.active = false;
    },
    start: function start() {
        var self = this;
        var SHOW_TIME = 3000;
        var FADE_TIME = 500;
        if (cc.sys.os != cc.sys.OS_IOS || !cc.sys.isNative) {
            var t = Date.now();
            var fn = function fn() {
                var dt = Date.now() - t;
                if (dt < SHOW_TIME) {
                    setTimeout(fn, 33);
                } else {
                    var op = (1 - (dt - SHOW_TIME) / FADE_TIME) * 255;
                    if (op < 0) {
                        self.checkVersion();
                    } else {
                        setTimeout(fn, 33);
                    }
                }
            };
            setTimeout(fn, 33);
        } else {
            this.checkVersion();
        }
    },
    initMgr: function initMgr() {
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        // cc.vv.gameNetMgr.initHandlers();
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();
        var Utils = require("Utils");
        cc.vv.utils = new Utils();
        cc.args = this.urlParse();
        this._isLoading = true;
    },
    urlParse: function urlParse() {
        var params = {};
        if (window.location == null) {
            return params;
        }
        var name, value;
        var str = window.location.href; //取得整个地址栏
        var num = str.indexOf("?");
        str = str.substr(num + 1); //取得所有参数   
        var arr = str.split("&"); //各个参数放到数组里
        for (var i = 0; i < arr.length; i++) {
            num = arr[i].indexOf("=");
            if (num > 0) {
                name = arr[i].substring(0, num);
                value = arr[i].substr(num + 1);
                params[name] = value;
            }
        }
        return params;
    },
    checkVersion: function checkVersion() {
        var self = this;
        var onGetVersion = function onGetVersion(ret) {
            if (ret.version == null) {
                console.log("error.");
            } else {
                console.log("返回的结果是" + JSON.stringify(ret));
                cc.vv.SI = ret;
                self.startPreloading();
            }
        };
        var xhr = null;
        var complete = false;
        var fnRequest = function fnRequest() {
            self._stateStr = "正在连接服务器";
            xhr = cc.vv.http.sendRequest("/get_serverinfo", null, function (ret) {
                xhr = null;
                complete = true;
                onGetVersion(ret);
            });
            setTimeout(fn, 5000);
        };
        var fn = function fn() {
            if (!complete) {
                if (xhr) {
                    xhr.abort();
                    self._stateStr = "连接失败，即将重试";
                    setTimeout(function () {
                        fnRequest();
                    }, 5000);
                } else {
                    fnRequest();
                }
            }
        };
        fn();
    },
    startPreloading: function startPreloading() {
        this._stateStr = "正在加载资源，请稍候";
        // this._isLoading = true;
        var self = this;
        cc.loader.onProgress = function (completedCount, totalCount, item) {
            if (self._isLoading) {
                self._progress = completedCount / totalCount;
            }
        };
        cc.loader.loadResDir("textures/images/login", function (err, assets) {
            console.log("登录资源加载完成");
            self.onLoadComplete();
        });
    },
    // 加载完成
    onLoadComplete: function onLoadComplete() {
        this._isLoading = false;
        this.loadingbar.node.active = false;
        this.btnWechatLogin.active = true;
        cc.loader.onComplete = null;
        cc.loader.loadResDir("textures/home", function (err, assets) {
            console.log("hall大厅资源加载完成");
        });
    },
    // 点击微信登录按钮
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        console.log("创建一个微信登录的");
        if (cc.args["account"] == null) {
            this.sendWXLoginXHR();
        } else {
            cc.vv.wc.show("正在登录游戏,请稍后");
            cc.vv.userMgr.guestAuth();
        }
    },
    // 发送请求，获取到微信登录用的code
    sendWXLoginXHR: function sendWXLoginXHR() {
        cc.vv.wc.show("正在登录游戏,请稍后");
        var url = "http://mj.yajugame.com/sessionid.php";
        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <= 207) {
                var httpStatus = xhr.statusText;
                var response = xhr.responseText;
                var res = JSON.parse(response);
                this.session_id = res["sid"];
                if (this.session_id) {
                    console.log("the sid is " + this.session_id);
                    var fn = function fn(ret) {
                        if (ret.errcode == 0) {
                            cc.vv.anysdkMgr.onLoginResp(ret.code, ret.uid, ret.roomid);
                        } else {
                            cc.vv.wc.show("请在微信中打开该链接地址或刷新页面！");
                        }
                    };
                    cc.vv.http.sendRequest("/get_wx_code", {
                        sid: this.session_id
                    }, fn);
                }
            } else {
                console.log("无结果返回");
            }
        };
        xhr.timeout = 5000; // 5 seconds for timeout
        xhr.send();
    },
    time: function time() {
        this._time = Date.now();
    },
    update: function update(dt) {
        var progress = this.loadingbar.progress;
        if (this._isLoading) {
            if (Date.now() - this._time > 100) {
                this.time();
                progress += dt;
                if (this.i >= 3) {
                    if (progress < this._progress) {
                        progress = this._progress;
                    }
                }
                if (progress > 1) {
                    progress = 1;
                }
                this.i++;
            }
            this.loadingbar.progress = progress;
        }
    }
});

cc._RFpop();
},{"AnysdkMgr":"AnysdkMgr","AudioMgr":"AudioMgr","GameNetMgr":"GameNetMgr","Global":"Global","HTTP":"HTTP","Net":"Net","ReplayMgr":"ReplayMgr","UserMgr":"UserMgr","Utils":"Utils","VoiceMgr":"VoiceMgr"}],"MJGame":[function(require,module,exports){
"use strict";
cc._RFpush(module, '7fa8fcvrqFOj6lhh6xHzd3c', 'MJGame');
// scripts/components/MJGame.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        gameRoot: {
            default: null,
            type: cc.Node
        },
        prepareRoot: {
            default: null,
            type: cc.Node
        },
        _myMJArr: [],
        _options: null,
        _selectedMJ: null,
        _chupaiSprite: [],
        _mjcount: null,
        _gamecount: null,
        _hupaiTips: [],
        _hupaiLists: [],
        _playEfxs: [],
        _opts: [],
        // 用于存放服务端发过来的可以吃的组合
        _chiArrays: [],
        // 用来存放玩家选中的吃的组合
        _chiOptionArray: [],
        _chiOpts: null,
        _optionsData: null
    },
    onLoad: function onLoad() {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("login");
            return;
        }
        this.addComponent("NoticeTip");
        this.addComponent("GameOver");
        this.addComponent("PengGangs");
        this.addComponent("MJRoom");
        this.addComponent("TimePointer");
        this.addComponent("GameResult");
        this.addComponent("Chat");
        this.addComponent("Folds");
        this.addComponent("ReplayCtrl");
        this.addComponent("PopupMgr");
        this.addComponent("ReConnect");
        this.addComponent("Voice");
        this.initView();
        this.initEventHandlers();
        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        this._chiArrays = [];
        this._chiOptionArray = [];
        this.initWanfaLabel();
        this.onGameBeign();
    },
    initView: function initView() {
        //搜索需要的子节点
        var gameChild = this.node.getChildByName("game");
        this._mjcount = gameChild.getChildByName('mjcount').getComponent(cc.Label);
        this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        this._gamecount = gameChild.getChildByName('gamecount').getComponent(cc.Label);
        this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");
        for (var i = 0; i < myholds.children.length; ++i) {
            var sprite = myholds.children[i].getComponent(cc.Sprite);
            this._myMJArr.push(sprite);
            this.onMjToUp(sprite.node);
            sprite.spriteFrame = null;
        }
        var realwidth = cc.director.getVisibleSize().width;
        myholds.scaleX *= realwidth / 1280;
        myholds.scaleY *= realwidth / 1280;
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var side = sides[i];
            var sideChild = gameChild.getChildByName(side);
            this._hupaiTips.push(sideChild.getChildByName("HuPai"));
            this._hupaiLists.push(sideChild.getChildByName("hupailist"));
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            this._chupaiSprite.push(sideChild.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
            var opt = sideChild.getChildByName("opt");
            opt.active = false;
            var sprite = opt.getChildByName("pai").getComponent(cc.Sprite);
            var data = {
                node: opt,
                sprite: sprite
            };
            this._opts.push(data);
        }
        var opts = gameChild.getChildByName("ops");
        this._options = opts;
        var chiOpts = gameChild.getChildByName("chiops");
        this._chiOpts = chiOpts;
        this.hideOptions();
        this.hideChupai();
        this.hideChiOptions();
    },
    hideChupai: function hideChupai() {
        for (var i = 0; i < this._chupaiSprite.length; ++i) {
            this._chupaiSprite[i].node.active = false;
        }
    },
    checkHasCaiShen: function checkHasCaiShen() {
        // console.log('判断是否有财神');
        var hasCaiShen = false;
        if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    var type = cc.vv.mahjongmgr.getMahjongType(sprite.node.mjId);
                    if (type == 4) {
                        console.log("有财神");
                        hasCaiShen = true;
                        break;
                    }
                }
            }
        }
        return hasCaiShen;
    },
    // 每摸一次牌,判断一下是否是财神
    checkCaiShen: function checkCaiShen() {
        if (this.checkHasCaiShen()) {
            var self = this;
            //自动出花牌
            var fn = function fn(node) {
                var type = cc.vv.mahjongmgr.getMahjongType(node.mjId);
                node.active = false;
                self.shootCaiShen(node.mjId);
                node.y = 0;
                self.recordShootPos(node);
            };
            var node;
            for (var i = 0; i < self._myMJArr.length; ++i) {
                var sprite = self._myMJArr[i];
                if (sprite.node.mjId != null) {
                    var type = cc.vv.mahjongmgr.getMahjongType(sprite.node.mjId);
                    if (type != 4) {
                        sprite.node.getComponent(cc.Button).interactable = false;
                    } else {
                        cc.vv.global.touch_target = sprite.node;
                        // cc.vv.gameNetMgr.turn = sprite.node;
                        node = sprite.node;
                        break;
                    }
                }
            }
            var fun = fn(node);
            setTimeout(fun, 100);
            //遍历检查看是否有未打缺的牌 如果有，则需要将不是定缺的牌设置为不可用
            // console.log("检查是否有财神");
        } else {
            // console.log("没有财神");
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                // console.log("没有财神:", cc.vv.gameNetMgr.seatIndex, cc.vv.gameNetMgr.turn);
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            } else {
                // 没有轮到出牌顺序,不能点击麻将
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        // 出牌默认还是可以点击的
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },
    //如果玩家手上还有缺的牌没有打，则只能打缺牌
    initTingedHolds: function initTingedHolds() {
        // 如果有财神,当然不能显示听牌哎
        if (this.checkHasCaiShen()) {
            return;
        }
        if (cc.vv.gameNetMgr.conf == null || !cc.vv.gameNetMgr.getSelfData().tinged) {
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    sprite.node.getComponent(cc.Button).interactable = true;
                }
            }
        } else {
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = i == 13;
                    }
                }
            } else {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },
    initExtraPaiHolds: function initExtraPaiHolds() {
        console.log("运行到这里哦extraPaiHolds");
        if (this.checkHasCaiShen()) {
            return;
        }
        var selfData = cc.vv.gameNetMgr.getSelfData();
        if (selfData.extraPais.length <= 0) {
            console.log("当前多余的牌不存在,不需要额外处理手牌");
            return;
        }
        if (cc.vv.gameNetMgr.conf == null || !selfData.tinged) {
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    sprite.node.getComponent(cc.Button).interactable = true;
                }
            }
        } else {
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                console.log("判断是否是自己");
                for (var j = 0; j < 14; ++j) {
                    var sprite = this._myMJArr[j];
                    console.log(" 当前的麻将的id是", sprite.node.mjId);
                    if (sprite.node.active == true && sprite.node.mjId != null) {
                        if (selfData.extraPais.indexOf(sprite.node.mjId) > -1) {
                            console.log("准备选择哪些可用", sprite.node.mjId);
                            sprite.node.getComponent(cc.Button).interactable = true;
                        } else {
                            console.log("准备选择哪些可以禁用的", sprite.node.mjId);
                            sprite.node.getComponent(cc.Button).interactable = false;
                        }
                    }
                }
                //ly鉴定。这样写是错误的。因为这样始终是最后一个可操作，与需求不符
                // for (var i = 0; i < selfData.extraPais.length; i++) {
                //     console.log("当前牌是", selfData.extraPais[i]);
                //     var paiId = selfData.extraPais[i];
                //     for (var j = 0; j < 14; ++j) {
                //         var sprite = this._myMJArr[j];
                //         console.log(" 当前的麻将的id是", sprite.node.mjId);
                //         if ((sprite.node.active == true) && (sprite.node.mjId != null)) {
                //             if (sprite.node.mjId == paiId) {
                //                 console.log("准备选择哪些可用", sprite.node.mjId);
                //                 sprite.node.getComponent(cc.Button).interactable = true;
                //             } else {
                //                 console.log("准备选择哪些可以禁用的", sprite.node.mjId);
                //                 sprite.node.getComponent(cc.Button).interactable = false;
                //             }
                //         }
                //     }
                // }
            } else {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },
    showTingedFlag: function showTingedFlag() {
        console.log("showTingedFlag");
        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            hupai.active = seatData.tinged;
            if (seatData.tinged) {
                hupai.getChildByName("sprHu").active = !seatData.tinged;
                hupai.getChildByName("sprZimo").active = !seatData.tinged;
                hupai.getChildByName("sprTing").active = seatData.tinged;
            }
        }
    },
    resetPai: function resetPai(isShow) {
        //还原被拖动的牌的位置
        var touch_target = cc.vv.global.touch_target;
        if (touch_target) {
            touch_target.x = touch_target.old_node_x;
            touch_target.y = 0;
            if (isShow) {
                touch_target.active = true;
            }
        }
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        //初始化事件监听器
        var self = this;
        this.node.on('game_holds', function (data) {
            self.initMahjongs();
            self.checkCaiShen();
            var selfData = cc.vv.gameNetMgr.getSelfData();
            console.log('------------------------------------');
            console.log("selfData", selfData.extraPais);
            console.log('------------------------------------');
            if (selfData != null && selfData.extraPais != null) {
                if (selfData.extraPais.length > 0) {
                    console.log("当前多余的牌存在,则需要额外处理手牌");
                    self.initExtraPaiHolds();
                    selfData.extraPais = [];
                } else {
                    self.initTingedHolds();
                }
            }
        });
        this.node.on('game_begin', function (data) {
            self.onGameBeign();
        });
        this.node.on('game_sync', function (data) {
            self.onGameBeign();
        });
        this.node.on('game_chupai', function (data) {
            data = data.detail;
            self.hideChupai();
            self.checkCaiShen();
            var selfData = cc.vv.gameNetMgr.getSelfData();
            console.log('------------------------------------');
            console.log("selfData", selfData.extraPais);
            console.log('------------------------------------');
            if (selfData != null && selfData.extraPais != null) {
                if (selfData.extraPais.length > 0) {
                    console.log("当前多余的牌存在,则需要额外处理手牌");
                    self.initExtraPaiHolds();
                    selfData.extraPais = [];
                } else {
                    self.initTingedHolds();
                }
            }
            if (data.last != cc.vv.gameNetMgr.seatIndex) {
                self.initMopai(data.last, null);
            }
            if (!cc.vv.replayMgr.isReplay() && data.turn != cc.vv.gameNetMgr.seatIndex) {
                self.initMopai(data.turn, -1);
            }
        });
        this.node.on('game_mopai', function (data) {
            self.hideChupai();
            data = data.detail;
            var pai = data.pai;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.seatIndex);
            if (localIndex == 0) {
                var index = 13;
                var sprite = self._myMJArr[index];
                self.setSpriteFrameByMJID("M_", sprite, pai, index);
                sprite.node.active = true;
                sprite.node.mjId = pai;
            } else if (cc.vv.replayMgr.isReplay()) {
                self.initMopai(data.seatIndex, pai);
            }
        });
        this.node.on('game_action', function (data) {
            self._optionsData = data.detail;
            self.showAction(data.detail);
            // console.log("game_action-----是否可以吃牌", data);
            // if (data.detail && data.detail.chi) {
            //     console.log("可以吃牌");
            //     self.showChiAction(data.detail);
            // }
            // if (data.detail) {
            //     if (data.detail.peng || data.detail.gang || data.detail.hu) {
            //         console.log("碰杠胡");
            //         self.showAction(data.detail);
            //     }
            // }
        });
        this.node.on('hupai', function (data) {
            console.log("ly:有人胡牌了");
            self.hideChiOptions();
            var data = data.detail;
            //如果不是玩家自己，则将玩家的牌都放倒
            var seatIndex = data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            var hupai = self._hupaiTips[localIndex];
            hupai.active = true;
            if (localIndex == 0) {
                self.hideOptions();
            }
            var seatData = cc.vv.gameNetMgr.seats[seatIndex];
            seatData.hued = true;
            if (cc.vv.gameNetMgr.conf.type == "ykx") {
                hupai.getChildByName("sprHu").active = true;
                hupai.getChildByName("sprZimo").active = false;
                hupai.getChildByName("sprTing").active = false;
                self.initHupai(localIndex, data.hupai);
                if (data.iszimo) {
                    if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                        seatData.holds.pop();
                        self.initMahjongs();
                    } else {
                        self.initOtherMahjongs(seatData);
                    }
                }
            } else {
                hupai.getChildByName("sprHu").active = !data.iszimo;
                hupai.getChildByName("sprZimo").active = data.iszimo;
                if (!(data.iszimo && localIndex == 0)) {
                    //if(cc.vv.replayMgr.isReplay() == false && localIndex != 0){
                    //    self.initEmptySprites(seatIndex);                
                    //}
                    self.initMopai(seatIndex, data.hupai);
                }
            }
            // if (cc.vv.replayMgr.isReplay() == true && cc.vv.gameNetMgr.conf.type != "ykx") {
            //     var opt = self._opts[localIndex];
            //     opt.node.active = true;
            //     opt.sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", data.hupai);
            // }
            if (data.iszimo) {
                self.playEfx(localIndex, "play_zimo");
            } else {
                self.playEfx(localIndex, "play_hu");
            }
            cc.vv.audioMgr.playSFX("nv/hu.mp3");
        });
        this.node.on('mj_count', function (data) {
            self._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        });
        this.node.on('game_num', function (data) {
            self._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        });
        this.node.on('game_over', function (data) {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
        });
        this.node.on('game_chupai_notify', function (data) {
            self.hideChupai();
            var seatData = data.detail.seatData;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                //还原被拖动的牌的位置
                self.resetPai();
                setTimeout(function () {
                    var touch_target = cc.vv.global.touch_target;
                    if (touch_target) {
                        touch_target.active = true;
                    }
                    self.initMahjongs();
                }, 500);
            } else {
                self.initOtherMahjongs(seatData);
            }
            self.showChupai();
            // 花牌没有对应的声音
            if (data.detail.pai < 34) {
                var audioUrl = cc.vv.mahjongmgr.getAudioURLByMJID(data.detail.pai);
                // console.log("audioUrl!!!" + audioUrl);
                cc.vv.audioMgr.playSFX(audioUrl);
            }
        });
        //财神处理
        this.node.on('game_caishen_notify', function (data) {
            // console.log("财神事件监听!!!!!!!!!!!!!", data);
            var seatData = data.detail;
            // console.log('财神事件监听', seatData);
            //如果是自己，则刷新手牌
            // if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
            //     setTimeout(function() {
            //         var touch_target = cc.vv.global.touch_target;
            //         if (touch_target) {
            //             touch_target.active = true;
            //         }
            //         self.initCaiShenList();
            //         self.initMahjongs();
            //     }, 500);
            // } else {
            //      self.initOtherMahjongs(seatData);
            //     self.initOtherCaiShenList(seatData);
            // }
            // self.showChupai();
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initCaiShenList();
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
                self.initOtherCaiShenList(seatData);
            }
        });
        this.node.on('guo_notify', function (data) {
            self.hideChupai();
            self.hideOptions();
            self.hideChiOptions();
            var seatData = data.detail;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            }
            cc.vv.audioMgr.playSFX("give.mp3");
        });
        this.node.on('guo_result', function (data) {
            self.hideOptions();
        });
        // 游戏
        this.node.on('game_playing', function (data) {
            self.initMahjongs();
        });
        this.node.on('peng_notify', function (data) {
            self.hideChiOptions();
            self.hideChupai();
            var seatData = data.detail;
            console.log("此时玩家的seatdate", seatData);
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, "play_peng");
            cc.vv.audioMgr.playSFX("nv/peng.mp3");
            self.hideOptions();
            seatData.tinged = true;
            self.showTingedFlag();
        });
        // 吃
        this.node.on("chi_notify", function (data) {
            var seatData = data.detail;
            var localIndex = self.getLocalIndex(seatData);
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            // TODO 吃牌特效有bug
            // self.playEfx(localIndex, "play_peng");
            cc.vv.audioMgr.playSFX("nv/chi.mp3");
            self.hideChiOptions();
            self.hideOptions();
            seatData.tinged = true;
            self.showTingedFlag();
        });
        this.node.on('gang_notify', function (data) {
            self.hideChiOptions();
            self.hideChupai();
            var data = data.detail;
            var seatData = data.seatData;
            var gangtype = data.gangtype;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, "play_gang");
            cc.vv.audioMgr.playSFX("nv/gang.mp3");
            console.log("---------seatData------------->>", seatData.tinged, seatData);
            if (seatData.angangs.length == 0) {
                seatData.tinged = true;
            }
            self.showTingedFlag();
        });
        this.node.on("hangang_notify", function (data) {
            var data = data.detail;
            var localIndex = self.getLocalIndex(data);
            self.playEfx(localIndex, "play_gang");
            cc.vv.audioMgr.playSFX("nv/gang.mp3");
            self.hideOptions();
        });
    },
    showChupai: function showChupai() {
        var pai = cc.vv.gameNetMgr.chupai;
        if (pai >= 0) {
            var localIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var sprite = this._chupaiSprite[localIndex];
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            var target_node = sprite.node;
            var old_x = target_node.x;
            var old_y = target_node.y;
            sprite.node.active = true;
            var pos = cc.vv.global.shootPos;
            switch (localIndex) {
                case 0:
                    if (pos) {
                        target_node.x = pos.x * 1.1; //移到出牌位置
                        target_node.y = pos.y * 1.1 - 158; //移到出牌位置
                    }
                    break;
                case 1:
                    target_node.x = cc.find("Canvas/game/right").x;
                    target_node.y = -150;
                    break;
                case 2:
                    target_node.x = -50;
                    target_node.y = 276;
                    break;
                case 3:
                    target_node.x = cc.find("Canvas/game/left").x;
                    target_node.y = 150;
                    break;
            }
            var action = cc.moveTo(0.05, cc.p(old_x, old_y));
            //动画需要隐藏自己出的牌
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn && cc.vv.global.touch_target) {
                cc.vv.global.touch_target.active = false;
            }
            target_node.runAction(action);
        }
    },
    toChiActionPage: function toChiActionPage() {
        // console.log("to 吃 操作的页面");
        this.showChiAction(this._optionsData);
    },
    // 碰，杠，胡，过操作
    addOption: function addOption(btnName, pai) {
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op" && child.active == false) {
                child.active = true;
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
                var btn = child.getChildByName(btnName);
                btn.active = true;
                btn.pai = pai;
                return;
            }
        }
    },
    // 吃牌操作
    addChiOption: function addChiOption(btnName, data) {
        console.log("吃牌操作addchioption", data);
        // 显示全部
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var child = this._chiOpts.children[i];
            child.active = true;
            if (child.name == "btnChi") {
                if (data.pai != null) {
                    child.pai = data.pai;
                }
            }
        }
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var child = this._chiOpts.children[i];
            for (var j = 0; j < 3; j++) {
                var id = "op" + j;
                if (child.name == id) {
                    child.active = false;
                }
            }
        }
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var parentname = this._chiOpts.children[i];
            var info = data.chiArrayInfo;
            if (info.length <= 0) {
                return;
            }
            // 目标牌
            if (parentname.name == "opTarget") {
                if (data.pai != null) {
                    var sprite = parentname.getComponent(cc.Sprite);
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", data.pai);
                }
            }
            this._chiArrays = [];
            for (var k = 0; k < info.length; k++) {
                var name = "op" + k;
                if (parentname.name == name) {
                    parentname.active = true;
                    var childName = "pai" + k;
                    var paiInfo = info[k];
                    this._chiArrays.push(paiInfo);
                    console.log('this._chiArraysthis._chiArraysthis._chiArraysthis._chiArrays', this._chiArrays);
                    this.showChiPaiArray(parentname, paiInfo);
                }
            }
        }
    },
    // 显示吃牌的组合
    showChiPaiArray: function showChiPaiArray(parentname, data) {
        console.log("显示吃牌的组合", data, this._chiArrays);
        if (data != null && data.length > 0) {
            for (var index = 0; index < 2; index++) {
                var pai = data[index];
                var painame = "pai" + index;
                var sprite = parentname.getChildByName(painame).getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            }
        }
    },
    // 隐藏碰杠胡牌操作
    hideOptions: function hideOptions(data) {
        this._options.active = false;
        this.hideChiOptions();
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op") {
                child.active = false;
                child.getChildByName("btnPeng").active = false;
                child.getChildByName("btnGang").active = false;
                child.getChildByName("btnHu").active = false;
                child.getChildByName("btnChi").active = false;
            }
        }
    },
    // 隐藏吃牌的操作
    hideChiOptions: function hideChiOptions() {
        console.log("隐藏hideChiOptions", this._chiOpts.childrenCount);
        this._chiOpts.active = false;
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var child = this._chiOpts.children[i];
            child.active = false;
        }
    },
    showAction: function showAction(data) {
        if (this._options.active) {
            this.hideOptions();
        }
        if (data && (data.hu || data.gang || data.peng || data.chi)) {
            this._options.active = true;
            if (data.hu) {
                this.addOption("btnHu", data.pai);
            }
            if (data.peng) {
                this.addOption("btnPeng", data.pai);
            }
            if (data.gang) {
                for (var i = 0; i < data.gangpai.length; ++i) {
                    var gp = data.gangpai[i];
                    this.addOption("btnGang", gp);
                }
            }
            if (data.chi) {
                this.addOption("btnChi");
            }
        } else {
            var selfData = cc.vv.gameNetMgr.getSelfData();
            if (selfData.tinged) {
                //如果已经听牌，并且没有操作，则自动打牌
                var sprite = this._myMJArr[this._myMJArr.length - 1];
                var node = sprite.node;
                cc.vv.global.touch_target = node;
                node.active = false;
                this.shoot(node.mjId);
                node.y = 0;
                this.recordShootPos(node);
            }
        }
    },
    // 吃牌的操作
    showChiAction: function showChiAction(data) {
        console.log("吃牌操作", data);
        // 如果碰牌的操作界面显示了,先隐藏,正常情况下这是不可能的
        if (this._options.active) {
            this.hideOptions();
        }
        if (this._chiOpts.active) {
            this.hideChiOptions();
        }
        if (data && data.chi) {
            this._chiOpts.active = true;
            this.addChiOption('btnChi', data);
        }
    },
    initWanfaLabel: function initWanfaLabel() {
        var wanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
    },
    initHupai: function initHupai(localIndex, pai) {
        if (cc.vv.gameNetMgr.conf.type == "ykx") {
            var hupailist = this._hupaiLists[localIndex];
            for (var i = 0; i < hupailist.children.length; ++i) {
                var hupainode = hupailist.children[i];
                if (hupainode.active == false) {
                    var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
                    hupainode.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, pai);
                    hupainode.active = true;
                    break;
                }
            }
        }
    },
    // 在胡牌堆里面处理财神显示
    initCaiShen: function initCaiShen(localIndex, pai) {
        var hupailist = this._hupaiLists[localIndex];
        for (var i = 0; i < hupailist.children.length; ++i) {
            var hupainode = hupailist.children[i];
            if (hupainode.active == false) {
                var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
                hupainode.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, pai);
                hupainode.active = true;
                break;
            }
        }
    },
    playEfx: function playEfx(index, name) {
        this._playEfxs[index].node.active = true;
        this._playEfxs[index].play(name);
    },
    onGameBeign: function onGameBeign() {
        for (var i = 0; i < this._playEfxs.length; ++i) {
            this._playEfxs[i].node.active = false;
        }
        for (var i = 0; i < this._hupaiLists.length; ++i) {
            for (var j = 0; j < this._hupaiLists[i].childrenCount; ++j) {
                this._hupaiLists[i].children[j].active = false;
            }
        }
        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            hupai.active = seatData.hued;
            if (seatData.hued) {
                // 如果胡牌了.肯定不显示听牌了
                hupai.getChildByName("sprHu").active = !seatData.iszimo;
                hupai.getChildByName("sprZimo").active = seatData.iszimo;
                hupai.getChildByName("sprTing").active = false;
            }
        }
        this.hideChupai();
        this.hideOptions();
        var sides = ["right", "up", "left"];
        var gameChild = this.node.getChildByName("game");
        for (var i = 0; i < sides.length; ++i) {
            var sideChild = gameChild.getChildByName(sides[i]);
            var holds = sideChild.getChildByName("holds");
            for (var j = 0; j < holds.childrenCount; ++j) {
                var nc = holds.children[j];
                nc.active = true;
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
                var sprite = nc.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.holdsEmpty[i + 1];
            }
        }
        if (cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false) {
            return;
        }
        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        this.initMahjongs();
        this.initCaiShenList();
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if (localIndex != 0) {
                this.initOtherMahjongs(seatData);
                this.initOtherCaiShenList(seatData);
                if (i == cc.vv.gameNetMgr.turn) {
                    this.initMopai(i, -1);
                } else {
                    this.initMopai(i, null);
                }
            }
        }
        this.showChupai();
        if (cc.vv.gameNetMgr.curaction != null) {
            this._optionsData = cc.vv.gameNetMgr.curaction;
            this.showAction(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }
        this.checkCaiShen();
        var selfData = cc.vv.gameNetMgr.getSelfData();
        console.log('------------------------------------');
        console.log("selfData", selfData);
        console.log('------------------------------------');
        if (!selfData.extraPais) {
            return;
        }
        if (selfData.extraPais.length > 0) {
            console.log("当前多余的牌存在,则需要额外处理手牌");
            this.initExtraPaiHolds();
            selfData.extraPais = [];
        } else {
            this.initTingedHolds();
        }
        this.showTingedFlag();
    },
    recordShootPos: function recordShootPos(node) {
        //记录出牌位置
        if (node) {
            var pos = {
                x: node.x,
                y: node.y
            };
            cc.vv.global.shootPos = pos;
        }
    },
    onMjToUp: function onMjToUp(nc) {
        var self = this;
        nc.on(cc.Node.EventType.TOUCH_START, function (touch) {
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            this.old_node_x = nc.x;
            this.old_node_y = nc.y;
            this.old_touch_x = touch.getLocation().x;
            this.old_touch_y = touch.getLocation().y;
            cc.vv.global.touch_target = nc;
        });
        nc.on(cc.Node.EventType.TOUCH_MOVE, function (touch) {
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            var touchX_diff = touch.getLocation().x - this.old_touch_x;
            var touchY_diff = touch.getLocation().y - this.old_touch_y;
            if (touchY_diff > 0) {
                nc.x = this.old_node_x + touchX_diff;
                nc.y = this.old_node_y + touchY_diff;
            }
        });
        nc.on(cc.Node.EventType.TOUCH_END, function (touch) {
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            var touchY_diff = touch.getLocation().y - this.old_touch_y;
            if (touchY_diff > nc.height / 2) {
                self.recordShootPos(nc);
                var type = cc.vv.mahjongmgr.getMahjongType(nc.mjId);
                if (type == 4) {
                    self.shootCaiShen(nc.mjId);
                } else {
                    self.shoot(nc.mjId);
                }
                // nc.active = false;
            }
            //还原到原始位置
            nc.x = this.old_node_x;
            nc.y = this.old_node_y;
        });
        nc.on(cc.Node.EventType.TOUCH_CANCEL, function (touch) {
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            var touchCancel = touch.getLocation();
            var delta = touchCancel.y - this.old_touch_y;
            if (delta > nc.height / 2) {
                self.recordShootPos(nc);
                var type = cc.vv.mahjongmgr.getMahjongType(nc.mjId);
                if (type == 4) {
                    self.shootCaiShen(nc.mjId);
                } else {
                    self.shoot(nc.mjId);
                }
                nc.active = false;
            }
            //还原到原始位置
            nc.x = this.old_node_x;
            nc.y = this.old_node_y;
        });
    },
    onMJClicked: function onMJClicked(event) {
        //如果不是自己的轮子，则忽略
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
            console.log("not your turn." + cc.vv.gameNetMgr.turn);
            return;
        }
        var self = this;
        for (var i = 0; i < this._myMJArr.length; ++i) {
            if (event.target == this._myMJArr[i].node) {
                //如果是再次点击，则出牌
                if (event.target == this._selectedMJ) {
                    // event.target.active = false;
                    var type = cc.vv.mahjongmgr.getMahjongType(this._selectedMJ.mjId);
                    if (type == 4) {
                        this.shootCaiShen(this._selectedMJ.mjId);
                    } else {
                        this.shoot(this._selectedMJ.mjId);
                    }
                    this._selectedMJ.y = 0;
                    this._selectedMJ = null;
                    self.recordShootPos(event.target);
                    return;
                }
                if (this._selectedMJ != null) {
                    this._selectedMJ.y = 0;
                }
                event.target.y = 15;
                this._selectedMJ = event.target;
                return;
            }
        }
    },
    //出牌
    shoot: function shoot(mjId) {
        if (mjId == null) {
            return;
        }
        cc.vv.net.send('chupai', mjId);
    },
    //出牌
    shootCaiShen: function shootCaiShen(mjId) {
        console.log("财神,换牌");
        if (mjId == null) {
            return;
        }
        // 一定要是财神才能进行此操作
        cc.vv.net.send('caishen', mjId);
    },
    getMJIndex: function getMJIndex(side, index) {
        if (side == "right" || side == "up") {
            return 13 - index;
        }
        return index;
    },
    initMopai: function initMopai(seatIndex, pai) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var lastIndex = this.getMJIndex(side, 13);
        var nc = holds.children[lastIndex];
        nc.scaleX = 1.0;
        nc.scaleY = 1.0;
        if (pai == null) {
            nc.active = false;
        } else if (pai >= 0) {
            nc.active = true;
            if (side == "up") {
                nc.scaleX = 0.73;
                nc.scaleY = 0.73;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, pai);
        } else if (pai != null) {
            nc.active = true;
            if (side == "up") {
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
        }
    },
    initEmptySprites: function initEmptySprites(seatIndex) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
        for (var i = 0; i < holds.childrenCount; ++i) {
            var nc = holds.children[i];
            nc.scaleX = 1.0;
            nc.scaleY = 1.0;
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },
    initOtherMahjongs: function initOtherMahjongs(seatData) {
        console.log("seat:" + seatData.seatindex, seatData);
        var localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0 || seatData) {
            return;
        }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = sideRoot.getChildByName("holds");
        console.log('sideholds', sideHolds);
        var num = seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length + seatData.chis.length;
        num *= 3;
        for (var i = 0; i < num; ++i) {
            var idx = this.getMJIndex(side, i);
            sideHolds.children[idx].active = false;
        }
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var holds = this.sortHolds(seatData);
        if (holds != null && holds.length > 0) {
            for (var i = 0; i < holds.length; ++i) {
                var idx = this.getMJIndex(side, i + num);
                var sprite = sideHolds.children[idx].getComponent(cc.Sprite);
                if (side == "up") {
                    sprite.node.scaleX = 0.73;
                    sprite.node.scaleY = 0.73;
                }
                sprite.node.active = true;
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, holds[i]);
            }
            if (holds.length + num == 13) {
                var lasetIdx = this.getMJIndex(side, 13);
                sideHolds.children[lasetIdx].active = false;
            }
        }
    },
    sortHolds: function sortHolds(seatData) {
        var holds = seatData.holds;
        if (holds == null) {
            return null;
        }
        //如果手上的牌的数目是2,5,8,11,14，表示最后一张牌是刚摸到的牌
        var mopai = null;
        var l = holds.length;
        if (l == 2 || l == 5 || l == 8 || l == 11 || l == 14) {
            mopai = holds.pop();
        }
        cc.vv.mahjongmgr.sortMJ(holds);
        //将摸牌添加到最后
        if (mopai != null) {
            holds.push(mopai);
        }
        return holds;
    },
    initMahjongs: function initMahjongs() {
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var holds = this.sortHolds(seatData);
        if (holds == null) {
            return;
        }
        console.log("seatData.chis.length", seatData.chis.length);
        console.log("this._myMJArrthis._myMJArrthis._myMJArrthis._myMJArr", this._myMJArr);
        //初始化手牌
        var lackingNum = (seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length + seatData.chis.length) * 3;
        console.log("lackingNum", lackingNum);
        for (var i = 0; i < holds.length; ++i) {
            var mjid = holds[i];
            var sprite = this._myMJArr[i + lackingNum];
            if (sprite && sprite.node) {
                sprite.node.mjId = mjid;
                sprite.node.y = 0;
                sprite.node.active = true;
                this.setSpriteFrameByMJID("M_", sprite, mjid);
            }
        }
        for (var i = 0; i < lackingNum; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
        for (var i = lackingNum + holds.length; i < this._myMJArr.length; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },
    setSpriteFrameByMJID: function setSpriteFrameByMJID(pre, sprite, mjid) {
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
        sprite.node.active = true;
    },
    getLocalIndex: function getLocalIndex(index) {
        var ret = (index - cc.vv.gameNetMgr.seatIndex + 4) % 4;
        console.log("old:" + index + ",base:" + cc.vv.gameNetMgr.seatIndex + ",new:" + ret);
        return ret;
    },
    onOptionClicked: function onOptionClicked(event) {
        console.log("吃碰杠牌操作");
        console.log(event.target.pai);
        if (event.target.name == "btnPeng") {
            cc.vv.net.send("peng");
        } else if (event.target.name == "btnGang") {
            cc.vv.net.send("gang", event.target.pai);
        } else if (event.target.name == "btnHu") {
            cc.vv.net.send("hu");
        } else if (event.target.name == "btnGuo") {
            cc.vv.net.send("guo");
        } else if (event.target.name == "btnChi") {
            console.log("吃牌操作按钮点击");
            cc.vv.net.send("chi", event.target.pai);
            console.log("向服务器发送吃牌操作--", {
                pai: event.target.pai,
                chiArray: this._chiOptionArray
            });
        }
    },
    // 吃牌操作
    onChiOptionClicked: function onChiOptionClicked(event) {
        console.log("吃牌操作事件绑定");
        // 用来存放玩家选中的吃的组合
        console.log(event.target.pai);
        if (event.target.name == "op0") {
            if (this._chiArrays.length <= 0) {
                this._chiOptionArray = [];
            } else {
                this._chiOptionArray = this._chiArrays[0];
            }
            console.log("玩家选中了第一组组合", this._chiOptionArray);
        } else if (event.target.name == "op1") {
            if (this._chiArrays.length <= 0) {
                this._chiOptionArray = [];
            } else {
                this._chiOptionArray = this._chiArrays[1];
            }
            console.log("选择了第二组组合", this._chiOptionArray);
        } else if (event.target.name == "op2") {
            if (this._chiArrays.length <= 0) {
                this._chiOptionArray = [];
            } else {
                this._chiOptionArray = this._chiArrays[2];
            }
            console.log("选择了第三组组合", this._chiOptionArray);
        } else if (event.target.name == "btnGuo") {
            cc.vv.net.send("guo");
        } else if (event.target.name == "btnChi") {
            console.log("吃牌操作按钮点击");
            if (this._chiOptionArray.length > 0) {
                console.log("可以吃的组合选中了,发送数据到服务器", this._chiOptionArray);
                var data = {
                    pai: event.target.pai,
                    chiOptioned: this._chiOptionArray
                };
                console.log("吃牌的组合是", data);
                cc.vv.net.send("chi", data);
            } else {
                cc.vv.alert.show("注意", "请选择一组吃牌的组合");
            }
            console.log("向服务器发送吃牌操作--", event.target.pai);
        }
    },
    initCaiShenList: function initCaiShenList() {
        // console.log('开始游戏,调用财神初始化信息');
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var caishen = seatData.caiShen;
        // console.log('caiShen initCaiShenList', caishen);
        if (caishen == null) {
            return;
        }
        var gameChild = this.node.getChildByName("game");
        var myselfChild = gameChild.getChildByName("myself");
        var caishen_list = myselfChild.getChildByName("hupailist");
        for (var i = 0; i < caishen.length; ++i) {
            var mj_caishen_id = caishen[i];
            var sprite = caishen_list.children[i].getComponent(cc.Sprite);
            sprite.node.mjId = mj_caishen_id;
            this.setSpriteFrameByMJID("M_", sprite, mj_caishen_id);
        }
    },
    initOtherCaiShenList: function initOtherCaiShenList(seatData) {
        // console.log('初始化其他人的财神');
        var caishen = seatData.caiShen;
        // console.log('caiShen initOtherCaiShenList', caishen);
        if (caishen == null) {
            return;
        }
        var localIndex = this.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var side_caishen_list = sideRoot.getChildByName("hupailist");
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        for (var i = 0; i < caishen.length; ++i) {
            var mj_caishen_id = caishen[i];
            var sprite = side_caishen_list.children[i].getComponent(cc.Sprite);
            sprite.node.mjId = mj_caishen_id;
            this.setSpriteFrameByMJID(pre, sprite, mj_caishen_id);
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {},
    onDestroy: function onDestroy() {
        console.log("onDestroy");
        if (cc.vv) {
            cc.vv.gameNetMgr.clear();
        }
    }
});

cc._RFpop();
},{}],"MJRoom":[function(require,module,exports){
"use strict";
cc._RFpush(module, '921dfQJZddJ+5GFUXqxmMmT', 'MJRoom');
// scripts/components/MJRoom.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _seats2: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initView();
        this.initSeats();
        this.initEventHandlers();
    },
    initView: function initView() {
        var prepare = this.node.getChildByName("prepare");
        var seats = prepare.getChildByName("seats");
        for (var i = 0; i < seats.children.length; ++i) {
            this._seats.push(seats.children[i].getComponent("Seat"));
        }
        this.refreshBtns();
        this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
        this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
        this.lblRoomNo.string = cc.vv.gameNetMgr.roomId;
        var gameChild = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var sideNode = gameChild.getChildByName(sides[i]);
            var seat = sideNode.getChildByName("seat");
            this._seats2.push(seat.getComponent("Seat"));
        }
        var btnWechat = cc.find("Canvas/prepare/btnWeichat");
        if (btnWechat) {
            cc.vv.utils.addClickEvent(btnWechat, this.node, "MJRoom", "onBtnWeichatClicked");
        }
    },
    refreshBtns: function refreshBtns() {
        var prepare = this.node.getChildByName("prepare");
        var btnExit = prepare.getChildByName("btnExit");
        var btnDispress = prepare.getChildByName("btnDissolve");
        var btnWeichat = prepare.getChildByName("btnWeichat");
        var btnBack = prepare.getChildByName("btnBack");
        var isIdle = cc.vv.gameNetMgr.numOfGames == 0;
        btnExit.active = !cc.vv.gameNetMgr.isOwner() && isIdle;
        btnDispress.active = cc.vv.gameNetMgr.isOwner() && isIdle;
        btnWeichat.active = isIdle;
        btnBack.active = isIdle;
    },
    initEventHandlers: function initEventHandlers() {
        var self = this;
        this.node.on('new_user', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('user_state_changed', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('game_begin', function (data) {
            self.refreshBtns();
            self.initSeats();
        });
        this.node.on('game_num', function (data) {
            self.refreshBtns();
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
            self._seats2[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            var index = data.content;
            var info = cc.vv.chat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            self._seats2[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            console.log(data);
            self._seats[localIdx].emoji(data.content);
            self._seats2[localIdx].emoji(data.content);
        });
    },
    initSeats: function initSeats() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.gameNetMgr.getLocalIndex(seat.seatindex);
        var isOffline = !seat.online;
        var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        console.log("isOffline:" + isOffline);
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
        this._seats2[index].setInfo(seat.name, seat.score);
        this._seats2[index].setZhuang(isZhuang);
        this._seats2[index].setOffline(isOffline);
        this._seats2[index].setID(seat.userid);
        this._seats2[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    onBtnBackClicked: function onBtnBackClicked() {
        cc.vv.alert.show("返回大厅", "返回大厅房间仍会保留，快去邀请大伙来玩吧！", function () {
            cc.director.loadScene("newhall");
        }, true);
    },
    onBtnChatClicked: function onBtnChatClicked() {},
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnDissolveClicked: function onBtnDissolveClicked() {
        cc.vv.alert.show("解散房间", "解散房间不扣金币，是否确定解散？", function () {
            cc.vv.net.send("dispress");
        }, true);
    },
    onBtnExit: function onBtnExit() {
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            this._seats2[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            this._lastPlayTime = Date.now() + msgInfo.time;
            if (!cc.sys.isNative) {
                var serverid = msgInfo['msg'];
                window.downloadVoice(serverid);
                return;
            }
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (window.voice && window.voice.localId != null) {
            var localId = window.voice.localId;
            window.voice.localId = null;
            cc.vv.audioMgr.pauseAll();
            window.playVoice(localId);
        }
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;
            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }
        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },
    onPlayerOver: function onPlayerOver() {
        if (!cc.sys.isNative) {
            window.stopPlayVoice();
        };
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
        this._seats2[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    }
});

cc._RFpop();
},{}],"MahjongMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '0ecea6X+IFIK5XFdJe38hXa', 'MahjongMgr');
// scripts/MahjongMgr.js

"use strict";

var mahjongSprites = [];
cc.Class({
    extends: cc.Component,
    properties: {
        leftAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        rightAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        bottomAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        bottomFoldAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        pengPrefabSelf: {
            default: null,
            type: cc.Prefab
        },
        pengPrefabLeft: {
            default: null,
            type: cc.Prefab
        },
        emptyAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        holdsEmpty: {
            default: [],
            type: [cc.SpriteFrame]
        },
        _sides: null,
        _pres: null,
        _foldPres: null
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sides = ["myself", "right", "up", "left"];
        this._pres = ["M_", "R_", "B_", "L_"];
        this._foldPres = ["B_", "R_", "B_", "L_"];
        cc.vv.mahjongmgr = this;
        //筒
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("dot_" + i);
        }
        //条
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("bamboo_" + i);
        }
        //万
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("character_" + i);
        }
        //东西南北风
        mahjongSprites.push("wind_east");
        mahjongSprites.push("wind_west");
        mahjongSprites.push("wind_south");
        mahjongSprites.push("wind_north");
        //中、发、白
        mahjongSprites.push("red");
        mahjongSprites.push("green");
        mahjongSprites.push("white");
        //春夏秋冬 
        mahjongSprites.push("spring");
        mahjongSprites.push("summer");
        mahjongSprites.push("autumn");
        mahjongSprites.push("winter");
        //兰竹菊梅
        mahjongSprites.push("orchid"); //兰
        mahjongSprites.push("bamboo"); //竹
        mahjongSprites.push("chrysanthemum"); //菊       
        mahjongSprites.push("plum"); //梅            
    },
    getMahjongSpriteByID: function getMahjongSpriteByID(id) {
        return mahjongSprites[id];
    },
    getMahjongType: function getMahjongType(id) {
        if (id >= 0 && id < 9) {
            //筒
            return 0;
        } else if (id >= 9 && id < 18) {
            //条
            return 1;
        } else if (id >= 18 && id < 27) {
            //万
            return 2;
        } else if (id >= 27 && id < 34) {
            //字一（东西南北中发白）
            return 3;
        } else if (id >= 34 && id < 42) {
            //花一（春夏秋冬兰竹菊梅）
            return 4;
        }
    },
    getSpriteFrameByMJID: function getSpriteFrameByMJID(pre, mjid) {
        var spriteFrameName = this.getMahjongSpriteByID(mjid);
        spriteFrameName = pre + spriteFrameName;
        if (pre == "M_") {
            return this.bottomAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "B_") {
            return this.bottomFoldAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "L_") {
            return this.leftAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "R_") {
            return this.rightAtlas.getSpriteFrame(spriteFrameName);
        }
    },
    // 出牌声音对应id只有筒条万和东西南北中发白才有声音
    getAudioURLByMJID: function getAudioURLByMJID(id) {
        var paitype = this.getMahjongType(id);
        console.log("牌的类型是:" + paitype);
        if (paitype >= 0 && paitype < 4) {
            return "nv/" + id + ".mp3";
        } else {
            return null;
        }
    },
    getEmptySpriteFrame: function getEmptySpriteFrame(side) {
        if (side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
        } else if (side == "myself") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_bottom");
        } else if (side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_left");
        } else if (side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_right");
        }
    },
    getHoldsEmptySpriteFrame: function getHoldsEmptySpriteFrame(side) {
        if (side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_up");
        } else if (side == "myself") {
            return null;
        } else if (side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_left");
        } else if (side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_right");
        }
    },
    sortMJ: function sortMJ(mahjongs) {
        var self = this;
        mahjongs.sort(function (a, b) {
            return a - b;
        });
    },
    getSide: function getSide(localIndex) {
        return this._sides[localIndex];
    },
    getPre: function getPre(localIndex) {
        return this._pres[localIndex];
    },
    getFoldPre: function getFoldPre(localIndex) {
        return this._foldPres[localIndex];
    }
});

cc._RFpop();
},{}],"MjNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'f084a+6r9pFkpyzRb+cYNPH', 'MjNetMgr');
// scripts/MjNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log("login_result===>", data);
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.room_type = data.conf.room_type;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            console.log("login_finished");
            cc.director.loadScene("mjgame");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("exit_notify_push", function (data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            if (self.roomId == null) {
                if (self.room_type == 0) {
                    cc.director.loadScene("newhall");
                    self.room_type = -1;
                } else {
                    cc.director.loadScene("newhall");
                }
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    self.roomId = null;
                    self.room_type = -1;
                }
            }
        });
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            //console.log(data);
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
        cc.vv.net.addHandler("user_state_push", function (data) {
            //console.log(data);
            var userId = data.userid;
            if (self.room_type == 0) {
                var seat = self.getSeatByID(userId);
                if (!seat) return;
                seat.online = data.online;
                self.dispatchEvent('user_state_changed', seat);
            }
        });
        cc.vv.net.addHandler("user_ready_push", function (data) {
            //console.log(data);
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.ready = data.ready;
            self.dispatchEvent('user_state_changed', seat);
        });
        cc.vv.net.addHandler("game_holds_push", function (data) {
            var seat = self.seats[self.seatIndex];
            console.log(data);
            seat.holds = data;
            for (var i = 0; i < self.seats.length; ++i) {
                var s = self.seats[i];
                if (!s.folds) {
                    s.folds = [];
                }
                if (!s.pengs) {
                    s.pengs = [];
                }
                if (!s.extraPais) {
                    s.extraPais = [];
                }
                if (!s.caiShen) {
                    s.caiShen = [];
                }
                if (!s.chis) {
                    s.chis = [];
                }
                if (!s.angangs) {
                    s.angangs = [];
                }
                if (!s.diangangs) {
                    s.diangangs = [];
                }
                if (!s.wangangs) {
                    s.wangangs = [];
                }
                s.ready = false;
            }
            self.dispatchEvent('game_holds');
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            console.log('game_begin_push');
            console.log(data);
            self.button = data;
            self.turn = self.button;
            self.gamestate = "begin";
            self.dispatchEvent('game_begin');
        });
        cc.vv.net.addHandler("game_playing_push", function (data) {
            console.log('game_playing_push');
            self.gamestate = "playing";
            self.dispatchEvent('game_playing');
        });
        cc.vv.net.addHandler("game_sync_push", function (data) {
            console.log("game_sync_push");
            console.log(data);
            self.numOfMJ = data.numofmj;
            self.gamestate = data.state;
            self.turn = data.turn;
            self.button = data.button;
            self.chupai = data.chuPai;
            for (var i = 0; i < 4; ++i) {
                var seat = self.seats[i];
                var sd = data.seats[i];
                seat.holds = sd.holds;
                seat.folds = sd.folds;
                seat.angangs = sd.angangs;
                seat.diangangs = sd.diangangs;
                seat.wangangs = sd.wangangs;
                seat.pengs = sd.pengs;
                seat.extraPais = sd.extraPais;
                seat.caiShen = sd.caiShen;
                seat.chis = sd.chis;
                seat.hued = sd.hued;
                seat.tinged = sd.tinged;
                seat.iszimo = sd.iszimo;
                seat.huinfo = sd.huinfo;
            }
        });
        cc.vv.net.addHandler("game_action_push", function (data) {
            self.curaction = data;
            cc.vv.gameNetMgr.curaction = data;
            console.log("game_action_push---获得所以操作的数据", data);
            self.dispatchEvent('game_action', data);
        });
        cc.vv.net.addHandler("game_chupai_push", function (data) {
            console.log('game_chupai_push');
            //console.log(data);
            var turnUserID = data;
            var si = self.getSeatIndexByID(turnUserID);
            self.doTurnChange(si);
        });
        cc.vv.net.addHandler("game_num_push", function (data) {
            self.numOfGames = data;
            self.dispatchEvent('game_num', data);
        });
        cc.vv.net.addHandler("game_over_push", function (data) {
            console.log('game_over_push');
            var results = data.results;
            for (var i = 0; i < self.seats.length; ++i) {
                self.seats[i].score = results.length == 0 ? 0 : results[i].totalscore;
            }
            self.dispatchEvent('game_over', results);
            if (data.endinfo) {
                self.isOver = true;
                self.dispatchEvent('game_end', data.endinfo);
            }
            self.reset();
            for (var i = 0; i < self.seats.length; ++i) {
                self.dispatchEvent('user_state_changed', self.seats[i]);
            }
        });
        cc.vv.net.addHandler("mj_count_push", function (data) {
            console.log('mj_count_push');
            self.numOfMJ = data;
            //console.log(data);
            self.dispatchEvent('mj_count', data);
        });
        cc.vv.net.addHandler("hu_push", function (data) {
            console.log('hu_push');
            console.log(data);
            self.doHu(data);
        });
        cc.vv.net.addHandler("hangang_notify_push", function (data) {
            self.dispatchEvent('hangang_notify', data);
        });
        cc.vv.net.addHandler("game_chupai_notify_push", function (data) {
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doChupai(si, pai);
        });
        cc.vv.net.addHandler("game_mopai_push", function (data) {
            console.log('game_mopai_push');
            self.doMopai(self.seatIndex, data);
        });
        cc.vv.net.addHandler("guo_notify_push", function (data) {
            console.log('guo_notify_push');
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doGuo(si, pai);
        });
        cc.vv.net.addHandler("guo_result", function (data) {
            console.log('guo_result');
            self.dispatchEvent('guo_result');
        });
        cc.vv.net.addHandler("guohu_push", function (data) {
            console.log('guohu_push');
            self.dispatchEvent("push_notice", {
                info: "过胡",
                time: 1.5
            });
        });
        cc.vv.net.addHandler("peng_notify_push", function (data) {
            console.log('peng_notify_push-------碰牌操作', data);
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            var extraPengPai = data.extraPengPai;
            self.doPeng(si, data.pai, extraPengPai);
        });
        //  吃牌操作
        cc.vv.net.addHandler("chi_notify_push", function (data) {
            console.log('chi_notify_push', data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            var extraChiPai = data.extraChiPai;
            var chiArray = data.chiArray;
            self.doChi(si, data.pai, chiArray, extraChiPai);
        });
        cc.vv.net.addHandler("gang_notify_push", function (data) {
            console.log('gang_notify_push');
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doGang(si, pai, data.gangtype);
        });
        //  财神弃牌操作
        cc.vv.net.addHandler("game_caishen_notify_push", function (data) {
            console.log("财神弃牌操作");
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            console.log('财神弃牌操作!!!!!!!!!!', data);
            self.doCaiShen(si, pai);
        });
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
        cc.vv.net.addHandler("dissolve_notice_push", function (data) {
            console.log("dissolve_notice_push");
            console.log(data);
            self.dissoveData = data;
            self.dispatchEvent("dissolve_notice", data);
        });
        cc.vv.net.addHandler("dissolve_cancel_push", function (data) {
            self.dissoveData = null;
            self.dispatchEvent("dissolve_cancel", data);
        });
        cc.vv.net.addHandler("voice_msg_push", function (data) {
            console.log("voice_msg_push");
            self.dispatchEvent("voice_msg", data);
        });
    }
});

cc._RFpop();
},{}],"MorraGame":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'cce5a7TsatHIaNaoMqubLNv', 'MorraGame');
// scripts/components/MorraGame.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // _hallGemsV: null,
        // _hallCoinsV: null,
        _alertV: null, //提示框
        _alertContentV: null,
        _morraHallV: null, //大厅view
        _roomIdV: null,
        _seatsV: [], //座位view
        _caiquanV: [],
        //动画相关
        _leftAnimation: null,
        _rightAnimation: null,
        _leftOpenAnim: null,
        _rightOpenAnim: null,
        _animTime: 3000,
        _resultsV: null, //结果显示view
        _currentQuanV: null, //当前选择手势的view
        _winlabelV: null,
        _winBgV: null,
        currentQuan: -1, //当前选择的手势
        isRandom: false, //是否随机手势
        gameEndData: null, //对局结束数据
        jianzi: 0,
        shitou: 1,
        bu: 2,
        seatindex: 0, //当前位置 0左1右
        seats: null,
        canAgain: false, //能否继续游戏（当有人掉线或退出）
        guize: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        // this._hallGemsV = cc.find("Canvas/header/jinbi/gems").getComponent(cc.Label);
        // this._hallCoinsV = cc.find("Canvas/header/zuanshi/coins").getComponent(cc.Label);
        this.guize = cc.find("Canvas/guessbox/guize");
        this._alertV = cc.find("Canvas/guessboxAlert");
        this._alertContentV = this._alertV.getChildByName("content").getComponent(cc.Label);
        this._morraHallV = cc.find("Canvas/guessbox");
        this._roomIdV = this._morraHallV.getChildByName("roomId").getComponent(cc.Label);
        this.initSeatsView();
        this.showWinCount(false);
        this.initCaiquanView();
        this.initEventHandlers();
        this.setGemsAndCoins(cc.vv.userMgr.gems, cc.vv.userMgr.coins);
        if (cc.vv.gameNetMgr.cq_data) {
            console.log("------cq_data----", cc.vv.gameNetMgr.cq_data);
            this.seats = cc.vv.gameNetMgr.cq_data.seats;
            this.initSeatsData(cc.vv.gameNetMgr.cq_data);
        }
        cc.vv.net.send('ready');
    },
    initSeatsView: function initSeatsView() {
        var seat = [];
        seat[0] = this._morraHallV.getChildByName("seat").children[0].getComponent(cc.Label);
        seat[1] = this._morraHallV.getChildByName("seat").children[1].getComponent(cc.Label);
        this._seatsV.seat = seat;
        this._seatsV.difen = this._morraHallV.getChildByName("difen").getComponent(cc.Label);
        this._seatsV.gems = this._morraHallV.getChildByName("gemsBg").getChildByName("gems").getComponent(cc.Label);
        this._seatsV.coins = this._morraHallV.getChildByName("coinsBg").getChildByName("coins").getComponent(cc.Label);
        this._seatsV.wincont = this._morraHallV.getChildByName("winBg").getChildByName("wincont").getComponent(cc.Label);
        this._winlabelV = this._morraHallV.getChildByName("winlabel");
        this._winBgV = this._morraHallV.getChildByName("winBg");
        this._seatsV.lastTime = this._morraHallV.getChildByName("lastTimeBg").getChildByName("lastTime").getComponent(cc.Label);
    },
    initCaiquanView: function initCaiquanView() {
        var layout = this._morraHallV.getChildByName("content").getChildByName("layout");
        this._caiquanV.left = layout.getChildByName("left");
        this._caiquanV.left.active = false;
        this._caiquanV.right = layout.getChildByName("right");
        this._caiquanV.right.active = false;
        this._leftAnimation = layout.getChildByName("l_anim");
        this._rightAnimation = layout.getChildByName("r_anim");
        this._leftOpenAnim = this._leftAnimation.getComponent(cc.Animation);
        this._rightOpenAnim = this._rightAnimation.getComponent(cc.Animation);
        this._leftXuanding = this._caiquanV.left.getChildByName('xuanding');
        this._rightXuanding = this._caiquanV.right.getChildByName('xuanding');
        this._resultsV = new Array();
        this._resultsV.push(layout.getChildByName("result1"));
        this._resultsV.push(layout.getChildByName("result2"));
        this._resultsV.push(layout.getChildByName("result3"));
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.cqEventHandler = this.node;
        var self = this;
        //游戏开始
        this.node.on('cq_begin', function (data) {
            console.log('cq_begin====================>', data);
            self.playOpenAnim();
        });
        //新增用户
        this.node.on('cq_new_user', function (res) {
            var data = res.detail.data;
            cc.vv.gameNetMgr.cq_data = data;
            self.seats = data.seats;
            self.initSeatsData(data);
        });
        //游戏结束
        this.node.on('cq_game_over', function (res) {
            var data = res.detail.data;
            self.gameEndData = data;
            // self.playOpenAnim();
            self.gameEnd();
            var s = self;
            var again = function again() {
                if (s.seatindex == 0 && s.canAgain) {
                    //如果是房主
                    cc.vv.net.send('cq_again');
                }
                s.clearCq();
            };
            setTimeout(again, 2000);
            // var data = data.detail.data;
        });
        //攻擂退出房间
        this.node.on('cq_exit_notify', function (res) {
            var userid = res.detail;
            self.canAgain = false;
            if (userid == cc.vv.userMgr.userId) {
                self.clearCq();
                self.seats = null;
                self.seatindex = 0;
            } else {
                if (self.seats) {
                    self.seats.pop();
                    console.log("-------------self.seats--------->>", self.seats);
                    self._seatsV.seat[1].string = "";
                    self.showWinCount(false);
                }
            }
            self.getGemsAndCoins();
        });
        //房主解散房间
        this.node.on('cq_dispress', function (res) {
            var context = self;
            var userid = res.detail;
            if (userid == cc.vv.userMgr.userId) {} else {
                cc.vv.alert.show("提示", "擂主逃跑了！,并赠送了你全部奖金！", function () {
                    context.loadHomeHall();
                });
            }
            self.canAgain = false;
            self.clearCq();
            self.seats = null;
            self.seatindex = 0;
            self.getGemsAndCoins();
        });
        //倒计时
        this.node.on('cq_game_time', function (res) {
            var data = res.detail.data;
            self._seatsV.lastTime.string = data;
            if (data == 0) {
                if (self.currentQuan == -1) {
                    //倒计时结束随机选择手势
                    self.isRandom = true;
                    var num = Math.floor(Math.random() * 10) % 3;
                    if (num == 0) {
                        self.chuJianzi();
                    } else if (num == 1) {
                        self.chuShitou();
                    } else {
                        self.chuBu();
                    }
                }
            }
        });
        //攻擂失败
        this.node.on('cq_loser_notify', function (res) {
            var context = self;
            var userid = res.detail;
            self.canAgain = false;
            if (userid == cc.vv.userMgr.userId) {
                self.clearCq();
                self.seats = null;
                self.seatindex = 0;
                cc.vv.alert.show("提示", "您挑战失败！自动退出房间", function () {
                    context.loadHomeHall();
                });
            } else {
                if (self.seats) {
                    self.seats.pop();
                    console.log("-------------cq_loser_notify--------->>", self.seats);
                    self._seatsV.seat[1].string = "";
                }
                self.showWinCount(false);
            }
            self.getGemsAndCoins();
        });
        //攻擂成功
        this.node.on('cq_winner_notify', function (res) {
            var context = self;
            var userid = res.detail;
            var str = "";
            if (userid == cc.vv.userMgr.userId) {
                cc.vv.alert.show("提示", "攻擂成功！并获得了全部奖金！", function () {
                    context.loadHomeHall();
                });
            } else {
                cc.vv.alert.show("提示", "您被打败了！并将奖金赠送给了对手！", function () {
                    context.loadHomeHall();
                });
            }
            self.canAgain = false;
            self.clearCq();
            self.seats = null;
            self.seatindex = 0;
            self.getGemsAndCoins();
        });
        //出拳通知
        this.node.on('cq_chuquan_notify', function (data) {
            //停止动画，显示已出拳
            var userId = data.detail;
            if (self.seats[0].userid == userId) {
                // 擂主出拳
                self._leftOpenAnim.stop();
                self._leftAnimation.active = false;
                self._caiquanV.left.active = true;
                if (cc.vv.userMgr.userId != userId) {
                    //不是本人的时候，显示已选定
                    self._leftXuanding.active = true;
                }
            } else {
                //userid
                self._rightOpenAnim.stop();
                self._rightAnimation.active = false;
                self._caiquanV.right.active = true;
                if (cc.vv.userMgr.userId != userId) {
                    //不是本人的时候，显示已选定
                    self._rightXuanding.active = true;
                }
            }
        });
        this.node.on('disconnect', function (res) {
            var context = self;
            self.canAgain = false;
            self.seats = null;
            self.seatindex = 0;
        });
    },
    initSeatsData: function initSeatsData(data) {
        var self = this;
        var consu = data.conf.consu;
        if (consu == 0) {
            //金币
            self._seatsV.difen.string = cc.vv.utils.showJinbi(data.conf.baseScore) + "金币";
        } else {
            //钻石
            self._seatsV.difen.string = cc.vv.utils.showJinbi(data.conf.baseScore) + "钻石";
        }
        if (self.seats) {
            self._roomIdV.string = "房间号：" + cc.vv.gameNetMgr.roomId;
            for (var i = 0; i < self.seats.length; i++) {
                self._seatsV.seat[i].string = self.seats[i].name;
                if (self.seats[i].userid == cc.vv.userMgr.userId) {
                    self._seatsV.wincont.string = self.seats[i].score;
                    self.seatindex = self.seats[i].seatindex;
                    self.getGemsAndCoins();
                }
            }
            if (self.seats.length == 2 && self.seats[1].userid != 0) {
                if (self.seats[0].userid == cc.vv.userMgr.userId) {
                    //房主提示有人进入房间
                    self._alertContentV.string = self.seats[1].name + "进入了房间";
                    self._alertV.active = true;
                    var context = self;
                    setTimeout(function () {
                        context._alertV.active = false;
                    }, 3000);
                }
                this.showWinCount(true);
            } else {
                this.showWinCount(false);
            }
        }
        self.canAgain = self.seats.length == 2 && self.seats[1].userid != 0;
        self.clearCq();
    },
    gameEnd: function gameEnd() {
        if (!this.gameEndData || this.gameEndData == null) {
            return;
        }
        this._rightXuanding.active = false;
        this._leftXuanding.active = false;
        for (var i = 0; i < this.gameEndData.length; i++) {
            if (this.gameEndData[i].seatIndex == this.seatindex) {
                //如果是自己
                // this._resultsV[this.gameEndData[i].wined].active = true;
                this._resultsV[this.gameEndData[1].wined].active = true; //只显示攻擂者的输赢
            } else {
                this.gameOverShowGesture(this.gameEndData[i].chuQuan, i);
            }
            this._seatsV.wincont.string = i == 0 ? 0 : this.gameEndData[i].winCount; //显示攻擂者得分
        }
    },
    clearCq: function clearCq() {
        if (this._caiquanV) {
            var left = this._caiquanV.left.children;
            var right = this._caiquanV.right.children;
            for (var i = 0; i < left.length; i++) {
                for (var j = 0; j < left[i].children.length; j++) {
                    left[i].children[j].active = false;
                }
            }
            for (var i = 0; i < right.length; i++) {
                for (var j = 0; j < right[i].children.length; j++) {
                    right[i].children[j].active = false;
                }
            }
        }
        if (this._resultsV) {
            for (var i = 0; i < this._resultsV.length; i++) {
                this._resultsV[i].active = false;
            }
        }
        this._currentQuanV = null;
        this.currentQuan = -1;
        this.isRandom = false;
        this.gameEndData = null;
        if (this._caiquanV) {
            this._caiquanV.left.active = false;
        }
        if (this._caiquanV) {
            this._caiquanV.right.active = false;
        }
    },
    // 猜拳动画播放
    playOpenAnim: function playOpenAnim() {
        var self = this;
        this._caiquanV.left.active = false;
        this._caiquanV.right.active = false;
        var leftAnim = function leftAnim() {
            self._leftAnimation.active = true;
            var animState1 = self._leftOpenAnim.play('caiquan2');
            animState1.wrapMode = cc.WrapMode.Loop;
        };
        var rightAnim = function rightAnim() {
            self._rightAnimation.active = true;
            var animState2 = self._rightOpenAnim.play('caiquan1');
            animState2.wrapMode = cc.WrapMode.Loop;
        };
        if (self.isRandom) {
            leftAnim();
            rightAnim();
            return;
        }
        leftAnim();
        rightAnim();
    },
    showGesture: function showGesture(type) {
        //手势显示
        if (this._currentQuanV && this._currentQuanV != null) {
            this._currentQuanV.active = false;
        }
        var left = this._caiquanV.left.children;
        var right = this._caiquanV.right.children;
        for (var i in left) {
            left[i].active = false;
        }
        for (var i in right) {
            right[i].active = false;
        }
        if (this.seatindex == 0) {
            //左边
            left[0].active = true;
            this._currentQuanV = left[0].children[type];
        } else {
            right[1].active = true;
            this._currentQuanV = right[1].children[type];
        }
        this._currentQuanV.active = true;
        this.currentQuan = type;
        this._caiquanV.left.active = true;
        this._caiquanV.right.active = true;
    },
    gameOverShowGesture: function gameOverShowGesture(type, index) {
        var left = this._caiquanV.left.children;
        var right = this._caiquanV.right.children;
        if (index == 0) {
            left[0].active = true;
            left[0].children[type].active = true;
        } else {
            right[1].active = true;
            right[1].children[type].active = true;
        }
        return;
    },
    //是否显示赢句次数
    showWinCount: function showWinCount(flag) {
        this._winlabelV.active = flag;
        this._winBgV.active = flag;
    },
    //设置金币钻石数量
    getGemsAndCoins: function getGemsAndCoins() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            console.log("------getGemsAndCoins-------->", data);
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
            // self._hallGemsV.string = data.gems;
            // self._hallCoinsV.string = data.coins;
            self.setGemsAndCoins(data.gems, data.coins);
        });
    },
    setGemsAndCoins: function setGemsAndCoins(gems, coins) {
        if (this._seatsV && this._seatsV.gems && this._seatsV.coins) {
            this._seatsV.gems.string = cc.vv.utils.showJinbi(gems);
            this._seatsV.coins.string = coins;
        }
    },
    //出剪子
    chuJianzi: function chuJianzi() {
        if (this.currentQuan == -1) {
            this.showGesture(this.jianzi);
            cc.vv.net.send('cq_shot', this.jianzi);
        }
    },
    //出石头
    chuShitou: function chuShitou() {
        if (this.currentQuan == -1) {
            this.showGesture(this.shitou);
            cc.vv.net.send('cq_shot', this.shitou);
        }
    },
    //出布
    chuBu: function chuBu() {
        if (this.currentQuan == -1) {
            this.showGesture(this.bu);
            cc.vv.net.send('cq_shot', this.bu);
        }
    },
    //关闭弹框通知
    onBtnCloseAlert: function onBtnCloseAlert() {
        this._alertV.active = false;
        this.loadHomeHall();
        // this._morraHallV.active = false;
    },
    //关闭猜拳大厅
    onBtnCloseRoom: function onBtnCloseRoom() {
        var context = this;
        var str = "";
        if (this.seatindex == 0) {
            //房主
            if (this.seats.length == 2 && this.seats[1].userid != 0) {
                str = "您确定要放弃守擂！并将奖金赠送给了对手？";
            } else {
                str = "您确定要离开擂台？";
            }
            cc.vv.alert.show("提示", str, function () {
                cc.vv.net.send('cq_dispress');
                context.loadHomeHall();
            }, true);
        } else {
            str = "您手续费已扣除！您确定放弃攻擂？";
            cc.vv.alert.show("提示", str, function () {
                cc.vv.net.send('cq_exit');
                context.loadHomeHall();
            }, true);
        }
    },
    //加载首页大厅
    loadHomeHall: function loadHomeHall() {
        cc.director.loadScene("newhall");
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
    //打开猜拳规则
    onOpenguize: function onOpenguize() {
        this.guize.active = true;
    },
    //打开猜拳规则
    onCloseguize: function onCloseguize() {
        this.guize.active = false;
    }
});

cc._RFpop();
},{}],"Morra":[function(require,module,exports){
"use strict";
cc._RFpush(module, '21606/vy7RDk4aiixV6lpY1', 'Morra');
// scripts/components/Morra.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {

        _guessV: null,
        _createboxV: null,
        _create_gemsV: null,
        _create_coinsV: null,
        _create_tagV: null,
        _seekboxV: null,
        _alertV: null,
        _alertContentV: null,
        consu: 0 },
    // use this for initialization
    onLoad: function onLoad() {

        this._guessV = cc.find("Canvas/guess");
        this._createboxV = this._guessV.getChildByName("createbox");
        this._create_gemsV = this._createboxV.getChildByName("create_gems");
        this._create_coinsV = this._createboxV.getChildByName("create_coins");
        this._create_tagV = this._createboxV.getChildByName("create_tag");
        this._seekboxV = this._guessV.getChildByName("seekbox");
        this._alertV = cc.find("Canvas/guessboxAlert");
        this._alertContentV = this._alertV.getChildByName("content").getComponent(cc.Label);
    },

    //显示创建猜拳页面
    onBtnShowMorra: function onBtnShowMorra() {
        this._guessV.active = true;
    },
    //关闭猜拳页面
    onBtnCloseMorra: function onBtnCloseMorra() {
        this._guessV.active = false;
    },
    onBtnSetConsu: function onBtnSetConsu(ev, data) {
        if (data == 1) {
            this.consu = 1;
            this._create_tagV.getChildByName("gems_n").active = false;
            this._create_tagV.getChildByName("coins_n").active = true;
            this._create_gemsV.active = false;
            this._create_coinsV.active = true;
        } else {
            this.consu = 0;
            this._create_tagV.getChildByName("gems_n").active = true;
            this._create_tagV.getChildByName("coins_n").active = false;
            this._create_gemsV.active = true;
            this._create_coinsV.active = false;
        }
    },
    //显示创建房间页面
    onBtnShowCreat: function onBtnShowCreat() {
        this._createboxV.active = true;
        this._create_tagV.getChildByName("gems_n").active = true;
        this._create_tagV.getChildByName("coins_n").active = false;
        this._create_gemsV.active = true;
        this._create_coinsV.active = false;
        this.consu = 0;
    },
    //关闭创建房间页面
    onBtnCloseCreat: function onBtnCloseCreat() {
        this._createboxV.active = false;
        this._create_gemsV.active = false;
        this._create_coinsV.active = false;
        this.consu = 0;
    },
    //显示加入房间页面
    onBtnShowJoin: function onBtnShowJoin() {
        this._seekboxV.active = true;
    },
    //关闭加入房间页面
    onBtnCloseJoin: function onBtnCloseJoin() {
        this._seekboxV.active = false;
    },
    //关闭弹框通知
    onBtnCloseAlert: function onBtnCloseAlert() {
        this._alertV.active = false;
    },
    onBtnSetBonus: function onBtnSetBonus(ev, data) {
        if (this.consu == 0) {
            this._create_gemsV.getChildByName("editbox").getComponent(cc.EditBox).string = data;
        } else {
            this._create_coinsV.getChildByName("editbox").getComponent(cc.EditBox).string = data;
        }
    },
    //创建房间
    creatMorraRoom: function creatMorraRoom() {
        var self = this;
        var difen;
        if (this.consu == 0) {
            difen = self._create_gemsV.getChildByName("editbox").getComponent(cc.EditBox).string;
        } else {
            difen = self._create_coinsV.getChildByName("editbox").getComponent(cc.EditBox).string;
        }
        console.log("--------difen------->>", difen);
        if (!cc.vv.utils.checkRate(difen) || parseInt(difen) <= 0) {
            cc.vv.alert.show("提示", "请设置奖金数量！(只限整数)");
            // self._alertContentV.string = "请设置奖金数量！(只限整数)";
            // self._alertV.active = true;
            return;
        }
        var seiriNum = function seiriNum() {
            if (difen.charAt(0) == '0') {
                difen = difen.substr(1);
                seiriNum();
            }
        };
        seiriNum();
        if (this.consu == 0) {
            difen += "0000";
        }
        var onCreate = function onCreate(ret) {
            if (ret.errcode !== 0) {
                //console.log(ret.errmsg);
                cc.vv.wc.hide();
                var content = "";
                if (ret.errcode == 2222) {
                    content = "金币不足，创建房间失败!";
                    console.log("金币不足，创建房间失败!");
                    // cc.vv.alert.show("提示", "金币不足，创建房间失败!");
                } else {
                    content = "创建房间失败,错误码" + ret.errcode;
                    console.log("创建房间失败,错误码" + ret.errcode);
                    // cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
                cc.vv.alert.show("提示", content);
                // self._alertContentV.string = content;
                // self._alertV.active = true;
            } else {
                console.log('创建房间成功！！！！！！');
                //显示猜拳大厅
                // self._morraHallV.active = true;
                self.loadMorraHall();
                cc.vv.userMgr.room_type = 1;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var conf = {
            room_type: 1, //1代表猜拳房间
            difen: difen,
            consu: self.consu };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        console.log(data);
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, onCreate);
    },
    //加入房间
    joinMorraRoom: function joinMorraRoom() {
        var self = this;
        var roomId = self._seekboxV.getChildByName("editbox").getComponent(cc.EditBox).string;
        if (!cc.vv.utils.checkRate(roomId)) {
            // self._alertContentV.string = "请输入正确的房间号";
            // self._alertV.active = true;
            cc.vv.alert.show("提示", "请输入正确的房间号");
            return;
        }
        self.join(roomId);
    },
    join: function join(roomId) {
        var self = this;
        console.log("----roomId---->>", roomId);
        cc.vv.wc.show("正在进入房间");
        cc.vv.userMgr.enterRoom(roomId, function (ret) {
            cc.vv.wc.hide();
            console.log("----ret.errcode---->>", ret);
            if (ret.errcode == 0) {
                //显示猜拳大厅
                // self._morraHallV.active = true;
                cc.vv.gameNetMgr.initHandlers(1);
                self.loadMorraHall();
            } else {
                var content = "房间[" + roomId + "]不存在，请重新输入!";
                if (ret.errcode == 4) {
                    content = "房间[" + roomId + "]已满!";
                } else if (ret.errcode == 5) {
                    content = "钻石或金币不足！";
                }
                // self._alertContentV.string = content;
                // self._alertV.active = true;
                cc.vv.alert.show("提示", content);
            }
        });
    },

    //加载猜拳大厅
    loadMorraHall: function loadMorraHall() {
        cc.director.loadScene("caiquan");
    }
});

cc._RFpop();
},{}],"Net":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'b1cc9yRd15CXqFg0vTGKZUk', 'Net');
// scripts/Net.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (window.io == null) {
    window.io = require("socket-io");
}
var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: "",
        sio: null,
        isPinging: false,
        fnDisconnect: null,
        handlers: {},
        addHandler: function addHandler(event, fn) {
            if (this.handlers[event]) {
                console.log("event:" + event + "' handler has been registered.");
                return;
            }
            var handler = function handler(data) {
                //console.log(event + "(" + typeof(data) + "):" + (data? data.toString():"null"));
                if (event != "disconnect" && typeof data == "string") {
                    data = JSON.parse(data);
                }
                fn(data);
            };
            this.handlers[event] = handler;
            if (this.sio) {
                console.log("register:function " + event);
                this.sio.on(event, handler);
            }
        },
        connect: function connect(fnConnect, fnError) {
            var self = this;
            var opts = {
                'reconnection': false,
                'force new connection': true,
                'transports': ['websocket', 'polling']
            };
            this.sio = window.io.connect(this.ip, opts);
            this.sio.on('reconnect', function () {
                console.log('reconnection');
            });
            this.sio.on('connect', function (data) {
                self.sio.connected = true;
                fnConnect(data);
            });
            this.sio.on('disconnect', function (data) {
                console.log("disconnect");
                self.sio.connected = false;
                self.close();
            });
            this.sio.on('connect_failed', function () {
                console.log('connect_failed');
            });
            for (var key in this.handlers) {
                var value = this.handlers[key];
                if (typeof value == "function") {
                    if (key == 'disconnect') {
                        this.fnDisconnect = value;
                    } else {
                        console.log("register:function " + key);
                        this.sio.on(key, value);
                    }
                }
            }
            this.startHearbeat();
        },
        startHearbeat: function startHearbeat() {
            this.sio.on('game_pong', function () {
                self.lastRecieveTime = Date.now();
            });
            this.lastRecieveTime = Date.now();
            var self = this;
            if (!self.isPinging) {
                self.isPinging = true;
                setInterval(function () {
                    if (self.sio) {
                        //FIXME: 超时设为3s
                        if (Date.now() - self.lastRecieveTime > 10000) {
                            self.close();
                        } else {
                            self.ping();
                        }
                    }
                }, 5000);
            }
        },
        send: function send(event, data) {
            if (this.sio.connected) {
                if (data != null && (typeof data === "undefined" ? "undefined" : _typeof(data)) == "object") {
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event, data);
            }
        },
        ping: function ping() {
            this.send('game_ping');
        },
        close: function close() {
            console.log('close');
            if (this.sio && this.sio.connected) {
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
            if (this.fnDisconnect) {
                this.fnDisconnect();
                this.fnDisconnect = null;
            }
        },
        test: function test(fnResult) {
            var xhr = null;
            var fn = function fn(ret) {
                fnResult(ret.isonline);
                xhr = null;
            };
            var arr = this.ip.split(':');
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                ip: arr[0],
                port: arr[1]
            };
            xhr = cc.vv.http.sendRequest("/is_server_online", data, fn);
            setTimeout(function () {
                if (xhr) {
                    xhr.abort();
                    fnResult(false);
                }
            }, 1500);
        }
    }
});

cc._RFpop();
},{"socket-io":"socket-io"}],"NewHall":[function(require,module,exports){
"use strict";
cc._RFpush(module, '84dfbD7QXlAUJfOKA+Ujf4s', 'NewHall');
// scripts/components/NewHall.js

"use strict";

var Net = require("Net");
var Global = require("Global");
cc.Class({
    extends: cc.Component,
    properties: {
        selectZJH: cc.Node,
        selectMJ: cc.Node,
        selectDN: cc.Node,
        selectDZPK: cc.Node,
        nickname: cc.Label,
        userGems: cc.Label,
        userCoins: cc.Label,
        headImg: cc.Sprite,
        _lastCheckTime: 0,
        _lastRefreshTime: 0,
        mj_online: cc.Label,
        zjh_online: cc.Label,
        dn_online: cc.Label,
        dzpk_online: cc.Label,
        effAnimation: cc.Node,
        lblNotice: cc.Label,
        _activity: null,
        gonggao: cc.Node,
        statement: null,
        statementContent: cc.RichText
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (!cc.vv) {
            cc.director.loadScene("login");
            return;
        }
        this.statement = cc.find("Canvas/statement");
        this._activity = cc.find("Canvas/activity");
        this._match = cc.find("Canvas/match");
        this.jbs = this._match.getComponent("Jbs");
        var imgLoader = this.headImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        this.jinbi = cc.find("Canvas/header/jinbi/gems").getComponent(cc.Label);
        this.diamond = cc.find("Canvas/header/zuanshi/coins").getComponent(cc.Label);
        this.jinbiChange = cc.find("Canvas/jinbiChange");
        this.initButtonHandler("Canvas/scrollview/view/content/zjhbtn");
        this.initButtonHandler("Canvas/scrollview/view/content/mjbtn");
        this.initButtonHandler("Canvas/scrollview/view/content/dnbtn");
        this.initButtonHandler("Canvas/scrollview/view/content/dzpkbtn");
        this.initButtonHandler("Canvas/footer/exchange");
        this.initButtonHandler("Canvas/header/jinbi/iconAdd");
        this.initJinbiChangeHandler();
        this.initLabels();
        this.getUserOnline();
        this.effNode = cc.find("Canvas/eff");
        // this.playBtnEff(true);
        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version: null,
                msg: "数据请求中..."
            };
        };
        if (!cc.vv.userMgr.gemstip) {
            cc.vv.userMgr.gemstip = {
                version: null,
                msg: "数据请求中..."
            };
        };
        var roomId = cc.vv.userMgr.oldRoomId;
        if (roomId != null) {
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        };
        this.lblNotice.string = cc.vv.userMgr.notice.msg;
        this.refreshNotice();
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        //模块的动态显示
        if (cc.vv.userMgr.modules) {
            var content = cc.find("Canvas/scrollview/view/content");
            var del_arr = [];
            for (var i in content.children) {
                var child = content.children[i];
                if (cc.vv.userMgr.modules.indexOf(parseInt(i)) == -1) {
                    del_arr.push(child);
                }
            }
            for (var i in del_arr) {
                content.removeChild(del_arr[i]);
            }
            var width = content.children[0].width;
            var length = content.children.length;
            var per = (1280 - width * length) / (length + 1);
            per = per + 120;
            for (var i in content.children) {
                var child = content.children[i];
                child.x = per + i * (width / 2 + per);
            }
        };
        //锦标赛是否开放
        this.initJbs();
    },
    initJbs: function initJbs() {
        var btn = cc.find("Canvas/scrollview/view/content/jbsbtn");
        if (cc.vv.userMgr.is_open_jbs) {
            btn.getComponent(cc.Button).interactable = true;
            // btn.interactable = true;
            for (var i in btn.children) {
                btn.children[i].active = false;
            }
        }
    },
    /*// 播放按钮特效
    playBtnEff: function(flag) {
        if (flag) {
            this.btnEff = this.effAnimation.getComponent(cc.Animation);
            var animState = this.btnEff.play('anniu');
            animState.speed = 0.2;
            animState.wrapMode = cc.WrapMode.Loop;
            animState.repeatCount = Infinity;
        }
    },*/
    refreshNotice: function refreshNotice() {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.lblNotice.string = ret.msg;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "notice",
            version: cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    initLabels: function initLabels() {
        this.nickname.string = cc.vv.userMgr.userName;
        this.userGems.string = cc.vv.utils.showJinbi(cc.vv.userMgr.gems);
        this.userCoins.string = cc.vv.userMgr.coins;
    },
    initButtonHandler: function initButtonHandler(btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "NewHall", "onBtnClicked");
    },
    initJinbiChangeHandler: function initJinbiChangeHandler() {
        cc.vv.utils.addClickEvent(this.jinbiChange.getChildByName('yes'), this.node, "NewHall", "onChangeJinbi");
        cc.vv.utils.addClickEvent(this.jinbiChange.getChildByName('no'), this.node, "NewHall", "onChangeJinbi");
    },
    onBtnClicked: function onBtnClicked(event) {
        switch (event.target.name) {
            case 'zjhbtn':
                this.selectZJH.active = true;
                this.selectZJH.getComponent("SelectZjh").initView();
                break;
            case 'exchange':
                this.jinbiChange.active = true;
                break;
            case 'mjbtn':
                this.selectMJ.active = true;
                break;
            case 'dnbtn':
                this.selectDN.active = true;
                this.selectDN.getComponent("SelectDn").initView();
                break;
            case 'dzpkbtn':
                this.selectDZPK.active = true;
                this.selectDZPK.getComponent("SelectDzpk").initView();
                break;
        }
    },
    showActivity: function showActivity() {
        this._activity.active = true;
        this._activity.getComponent("Collapse").refreshBtns();
    },
    hideActivity: function hideActivity() {
        this._activity.active = false;
    },
    //兑换金币
    onChangeJinbi: function onChangeJinbi(event) {
        switch (event.target.name) {
            case 'yes':
                var data = {
                    sign: cc.vv.userMgr.sign,
                    userid: cc.vv.userMgr.userId,
                    num_diamond: cc.find("Canvas/jinbiChange/editbox").getComponent(cc.EditBox).string
                };
                var onYes = function onYes(ret) {
                    if (ret) {
                        if (ret.userid == cc.vv.userMgr.userId) {
                            if (ret.jinbi != null) {
                                this.jinbi.string = cc.vv.utils.showJinbi(ret.jinbi); //刷新金币显示
                                this.diamond.string = ret.diamond; //刷新钻石显示
                                console.log('兑换成功！');
                            } else {
                                console.log('无金币数量返回！');
                            }
                        } else {
                            console.log('userid不匹配！');
                        }
                    } else {
                        console.log('兑换失败！');
                    }
                    this.jinbiChange.active = false;
                };
                cc.vv.http.sendRequest("/changeJinbi", data, onYes.bind(this));
                break;
            case 'no':
                this.jinbiChange.active = false;
                break;
        }
    },
    onBtnAddCoinsClicked: function onBtnAddCoinsClicked() {
        cc.vv.chargeType.show();
    },
    onBtnAddGemsClicked: function onBtnAddGemsClicked() {
        this.jinbiChange.active = true;
    },
    showAnnouncement: function showAnnouncement() {
        this.gonggao.active = true;
        this.gonggao.getComponent("Announcement").getAnnouncement();
    },
    // 获得更新消息
    getRefreshInfo: function getRefreshInfo() {
        var self = this;
        var fn = function fn(ret) {
            if (ret == null) {
                console.log('消息是空的');
                return;
            }
            if (ret.userid == cc.vv.userMgr.userId) {
                if (ret.gems != null) {
                    // self.userGems.string = cc.vv.utils.showJinbi(ret.gems);
                    cc.vv.userMgr.gems = ret.gems;
                }
                if (ret.coins != null) {
                    cc.vv.userMgr.coins = ret.coins;
                    // self.userCoins.string = ret.coins;
                }
            }
        };
        this._lastRefreshTime = Date.now();
        cc.vv.http.sendRequest("/need_refresh", {
            userid: cc.vv.userMgr.userId
        }, fn);
    },
    getUserOnline: function getUserOnline() {
        var self = this;
        var fn = function fn(ret) {
            self.mj_online.string = ret['0'] + "人在线";
            self.zjh_online.string = ret['2'] + "人在线";
            self.dn_online.string = ret['3'] + "人在线";
            self.dzpk_online.string = ret['4'] + "人在线";
        };
        this._lastCheckTime = Date.now();
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_online", data, fn);
    },
    exchangeRoom: function exchangeRoom() {
        if (cc.vv.userMgr.room_type == 2) {
            var type = 'zjh';
        } else if (cc.vv.userMgr.room_type == 3) {
            var type = 'dn';
        } else {
            var type = 'dzpk';
        }
        var conf = {
            room_type: cc.vv.userMgr.room_type, //2代表扎金花房间
            scene: cc.vv.userMgr.scene,
            genre: 1,
            type: type
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf),
            e_roomid: cc.vv.userMgr.e_roomid
        };
        cc.vv.wc.show("寻找房间");
        var onSearch = function onSearch(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                if (ret.errcode == 2) {
                    if (ret.errmsg == 1) {
                        cc.vv.alert.show("提示", "钻石不够，无法匹配");
                    } else {
                        cc.vv.alert.show("提示", "金币不够，无法匹配");
                    }
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = conf.room_type;
                cc.vv.userMgr.scene = conf.scene;
                cc.vv.userMgr.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        cc.vv.http.sendRequest("/exchange_room", data, onSearch);
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (Date.now() - this._lastCheckTime > 10000) {
            this.getUserOnline();
        };
        if (Date.now() - this._lastRefreshTime > 20000) {
            this.getRefreshInfo();
        };
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;
        if (cc.vv && cc.vv.userMgr.roomData != null) {
            cc.vv.userMgr.reconnection = 1;
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        } else {
            // 如果当前没有房间，且分享过来的房间号不是空的话，可以进入房间
            if (cc.vv && cc.vv.userMgr.shareRoomId != null) {
                cc.vv.userMgr.roomData = null;
                var roomid = cc.vv.userMgr.shareRoomId;
                cc.vv.userMgr.shareRoomId = null;
                cc.vv.userMgr.enterRoom(roomid, function (ret) {
                    if (ret.errcode != 0) {
                        var content = "房间[" + roomid + "]不存在，请重新输入!";
                        if (ret.errcode == 4) {
                            content = "房间[" + roomid + "]已满!";
                        }
                        cc.vv.alert.show("提示", content);
                    }
                }.bind(this));
            }
        }
        if (cc.vv && cc.vv.userMgr.exchange == 1) {
            cc.vv.userMgr.exchange = 0;
            this.exchangeRoom();
        }
        this.userGems.string = cc.vv.utils.showJinbi(cc.vv.userMgr.gems);
        this.userCoins.string = cc.vv.userMgr.coins;
    },
    onOpenstatement: function onOpenstatement() {
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                this.statement.active = true;
                this.statementContent.string = ret.msg;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "statement"
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    onClosestatement: function onClosestatement() {
        this.statement.active = false;
    },
    // onJBSBtnClick: function() {
    //     cc.vv.gameNetMgr.connectMatchServer();
    // },
    onJBSBtnClick: function onJBSBtnClick() {
        var self = this;
        var send_data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userid: cc.vv.userMgr.userId
        };
        cc.vv.http.sendRequest("/get_jbs_data", send_data, function (ret) {
            self.jbs.showMatchList(ret);
        });
    }
});

cc._RFpop();
},{"Global":"Global","Net":"Net"}],"NoticeTip":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'df61b4+FzFDvbpO5g8UNVIM', 'NoticeTip');
// scripts/components/NoticeTip.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _guohu: null,
        _info: null,
        _guohuTime: -1
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._guohu = cc.find("Canvas/tip_notice");
        this._guohu.active = false;
        this._info = cc.find("Canvas/tip_notice/info").getComponent(cc.Label);
        var self = this;
        this.node.on('push_notice', function (data) {
            var data = data.detail;
            self._guohu.active = true;
            self._guohuTime = data.time;
            self._info.string = data.info;
        });
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._guohuTime > 0) {
            this._guohuTime -= dt;
            if (this._guohuTime < 0) {
                this._guohu.active = false;
            }
        }
    }
});

cc._RFpop();
},{}],"OnBack":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6fd982Tyi5NOYJWt/fGY8Lj', 'OnBack');
// scripts/components/OnBack.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },
    // use this for initialization
    onLoad: function onLoad() {
        var btn = this.node.getChildByName("btn_back");
        cc.vv.utils.addClickEvent(btn, this.node, "OnBack", "onBtnClicked");
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "btn_back") {
            this.node.active = false;
        }
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"PengGangs":[function(require,module,exports){
"use strict";
cc._RFpush(module, '279d9pNFGRB3rD/ngr1LIXQ', 'PengGangs');
// scripts/components/PengGangs.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (!cc.vv) {
            return;
        }
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName("myself");
        var pengangroot = myself.getChildByName("penggangs");
        var realwidth = cc.director.getVisibleSize().width;
        var scale = realwidth / 1280;
        pengangroot.scaleX *= scale;
        pengangroot.scaleY *= scale;
        var self = this;
        this.node.on('peng_notify', function (data) {
            //刷新所有的牌
            console.log("peng_notify", data.detail);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        this.node.on('chi_notify', function (data) {
            //刷新所有的牌
            console.log("chi_notify-----penggang", data.detail);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        this.node.on('gang_notify', function (data) {
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data.seatData);
        });
        this.node.on('game_begin', function (data) {
            self.onGameBein();
        });
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }
    },
    onGameBein: function onGameBein() {
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },
    hideSide: function hideSide(side) {
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        if (pengangroot) {
            for (var i = 0; i < pengangroot.childrenCount; ++i) {
                pengangroot.children[i].active = false;
            }
        }
    },
    onPengGangChanged: function onPengGangChanged(seatData) {
        if (seatData.angangs == null && seatData.diangangs == null && seatData.wangangs == null && seatData.pengs == null && seatData.chis == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        console.log("onPengGangChanged" + localIndex);
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        for (var i = 0; i < pengangroot.childrenCount; ++i) {
            pengangroot.children[i].active = false;
        }
        //初始化杠牌
        var index = 0;
        var gangs = seatData.angangs;
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                var mjid = gangs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "angang");
                index++;
            }
        }
        var gangs = seatData.diangangs;
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                var mjid = gangs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "diangang");
                index++;
            }
        }
        var gangs = seatData.wangangs;
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                var mjid = gangs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "wangang");
                index++;
            }
        }
        //初始化碰牌
        var pengs = seatData.pengs;
        if (pengs) {
            for (var i = 0; i < pengs.length; ++i) {
                var mjid = pengs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "peng");
                index++;
            }
        }
        // 吃的牌一定要以数组的形式存放,类似[[1,2,3],[3,4,5]];
        //初始化吃牌
        var chis = seatData.chis;
        console.debug("显示吃牌操作", chis);
        if (chis) {
            console.debug("吃的", chis.length);
            for (var i = 0; i < chis.length; ++i) {
                var mjids = chis[i];
                this.initChis(pengangroot, side, pre, index, mjids);
                index++;
            }
        }
    },
    initPengAndGangs: function initPengAndGangs(pengangroot, side, pre, index, mjid, flag) {
        console.info("initPengAndGangs", pengangroot, side, pre, index, mjid, flag);
        var pgroot = null;
        if (pengangroot.childrenCount <= index) {
            if (side == "left" || side == "right") {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            } else {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            pengangroot.addChild(pgroot);
        } else {
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        if (side == "left") {
            pgroot.y = -(index * 25 * 3);
        } else if (side == "right") {
            pgroot.y = index * 25 * 3;
            pgroot.setLocalZOrder(-index);
        } else if (side == "myself") {
            pgroot.x = index * 55 * 3 + index * 10;
        } else {
            pgroot.x = -(index * 55 * 3);
        }
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") {
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if (flag == "angang") {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                    if (side == "myself" || side == "up") {
                        sprite.node.scaleX = 1.4;
                        sprite.node.scaleY = 1.4;
                    }
                } else {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
                }
            } else {
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
            }
        }
    },
    // 吃牌
    initChis: function initChis(pengangroot, side, pre, index, mjids) {
        console.debug("initChis", mjids);
        var pgroot = null;
        if (pengangroot.childrenCount <= index) {
            if (side == "left" || side == "right") {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            } else {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            pengangroot.addChild(pgroot);
        } else {
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        if (side == "left") {
            pgroot.y = -(index * 25 * 3);
        } else if (side == "right") {
            pgroot.y = index * 25 * 3;
            pgroot.setLocalZOrder(-index);
        } else if (side == "myself") {
            pgroot.x = index * 55 * 3 + index * 10;
        } else {
            pgroot.x = -(index * 55 * 3);
        }
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") {
                sprite.node.active = false;
            }
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjids[s]);
        }
    }
});

cc._RFpop();
},{}],"PopupMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'bc0d2VLgL1Avo166tHLsjCJ', 'PopupMgr');
// scripts/components/PopupMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _popuproot: null,
        _settings: null,
        _dissolveNotice: null,
        _endTime: -1,
        _extraInfo: null,
        _noticeLabel: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        cc.vv.popupMgr = this;
        this._popuproot = cc.find("Canvas/popups");
        this._settings = cc.find("Canvas/popups/settings");
        this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
        this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);
        this.closeAll();
        this.addBtnHandler("settings/btn_close");
        this.addBtnHandler("settings/btn_sqjsfj");
        this.addBtnHandler("dissolve_notice/btn_agree");
        this.addBtnHandler("dissolve_notice/btn_reject");
        this.addBtnHandler("dissolve_notice/btn_ok");
        var self = this;
        this.node.on("dissolve_notice", function (event) {
            var data = event.detail;
            self.showDissolveNotice(data);
        });
        this.node.on("dissolve_cancel", function (event) {
            self.closeAll();
        });
    },
    start: function start() {
        if (cc.vv.gameNetMgr.dissoveData) {
            this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
        }
    },
    addBtnHandler: function addBtnHandler(btnName) {
        var btn = cc.find("Canvas/popups/" + btnName);
        this.addClickEvent(btn, this.node, "PopupMgr", "onBtnClicked");
    },
    addClickEvent: function addClickEvent(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    onBtnClicked: function onBtnClicked(event) {
        this.closeAll();
        var btnName = event.target.name;
        if (btnName == "btn_agree") {
            cc.vv.net.send("dissolve_agree");
        } else if (btnName == "btn_reject") {
            cc.vv.net.send("dissolve_reject");
        } else if (btnName == "btn_sqjsfj") {
            cc.vv.net.send("dissolve_request");
        } else if (btnName == "btn_ok") {
            this.closeAll();
        }
    },
    closeAll: function closeAll() {
        this._popuproot.active = false;
        this._settings.active = false;
        this._dissolveNotice.active = false;
    },
    showSettings: function showSettings() {
        this.closeAll();
        this._popuproot.active = true;
        this._settings.active = true;
    },
    showDissolveRequest: function showDissolveRequest() {
        this.closeAll();
        this._popuproot.active = true;
    },
    showDissolveNotice: function showDissolveNotice(data) {
        this._endTime = Date.now() / 1000 + data.time;
        this._extraInfo = "";
        for (var i = 0; i < data.states.length; ++i) {
            var b = data.states[i];
            var name = cc.vv.gameNetMgr.seats[i].name;
            if (b) {
                this._extraInfo += "\n[已同意] " + name;
            } else {
                this._extraInfo += "\n[待确认] " + name;
            }
        }
        this.closeAll();
        this._popuproot.active = true;
        this._dissolveNotice.active = true;;
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._endTime > 0) {
            var lastTime = this._endTime - Date.now() / 1000;
            if (lastTime < 0) {
                this._endTime = -1;
            }
            var m = Math.floor(lastTime / 60);
            var s = Math.ceil(lastTime - m * 60);
            var str = "";
            if (m > 0) {
                str += m + "分";
            }
            this._noticeLabel.string = str + s + "秒后房间将自动解散" + this._extraInfo;
        }
    }
});

cc._RFpop();
},{}],"RadioButton":[function(require,module,exports){
"use strict";
cc._RFpush(module, '8d571y2U+9AiKntO+TSf0Fb', 'RadioButton');
// scripts/components/RadioButton.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

cc.Class({
    extends: cc.Component,
    properties: {
        target: cc.Node,
        sprite: cc.SpriteFrame,
        checkedSprite: cc.SpriteFrame,
        checked: false,
        groupId: -1
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        if (cc.vv.radiogroupmgr == null) {
            var RadioGroupMgr = require("RadioGroupMgr");
            cc.vv.radiogroupmgr = new RadioGroupMgr();
            cc.vv.radiogroupmgr.init();
        }
        console.log(_typeof(cc.vv.radiogroupmgr.add));
        cc.vv.radiogroupmgr.add(this);
        this.refresh();
    },
    refresh: function refresh() {
        var targetSprite = this.target.getComponent(cc.Sprite);
        if (this.checked) {
            targetSprite.spriteFrame = this.checkedSprite;
        } else {
            targetSprite.spriteFrame = this.sprite;
        }
    },
    check: function check(value) {
        this.checked = value;
        this.refresh();
    },
    onClicked: function onClicked() {
        cc.vv.radiogroupmgr.check(this);
    },
    onDestroy: function onDestroy() {
        if (cc.vv && cc.vv.radiogroupmgr) {
            cc.vv.radiogroupmgr.del(this);
        }
    }
});

cc._RFpop();
},{"RadioGroupMgr":"RadioGroupMgr"}],"RadioGroupMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '824eapeRYNKY4RJzg2Z4YA2', 'RadioGroupMgr');
// scripts/components/RadioGroupMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _groups: null
    },
    // use this for initialization
    init: function init() {
        this._groups = {};
    },
    add: function add(radioButton) {
        var groupId = radioButton.groupId;
        var buttons = this._groups[groupId];
        if (buttons == null) {
            buttons = [];
            this._groups[groupId] = buttons;
        }
        buttons.push(radioButton);
    },
    del: function del(radioButton) {
        var groupId = radioButton.groupId;
        var buttons = this._groups[groupId];
        if (buttons == null) {
            return;
        }
        var idx = buttons.indexOf(radioButton);
        if (idx != -1) {
            buttons.splice(idx, 1);
        }
        if (buttons.length == 0) {
            delete this._groups[groupId];
        }
    },
    check: function check(radioButton) {
        var groupId = radioButton.groupId;
        var buttons = this._groups[groupId];
        if (buttons == null) {
            return;
        }
        for (var i = 0; i < buttons.length; ++i) {
            var btn = buttons[i];
            if (btn == radioButton) {
                btn.check(true);
            } else {
                btn.check(false);
            }
        }
    }
});

cc._RFpop();
},{}],"ReConnect":[function(require,module,exports){
"use strict";
cc._RFpush(module, '7f553G0boRH6KrTE7wACaXx', 'ReConnect');
// scripts/components/ReConnect.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _reconnect: null,
        _lblTip: null,
        _lastPing: 0
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._reconnect = cc.find("Canvas/reconnect");
        this._lblTip = cc.find("Canvas/reconnect/tip").getComponent(cc.Label);
        var self = this;
        var fnTestServerOn = function fnTestServerOn() {
            cc.vv.net.test(function (ret) {
                if (ret) {
                    cc.director.loadScene('newhall');
                } else {
                    setTimeout(fnTestServerOn, 3000);
                }
            });
        };
        var fn = function fn(data) {
            self.node.off('disconnect', fn);
            self._reconnect.active = true;
            fnTestServerOn();
        };
        this.node.on('disconnect', fn);
        this.node.on('loadHall', function (ret) {
            cc.director.loadScene('newhall');
        });
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._reconnect.active) {
            var t = Math.floor(Date.now() / 1000) % 4;
            this._lblTip.string = "与服务器断开连接，正在尝试重连";
            for (var i = 0; i < t; ++i) {
                this._lblTip.string += '.';
            }
        }
    }
});

cc._RFpop();
},{}],"ReplayCtrl":[function(require,module,exports){
"use strict";
cc._RFpush(module, '21e6a+ajGNDTJwDHbV3A72m', 'ReplayCtrl');
// scripts/components/ReplayCtrl.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _nextPlayTime: 1,
        _replay: null,
        _isPlaying: true
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._replay = cc.find("Canvas/replay");
        this._replay.active = cc.vv.replayMgr.isReplay();
    },
    onBtnPauseClicked: function onBtnPauseClicked() {
        this._isPlaying = false;
    },
    onBtnPlayClicked: function onBtnPlayClicked() {
        this._isPlaying = true;
    },
    onBtnBackClicked: function onBtnBackClicked() {
        cc.vv.replayMgr.clear();
        cc.vv.gameNetMgr.reset();
        cc.vv.gameNetMgr.roomId = null;
        cc.director.loadScene("hall");
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (cc.vv) {
            if (this._isPlaying && cc.vv.replayMgr.isReplay() == true && this._nextPlayTime > 0) {
                this._nextPlayTime -= dt;
                if (this._nextPlayTime < 0) {
                    this._nextPlayTime = cc.vv.replayMgr.takeAction();
                }
            }
        }
    }
});

cc._RFpop();
},{}],"ReplayMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '1a6a1p86NFL6KZEZCnbu7tt', 'ReplayMgr');
// scripts/ReplayMgr.js

"use strict";

var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_CHI = 7;
var ACTION_CAISHEN = 8;
cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _lastAction: null,
        _actionRecords: null,
        _currentIndex: 0
    },
    // use this for initialization
    onLoad: function onLoad() {},
    clear: function clear() {
        this._lastAction = null;
        this._actionRecords = null;
        this._currentIndex = 0;
    },
    init: function init(data) {
        this._actionRecords = data.action_records;
        if (this._actionRecords == null) {
            this._actionRecords = {};
        }
        this._currentIndex = 0;
        this._lastAction = null;
    },
    isReplay: function isReplay() {
        return this._actionRecords != null;
    },
    getNextAction: function getNextAction() {
        if (this._currentIndex >= this._actionRecords.length) {
            return null;
        }
        var si = this._actionRecords[this._currentIndex++];
        var action = this._actionRecords[this._currentIndex++];
        var pai = this._actionRecords[this._currentIndex++];
        return {
            si: si,
            type: action,
            pai: pai
        };
    },
    takeAction: function takeAction() {
        var action = this.getNextAction();
        if (this._lastAction != null && this._lastAction.type == ACTION_CHUPAI) {
            if (action != null && action.type != ACTION_PENG && action.type != ACTION_GANG && action.type != ACTION_HU) {
                cc.vv.gameNetMgr.doGuo(this._lastAction.si, this._lastAction.pai);
            }
        }
        this._lastAction = action;
        if (action == null) {
            return -1;
        }
        var nextActionDelay = 1.0;
        if (action.type == ACTION_CHUPAI) {
            //console.log("chupai");
            cc.vv.gameNetMgr.doChupai(action.si, action.pai);
            return 1.0;
        } else if (action.type == ACTION_MOPAI) {
            //console.log("mopai");
            cc.vv.gameNetMgr.doMopai(action.si, action.pai);
            cc.vv.gameNetMgr.doTurnChange(action.si);
            return 0.5;
        } else if (action.type == ACTION_PENG) {
            //console.log("peng");
            cc.vv.gameNetMgr.doPeng(action.si, action.pai);
            cc.vv.gameNetMgr.doTurnChange(action.si);
            return 1.0;
        } else if (action.type == ACTION_GANG) {
            //console.log("gang");
            cc.vv.gameNetMgr.dispatchEvent('hangang_notify', action.si);
            cc.vv.gameNetMgr.doGang(action.si, action.pai);
            cc.vv.gameNetMgr.doTurnChange(action.si);
            return 1.0;
        } else if (action.type == ACTION_HU) {
            //console.log("hu");
            cc.vv.gameNetMgr.doHu({
                seatindex: action.si,
                hupai: action.pai,
                iszimo: false
            });
            return 1.5;
        } else if (action.type == ACTION_CHI) {
            //console.log("chi");
            // 
            // var pd = {
            //     "pai": pai,
            //     "chiArray": chiArray
            // };
            var pai = action.pai["pai"];
            var chiArr = action.pai["chiArray"];
            for (var i = 0; i < chiArr.length; i++) {
                if (chiArr[i] == pai) {
                    chiArr.splice(i, 1);
                }
            }
            cc.vv.gameNetMgr.doChi(action.si, pai, chiArr);
            return 1.5;
        } else if (action.type == ACTION_CAISHEN) {
            cc.vv.gameNetMgr.doCaiShen(action.si, action.pai);
            return 1.5;
        }
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"Seat":[function(require,module,exports){
"use strict";
cc._RFpush(module, '820870ltMZNDYlvzr+qCDEJ', 'Seat');
// scripts/components/Seat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _sprIcon: null,
        _zhuang: null,
        _ready: null,
        _offline: null,
        _lblName: null,
        _lblScore: null,
        _scoreBg: null,
        _nddayingjia: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _dayingjia: false,
        _isOffline: false,
        _isReady: false,
        _isZhuang: false,
        _userId: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("icon").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("score").getComponent(cc.Label);
        this._voicemsg = this.node.getChildByName("voicemsg");
        if (this._voicemsg) {
            this._voicemsg.active = false;
        }
        if (this._sprIcon && this._sprIcon.getComponent(cc.Button)) {
            cc.vv.utils.addClickEvent(this._sprIcon, this.node, "Seat", "onIconClicked");
        }
        this._offline = this.node.getChildByName("offline");
        this._ready = this.node.getChildByName("ready");
        this._zhuang = this.node.getChildByName("zhuang");
        this._scoreBg = this.node.getChildByName("Z_money_frame");
        this._nddayingjia = this.node.getChildByName("dayingjia");
        this._chatBubble = this.node.getChildByName("ChatBubble");
        if (this._chatBubble != null) {
            this._chatBubble.active = false;
        }
        this._emoji = this.node.getChildByName("emoji");
        if (this._emoji != null) {
            this._emoji.active = false;
        }
        this.refresh();
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
    },
    onIconClicked: function onIconClicked() {
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if (this._userId != null && this._userId > 0) {
            var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if (cc.vv.baseInfoMap) {
                var info = cc.vv.baseInfoMap[this._userId];
                if (info) {
                    sex = info.sex;
                }
            }
        }
    },
    refresh: function refresh() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._nddayingjia != null) {
            this._nddayingjia.active = this._dayingjia == true;
        }
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
        if (this._zhuang) {
            this._zhuang.active = this._isZhuang;
        }
        this.node.active = this._userName != null && this._userName != "";
    },
    setInfo: function setInfo(name, score, dayingjia) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        this._dayingjia = dayingjia;
        if (this._scoreBg != null) {
            this._scoreBg.active = this._score != null;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        this.refresh();
    },

    setZhuang: function setZhuang(value) {
        this._isZhuang = value;
        if (this._zhuang) {
            this._zhuang.active = value;
        } else {
            this._zhuang = this.node.getChildByName("zhuang");
            this._zhuang.active = value;
        }
    },
    setReady: function setReady(isReady) {
        this._isReady = isReady;
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
    },
    setID: function setID(id) {
        var idNode = this.node.getChildByName("id");
        if (idNode) {
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;
        }
        this._userId = id;
        if (this._sprIcon) {
            this._sprIcon.setUserID(id);
        }
    },
    setOffline: function setOffline(isOffline) {
        this._isOffline = isOffline;
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    chat: function chat(content) {
        if (this._chatBubble == null || this._emoji == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function emoji(_emoji) {
        //emoji = JSON.parse(emoji);
        if (this._emoji == null || this._emoji == null) {
            return;
        }
        console.log(_emoji);
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(_emoji);
        this._lastChatTime = 3;
    },
    voiceMsg: function voiceMsg(show) {
        if (this._voicemsg) {
            this._voicemsg.active = show;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._lastChatTime > 0) {
            this._lastChatTime -= dt;
            if (this._lastChatTime < 0) {
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
    }
});

cc._RFpop();
},{}],"SelectDn":[function(require,module,exports){
"use strict";
cc._RFpush(module, '06939hb4odIYavgJf6dOkV9', 'SelectDn');
// scripts/components/SelectDn.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        pm: cc.Node,
        xz: cc.Node,
        lb: cc.Node,
        th: cc.Node,
        gz: cc.Node,
        hj: cc.Node,
        // pmlable1: cc.Label,
        // pmlable2: cc.Label,
        pmlable3: cc.Label,
        pmlable4: cc.Label,
        // xzlable1: cc.Label,
        // xzlable2: cc.Label,
        xzlable3: cc.Label,
        xzlable4: cc.Label,
        // lblable1: cc.Label,
        // lblable2: cc.Label,
        lblable3: cc.Label,
        lblable4: cc.Label,
        // thlable1: cc.Label,
        // thlable2: cc.Label,
        thlable3: cc.Label,
        thlable4: cc.Label,
        // gzlable1: cc.Label,
        // gzlable2: cc.Label,
        gzlable3: cc.Label,
        gzlable4: cc.Label,
        // hjlable1: cc.Label,
        // hjlable2: cc.Label,
        hjlable3: cc.Label,
        hjlable4: cc.Label
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.initButtonHandler(this.pm);
        this.initButtonHandler(this.xz);
        this.initButtonHandler(this.lb);
        this.initButtonHandler(this.th);
        this.initButtonHandler(this.gz);
        this.initButtonHandler(this.hj);
    },
    initView: function initView() {
        var self = this;
        var fn = function fn(ret) {
            if (ret) {
                for (var i = 0; i < ret.length; i++) {
                    if (i == 0) {
                        self.pm.scene = ret[i].id;
                        // self.pmlable1.string = ret[i].name;
                        // self.pmlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.pmlable3.string = ret[i].online;
                        self.pmlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 1) {
                        self.xz.scene = ret[i].id;
                        // self.xzlable1.string = ret[i].name;
                        // self.xzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.xzlable3.string = ret[i].online;
                        self.xzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 2) {
                        self.lb.scene = ret[i].id;
                        // self.lblable1.string = ret[i].name;
                        // self.lblable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.lblable3.string = ret[i].online;
                        self.lblable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 3) {
                        self.th.scene = ret[i].id;
                        // self.thlable1.string = ret[i].name;
                        // self.thlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.thlable3.string = ret[i].online;
                        self.thlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 4) {
                        self.gz.scene = ret[i].id;
                        // self.gzlable1.string = ret[i].name;
                        // self.gzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.gzlable3.string = ret[i].online;
                        self.gzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 5) {
                        self.hj.scene = ret[i].id;
                        // self.hjlable1.string = ret[i].name;
                        // self.hjlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.hjlable3.string = ret[i].online;
                        self.hjlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    }
                };
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            room_type: 3
        };
        cc.vv.http.sendRequest("/get_scene", data, fn);
    },
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectDn", "matchRoom");
    },
    matchRoom: function matchRoom(event) {
        var conf = {
            room_type: 3, //3代表斗牛房间
            scene: event.target.scene,
            genre: 1,
            type: 'dn'
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        cc.vv.wc.show("寻找房间");
        var onSearch = function onSearch(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2) {
                    if (ret.errmsg == 1) {
                        cc.vv.alert.show("提示", "钻石不够，无法匹配");
                    } else {
                        cc.vv.alert.show("提示", "金币不够，无法匹配");
                    }
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = conf.room_type;
                cc.vv.userMgr.scene = conf.scene;
                cc.vv.userMgr.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        cc.vv.http.sendRequest("/match_room", data, onSearch);
    }
});

cc._RFpop();
},{}],"SelectDzpk":[function(require,module,exports){
"use strict";
cc._RFpush(module, '0ca87mvrqZMsqO7PN38htpU', 'SelectDzpk');
// scripts/components/SelectDzpk.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        pm: cc.Node,
        xz: cc.Node,
        lb: cc.Node,
        th: cc.Node,
        gz: cc.Node,
        hj: cc.Node,
        // pmlable1: cc.Label,
        // pmlable2: cc.Label,
        pmlable3: cc.Label,
        pmlable4: cc.Label,
        // xzlable1: cc.Label,
        // xzlable2: cc.Label,
        xzlable3: cc.Label,
        xzlable4: cc.Label,
        // lblable1: cc.Label,
        // lblable2: cc.Label,
        lblable3: cc.Label,
        lblable4: cc.Label,
        // thlable1: cc.Label,
        // thlable2: cc.Label,
        thlable3: cc.Label,
        thlable4: cc.Label,
        // gzlable1: cc.Label,
        // gzlable2: cc.Label,
        gzlable3: cc.Label,
        gzlable4: cc.Label,
        // hjlable1: cc.Label,
        // hjlable2: cc.Label,
        hjlable3: cc.Label,
        hjlable4: cc.Label
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.initButtonHandler(this.pm);
        this.initButtonHandler(this.xz);
        this.initButtonHandler(this.lb);
        this.initButtonHandler(this.th);
        this.initButtonHandler(this.gz);
        this.initButtonHandler(this.hj);
    },
    initView: function initView() {
        var self = this;
        var fn = function fn(ret) {
            if (ret) {
                for (var i = 0; i < ret.length; i++) {
                    if (i == 0) {
                        self.pm.scene = ret[i].id;
                        // self.pmlable1.string = ret[i].name;
                        // self.pmlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.pmlable3.string = ret[i].online;
                        self.pmlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 1) {
                        self.xz.scene = ret[i].id;
                        // self.xzlable1.string = ret[i].name;
                        // self.xzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.xzlable3.string = ret[i].online;
                        self.xzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 2) {
                        self.lb.scene = ret[i].id;
                        // self.lblable1.string = ret[i].name;
                        // self.lblable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.lblable3.string = ret[i].online;
                        self.lblable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 3) {
                        self.th.scene = ret[i].id;
                        // self.thlable1.string = ret[i].name;
                        // self.thlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.thlable3.string = ret[i].online;
                        self.thlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 4) {
                        self.gz.scene = ret[i].id;
                        // self.gzlable1.string = ret[i].name;
                        // self.gzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.gzlable3.string = ret[i].online;
                        self.gzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 5) {
                        self.hj.scene = ret[i].id;
                        // self.hjlable1.string = ret[i].name;
                        // self.hjlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.hjlable3.string = ret[i].online;
                        self.hjlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    }
                };
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            room_type: 4
        };
        cc.vv.http.sendRequest("/get_scene", data, fn);
    },
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectDzpk", "matchRoom");
    },
    matchRoom: function matchRoom(event) {
        var conf = {
            room_type: 4, //4代表德州扑克房间
            scene: event.target.scene,
            genre: 1,
            type: 'dzpk'
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        cc.vv.wc.show("寻找房间");
        var onSearch = function onSearch(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2) {
                    if (ret.errmsg == 1) {
                        cc.vv.alert.show("提示", "钻石不够，无法匹配");
                    } else {
                        cc.vv.alert.show("提示", "金币不够，无法匹配");
                    }
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = conf.room_type;
                cc.vv.userMgr.scene = conf.scene;
                cc.vv.userMgr.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        cc.vv.http.sendRequest("/match_room", data, onSearch);
    }
});

cc._RFpop();
},{}],"SelectMj":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'bd8f2TzJQdH+LM4cYQAzPC3', 'SelectMj');
// scripts/components/SelectMj.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        btmj: cc.Node,
        whmj: cc.Node,
        jrfj: cc.Node,
        fhfj: cc.Node
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.initButtonHandler(this.btmj);
        this.initButtonHandler(this.whmj);
        this.initButtonHandler(this.jrfj);
        this.initButtonHandler(this.fhfj);
        if (cc.vv.gameNetMgr.roomId) {
            this.jrfj.active = false;
            this.fhfj.active = true;
        } else {
            this.jrfj.active = true;
            this.fhfj.active = false;
        }
    },
    initView: function initView() {},
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectMj", "onClickBtn");
    },
    onClickBtn: function onClickBtn(event) {
        switch (event.target.name) {
            case 'mj_join':
                cc.find("Canvas/JoinGame").active = true;
                break;
            case 'mj_back':
                this.onReturnGameClicked();
                break;
            case 'baotou':
                if (cc.vv.gameNetMgr.roomId) {
                    this.onReturnGameClicked();
                } else {
                    cc.find("Canvas/CreateRoom").active = true;
                }
                break;
            case 'wuhan':
                // cc.find("Canvas/JoinGame").active = true;
                break;
        }
    },
    onReturnGameClicked: function onReturnGameClicked() {
        cc.director.loadScene("mjgame");
    }
});

cc._RFpop();
},{}],"SelectZjh":[function(require,module,exports){
"use strict";
cc._RFpush(module, '0ceec5rmkVNwbKYiMDf8JpW', 'SelectZjh');
// scripts/components/SelectZjh.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        pm: cc.Node,
        xz: cc.Node,
        lb: cc.Node,
        th: cc.Node,
        gz: cc.Node,
        hj: cc.Node,
        // pmlable1: cc.Label,
        // pmlable2: cc.Label,
        pmlable3: cc.Label,
        pmlable4: cc.Label,
        // xzlable1: cc.Label,
        // xzlable2: cc.Label,
        xzlable3: cc.Label,
        xzlable4: cc.Label,
        // lblable1: cc.Label,
        // lblable2: cc.Label,
        lblable3: cc.Label,
        lblable4: cc.Label,
        // thlable1: cc.Label,
        // thlable2: cc.Label,
        thlable3: cc.Label,
        thlable4: cc.Label,
        // gzlable1: cc.Label,
        // gzlable2: cc.Label,
        gzlable3: cc.Label,
        gzlable4: cc.Label,
        // hjlable1: cc.Label,
        // hjlable2: cc.Label,
        hjlable3: cc.Label,
        hjlable4: cc.Label
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.initButtonHandler(this.pm);
        this.initButtonHandler(this.xz);
        this.initButtonHandler(this.lb);
        this.initButtonHandler(this.th);
        this.initButtonHandler(this.gz);
        this.initButtonHandler(this.hj);
    },
    initView: function initView() {
        var self = this;
        var fn = function fn(ret) {
            if (ret) {
                for (var i = 0; i < ret.length; i++) {
                    if (i == 0) {
                        self.pm.scene = ret[i].id;
                        // self.pmlable1.string = ret[i].name;
                        // self.pmlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.pmlable3.string = ret[i].online;
                        self.pmlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 1) {
                        self.xz.scene = ret[i].id;
                        // self.xzlable1.string = ret[i].name;
                        // self.xzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.xzlable3.string = ret[i].online;
                        self.xzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 2) {
                        self.lb.scene = ret[i].id;
                        // self.lblable1.string = ret[i].name;
                        // self.lblable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.lblable3.string = ret[i].online;
                        self.lblable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 3) {
                        self.th.scene = ret[i].id;
                        // self.thlable1.string = ret[i].name;
                        // self.thlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.thlable3.string = ret[i].online;
                        self.thlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 4) {
                        self.gz.scene = ret[i].id;
                        // self.gzlable1.string = ret[i].name;
                        // self.gzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.gzlable3.string = ret[i].online;
                        self.gzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 5) {
                        self.hj.scene = ret[i].id;
                        // self.hjlable1.string = ret[i].name;
                        // self.hjlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.hjlable3.string = ret[i].online;
                        self.hjlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    }
                };
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            room_type: 2
        };
        cc.vv.http.sendRequest("/get_scene", data, fn);
    },
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectZjh", "matchRoom");
    },
    matchRoom: function matchRoom(event) {
        var conf = {
            room_type: 2, //2代表扎金花房间
            scene: event.target.scene,
            genre: 1,
            type: 'zjh'
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        cc.vv.wc.show("寻找房间");
        var onSearch = function onSearch(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2) {
                    if (ret.errmsg == 1) {
                        cc.vv.alert.show("提示", "钻石不够，无法匹配");
                    } else {
                        cc.vv.alert.show("提示", "金币不够，无法匹配");
                    }
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = conf.room_type;
                cc.vv.userMgr.scene = conf.scene;
                cc.vv.userMgr.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        cc.vv.http.sendRequest("/match_room", data, onSearch);
    }
});

cc._RFpop();
},{}],"Settings":[function(require,module,exports){
"use strict";
cc._RFpush(module, '4c04fyd89JAZY7qGjvubi+f', 'Settings');
// scripts/components/Settings.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _btnYXOpen: null,
        _btnYXClose: null,
        _btnYYOpen: null,
        _btnYYClose: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._btnYXOpen = this.node.getChildByName("yinxiao").getChildByName("btn_yx_open");
        this._btnYXClose = this.node.getChildByName("yinxiao").getChildByName("btn_yx_close");
        this._btnYYOpen = this.node.getChildByName("yinyue").getChildByName("btn_yy_open");
        this._btnYYClose = this.node.getChildByName("yinyue").getChildByName("btn_yy_close");
        this.initButtonHandler(this.node.getChildByName("btn_close"));
        this.initButtonHandler(this.node.getChildByName("btn_exit"));
        this.initButtonHandler(this._btnYXOpen);
        this.initButtonHandler(this._btnYXClose);
        this.initButtonHandler(this._btnYYOpen);
        this.initButtonHandler(this._btnYYClose);
        var slider = this.node.getChildByName("yinxiao").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider, this.node, "Settings", "onSlided");
        var slider = this.node.getChildByName("yinyue").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider, this.node, "Settings", "onSlided");
        this.refreshVolume();
    },
    onSlided: function onSlided(slider) {
        if (slider.node.parent.name == "yinxiao") {
            cc.vv.audioMgr.setSFXVolume(slider.progress);
        } else if (slider.node.parent.name == "yinyue") {
            cc.vv.audioMgr.setBGMVolume(slider.progress);
        }
        this.refreshVolume();
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "Settings", "onBtnClicked");
    },
    refreshVolume: function refreshVolume() {
        this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
        this._btnYXOpen.active = !this._btnYXClose.active;
        var yx = this.node.getChildByName("yinxiao");
        var width = 430 * cc.vv.audioMgr.sfxVolume;
        var progress = yx.getChildByName("progress");
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        progress.getChildByName("progress").width = width;
        //yx.getChildByName("btn_progress").x = progress.x + width;
        this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
        this._btnYYOpen.active = !this._btnYYClose.active;
        var yy = this.node.getChildByName("yinyue");
        var width = 430 * cc.vv.audioMgr.bgmVolume;
        var progress = yy.getChildByName("progress");
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume;
        progress.getChildByName("progress").width = width;
        //yy.getChildByName("btn_progress").x = progress.x + width;
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "btn_close") {
            this.node.active = false;
        } else if (event.target.name == "btn_exit") {
            cc.sys.localStorage.removeItem("wx_account");
            cc.sys.localStorage.removeItem("wx_sign");
            cc.director.loadScene("login");
        } else if (event.target.name == "btn_yx_open") {
            cc.vv.audioMgr.setSFXVolume(1.0);
            this.refreshVolume();
        } else if (event.target.name == "btn_yx_close") {
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
        } else if (event.target.name == "btn_yy_open") {
            cc.vv.audioMgr.setBGMVolume(1);
            this.refreshVolume();
        } else if (event.target.name == "btn_yy_close") {
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
        }
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});

cc._RFpop();
},{}],"Share":[function(require,module,exports){
"use strict";
cc._RFpush(module, '8fc5bpKUdREdI5aVkPe053K', 'Share');
// scripts/components/Share.js

"use strict";

// 微信分享相关逻辑处理
cc.Class({
    extends: cc.Component,
    properties: {
        _share: null,
        _linkPanel: cc.Node,
        _QRCodePanel: cc.Node,
        _headIcon: cc.Sprite,
        _shareInfo: cc.Label,
        _shareType: 0,
        _btnLink: {
            default: null,
            type: cc.Button
        },
        _btnQRCode: {
            default: null,
            type: cc.Button
        },
        _spriteFrame: null,
        _shareRoomId: null,
        _sprQRCode: cc.Sprite
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initUI();
        cc.vv.share = this;
    },
    initUI: function initUI() {
        this._share = cc.find("Canvas/share");
        this._linkPanel = cc.find("Canvas/share/link_panel");
        this._QRCodePanel = cc.find("Canvas/share/QR_code_panel");
        this._headIcon = this._linkPanel.getChildByName("headicon");
        this._shareInfo = this._linkPanel.getChildByName("shareinfo");
        this._btnLink = cc.find("Canvas/share/button_link").getComponent(cc.Button);
        this._btnQRCode = cc.find("Canvas/share/button_qrcode").getComponent(cc.Button);
        this._sprQRCode = cc.find("Canvas/share/QR_code_panel/QRCodeImg").getComponent(cc.Sprite);
        this._shareRoomId = cc.vv.userMgr.shareRoomId || cc.vv.gameNetMgr.roomId;
    },
    onCloseBtnClicked: function onCloseBtnClicked() {
        console.log('关闭按钮点击');
        this._share.active = false;
    },
    onLinkBtnClicked: function onLinkBtnClicked() {
        console.log('链接邀请按钮点击');
        this._shareType = 1;
        this.toggleStatue();
    },
    onQRcodeBtnClicked: function onQRcodeBtnClicked() {
        console.log('二维码分享按钮点击');
        this._shareType = 2;
        this.toggleStatue();
    },
    toggleStatue: function toggleStatue() {
        if (this._shareType == 1) {
            this._linkPanel.active = true;
            this._QRCodePanel.active = false;
            this._btnLink.interactable = false;
            this._btnQRCode.interactable = true;
            this.getShareLinkInfo();
        } else {
            this._btnLink.interactable = true;
            this._btnQRCode.interactable = false;
            this._linkPanel.active = false;
            this._QRCodePanel.active = true;
            this.getShareQRCodeInfo();
        }
    },
    show: function show() {
        this._share.active = true;
        this._shareType = 1;
        this.toggleStatue();
    },
    getShareLinkInfo: function getShareLinkInfo() {
        var shareTitle = "亚巨包头麻将";
        var shareContent = "我在微信中玩包头麻将，邀请你一起来互相伤害!";
        if (cc.vv.userMgr.userName) {
            shareContent = cc.vv.userMgr.userName + "在微信中玩包头麻将，邀请你一起来互相伤害!";
        };
        if (this._shareRoomId) {
            shareContent = shareContent + "房间号是:" + this._shareRoomId;
        };
        this._shareInfo.getComponent(cc.Label).string = shareContent;
        if (!cc.sys.isNative) {
            document.title = window.wxFriend.title = shareTitle;
            window.wxFriend.desc = shareContent;
            if (cc.vv.gameNetMgr.roomId && cc.vv.gameNetMgr.roomId != null) {
                var shareUrl = cc.vv.userMgr.yaoqingUrl + cc.vv.gameNetMgr.roomId;
            } else {
                var shareUrl = cc.vv.userMgr.yaoqingUrl + "000000";
            }
            window.wxFriend.link = shareUrl;
            window.shareMessage();
        }
    },
    // 加载二维码
    getShareQRCodeInfo: function getShareQRCodeInfo() {
        var ImageLoader = this._sprQRCode.node.getComponent("ImageLoader");
        ImageLoader.setUserID(cc.vv.userMgr.userId, 1);
    },
    onDestory: function onDestory() {
        if (cc.vv) {
            cc.vv.share = null;
        }
    }
});

cc._RFpop();
},{}],"TimePointer":[function(require,module,exports){
"use strict";
cc._RFpush(module, '5b586erPK1H5bFfrMKWs+Y6', 'TimePointer');
// scripts/components/TimePointer.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _arrow: null,
        _pointer: null,
        _timeLabel: null,
        _time: -1,
        _alertTime: -1
    },
    // use this for initialization
    onLoad: function onLoad() {
        var gameChild = this.node.getChildByName("game");
        this._arrow = gameChild.getChildByName("arrow");
        this._pointer = this._arrow.getChildByName("pointer");
        this.initPointer();
        this._timeLabel = this._arrow.getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        var self = this;
        this.node.on('game_begin', function (data) {
            self.initPointer();
        });
        this.node.on('game_chupai', function (data) {
            self.initPointer();
            self._time = 10;
            self._alertTime = 3;
        });
    },
    initPointer: function initPointer() {
        if (cc.vv == null) {
            return;
        }
        this._arrow.active = cc.vv.gameNetMgr.gamestate == "playing";
        if (!this._arrow.active) {
            return;
        }
        var turn = cc.vv.gameNetMgr.turn;
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(turn);
        for (var i = 0; i < this._pointer.children.length; ++i) {
            this._pointer.children[i].active = i == localIndex;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._time > 0) {
            this._time -= dt;
            if (this._alertTime > 0 && this._time < this._alertTime) {
                cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
                this._alertTime = -1;
            }
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }
            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    }
});

cc._RFpop();
},{}],"UserMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '74d78JBqHdDKY6hckY2YuL+', 'UserMgr');
// scripts/UserMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        account: null,
        userId: null,
        userName: null,
        lv: 0,
        exp: 0,
        coins: 0,
        gems: 0,
        sign: 0,
        ip: "",
        sex: 0,
        roomData: null,
        oldRoomId: null,
        yaoqingUrl: null,
        headimg: null,
        shareRoomId: null,
        yaoqing_key: null,
        chargerate: null,
        is_sign: 0,
        sign_days: 0,
        room_type: -1,
        collapse_prise: 0,
        is_first_charge: 0,
        scene: -1,
        e_roomid: 0,
        exchange: 0,
        reconnection: 0
    },
    guestAuth: function guestAuth(param) {
        this.loadSceneName = param;
        var account = cc.args["account"];
        if (account == null) {
            account = cc.sys.localStorage.getItem("account");
        }
        if (account == null) {
            account = Date.now();
            cc.sys.localStorage.setItem("account", account);
        }
        cc.vv.http.sendRequest("/guest", {
            account: account
        }, this.onAuth);
    },
    onAuth: function onAuth(ret) {
        var self = cc.vv.userMgr;
        if (ret.errcode !== 0) {
            console.log(ret.errmsg);
        } else {
            self.account = ret.account;
            self.sign = ret.sign;
            self.shareRoomId = ret.shareRoomId;
            cc.vv.http.url = "http://" + cc.vv.SI.hall;
            self.login();
        }
    },
    // 登录
    login: function login() {
        var self = this;
        var onLogin = function onLogin(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                self.account = ret.account;
                self.userId = ret.userid;
                self.userName = ret.name;
                self.lv = ret.lv;
                self.exp = ret.exp;
                self.coins = ret.coins;
                self.gems = ret.gems;
                self.roomData = ret.roomid;
                self.room_type = ret.room_type;
                self.sex = ret.sex;
                self.ip = ret.ip;
                self.headimg = ret.headimg;
                self.yaoqingUrl = ret.yaoqingUrl;
                self.yaoqing_key = ret.yaoqing_key;
                self.is_sign = ret.is_sign;
                self.sign_days = ret.sign_days;
                self.collapse_prise = ret.collapse_prise;
                self.is_first_charge = ret.is_first_charge;
                self.modules = ret.modules; //显示模块
                self.is_open_jbs = ret.is_open_jbs; //是否开放锦标赛
                // TODO  充值兑换率
                // self.chargerate = ret.chargerate;
                var shareUrl = self.yaoqingUrl;
                if (!cc.sys.isNative) {
                    var roomvalid = self.shareRoomId || cc.vv.gameNetMgr.roomId || self.roomData;
                    if (roomvalid) {
                        shareUrl = shareUrl + roomvalid;
                    } else {
                        shareUrl = shareUrl + "000000";
                    }
                    if (window.wxFriend) {
                        window.wxFriend.link = shareUrl;
                        window.shareMessage();
                    }
                }
                if (self.loadSceneName) {
                    cc.director.loadScene(self.loadSceneName);
                } else {
                    cc.director.loadScene("newhall");
                }
            }
        };
        // cc.vv.wc.show("正在登录游戏");
        cc.vv.http.sendRequest("/login", {
            account: this.account,
            sign: this.sign
        }, onLogin);
    },
    // 进入房间
    enterRoom: function enterRoom(roomId, callback) {
        var self = this;
        var onEnter = function onEnter(ret) {
            if (ret.errcode !== 0) {
                if (ret.errcode == -1) {
                    setTimeout(function () {
                        self.enterRoom(roomId, callback);
                    }, 5000);
                } else {
                    cc.vv.wc.hide();
                    if (callback != null) {
                        callback(ret);
                    }
                }
            } else {
                if (callback != null) {
                    callback(ret);
                }
                self.room_type = ret.room_type;
                self.scene = ret.scene;
                self.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            roomid: roomId
        };
        cc.vv.wc.show("正在进入房间 " + roomId);
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
    },
    // 获取历史战斗记录
    getHistoryList: function getHistoryList(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.history);
                if (callback != null) {
                    callback(ret.history);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_history_list", data, onGet);
    },
    // 获取金币和钻石数量
    getGemsAndCoins: function getGemsAndCoins(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret);
                if (callback != null) {
                    callback(ret);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_gems_and_coins", data, onGet);
    },
    // 用户签到
    setUserSign: function setUserSign(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (callback != null) {
                    callback(ret.data);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/set_user_sign", data, onGet);
    },
    // 获取签到礼物列表
    getSignList: function getSignList(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (callback != null) {
                    callback(ret.data);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_sign_list", data, onGet);
    },
    getGamesOfRoom: function getGamesOfRoom(uuid, callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid
        };
        cc.vv.http.sendRequest("/get_games_of_room", data, onGet);
    },
    getDetailOfGame: function getDetailOfGame(uuid, index, callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid,
            index: index
        };
        cc.vv.http.sendRequest("/get_detail_of_game", data, onGet);
    }
});

cc._RFpop();
},{}],"UserSign":[function(require,module,exports){
"use strict";
cc._RFpush(module, '03612hS7chGjpJQKni4Wrqr', 'UserSign');
// scripts/components/UserSign.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _DayListV: null,
        _sign: null,
        _btn_sign: null,
        _btn_signed: null,
        _isShowView: false,
        _time: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._sign = cc.find("Canvas/sign");
        this._btn_sign = this._sign.getChildByName("btn_sign");
        this._btn_signed = this._sign.getChildByName("btn_signed");
        this._time = this._sign.getChildByName("time");
        this._DayListV = new Array();
        for (var i = 0; i < 7; i++) {
            var path = "day" + (i + 1);
            this._DayListV.push(this._sign.getChildByName(path));
        }
        this._isShowView = cc.vv.userMgr.is_sign == 0;
        this.initSignData();
    },
    initSignData: function initSignData() {
        var self = this;
        if (this._isShowView) {
            //签到按钮不可点击
            this._time.getComponent(cc.Label).string = "已登录" + cc.vv.userMgr.sign_days + "天";
            this._btn_sign.active = cc.vv.userMgr.sign_days < 6 && cc.vv.userMgr.is_sign == 0;
            this._btn_signed.active = cc.vv.userMgr.sign_days < 6 && cc.vv.userMgr.is_sign == 1;
            // this._btn_sign.getComponent(cc.Button).interactable = (cc.vv.userMgr.is_sign == 0);
            cc.vv.userMgr.getSignList(function (data) {
                console.log("------initSignData------->>", data);
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        var d = data[i];
                        var view = self._DayListV[i];
                        if (view) {
                            var name = view.getChildByName("name").getComponent(cc.Label);
                            name.string = d.name + "×" + d.amount;
                            var signed = view.getChildByName("signed");
                            if (signed) {
                                if (cc.vv.userMgr.sign_days > i) {
                                    signed.active = true;
                                    if (i == data.length - 1 && cc.vv.userMgr.sign_days > 6 && cc.vv.userMgr.is_sign == 0) {
                                        signed.active = false;
                                    }
                                }
                            }
                            var btn_sign = view.getChildByName("btn_sign");
                            if (btn_sign) {
                                btn_sign.active = cc.vv.userMgr.sign_days >= 6 && cc.vv.userMgr.is_sign == 0;
                                // btn_sign.getComponent(cc.Button).interactable = (cc.vv.userMgr.is_sign == 0);
                            }
                        }
                    }
                    self._sign.active = self._isShowView;
                }
            });
        } else {
            self._sign.active = self._isShowView;
        }
    },
    //签到
    onSignBtnClicked: function onSignBtnClicked() {
        if (cc.vv.userMgr.is_sign == 0) {
            var self = this;
            cc.vv.userMgr.setUserSign(function (data) {
                if (data) {
                    cc.vv.userMgr.is_sign = 1;
                    cc.vv.userMgr.sign_days++;
                    if (data.type == 1) {
                        cc.vv.userMgr.gems += data.amount;
                    }
                    self.initSignData();
                }
            });
        } else {
            cc.vv.alert.show("提示", "今日已签到!");
        }
    },
    onCloseBtnClicked: function onCloseBtnClicked() {
        this._sign.active = false;
        this._isShowView = false;
    }
});

cc._RFpop();
},{}],"Utils":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'b717fzww0hNzIqvNbb1t9wx', 'Utils');
// scripts/Utils.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },
    addClickEvent: function addClickEvent(node, target, component, handler, isReplace) {
        console.log(component + ":" + handler);
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        if (isReplace) {
            //是否覆盖掉之前的事件
            clickEvents[0] = eventHandler;
        } else {
            clickEvents.push(eventHandler);
        }
    },
    addSlideEvent: function addSlideEvent(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var slideEvents = node.getComponent(cc.Slider).slideEvents;
        slideEvents.push(eventHandler);
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
    showJinbi: function showJinbi(jinbi, suffix) {
        if (!suffix) {
            suffix = "万";
        }
        var jinbi = parseFloat(jinbi);
        if (jinbi >= 10000) {
            jinbi /= 10000;
            jinbi = jinbi + suffix;
            return jinbi;
        }
        return jinbi;
    },

    checkRate: function checkRate(nubmer) {
        //判断字符串是否为数字//
        // 　　var re = /^[0-9]+.?[0-9]*$/;  
        //判断正整数 /^[1-9]+[0-9]*]*$/ 
        var re = /^[0-9]+[0-9]*]*$/;
        if (!re.test(nubmer)) {
            return false;
        }
        return true;
    }
});

cc._RFpop();
},{}],"VoiceMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '1f066RbLAxKGJZtkDFO2kq/', 'VoiceMgr');
// scripts/VoiceMgr.js

"use strict";

var radix = 12;
var base = 128 - radix;

function crypto(value) {
    value -= base;
    var h = Math.floor(value / radix) + base;
    var l = value % radix + base;
    return String.fromCharCode(h) + String.fromCharCode(l);
}
var encodermap = {};
var decodermap = {};
for (var i = 0; i < 256; ++i) {
    var code = null;
    var v = i + 1;
    if (v >= base) {
        code = crypto(v);
    } else {
        code = String.fromCharCode(v);
    }
    encodermap[i] = code;
    decodermap[code] = i;
}

function encode(data) {
    var content = "";
    var len = data.length;
    var a = len >> 24 & 0xff;
    var b = len >> 16 & 0xff;
    var c = len >> 8 & 0xff;
    var d = len & 0xff;
    content += encodermap[a];
    content += encodermap[b];
    content += encodermap[c];
    content += encodermap[d];
    for (var i = 0; i < data.length; ++i) {
        content += encodermap[data[i]];
    }
    return content;
}

function getCode(content, index) {
    var c = content.charCodeAt(index);
    if (c >= base) {
        c = content.charAt(index) + content.charAt(index + 1);
    } else {
        c = content.charAt(index);
    }
    return c;
}

function decode(content) {
    var index = 0;
    var len = 0;
    for (var i = 0; i < 4; ++i) {
        var c = getCode(content, index);
        index += c.length;
        var v = decodermap[c];
        len |= v << (3 - i) * 8;
    }
    var newData = new Uint8Array(len);
    var cnt = 0;
    while (index < content.length) {
        var c = getCode(content, index);
        index += c.length;
        newData[cnt] = decodermap[c];
        cnt++;
    }
    return newData;
}
cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        onPlayCallback: null,
        _voiceMediaPath: null
    },
    // use this for initialization
    init: function init() {
        if (cc.sys.isNative) {
            this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "/voicemsgs/";
            this.setStorageDir(this._voiceMediaPath);
        }
    },
    prepare: function prepare(filename) {
        cc.vv.audioMgr.pauseAll();
        if (!cc.sys.isNative) {
            window.startRecord();
            return;
        }
        this.clearCache(filename);
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "prepare", "(Ljava/lang/String;)V", filename);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "prepareRecord:", filename);
        }
    },
    release: function release() {
        cc.vv.audioMgr.resumeAll();
        if (!cc.sys.isNative) {
            window.stopRecord();
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "release", "()V");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "finishRecord");
        }
    },
    cancel: function cancel() {
        cc.vv.audioMgr.resumeAll();
        if (!cc.sys.isNative) {
            window.cancelRecord();
            window.voice.localId = null;
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "cancel", "()V");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "cancelRecord");
        }
    },
    writeVoice: function writeVoice(filename, voiceData) {
        if (!cc.sys.isNative) {
            return;
        }
        if (voiceData && voiceData.length > 0) {
            var fileData = decode(voiceData);
            var url = this._voiceMediaPath + filename;
            this.clearCache(filename);
            jsb.fileUtils.writeDataToFile(fileData, url);
        }
    },
    clearCache: function clearCache(filename) {
        if (cc.sys.isNative) {
            var url = this._voiceMediaPath + filename;
            //console.log("check file:" + url);
            if (jsb.fileUtils.isFileExist(url)) {
                //console.log("remove:" + url);
                jsb.fileUtils.removeFile(url);
            }
            if (jsb.fileUtils.isFileExist(url + ".wav")) {
                //console.log("remove:" + url + ".wav");
                jsb.fileUtils.removeFile(url + ".wav");
            }
        }
    },
    play: function play(filename) {
        if (!cc.sys.isNative) {
            return;
        }
        cc.vv.audioMgr.pauseAll();
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "play", "(Ljava/lang/String;)V", filename);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "play:", filename);
        } else {}
    },
    stop: function stop() {
        if (!cc.sys.isNative) {
            return;
        }
        cc.vv.audioMgr.resumeAll();
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "stop", "()V");
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "stopPlay");
        } else {}
    },
    getVoiceLevel: function getVoiceLevel(maxLevel) {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            return jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "getVoiceLevel", "(I)I", maxLevel);
        } else if (cc.sys.os == cc.sys.OS_IOS) {} else {
            return Math.floor(Math.random() * maxLevel + 1);
        }
    },
    getVoiceData: function getVoiceData(filename) {
        if (cc.sys.isNative) {
            var url = this._voiceMediaPath + filename;
            console.log("getVoiceData:" + url);
            var fileData = jsb.fileUtils.getDataFromFile(url);
            if (fileData) {
                var content = encode(fileData);
                return content;
            }
        }
        return "";
    },
    download: function download() {},
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
    setStorageDir: function setStorageDir(dir) {
        if (!cc.sys.isNative) {
            return;
        }
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "setStorageDir", "(Ljava/lang/String;)V", dir);
        } else if (cc.sys.os == cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod("VoiceSDK", "setStorageDir:", dir);
            if (!jsb.fileUtils.isDirectoryExist(dir)) {
                jsb.fileUtils.createDirectory(dir);
            }
        }
    }
});

cc._RFpop();
},{}],"Voice":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'f6db9z0CxdEzpRVgU569dDu', 'Voice');
// scripts/components/Voice.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _lastTouchTime: null,
        _voice: null,
        _volume: null,
        _voice_failed: null,
        _lastCheckTime: -1,
        _timeBar: null,
        MAX_TIME: 15000,
        _voiceTime: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._voice = cc.find("Canvas/voice");
        this._voice.active = false;
        this._voice_failed = cc.find("Canvas/voice/voice_failed");
        this._voice_failed.active = false;
        this._timeBar = cc.find("Canvas/voice/time");
        this._timeBar.scaleX = 0.0;
        this._volume = cc.find("Canvas/voice/volume");
        for (var i = 1; i < this._volume.children.length; ++i) {
            this._volume.children[i].active = false;
        }
        var btnVoice = cc.find("Canvas/voice/voice_failed/btn_ok");
        if (btnVoice) {
            cc.vv.utils.addClickEvent(btnVoice, this.node, "Voice", "onBtnOKClicked");
        }
        var self = this;
        var btnVoice = cc.find("Canvas/btn_voice");
        if (btnVoice) {
            btnVoice.on(cc.Node.EventType.TOUCH_START, function () {
                console.log("cc.Node.EventType.TOUCH_START");
                // 关掉所有音乐
                cc.vv.voiceMgr.prepare("record.amr");
                self._lastTouchTime = Date.now();
                self._voice.active = true;
                self._voice_failed.active = false;
            });
            btnVoice.on(cc.Node.EventType.TOUCH_MOVE, function () {
                console.log("cc.Node.EventType.TOUCH_MOVE");
            });
            btnVoice.on(cc.Node.EventType.TOUCH_END, function () {
                console.log("cc.Node.EventType.TOUCH_END");
                if (Date.now() - self._lastTouchTime < 1000) {
                    self._voice_failed.active = true;
                    cc.vv.voiceMgr.cancel();
                } else {
                    // 录音结束并上传
                    cc.vv.voiceMgr.release();
                    self.onVoiceOK();
                }
            });
            btnVoice.on(cc.Node.EventType.TOUCH_CANCEL, function () {
                console.log("cc.Node.EventType.TOUCH_CANCEL");
                cc.vv.voiceMgr.cancel();
                this._voice.active = false;
                self._lastTouchTime = null;
                self._voice.active = false;
            });
        }
    },
    onVoiceOK: function onVoiceOK() {
        console.log("onVoiceOK!!!!" + this._lastTouchTime);
        this._voice.active = false;
        if (this._lastTouchTime != null) {
            this._voiceTime = Date.now() - this._lastTouchTime;
            console.log('时长是多少' + this._voiceTime);
        }
        self._lastTouchTime = null;
    },
    // 发送语音到服务器
    sendVoice: function sendVoice() {
        if (window.voice.serverId && this._voiceTime) {
            console.log("发送语音消息到服务器");
            cc.vv.net.send("voice_msg", {
                msg: window.voice.serverId,
                time: this._voiceTime
            });
        }
        this._voiceTime = null;
        window.voice.serverId = null;
    },
    onBtnOKClicked: function onBtnOKClicked() {
        this._voice.active = false;
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._voice.active == true && this._voice_failed.active == false) {
            if (Date.now() - this._lastCheckTime > 300) {
                for (var i = 0; i < this._volume.children.length; ++i) {
                    this._volume.children[i].active = false;
                }
                var v = cc.vv.voiceMgr.getVoiceLevel(7);
                if (v >= 1 && v <= 7) {
                    this._volume.children[v - 1].active = true;
                }
                this._lastCheckTime = Date.now();
            }
        }
        if (this._lastTouchTime) {
            var time = Date.now() - this._lastTouchTime;
            if (time >= this.MAX_TIME) {
                cc.vv.voiceMgr.release();
                this.onVoiceOK();
                this._voice.active = false;
                this._lastTouchTime = null;
            } else {
                var percent = time / this.MAX_TIME;
                this._timeBar.scaleX = 1 - percent;
            }
        };
        if (window.voice && window.voice.serverId != null) {
            console.log("id是多少" + window.voice.serverId);
            this.sendVoice();
        };
    }
});

cc._RFpop();
},{}],"WaitingConnection":[function(require,module,exports){
"use strict";
cc._RFpush(module, '10e32jDstpLhIGHWrQEq2vN', 'WaitingConnection');
// scripts/components/WaitingConnection.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        target: cc.Node,
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _isShow: false,
        lblContent: cc.Label
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return null;
        }
        cc.vv.wc = this;
        this.node.active = this._isShow;
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        this.target.rotation = this.target.rotation - dt * 45;
    },
    show: function show(content) {
        this._isShow = true;
        if (this.node) {
            this.node.active = this._isShow;
        }
        if (this.lblContent) {
            if (content == null) {
                content = "";
            }
            this.lblContent.string = content;
        }
    },
    hide: function hide() {
        this._isShow = false;
        if (this.node) {
            this.node.active = this._isShow;
        }
    }
});

cc._RFpop();
},{}],"ZjhChat":[function(require,module,exports){
"use strict";
cc._RFpush(module, '6fd6eAhiXpJLozuKlsRJdZY', 'ZjhChat');
// scripts/components/ZjhChat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _chatRoot: null,
        _tabQuick: null,
        _tabEmoji: null,
        _iptChat: null,
        _quickChatInfo: null,
        _btnChat: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        cc.vv.zjhchat = this;
        // this._btnChat = this.node.getChildByName("xinxi");
        // this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        this._chatRoot = this.node.getChildByName("chat");
        this._chatRoot.active = false;
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {
            index: 0,
            content: "快点啊，都等到我花儿都谢谢了！",
            sound: "fix_msg_1.mp3"
        };
        this._quickChatInfo["item1"] = {
            index: 1,
            content: "怎么又断线了，网络怎么这么差啊！",
            sound: "fix_msg_2.mp3"
        };
        this._quickChatInfo["item2"] = {
            index: 2,
            content: "不要走，决战到天亮！",
            sound: "fix_msg_3.mp3"
        };
        this._quickChatInfo["item3"] = {
            index: 3,
            content: "你的牌打得也太好了！",
            sound: "fix_msg_4.mp3"
        };
        this._quickChatInfo["item4"] = {
            index: 4,
            content: "你是妹妹还是哥哥啊？",
            sound: "fix_msg_5.mp3"
        };
        this._quickChatInfo["item5"] = {
            index: 5,
            content: "和你合作真是太愉快了！",
            sound: "fix_msg_6.mp3"
        };
        this._quickChatInfo["item6"] = {
            index: 6,
            content: "大家好，很高兴见到各位！",
            sound: "fix_msg_7.mp3"
        };
        this._quickChatInfo["item7"] = {
            index: 7,
            content: "各位，真是不好意思，我得离开一会儿。",
            sound: "fix_msg_8.mp3"
        };
        this._quickChatInfo["item8"] = {
            index: 8,
            content: "不要吵了，专心玩游戏吧！",
            sound: "fix_msg_9.mp3"
        };
    },
    getQuickChatInfo: function getQuickChatInfo(index) {
        var key = "item" + index;
        return this._quickChatInfo[key];
    },

    onBtnChatClicked: function onBtnChatClicked() {
        this._chatRoot.active = true;
    },
    onBgClicked: function onBgClicked() {
        this._chatRoot.active = false;
    },
    onTabClicked: function onTabClicked(event) {
        if (event.target.name == "tabQuick") {
            this._tabQuick.active = true;
            this._tabEmoji.active = false;
        } else if (event.target.name == "tabEmoji") {
            this._tabQuick.active = false;
            this._tabEmoji.active = true;
        }
    },
    onQuickChatItemClicked: function onQuickChatItemClicked(event) {
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat", info.index);
    },
    onEmojiItemClicked: function onEmojiItemClicked(event) {
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji", event.target.name);
    },
    onBtnSendChatClicked: function onBtnSendChatClicked() {
        this._chatRoot.active = false;
        if (this._iptChat.string == "") {
            return;
        }
        cc.vv.net.send("chat", this._iptChat.string);
        this._iptChat.string = "";
    }
});

cc._RFpop();
},{}],"ZjhNetMgr":[function(require,module,exports){
"use strict";
cc._RFpush(module, '716cd2QI4dOx5YesLOt4bWV', 'ZjhNetMgr');
// scripts/ZjhNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log(data);
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.room_type = data.conf.room_type;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            cc.director.loadScene("zjhgame");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("exit_notify_push", function (data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("count_down_push", function (data) {
            self.dispatchEvent("count_down", data);
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            self.dispatchEvent("exit_room");
            if (self.roomId == null) {
                cc.director.loadScene("newhall");
                self.room_type = -1;
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    self.roomId = null;
                    self.room_type = -1;
                }
            }
        });
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
        cc.vv.net.addHandler("game_checkPai_push", function (data) {
            console.log(data);
            self.dispatchEvent('kanpai', data);
        });
        cc.vv.net.addHandler("game_losed_push", function (data) {
            self.dispatchEvent('qipai', data);
        });
        cc.vv.net.addHandler("game_wannaToCompare_push", function (data) {
            self.dispatchEvent('game_wannaToCompare_push', data);
        });
        //弃牌通知 game_userInlosed_push
        cc.vv.net.addHandler("game_userInlosed_push", function (data) {
            self.dispatchEvent('qiPai_notify', data);
        });
        cc.vv.net.addHandler("game_myTurn_push", function (data) {
            self.dispatchEvent('game_myTurn_push', data);
        });
        cc.vv.net.addHandler("game_turnChanged_push", function (data) {
            self.dispatchEvent('game_turnChanged_push', data);
        });
        cc.vv.net.addHandler("guo_notify_push", function (data) {
            self.dispatchEvent('guo_notify_push', data);
        });
        cc.vv.net.addHandler("game_myWin_push", function (data) {
            //我赢了
            // self.dispatchEvent('win', data);
        });
        cc.vv.net.addHandler("gameOver_notify_push", function (data) {
            //游戏结束清除定时器
            self.dispatchEvent('gameOver_notify_push', data);
        });
        cc.vv.net.addHandler("game_oneInWin_push", function (data) {
            //赢了
            self.dispatchEvent('win', data);
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            self.button = data;
            self.turn = self.button;
            self.gamestate = "begin";
            self.dispatchEvent('game_begin', {
                currentZhu: data.currentZhu,
                turn: data.turn
            });
        });
        cc.vv.net.addHandler("game_myMoney_push", function (data) {
            console.log('game_myMoney_push');
            console.log(data);
            self.dispatchEvent('game_myMoney', data);
        });
        //没钱了通知前端，让其退出
        cc.vv.net.addHandler("game_noMoney_exit", function (data) {
            self.dispatchEvent('noMoney_exit', data);
        });
        //总注通知
        cc.vv.net.addHandler("game_moneyPool_push", function (data) {
            console.log('game_moneyPool_push');
            console.log(data);
            self.dispatchEvent('game_moneyPool', data);
        });
        //跟注通知
        cc.vv.net.addHandler("genZhu_notify_push", function (data) {
            console.log('genZhu_notify_push');
            console.log(data);
            self.dispatchEvent('genZhu_notify', data);
        });
        //看牌通知 game_oneInCheckPai_push
        cc.vv.net.addHandler("game_oneInCheckPai_push", function (data) {
            console.log('game_oneInCheckPai_push');
            console.log(data);
            self.dispatchEvent('kanPai_notify', data);
        });
        //加注通知 jiaZhu_notify_push
        cc.vv.net.addHandler("jiaZhu_notify_push", function (data) {
            console.log('jiaZhu_notify_push');
            console.log(data);
            self.dispatchEvent('jiaZhu_notify', data);
        });
        //提示消息通知
        cc.vv.net.addHandler("message_notify_push", function (data) {
            console.log('message_notify_push');
            console.log(data);
            self.dispatchEvent('message_notify', data);
        });
        //轮数通知
        cc.vv.net.addHandler("game_circleCount_push", function (data) {
            console.log('game_circleCount_push');
            console.log(data);
            self.dispatchEvent('game_circleCount', data);
        });
        //比牌结果通知 game_userInBipai_result_push
        cc.vv.net.addHandler("game_userInBipai_result_push", function (data) {
            console.log('game_userInBipai_result_push');
            console.log(data);
            self.dispatchEvent('game_userInBipai_result', data);
        });
        cc.vv.net.addHandler("game_actionChanged_push", function (data) {
            self.dispatchEvent('game_actionChanged_push', data);
        });
        cc.vv.net.addHandler("game_AntiResults_push", function (data) {
            self.dispatchEvent('game_AntiResults', data);
        });
        cc.vv.net.addHandler("game_userInfoById_push", function (data) {
            if (data) {
                self.dispatchEvent('game_userInfoById', data);
            }
        });
        cc.vv.net.addHandler("game_gameInfoById_push", function (data) {
            if (data) {
                self.dispatchEvent('game_gameInfoById', data);
            }
        });
        cc.vv.net.addHandler("game_sbInAllIn_push", function (data) {
            if (data) {
                self.dispatchEvent('game_sbInAllIn', data);
            }
        });
    }
});

cc._RFpop();
},{}],"all":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'f97f0CDR71Ceq9Qbzo/gS2o', 'all');
// scripts/zjh/all.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null,
        paigroup: {
            default: null,
            type: cc.SpriteAtlas
        },
        back: cc.Node,
        fanhui: cc.Node,
        bg: cc.Node,
        helpbtn: cc.Node,
        helpshow: cc.Node,
        addzhudetail: null,
        ops: null,
        zhuobj: null,
        fan: cc.Node,
        backAlert: cc.Node,
        backAlert_no: cc.Node,
        countdown: cc.Label,
        _time: -1
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        for (var i = 0; i < 5; i++) {
            this._seats.push(cc.find("Canvas/seat" + i).getComponent("zjhSeat"));
        }
        this._timeLabel = cc.find("Canvas/time").getComponent(cc.Label);
        this.addComponent("ReConnect");
        this._zhuomian = cc.find("Canvas/zhuomian");
        this.zhuobj = ['zhu0', 'zhu1', 'zhu2', 'zhu3', 'zhu0_hui', 'zhu1_hui', 'zhu2_hui', 'zhu3_hui'];
        this._edit = cc.find("Canvas/edit");
        this._graykanpai = this._edit.getChildByName('graykanpai');
        this._kanpai = this._edit.getChildByName('kanpai');
        this._graygenzhu = this._edit.getChildByName('graygenzhu');
        this._genzhu = this._edit.getChildByName('genzhu');
        this._grayjiazhu = this._edit.getChildByName('grayjiazhu');
        this._jiazhu = this._edit.getChildByName('jiazhu');
        this._grayqipai = this._edit.getChildByName('grayqipai');
        this._qipai = this._edit.getChildByName('qipai');
        this._graybipai = this._edit.getChildByName('graybipai');
        this._bipai = this._edit.getChildByName('bipai');
        this._allin = this._edit.getChildByName('allin');
        this._allZhuLabel = cc.find("Canvas/zongxiazhu/label").getComponent(cc.Label); //牌桌上所有的注
        this._zhu = cc.find("Canvas/zhu"); //加注界面
        this._danzhu = cc.find("Canvas/danzhu").getComponent(cc.Label); //单注显示
        this._lunshu = cc.find("Canvas/lunshu").getComponent(cc.Label); //轮数显示
        this._pkPanel = cc.find("Canvas/pk"); //pk界面
        this._flashAnim = cc.find("Canvas/pk/shandian/pk_shandian").getComponent(cc.Animation); //闪电动画
        this._bipaiAnim = cc.find("Canvas/pk/bipai").getComponent(cc.Animation); //比牌动画
        this._leftLie = this._pkPanel.getChildByName('leftLie');
        this._rightLie = this._pkPanel.getChildByName('rightLie');
        this._tips = cc.find("Canvas/tips").getComponent(cc.Label); //tips显示
        cc.vv.utils.addClickEvent(this._kanpai, this.node, "all", "kanpai");
        cc.vv.utils.addClickEvent(this.back, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fanhui, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fan, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.bg, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.helpbtn, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.helpshow, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.backAlert_no, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._qipai, this.node, "all", "qipai");
        cc.vv.utils.addClickEvent(this._bipai, this.node, "all", "bipai");
        cc.vv.utils.addClickEvent(this._genzhu, this.node, "all", "genzhu");
        cc.vv.utils.addClickEvent(this._jiazhu, this.node, "all", "jiazhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu0'), this.node, "all", "addzhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu1'), this.node, "all", "addzhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu2'), this.node, "all", "addzhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu3'), this.node, "all", "addzhu");
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        cc.vv.net.send("getUserInfoByUserid");
        cc.vv.net.send("getGameInfoByUserid");
        cc.vv.net.send("ready");
        cc.vv.audioMgr.playBGM("back.mp3");
    },
    initView: function initView() {
        this._kanpai.active = false;
        this._qipai.active = false;
        this._genzhu.active = false;
        this._allin.active = false;
        this._jiazhu.active = false;
        this._bipai.active = false;
        this._pkPanel.active = false;
        this._zhuomian.active = false;
        this._tips.node.active = true;
    },
    freshUserInfo: function freshUserInfo(data) {
        console.log('获取断线重连后的用户信息', data);
        var self = this;
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            for (var t = 0; t < 3; t++) {
                cc.find('Canvas/seat' + i + '/fupai' + t).active = true;
            }
        }
        cc.find("Canvas/danzhu").active = true;
        cc.find("Canvas/lunshu").active = true;
        cc.find("Canvas/zongxiazhu").active = true;
        self._tips.node.active = false;
        self.countdown.node.active = false;
        self._kanpai.active = true;
        self._qipai.active = true;
        self._genzhu.active = data.canGenzhu;
        self._jiazhu.active = data.canAddZhu;
        self._bipai.active = data.canBiPai;
        self.ops = data.xiaZhuOptions;
        var holds = data.holds;
        if (holds && holds.length > 0) {
            var seat = self._seats[0];
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
        }
    },
    freshGameInfo: function freshGameInfo(data) {
        console.log('获取断线重连后的游戏信息', data);
        if (this.ops) {
            var self = this;
            this.freshCurrentZhu(data.currentZhu);
            this.freshCircleCount(data.circleCount);
            this._zhuomian.active = true;
            var total = data.moneyPool;
            self._allZhuLabel.string = total; //总数
            //fresh其他人的数据
            var commonInfo = data.players;
            var allZhu = [];
            for (var i in commonInfo) {
                var temp = commonInfo[i];
                var userid = temp.userid;
                var costMoney = temp.costMoney; //下的注
                var money = temp.money; //所有用的钱
                //刷新这个人的信息
                var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
                var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
                var seat = self._seats[localIndex];
                seat.setCostMoney(costMoney);
                seat.setMoney(money);
                var costArr = temp.costArr;
                for (var j in costArr) {
                    allZhu.push(costArr[j]);
                }
            }
            //添加桌面上的注
            for (var i in allZhu) {
                var zhu = allZhu[i];
                var node = self._zhuomian.children[0];
                var newNode = cc.instantiate(node);
                self._zhuomian.addChild(newNode);
                newNode.getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(zhu, 'W');
                var zhuLevel = self.getZhuLevel(zhu);
                var zhuObj = cc.find('Canvas/zhu/' + self.zhuobj[zhuLevel]);
                var zhuFrameCopy = zhuObj.getComponent(cc.Sprite).spriteFrame;
                newNode.getComponent(cc.Sprite).spriteFrame = zhuFrameCopy;
                newNode.x = Math.random() * 200;
                newNode.y = Math.random() * 200;
                newNode.active = true;
            }
        }
    },
    getZhuLevel: function getZhuLevel(zhu) {
        var ops = this.ops;
        var zhuLevel = null;
        for (var i in ops) {
            if (parseInt(ops[i]) == parseInt(zhu)) {
                zhuLevel = i;
                break;
            }
        }
        if (zhuLevel == null) {
            for (var i in ops) {
                if (parseInt(ops[i]) == parseInt(zhu) * 0.5) {
                    zhuLevel = i;
                    break;
                }
            }
        }
        if (zhuLevel == null) {
            for (var i in ops) {
                if (parseInt(ops[i]) == parseInt(zhu) * 2) {
                    zhuLevel = i;
                    break;
                }
            }
        }
        return zhuLevel;
    },
    refreshBtns: function refreshBtns(data) {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            for (var t = 0; t < 3; t++) {
                cc.find('Canvas/seat' + i + '/fupai' + t).active = true;
            }
        }
        cc.find("Canvas/danzhu").active = true;
        cc.find("Canvas/lunshu").active = true;
        cc.find("Canvas/zongxiazhu").active = true;
        this._tips.node.active = false;
        this.countdown.node.active = false;
        this.freshCurrentZhu(data.currentZhu);
        this.freshCircleCount(data.turn);
        this._kanpai.active = true;
        this._qipai.active = true;
        this._genzhu.active = false;
        this._jiazhu.active = false;
        this._bipai.active = false;
        this.showXiaDiZhuAnim(data.currentZhu); //下底注动画
    },
    showXiaDiZhuAnim: function showXiaDiZhuAnim(currentZhu) {
        var children_baoliu = [];
        for (var i in this._zhuomian.children) {
            if (i < 5) {
                //只留5个底注的筹码
                children_baoliu.push(this._zhuomian.children[i]);
            }
        }
        this._zhuomian.removeAllChildren();
        for (var j in children_baoliu) {
            this._zhuomian.addChild(children_baoliu[j]);
        }
        this._zhuomian.active = true;
        var addMoney = 100;
        if (currentZhu) {
            addMoney = parseInt(currentZhu) * 0.5;
        }
        for (var k in this._seats) {
            if (!this._seats[k]._userId) {
                continue;
            };
            var data = {
                x: this._seats[k].node.x,
                y: this._seats[k].node.y,
                addMoney: addMoney,
                addMoneyLevel: 0
            };
            this.showZhuAnim(data, k);
        }
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        var self = this;
        this.node.on('new_user', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('user_state_changed', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('game_begin', function (data) {
            self.refreshBtns(data.detail);
            // self.initSeats();
        });
        this.node.on('game_num', function (data) {
            // self.refreshBtns();
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            var index = data.content;
            var info = cc.vv.zjhchat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].emoji(data.content);
        });
        this.node.on('kanpai', function (event) {
            var data = event.detail;
            var holds = data.holds;
            var seat = self._seats[0];
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
            var currentZhu = data.currentZhu;
            self._genzhu.getChildByName('num').getComponent(cc.Label).string = cc.vv.utils.showJinbi(currentZhu, 'W');
        });
        this.node.on('qipai', function (event) {
            var data = event.detail;
            if (data.status == 'shu') {
                cc.find('Canvas/seat0/shuicon').active = true;
            } else {
                cc.find('Canvas/seat0/qiicon').active = true;
            }
            self._grayqipai.active = true;
            self._qipai.active = false;
            var holds = data.holds;
            var seat = self._seats[0];
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
        });
        this.node.on('game_myTurn_push', function (event) {
            var data = event.detail;
            self.addzhudetail = data.xiaZhuOptions;
            self.ops = data.xiaZhuExtra.ops;
            //可操作按钮
            if (data.canAddZhu) {
                self._jiazhu.active = true;
            }
            if (data.canGenzhu) {
                self._genzhu.active = true;
                var currentZhu = data.currentZhu;
                if (!data.hasCheckedPai) {
                    //暗注
                    currentZhu = currentZhu * 0.5;
                }
                self._genzhu.getChildByName('num').getComponent(cc.Label).string = cc.vv.utils.showJinbi(currentZhu, 'W');
            }
            if (data.canBiPai) {
                //满足比牌条件
                self._bipai.active = true;
            }
            if (data.allInFlag) {
                self._allin.active = true;
                // self._graygenzhu.active = false;
            } else {
                self._allin.active = false;
            }
        });
        this.node.on('gameOver_notify_push', function (event) {
            var i = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(event.detail));
            cc.find('Canvas/seat' + i + '/toggle').active = false;
        });
        this.node.on('game_turnChanged_push', function (event) {
            var i = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(event.detail));
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + i + '/toggle').active = true;
            self._seats[i].setTime();
            if (i != 0) {
                //如果没有轮到自己操作
                self._genzhu.active = false;
                self._jiazhu.active = false;
                self._bipai.active = false;
            }
        });
        this.node.on('game_actionChanged_push', function (event) {
            var bp = cc.find('Canvas/edit/bipai');
            var data = event.detail;
            if (data.xiaZhuOptions) self.addzhudetail = data.xiaZhuOptions;
            if (data.xiaZhuExtra.ops) self.ops = data.xiaZhuExtra.ops;
            if (event.detail.canBiPai) {
                bp.active = true;
            } else {
                bp.active = false;
            }
        });
        this.node.on('guo_notify_push', function (event) {
            cc.find('Canvas/seat0/toggle').active = false;
        });
        this.node.on('genZhu_notify', function (event) {
            var userid = event.detail.userid;
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var seat = self._seats[localIndex];
            seat.showGenZhu();
            var currentZhu = event.detail.currentZhu;
            var hasCheckedPai = event.detail.hasCheckedPai;
            var addMoney = event.detail.addMoney;
            var addMoneyLevel = event.detail.addMoneyLevel;
            self.freshCurrentZhu(currentZhu);
            var data = {
                x: seat.node.x,
                y: seat.node.y,
                addMoney: addMoney,
                addMoneyLevel: addMoneyLevel,
                hasCheckedPai: hasCheckedPai
            };
            self.showZhuAnim(data);
        });
        this.node.on('kanPai_notify', function (event) {
            var userid = event.detail;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            seat.showKanPai();
        });
        this.node.on('jiaZhu_notify', function (event) {
            var userid = event.detail.userid;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            seat.showJiaZhu();
            var currentZhu = event.detail.currentZhu;
            var hasCheckedPai = event.detail.hasCheckedPai;
            var addMoney = event.detail.addMoney;
            var addMoneyLevel = event.detail.addMoneyLevel;
            self.freshCurrentZhu(currentZhu);
            var data = {
                x: seat.node.x,
                y: seat.node.y,
                addMoney: addMoney,
                addMoneyLevel: addMoneyLevel,
                hasCheckedPai: hasCheckedPai
            };
            self.showZhuAnim(data);
        });
        this.node.on('qiPai_notify', function (event) {
            var data = event.detail;
            var userid = data.userId;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            seat.showQiPai(data.status);
        });
        this.node.on('win', function (data) {
            //赢了一局
            var data = data.detail;
            console.log('赢了一局', data);
            //赢的人显示手牌
            var userid = data.winer;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            var holds = data.holds;
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
            //赢了的动画
            self.endData = data;
            self.isEnd = true;
            if (!self._pkPanel.active) {
                self.showEndAnim();
            }
        });
        this.node.on('game_moneyPool', function (data) {
            //刷新总注
            data = data.detail;
            var total = data.moneyPool;
            self._allZhuLabel.string = total; //总数
            //fresh其他人的数据
            var commonInfo = data.commonInfo;
            for (var i in commonInfo) {
                var userid = i;
                var temp = commonInfo[i];
                var costMoney = temp.costMoney; //下的注
                var money = temp.money; //所有用的钱
                //刷新这个人的信息
                var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
                var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
                var seats = cc.vv.gameNetMgr.seats;
                seats[seatIndex].score = money;
                var seat = self._seats[localIndex];
                seat.setCostMoney(costMoney);
                seat.setMoney(money);
            }
        });
        this.node.on('message_notify', function (data) {
            //消息显示
            data = data.detail;
            var message = data.message;
            cc.vv.alert.show("注意", message);
        });
        this.node.on('game_circleCount', function (data) {
            //刷新轮数
            var circleCount = data.detail;
            self.freshCircleCount(circleCount);
        });
        this.node.on('clickPkButton', function (data) {
            var userId2 = data.detail;
            self.clickPkButton(userId2);
        });
        this.node.on('game_userInBipai_result', function (data) {
            data = data.detail;
            var winer = data.winer;
            var loser = data.loser;
            self.bipaiAnimQueue = [{
                winer: winer,
                loser: loser
            }]; //比牌队列
            self.bipaiAnimIndex = 0;
            self.showBipaiAnim();
        });
        this.node.on('game_wannaToCompare_push', function (data) {
            data = data.detail;
            if (!data || data.length < 1) {
                self._tips.node.active = false;
                return;
            }
            self._tips.string = "请选择比牌玩家";
            self._tips.node.active = true;
            for (var i in data) {
                var userid = data[i].userid;
                var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
                var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
                var seat = self._seats[localIndex];
                seat.showPkButton();
            }
        });
        this.node.on('count_down', function (data) {
            if (self._tips.node.active) {
                self._tips.node.active = false;
            }
            var data = data.detail;
            self.countdown.string = data.countDown;
            self.countdown.node.active = true;
            if (data.countDown <= 0) {
                self.countdown.node.active = false;
            }
        });
        this.node.on('game_AntiResults', function (data) {
            //最后一轮的比牌
            data = data.detail;
            self.bipaiAnimQueue = [];
            for (var i in data) {
                var bipaiData = data[i];
                var winer = bipaiData['winUserid'];
                var loser = bipaiData['loseUserid'];
                self.bipaiAnimQueue.push({
                    winer: winer,
                    loser: loser
                }); //比牌队列
            }
            self.bipaiAnimIndex = 0;
            self.showBipaiAnim();
        });
        this.node.on('game_userInfoById', function (data) {
            //获取断线重连后的用户信息
            data = data.detail;
            self.freshUserInfo(data);
        });
        this.node.on('game_gameInfoById', function (data) {
            //获取断线重连后的游戏信息
            data = data.detail;
            self.freshGameInfo(data);
        });
        this.node.on('exit_room', function (data) {
            //刷新用户钱币数量
            self.getGemsAndCoins();
        });
        this.node.on('noMoney_exit', function (data) {
            //提示金钱不足
            cc.vv.alert.show("提示", "金钱不足，您将退出房间，请在活动领取每日金币补助");
        });
        this.node.on('game_sbInAllIn', function (data) {
            //有人allin了
            console.log('game_sbInAllIn=====>', data.detail);
            data = data.detail;
            self.doAllin(data, function () {
                cc.vv.net.send('allInActiveFromClient'); //触发下一步
            });
        });
    },
    //设置金币钻石数量
    getGemsAndCoins: function getGemsAndCoins() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
    },
    initSeats: function initSeats() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.gameNetMgr.getLocalIndexZJH(seat.seatindex);
        var isOffline = !seat.online;
        // var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    onBtnBackClicked: function onBtnBackClicked() {
        cc.vv.alert.show("返回大厅", "返回大厅房间仍会保留，快去邀请大伙来玩吧！", function () {
            cc.director.loadScene("hall");
        }, true);
    },
    onBtnChatClicked: function onBtnChatClicked() {},
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnDissolveClicked: function onBtnDissolveClicked() {
        cc.vv.alert.show("解散房间", "解散房间不扣金币，是否确定解散？", function () {
            cc.vv.net.send("dispress");
        }, true);
    },
    onBtnExit: function onBtnExit() {
        this.backAlert.active = false;
        cc.vv.net.send("exit");
    },
    onBtnExchange: function onBtnExchange() {
        this.backAlert.active = false;
        cc.vv.userMgr.exchange = 1;
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            this._lastPlayTime = Date.now() + msgInfo.time;
            if (!cc.sys.isNative) {
                var serverid = msgInfo['msg'];
                window.downloadVoice(serverid);
                return;
            }
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (window.voice && window.voice.localId != null) {
            var localId = window.voice.localId;
            window.voice.localId = null;
            cc.vv.audioMgr.pauseAll();
            window.playVoice(localId);
        }
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;
            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }
        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },
    onPlayerOver: function onPlayerOver() {
        if (!cc.sys.isNative) {
            window.stopPlayVoice();
        };
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    },
    //点击看牌按钮
    kanpai: function kanpai() {
        cc.vv.net.send('kanpai');
    },
    //点击加注按钮，打开加注界面
    jiazhu: function jiazhu() {
        var self = this;
        for (var d in self.zhuobj) {
            cc.find('Canvas/zhu/' + self.zhuobj[d]).active = false;
        }
        self._zhu.active = true;
        for (var i in self.addzhudetail) {
            if (self.inObject(self.addzhudetail[i], self.ops)) {
                self._zhu.getChildByName('zhu' + i).active = true;
                self._zhu.getChildByName('zhu' + i).getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(self.addzhudetail[i], 'W');
            } else {
                self._zhu.getChildByName('zhu' + i + '_hui').active = true;
                self._zhu.getChildByName('zhu' + i + '_hui').getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(self.addzhudetail[i], 'W');
            };
        }
    },
    //点击比牌按钮
    bipai: function bipai() {
        cc.vv.net.send('wannaToComparePai');
        //显示其他人的pk按钮，选择和谁比牌
        // this.showOthersPkButton();
    },
    clickPkButton: function clickPkButton(userId2) {
        this.hideOhersPkButton();
        var userId1 = cc.vv.userMgr.userId; //自己
        cc.vv.net.send('bipai', {
            userId1: userId1,
            userId2: userId2
        });
    },
    //点击弃牌按钮
    qipai: function qipai() {
        cc.vv.net.send('qipai');
    },
    //点击跟注按钮
    genzhu: function genzhu() {
        cc.vv.net.send('genzhu');
    },
    addzhu: function addzhu(e) {
        var self = this,
            num;
        var index = e.target.name.split('zhu')[1];
        num = self.addzhudetail[index];
        console.log(num);
        cc.vv.net.send('addzhu', num);
        this._zhu.active = false;
    },
    getpaiRes: function getpaiRes(data) {
        var self = this;
        data = data + 1;
        var type, num, huase_big, huase_small;
        num = (data % 100).toString();
        if (data > 0 && data < 14) {
            type = '04'; //黑桃
            num = num + '-1'; //黑牌
        } else if (data > 100 && data < 114) {
            type = '03'; //红桃
            num = num + '-2'; //红牌
        } else if (data > 200 && data < 214) {
            type = '02'; //梅花
            num = num + '-1'; //黑牌
        } else if (data > 300 && data < 314) {
            type = '01'; //方块
            num = num + '-2'; //红牌
        }
        huase_big = "huase_big" + type;
        huase_small = "huase_small" + type;
        var result = {
            num: self.paigroup.getSpriteFrame(num),
            huase_big: self.paigroup.getSpriteFrame(huase_big),
            huase_small: self.paigroup.getSpriteFrame(huase_small)
        };
        // if (num == '1') num = 'A';
        // if (num == '11') num = 'J';
        // if (num == '12') num = 'Q';
        // if (num == '13') num = 'K';
        return result;
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name != "zhu") {
            cc.find('Canvas/zhu').active = false;
        }
        if (event.target.name == "back") {
            this.fanhui.active = true;
            this.helpshow.active = false;
            this.helpbtn.active = true;
        }
        if (event.target.name == "bg") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            this.helpbtn.active = true;
        }
        if (event.target.name == "helpbtn") {
            this.helpshow.active = true;
            this.helpbtn.active = false;
            this.fanhui.active = false;
        }
        if (event.target.name == "fan") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            this.helpbtn.active = true;
            this.backAlert.active = true;
        }
        if (event.target.name == "no") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            this.helpbtn.active = true;
            this.backAlert.active = false;
        }
    },
    freshCurrentZhu: function freshCurrentZhu(current_zhu) {
        this._danzhu.string = "单注：" + current_zhu;
    },
    freshNumOfLun: function freshNumOfLun(num) {},
    restart: function restart() {
        this.clearEnd();
        this.initView();
        this.initSeats();
    },
    freshCircleCount: function freshCircleCount(circleCount) {
        this._lunshu.string = "轮数：" + (circleCount + 1) + "/15";
    },
    showPk: function showPk() {
        this._leftLie.active = false;
        this._rightLie.active = false;
        this._pkPanel.active = true;
        //播放比牌动画
        this._flashAnim.play('pk_shandian');
        this._bipaiAnim.play('bipai');
    },
    hidePk: function hidePk(data) {
        var self = this;
        setTimeout(function () {
            self.showLie(data);
            setTimeout(function () {
                self._pkPanel.active = false;
                self.bipaiAnimIndex++; //下一个比牌动画
                if (self.bipaiAnimIndex >= self.bipaiAnimQueue.length) {
                    //没有下一个动画了
                    if (self.isEnd) {
                        //如果标识为游戏结束
                        self.showEndAnim();
                    } else {
                        //如果没有结束,执行比牌系列动画结束后的回调函数
                        if (self.bipaiAnimCallback) {
                            self.bipaiAnimCallback();
                        }
                    }
                } else {
                    self.showBipaiAnim(); //执行下一个比牌动画
                }
            }, 1000);
        }, 1000);
    },
    showLie: function showLie(data) {
        //0-显示左边裂牌 1-显示右边裂牌
        if (data == 1) {
            this._rightLie.active = true;
        } else {
            this._leftLie.active = true;
        }
    },
    hideLie: function hideLie() {
        this._leftLie.active = false;
        this._rightLie.active = false;
    },
    showOthersPkButton: function showOthersPkButton() {
        for (var i in this._seats) {
            if (i == 0) continue;
            var seat = this._seats[i];
            seat.showPkButton();
        }
    },
    showZhuAnim: function showZhuAnim(data, dizhuLevel) {
        //下注动画
        if (!data) return;
        var x = data.x; //起始点X
        var y = data.y; //起始点Y
        var random_diff = Math.random() * 50;
        var endX = x * 0.2 + random_diff;
        var endY = y * 0.2 + random_diff;
        var addMoney = data.addMoney;
        var addMoneyLevel = data.addMoneyLevel;
        var node = this._zhuomian.children[0];
        var newNode = cc.instantiate(node);
        if (typeof dizhuLevel != 'undefined') {
            //如果是底注本身
            newNode = this._zhuomian.children[dizhuLevel];
            endX = newNode.x;
            endY = newNode.y;
        } else {
            this._zhuomian.addChild(newNode);
        }
        newNode.getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(addMoney, 'W');
        var zhuObj = cc.find('Canvas/zhu/' + this.zhuobj[addMoneyLevel]);
        var zhuFrameCopy = zhuObj.getComponent(cc.Sprite).spriteFrame;
        newNode.getComponent(cc.Sprite).spriteFrame = zhuFrameCopy;
        newNode.x = x;
        newNode.y = y;
        newNode.active = true;
        var action = cc.moveTo(0.4, cc.p(endX, endY));
        newNode.runAction(action);
    },
    hideOhersPkButton: function hideOhersPkButton() {
        var self = this;
        self._tips.node.active = false;
        for (var i in this._seats) {
            if (i == 0) continue;
            var seat = this._seats[i];
            seat.hidePkButton();
        }
    },
    inObject: function inObject(data, obj) {
        var f = false;
        for (var i in obj) {
            if (data == obj[i]) {
                f = true;
                break;
            }
        }
        return f;
    },
    //结束动画
    showEndAnim: function showEndAnim() {
        var self = this;
        var data = self.endData;
        if (data) {
            var win_userid = data.winer;
            var holds = data.holds;
            var win_seatIndex = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(win_userid));
            //取得座位
            var win_seat = self._seats[win_seatIndex];
            win_seat.showYanhua(); //放烟花
            //筹码移动动画
            // self._zhuomian.active = true;
            for (var i in self._zhuomian.children) {
                var node = self._zhuomian.children[i];
                var action = cc.moveTo(2, cc.p(win_seat.node.x, win_seat.node.y));
                node.oldX = node.x;
                node.oldY = node.y;
                node.runAction(action);
            }
            setTimeout(function () {
                // self._zhuomian.active = false;
                if (self._zhuomian) {
                    for (var i in self._zhuomian.children) {
                        var node = self._zhuomian.children[i];
                        if (node.oldX) {
                            node.x = node.oldX;
                        }
                        if (node.oldY) {
                            node.y = node.oldY;
                        }
                    }
                    //重新开始一局
                    self.restart();
                }
            }, 1500);
        }
    },
    clearEnd: function clearEnd() {
        var self = this;
        self.isEnd = false;
        self.endData = null;
        self._tips.string = "正在等待下一局游戏";
        self._tips.node.active = true;
        setTimeout(function () {
            cc.vv.net.send('ready');
        }, 1000);
    },
    //比牌动画
    showBipaiAnim: function showBipaiAnim() {
        var self = this;
        var bipaiData = self.bipaiAnimQueue[self.bipaiAnimIndex];
        var winer = bipaiData['winer'];
        var loser = bipaiData['loser'];
        var lpx = cc.find('Canvas/pk/leftPai').x,
            lpy = cc.find('Canvas/pk/leftPai').y,
            rpx = cc.find('Canvas/pk/rightPai').x,
            rpy = cc.find('Canvas/pk/rightPai').y;
        var WseatIndex = cc.vv.gameNetMgr.getSeatIndexByID(winer),
            LseatIndex = cc.vv.gameNetMgr.getSeatIndexByID(loser);
        var WlocalIndex = cc.vv.gameNetMgr.getLocalIndexZJH(WseatIndex),
            LlocalIndex = cc.vv.gameNetMgr.getLocalIndexZJH(LseatIndex);
        var b1 = cc.find('Canvas/seat' + WlocalIndex),
            b2 = cc.find('Canvas/seat' + LlocalIndex);
        cc.find('Canvas/pk/leftPai').x = b1.x;
        cc.find('Canvas/pk/leftPai').y = b1.y;
        cc.find('Canvas/pk').active = true;
        cc.find('Canvas/pk/leftPai').active = true;
        cc.find('Canvas/pk/rightPai').x = b2.x;
        cc.find('Canvas/pk/rightPai').y = b2.y;
        cc.find('Canvas/pk/rightPai').active = true;
        var action1 = cc.moveTo(0.4, cc.p(lpx, lpy)),
            action2 = cc.moveTo(0.4, cc.p(rpx, rpy));
        cc.find('Canvas/pk/leftPai').runAction(action1);
        cc.find('Canvas/pk/rightPai').runAction(action2);
        self.hideLie();
        setTimeout(function () {
            self.showPk();
            self.hidePk(1);
        }, 400);
    },
    //孤注一掷
    allin: function allin() {
        cc.vv.net.send('all_in');
    },
    //孤注一掷动画
    doAllin: function doAllin(data, callback) {
        var userid = data.userid; //发起孤注一掷的那个人
        var status = data.status; //0-输了 1-赢了
        var self = this;
        self.bipaiAnimQueue = [];
        for (var i in self._seats) {
            var seatData = self._seats[i];
            var seatUserId = seatData['_userId'];
            if (!seatUserId || seatUserId == userid) continue;
            var winer, loser;
            if (status == 0) {
                winer = seatUserId;
                loser = userid;
            } else {
                winer = userid;
                loser = seatUserId;
            }
            self.bipaiAnimQueue.push({
                winer: winer,
                loser: loser
            }); //比牌队列
        }
        self.bipaiAnimIndex = 0;
        self.showBipaiAnim();
        if (callback) {
            self.bipaiAnimCallback = callback;
        }
    }
});

cc._RFpop();
},{}],"dnAll":[function(require,module,exports){
"use strict";
cc._RFpush(module, '5d3d7MtJTxAp5XWAMAAK+RL', 'dnAll');
// scripts/dn/dnAll.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null,
        paigroup: {
            default: null,
            type: cc.SpriteAtlas
        },
        back: cc.Node,
        fanhui: cc.Node,
        bg: cc.Node,
        backAlert: cc.Node,
        backAlert_no: cc.Node,
        fan: cc.Node,
        jinbi: cc.Node,
        countdown: cc.Label
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        for (var i = 0; i < 5; i++) {
            this._seats.push(cc.find("Canvas/seat" + i).getComponent("dnSeat"));
        }
        this._timeLabel = cc.find("Canvas/time").getComponent(cc.Label);
        this._tips = cc.find("Canvas/tips").getComponent(cc.Label);
        this._difen = cc.find("Canvas/difen").getComponent(cc.Label);
        this._qiangZhuTips = cc.find("Canvas/text1").getComponent(cc.Label);
        this._xiaBeiTips = cc.find("Canvas/text3").getComponent(cc.Label);
        this._lastResult = cc.find("Canvas/lastResult");
        this.addComponent("ReConnect");
        cc.vv.utils.addClickEvent(this.back, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fanhui, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fan, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.bg, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.backAlert_no, this.node, "dnAll", "onBtnClicked");
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        cc.vv.net.send("ready");
        cc.vv.audioMgr.playBGM("back.mp3");
        this.qiangZhuLevel = [0, 1, 2, 3, 4]; //抢注的档次
        this.jinbi_node_arr = [];
    },
    initView: function initView() {
        this._tips.node.active = true;
        this._lastResult.active = false;
    },
    initSeats: function initSeats() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.gameNetMgr.getLocalIndexZJH(seat.seatindex);
        var isOffline = !seat.online;
        // var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnDissolveClicked: function onBtnDissolveClicked() {
        cc.vv.alert.show("解散房间", "解散房间不扣金币，是否确定解散？", function () {
            cc.vv.net.send("dispress");
        }, true);
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "back") {
            this.fanhui.active = true;
        }
        if (event.target.name == "bg") {
            this.fanhui.active = false;
        }
        if (event.target.name == "fan") {
            this.fanhui.active = false;
            this.backAlert.active = true;
        }
        if (event.target.name == "no") {
            this.fanhui.active = false;
            this.backAlert.active = false;
        }
    },
    onBtnExit: function onBtnExit() {
        this.backAlert.active = false;
        cc.vv.net.send("exit");
    },
    onBtnExchange: function onBtnExchange() {
        this.backAlert.active = false;
        this.fanhui.active = false;
        cc.vv.userMgr.exchange = 1;
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            this._lastPlayTime = Date.now() + msgInfo.time;
            if (!cc.sys.isNative) {
                var serverid = msgInfo['msg'];
                window.downloadVoice(serverid);
                return;
            }
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
        }
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        var self = this;
        this.node.on('new_user', function (data) {
            //新人加入房间
            self.initSingleSeat(data.detail);
        });
        this.node.on('user_state_changed', function (data) {
            var seat = data.detail;
            var index = cc.vv.gameNetMgr.getLocalIndexZJH(seat.seatindex);
            self._seats[index].seatHide();
        });
        this.node.on('game_init', function (data) {
            var gameInfo = data.detail;
            if (!gameInfo) return;
            self.showDiFen(gameInfo.baseFen);
            self._tips.node.active = false;
            var seatDatas = {};
            if (gameInfo['players']) {
                for (var i in gameInfo['players']) {
                    var seatData = gameInfo['players'][i];
                    seatDatas[seatData['userid']] = seatData;
                }
            }

            self.refreshSeats(seatDatas);
        });
        this.node.on('not_exit', function (data) {
            cc.vv.userMgr.exchange = 0;
            cc.vv.alert.show('提示', '游戏进行中，无法退出房间');
        });
        this.node.on('game_begin', function (data) {
            var data = data.detail;
            //游戏开始
            console.log('游戏开始', data);
            var holds = data.holds;
            var maxQiangZhuangBeiShu = data.maxQiangZhuangBeiShu;
            console.log('holds===>', holds);
            self.showSelfPai(holds); //展示自己手上的四张手牌
            self.showQiangZhu(maxQiangZhuangBeiShu); //展示抢庄倍数
            self.showOtherSeat();
            self.showQiangZhuTips();
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            var index = data.content;
            var info = cc.vv.zjhchat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].emoji(data.content);
        });
        this.node.on('show_qiang', function (data) {
            //有人抢庄
            var data = data.detail;
            var userId = data.userid;
            var beishu = data.beiShu;
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var seat = self._seats[localIndex];
            seat.showQiangZhuText(beishu);
        });
        this.node.on('count_down', function (data) {
            if (self._tips.node.active) {
                self._tips.node.active = false;
            }
            var data = data.detail;
            self.countdown.string = data.countDown;
            self.countdown.node.active = true;
            if (data.countDown <= 0) {
                self.countdown.node.active = false;
            }
        });
        this.node.on('game_zhuangSelected', function (data) {
            //抢庄结束
            self.hideQiangZhuTips();
            self._seats[0].hideQiangZhu();
            //定庄
            var userId = data.detail;
            for (var i in self._seats) {
                var seat = self._seats[i];
                seat.hideQiangZhuText();
            }
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var localSeat = self._seats[localIndex];
            localSeat.showZhuang();
            //定完庄后，激活服务器
            cc.vv.net.send('zhuangEndFromClient');
        });
        this.node.on('game_myXzBegin', function (data) {
            //下注
            self.showXiaZhuTips(); //显示下注提示
            var data = data.detail;
            var seat = self._seats[0];
            seat.showXiaBei(data);
        });
        this.node.on('game_myXzEnd', function (data) {
            //下注结束
            self.hideXiaZhuTips();
            self._seats[0].hideXiaBei();
        });
        this.node.on('show_beiShuText', function (data) {
            //显示下的倍数
            var data = data.detail;
            var userId = data.userid;
            var beiShu = data.beiShu;
            self.showBeiShuText(userId, beiShu);
        });
        this.node.on('game_myHoldsUpdate', function (data) {
            //发最后一张手牌
            var holds = data.detail;
            self.showSelfPai(holds); //展示手牌
            self.showYouShi();
            self.showCount();
        });
        this.node.on('game_b_OneSnEnd', function (data) {
            //算牛结束
            var userId = data.detail;
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var localSeat = self._seats[localIndex];
            localSeat.snEnd();
        });
        this.node.on('game_showAllUser', function (data) {
            //游戏结束
            var data = data.detail;
            var moneyFlows = data.moneyFlows;
            var players = data.players;
            var zhuang_userId = null;
            var type = null;
            for (var i in players) {
                var player = players[i];
                if (player.isZhuang) {
                    zhuang_userId = player.userid;
                }
                if (cc.vv.userMgr.userId == player.userid) {
                    //判断自己的输赢
                    if (player.status == 'win') {
                        type = 1;
                    } else {
                        type = 2;
                    }
                }
            }
            var user_arr_toZhuang = []; //流向庄
            var user_arr_fromZhuang = []; //从庄来
            for (var j in moneyFlows) {
                var moneyFlow = moneyFlows[j];
                if (moneyFlow.to == zhuang_userId) {
                    user_arr_toZhuang.push(moneyFlow);
                }
                if (moneyFlow.from == zhuang_userId) {
                    user_arr_fromZhuang.push(moneyFlow);
                }
            }
            self.showLastPai(players, function () {
                self.showLastResult(type); //显示本人输赢
                setTimeout(function () {
                    self.hideLastResult();
                    self.hideLastPai();
                    self._tips.node.active = true;
                    self.showMoneyFlowsAnim(user_arr_toZhuang, user_arr_fromZhuang, function () {
                        self.showMoneyChange(players);
                        setTimeout(function () {
                            //showMoneyChange执行时间为2秒
                            cc.vv.net.send('ready');
                        }, 2000);
                    });
                }, 1500); //显示输赢的时间
            });
        });
        this.node.on('exit_room', function (data) {
            //刷新用户钱币数量
            self.getGemsAndCoins();
        });
    },
    refreshSeats: function refreshSeats(seatDatas) {
        for (var i in this._seats) {
            var seat = this._seats[i];
            var seatData = seatDatas[seat._userId];
            if (seatData) {
                seat._score = seatData['money'];
            }
            seat.refresh();
        }
    },
    //设置金币钻石数量
    getGemsAndCoins: function getGemsAndCoins() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
    },
    showLastPai: function showLastPai(players, callback) {
        var self = this;
        //显示每个人的牌
        // var players_num = players.length;
        var player_index = 0;
        var fun = function fun() {
            if (player_index > players.length - 1) {
                if (callback) {
                    callback();
                }
                clearInterval(interval);
                return;
            }
            var player = players[player_index];
            var userId = player.userid;
            var holds = player.holds;
            var seat = self.getSeatByUserId(userId);
            var spriteFrames = [];
            for (var i in holds) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.showLastPai(spriteFrames, player.score);
            player_index++;
        };
        var interval = setInterval(fun, 1000); //1秒显示一个
        fun();
    },
    hideLastPai: function hideLastPai() {
        for (var i in this._seats) {
            var seat = this._seats[i];
            seat.hideLastPai();
            seat.hideBeiShuText();
        }
    },
    showMoneyChange: function showMoneyChange(players) {
        var self = this;
        for (var i in players) {
            var player = players[i];
            var userId = player.userid;
            var seat = self.getSeatByUserId(userId);
            var money = player.money;
            seat.changeMoney(money);
        }
    },
    getSeatByUserId: function getSeatByUserId(userId) {
        var self = this;
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
        var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
        var localSeat = self._seats[localIndex];
        return localSeat;
    },
    showMoneyFlowsAnim: function showMoneyFlowsAnim(user_arr_toZhuang, user_arr_fromZhuang, callback) {
        var self = this;
        //资金流动画
        //流向庄的金币动画
        self.buildMoneyFlowsAnimData(user_arr_toZhuang);
        self.execMoneyFlowsAnim(function () {
            //从庄流出的金币动画
            self.buildMoneyFlowsAnimData(user_arr_fromZhuang);
            self.execMoneyFlowsAnim(function () {
                if (callback) {
                    callback();
                }
            });
        });
    },
    buildMoneyFlowsAnimData: function buildMoneyFlowsAnimData(user_arr) {
        var self = this;
        //构造金币流数据
        for (var i in user_arr) {
            //起点
            var from_userId = user_arr[i].from;
            var fromSeat = self.getSeatByUserId(from_userId);
            var from_node = fromSeat.node;
            var start_x = from_node.x;
            var start_y = from_node.y;
            //终点
            var to_userId = user_arr[i].to;
            var toSeat = self.getSeatByUserId(to_userId);
            var to_node = toSeat.node;
            var end_x = to_node.x;
            var end_y = to_node.y;
            var dis_x = end_x - start_x;
            var dis_y = end_y - start_y;
            var jin_num = 15;
            var per_x = Math.floor(dis_x / jin_num);
            var per_y = Math.floor(dis_y / jin_num);
            var new_node_arr = [];
            // if (type == 1) {
            for (var j = 0; j <= jin_num; j++) {
                var new_x = start_x + j * per_x;
                var new_y = start_y + j * per_y;
                var new_node = cc.instantiate(self.jinbi);
                new_node.active = false;
                new_node.x = new_x;
                new_node.y = new_y;
                cc.find("Canvas").addChild(new_node);
                new_node_arr.push(new_node);
            }
            self.jinbi_node_arr.push(new_node_arr);
        }
    },
    execMoneyFlowsAnim: function execMoneyFlowsAnim(callback) {
        //执行金币流动画
        var self = this;
        if (self.jinbi_node_arr.length == 0) {
            self.clearFlowAnim();
            if (callback) {
                callback();
            }
            return;
        }
        var interVal = setInterval(function () {
            if (!self.showJinbiIndex) {
                self.showJinbiIndex = 0;
            }
            for (var i in self.jinbi_node_arr) {
                var new_node_arr = self.jinbi_node_arr[i];
                new_node_arr[self.showJinbiIndex].active = true;
            }
            if (self.showJinbiIndex >= 10) {
                self.showJinbiIndex = 0;
                self.flowEndAnim(callback);
                clearInterval(interVal);
            } else {
                self.showJinbiIndex++;
            }
        }, 100);
    },
    flowEndAnim: function flowEndAnim(callback) {
        var self = this;
        var duration = 0.4;
        for (var i in self.jinbi_node_arr) {
            var node_arr = self.jinbi_node_arr[i];
            var endNode = node_arr[node_arr.length - 1];
            for (var j in node_arr) {
                var node = node_arr[j];
                var action = cc.moveTo(duration, cc.p(endNode.x, endNode.y));
                node.runAction(action);
            }
        }
        setTimeout(function () {
            //清理金币
            self.clearFlowAnim();
            if (callback) {
                callback();
            }
        }, duration * 1000);
    },
    clearFlowAnim: function clearFlowAnim() {
        var self = this;
        for (var i in self.jinbi_node_arr) {
            var node_arr = self.jinbi_node_arr[i];
            for (var j in node_arr) {
                var node = node_arr[j];
                cc.find("Canvas").removeChild(node);
            }
        }
        self.jinbi_node_arr = [];
    },
    showBeiShuText: function showBeiShuText(userId, beiShu) {
        var self = this;
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
        var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
        var seat = self._seats[localIndex];
        seat.showBeiShuText(beiShu);
    },
    showCount: function showCount() {
        this._seats[0].showCount();
    },
    showYouShi: function showYouShi() {
        this._seats[0].showYouShi();
    },
    showQiangZhuTips: function showQiangZhuTips() {
        //显示抢主tips
        this._qiangZhuTips.node.active = true;
    },
    hideQiangZhuTips: function hideQiangZhuTips() {
        this._qiangZhuTips.node.active = false;
    },
    showXiaZhuTips: function showXiaZhuTips() {
        this._xiaBeiTips.node.active = true;
    },
    hideXiaZhuTips: function hideXiaZhuTips() {
        this._xiaBeiTips.node.active = false;
    },
    showOtherSeat: function showOtherSeat() {
        var self = this;
        for (var i = 1; i < 5; i++) {
            var seat = self._seats[i];
            seat.showBeiPai(4); //显示牌的背面
        }
    },
    showQiangZhu: function showQiangZhu(maxQiangZhuangBeiShu) {
        var self = this;
        var level = 0;
        for (var i in self.qiangZhuLevel) {
            if (self.qiangZhuLevel[i] <= maxQiangZhuangBeiShu) {
                level = i;
            }
        }
        var seat = self._seats[0];
        seat.showQiangZhu(level);
    },
    showSelfPai: function showSelfPai(holds) {
        var self = this;
        var seat = self._seats[0];
        var spriteFrames = [];
        for (var i in holds) {
            spriteFrames.push(self.getpaiRes(holds[i]));
        }
        seat.showSelfPai(spriteFrames);
    },
    getpaiRes: function getpaiRes(data) {
        var self = this;
        data = data + 1;
        var type, num, huase_big, huase_small;
        num = (data % 100).toString();
        if (data > 0 && data < 14) {
            type = '04'; //黑桃
            num = num + '-1'; //黑牌
        } else if (data > 100 && data < 114) {
            type = '03'; //红桃
            num = num + '-2'; //红牌
        } else if (data > 200 && data < 214) {
            type = '02'; //梅花
            num = num + '-1'; //黑牌
        } else if (data > 300 && data < 314) {
            type = '01'; //方块
            num = num + '-2'; //红牌
        }
        huase_big = "huase_big" + type;
        huase_small = "huase_small" + type;
        var hold = data - 1;
        var result = {
            num: self.paigroup.getSpriteFrame(num),
            huase_big: self.paigroup.getSpriteFrame(huase_big),
            huase_small: self.paigroup.getSpriteFrame(huase_small),
            hold: hold
        };
        return result;
    },
    showDiFen: function showDiFen(difen) {
        var self = this;
        self._difen.node.active = true;
        self._difen.string = "底分：" + difen;
    },
    showLastResult: function showLastResult(type) {
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(cc.vv.userMgr.userId);
        var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
        var seat = this._seats[localIndex];
        if (this._lastResult && seat._lastpai.active) {
            this._lastResult.active = true;
        }
        if (type == 1) {
            this._lastResult.getChildByName('win').active = true;
            this._lastResult.getChildByName('lose').active = false;
        } else if (type == 2) {
            this._lastResult.getChildByName('win').active = false;
            this._lastResult.getChildByName('lose').active = true;
        }
    },
    hideLastResult: function hideLastResult() {
        if (this._lastResult) {
            this._lastResult.active = false;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (window.voice && window.voice.localId != null) {
            var localId = window.voice.localId;
            window.voice.localId = null;
            cc.vv.audioMgr.pauseAll();
            window.playVoice(localId);
        }
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;
            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }
        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },
    onPlayerOver: function onPlayerOver() {
        if (!cc.sys.isNative) {
            window.stopPlayVoice();
        };
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    },
    onQiangZhuangClick: function onQiangZhuangClick(e) {
        var self = this;
        var node = e.target;
        var opacity = node.opacity;
        if (opacity == 255) {
            var beishu = 0;
            var nodeName = node.name;
            beishu = nodeName.replace('qiang', '');
            cc.vv.net.send("qiang_zhuang", beishu);
            self.hideQiangZhuTips();
            self._seats[0].hideQiangZhu();
        }
    },
    onXiaZhuClick: function onXiaZhuClick(e) {
        var self = this;
        var node = e.target;
        var opacity = node.opacity;
        if (opacity == 255) {
            var beishu = 0;
            var str = node.getChildByName('num').getComponent(cc.Label).string;
            beishu = str.replace('倍', '');
            cc.vv.net.send("xia_zhu", beishu);
            self.hideXiaZhuTips();
            self._seats[0].hideXiaBei();
        }
    },
    onYouShiClick: function onYouShiClick(e) {
        console.log('有十', e.target);
        var niu_arr = this._seats[0].getNiuArr();
        console.log('niu_arr', niu_arr);
        cc.vv.net.send("you_shi", niu_arr);
    },
    onSanPaiClick: function onSanPaiClick(e) {
        console.log('散牌', e.target);
        cc.vv.net.send("san_pai");
    },
    onPaiClick: function onPaiClick(e) {
        if (!this._seats[0]._count.active) return;
        var node = e.target;
        var nodeName = node.name;
        var hold = node.hold;
        var num = hold % 100;
        console.log('hold', hold);
        if (node.isClicked) {
            node.isClicked = false;
            node.y -= 20;
            this._seats[0].unsetCount(nodeName);
        } else {
            node.isClicked = true;
            node.y += 20;
            this._seats[0].setCount(num, nodeName);
        }
    }
});

cc._RFpop();
},{}],"dnSeat":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'e73acaoMZZMCoeZBmvABtFo', 'dnSeat');
// scripts/dn/dnSeat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _sprIcon: null,
        _zhuang: null,
        _ready: null,
        _offline: null,
        _lblName: null,
        _lblScore: null,
        _scoreBg: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _isOffline: false,
        _isReady: false,
        _isZhuang: false,
        _userId: null,
        _isKanPai: false,
        _isQiPai: false,
        _isShu: false,
        // _timeLabel: null,
        _time: -1
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("head").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("money").getComponent(cc.Label);
        this._diff_money = this.node.getChildByName("diff_money").getComponent(cc.Label);
        this._chatBubble = this.node.getChildByName("ChatBubble");
        this._lastpai = this.node.getChildByName("lastpai");
        this._complete = this.node.getChildByName("complete");
        this._qiangzhu = this.node.getChildByName("qiangzhu");
        this._qiangzhuText = this.node.getChildByName("qiangzhuText");
        this._douniu_zhu = this.node.getChildByName("douniu_zhu");
        this._pai = this.node.getChildByName("pai"); //只有seat0才会有
        this._emoji = this.node.getChildByName("emoji");
        this._xiabei = this.node.getChildByName('xiabei');
        this._beishuText = this.node.getChildByName("beishuText");
        this._youshi = this.node.getChildByName('youshi');
        this._count = this.node.getChildByName('count');
        this.refresh();
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
    },
    onIconClicked: function onIconClicked() {
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if (this._userId != null && this._userId > 0) {
            var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if (cc.vv.baseInfoMap) {
                var info = cc.vv.baseInfoMap[this._userId];
                if (info) {
                    sex = info.sex;
                }
            }
        }
    },
    refresh: function refresh() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._diff_money != null) {
            this._diff_money.node.active = false;
        }
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
        if (this._zhuang) {
            this._zhuang.active = false;
        }
        this.node.active = this._userName != null && this._userName != "";
        if (this._chatBubble) {
            this._chatBubble.active = false;
        }
        if (this._emoji) {
            this._emoji.active = false;
        }
        if (this._lastpai) {
            this._lastpai.active = false;
        }
        if (this._complete) {
            // this._complete.getChildByName('douniu_bg1').active = false;
            // this._complete.getChildByName('wancheng').active = false;
            this._complete.active = false;
        }
        if (this._beishuText) {
            this._beishuText.active = false;
        }
        if (this._qiangzhu) {
            this._qiangzhu.active = false;
        }
        if (this._qiangzhuText) {
            this._qiangzhuText.active = false;
        }
        if (this._douniu_zhu) {
            this._douniu_zhu.active = false;
        }
        if (this._pai) {
            this._pai.active = false;
        }
        if (this._xiabei) {
            this._xiabei.active = false;
        }
        if (this._youshi) {
            this._youshi.active = false;
        }
    },
    setInfo: function setInfo(name, score) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        if (this._scoreBg != null) {
            this._scoreBg.active = this._score != null;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        this.refresh();
    },
    seatHide: function seatHide() {
        this.node.active = false;
        this._userName = "";
        this._userId = 0;
    },
    setZhuang: function setZhuang(value) {
        this._isZhuang = value;
        if (this._zhuang) {
            this._zhuang.active = value;
        } else {
            this._zhuang = this.node.getChildByName("zhuang");
            this._zhuang.active = value;
        }
    },
    setReady: function setReady(isReady) {
        this._isReady = isReady;
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
    },
    setID: function setID(id) {
        var idNode = this.node.getChildByName("id");
        if (idNode) {
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;
        }
        this._userId = id;
        if (this._sprIcon) {
            this._sprIcon.setUserID(id);
        }
    },
    getID: function getID() {
        return this._userId;
    },
    setOffline: function setOffline(isOffline) {
        this._isOffline = isOffline;
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    chat: function chat(content) {
        if (this._chatBubble == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function emoji(_emoji) {
        //emoji = JSON.parse(emoji);
        if (this._emoji == null) {
            return;
        }
        console.log(_emoji);
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(_emoji);
        this._lastChatTime = 3;
    },
    voiceMsg: function voiceMsg(show) {
        if (this._voicemsg) {
            this._voicemsg.active = show;
        }
    },
    setMoney: function setMoney(data) {
        //设置该玩家所拥有的的钱
        this._lblScore.string = data;
        this._score = data;
    },
    setTime: function setTime(o) {
        if (o) {
            this._time = 0;
        } else {
            this._time = 30;
        }
    },
    showQiangZhu: function showQiangZhu(level) {
        var self = this;
        if (!self._qiangzhu) return;
        self._qiangzhu.active = true;
        for (var i in self._qiangzhu.children) {
            if (level < i) {
                self._qiangzhu.children[i].opacity = 128;
            } else {
                self._qiangzhu.children[i].opacity = 255;
            }
        }
    },
    hideQiangZhu: function hideQiangZhu() {
        this._qiangzhu.active = false;
    },
    showSelfPai: function showSelfPai(spriteFrames) {
        var self = this;
        if (self._pai) {
            self._pai.active = true;
            for (var i in self._pai.children) {
                var pai = self._pai.children[i];
                var paiObj = spriteFrames[i];
                if (paiObj) {
                    //如果有资源则显示，没有则隐藏
                    pai.active = true;
                    self.setPai(pai, paiObj);
                } else {
                    pai.active = false;
                }
            }
        }
    },
    /**
     * [setPai description]
     * @param {[type]} pai    [牌的node]
     * @param {[type]} paiObj [牌的资源]
     */
    setPai: function setPai(pai, paiObj) {
        var numRes = paiObj['num'];
        var huase_bigRes = paiObj['huase_big'];
        var huase_smallRes = paiObj['huase_small'];
        var hold = paiObj['hold'];
        pai.getChildByName('num').getComponent(cc.Sprite).spriteFrame = numRes;
        pai.getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = huase_bigRes;
        pai.getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = huase_smallRes;
        pai.hold = hold;
    },
    showBeiPai: function showBeiPai(num) {
        var self = this;
        if (!self._complete) return;
        self._complete.active = true;
        for (var i in self._complete.children) {
            if (i < num) {
                self._complete.children[i].active = true;
            } else {
                self._complete.children[i].active = false;
            }
        }
    },
    showQiangZhuText: function showQiangZhuText(beishu) {
        var self = this;
        if (!self._qiangzhuText) return;
        self._qiangzhuText.active = true;
        for (var i in self._qiangzhuText.children) {
            if (i == beishu) {
                self._qiangzhuText.children[i].active = true;
            } else {
                self._qiangzhuText.children[i].active = false;
            }
        }
    },
    hideQiangZhuText: function hideQiangZhuText() {
        var self = this;
        if (!self._qiangzhuText) return;
        self._qiangzhuText.active = false;
    },
    showZhuang: function showZhuang() {
        //庄的显示
        var self = this;
        if (!self._douniu_zhu) return;
        self._douniu_zhu.active = true;
    },
    hideZhuang: function hideZhuang() {
        //隐藏庄
        var self = this;
        if (!self._douniu_zhu) return;
        self._douniu_zhu.active = false;
    },
    showXiaBei: function showXiaBei(data) {
        //下注
        var self = this;
        if (!self._xiabei) return;
        self._xiabei.active = true;
        var maxBeishu = data.maxXiaZhuBeiShu;
        var xiaZhuOps = data.xiaZhuOps;
        for (var i in self._xiabei.children) {
            var temp = self._xiabei.children[i];
            if (xiaZhuOps[i] <= maxBeishu) {
                temp.opacity = 255;
            } else {
                temp.opacity = 128;
            }
            temp.getChildByName('num').getComponent(cc.Label).string = xiaZhuOps[i] + "倍";
        }
    },
    hideXiaBei: function hideXiaBei() {
        var self = this;
        if (!self._xiabei) return;
        self._xiabei.active = false;
    },
    showYouShi: function showYouShi() {
        var self = this;
        if (!self._youshi) return;
        self._youshi.active = true;
    },
    hideYouShi: function hideYouShi() {
        var self = this;
        if (!self._youshi) return;
        self._youshi.active = false;
    },
    showCount: function showCount() {
        var self = this;
        if (!self._count) return;
        self._count.active = true;
        for (var i in self._count.children) {
            self._count.children[i].active = false;
        }
    },
    hideCount: function hideCount() {
        var self = this;
        if (!self._count) return;
        self._count.active = false;
    },
    setCount: function setCount(num, nodeName) {
        var self = this;
        if (!self._count) return;
        var index = null;
        for (var i in self._count.children) {
            if (i > 2) continue;
            var temp = self._count.children[i];
            if (temp.active == false) {
                index = i;
                break;
            }
        }
        if (index == null) return;
        var child = self._count.children[index];
        child.active = true;
        child.nodeName = nodeName;
        if (num > 9) {
            num = 9;
        }
        child.num = num;
        for (var i in child.children) {
            var temp = child.children[i];
            if (i == num) {
                temp.active = true;
            } else {
                temp.active = false;
            }
        }
        if (index == 2) {
            //如果前三个填满了，则在第四格算出
            var num0 = parseInt(self._count.children[0].num);
            var num1 = parseInt(self._count.children[1].num);
            var num2 = parseInt(self._count.children[2].num);
            var total_num = num0 + num1 + num2 + 3; //+3算出真实的值
            var total_num_shi = Math.floor(total_num / 10); //十位数
            var total_num_ge = total_num % 10; //个位数
            self._count.getChildByName('result').active = true;
            //子元素先全部隐藏
            var result = self._count.getChildByName('result').children;
            for (var i in result) {
                result[i].active = false;
            }
            //分类显示
            if (total_num > 9) {
                var index_shi = total_num_shi - 1;
                var index_ge = total_num_ge;
                var n9 = result[9];
                n9.active = true;
                //n9的子元素
                for (var j in n9.children) {
                    var child_n9 = n9.children[j];
                    for (var k in child_n9.children) {
                        if (j == 0 && k == index_shi) {
                            //显示十位数
                            child_n9.children[k].active = true;
                        } else if (j == 1 && k == index_ge) {
                            //显示个位数
                            child_n9.children[k].active = true;
                        } else {
                            child_n9.children[k].active = false;
                        }
                    }
                }
            } else {
                var index_ge = total_num_ge - 1;
                result[index_ge].active = true;
            }
        }
    },
    unsetCount: function unsetCount(nodeName) {
        var self = this;
        if (!self._count) return;
        var index = null;
        for (var i in self._count.children) {
            var temp = self._count.children[i];
            if (temp.nodeName == nodeName) {
                index = i;
            }
        }
        if (index == null) return;
        self._count.children[index].active = false;
        self._count.getChildByName('result').active = false;
    },
    showBeiShuText: function showBeiShuText(beishu) {
        var self = this;
        if (!self._beishuText || !beishu) return;
        self._beishuText.active = true;
        var num0 = Math.floor(parseInt(beishu) / 10);
        var num1 = parseInt(beishu) % 10;
        var num0_arr = self._beishuText.getChildByName('num0').children;
        var num1_arr = self._beishuText.getChildByName('num1').children;
        for (var i in num0_arr) {
            var temp = num0_arr[i];
            if (i == num0) {
                temp.active = true;
            } else {
                temp.active = false;
            }
        }
        for (var i in num1_arr) {
            var temp = num1_arr[i];
            if (i == num1) {
                temp.active = true;
            } else {
                temp.active = false;
            }
        }
    },
    hideBeiShuText: function hideBeiShuText() {
        var self = this;
        if (!self._beishuText) return;
        self._beishuText.active = false;
    },
    getNiuArr: function getNiuArr() {
        var self = this;
        if (!self._count) return;
        var niu_arr = [];
        for (var i in self._count.children) {
            var niu = self._count.children[i].num;
            if (i > 2 || !niu) return;
            niu_arr.push(niu);
        }
        return niu_arr;
    },
    snEnd: function snEnd() {
        //算牛结束，隐藏count界面，显示已完成
        var self = this;
        if (self._count) {
            self._count.active = false;
        }
        if (self._pai) {
            self._pai.active = false;
            for (var i in self._pai.children) {
                var child = self._pai.children[i];
                child.isClicked = false;
                child.y = -9;
            }
        }
        if (self._youshi) {
            self._youshi.active = false;
        }
        self._complete.active = true;
        for (var i in self._complete.children) {
            self._complete.children[i].active = true;
        }
    },
    changeMoney: function changeMoney(money) {
        if (!this._diff_money) return;
        var old_money = this._score;
        var diff_money = parseInt(money) - parseInt(old_money);
        if (diff_money > 0) {
            diff_money = "+" + diff_money;
        }
        this._diff_money.string = diff_money;
        this._diff_money.node.active = true;
        this._diff_money.node.opacity = 255;
        this.setMoney(money);
        var action = cc.fadeOut(2);
        this._diff_money.node.runAction(action);
    },
    showLastPai: function showLastPai(spriteFrames, score) {
        var self = this;
        if (self._lastpai) {
            self._lastpai.active = true;
            for (var i in self._lastpai.children) {
                if (i <= 4) {
                    //牌
                    var pai = self._lastpai.children[i];
                    var paiObj = spriteFrames[i];
                    if (paiObj) {
                        //如果有资源则显示，没有则隐藏
                        pai.active = true;
                        self.setPai(pai, paiObj);
                    } else {
                        pai.active = false;
                    }
                } else if (i == 6) {
                    //结果，“十带一”之类
                    var jieguo = self._lastpai.children[i];
                    if (score) {
                        jieguo.active = true;
                        for (var j in jieguo.children) {
                            var temp = jieguo.children[j];
                            temp.active = false;
                        }
                        if (score[3] == '1') {
                            //没有牛
                            jieguo.getChildByName('san').active = true;
                        } else if (score[3] == '4') {
                            //单牛
                            var index = parseInt(score[0]);
                            jieguo.getChildByName('jg' + index).active = true;
                        } else if (score[3] == '5') {
                            //双牛
                            jieguo.getChildByName('jg0').active = true;
                        } else if (score[3] == '6') {
                            //炸弹
                            jieguo.getChildByName('zhadan').active = true;
                        } else if (score[3] == '7') {
                            //五花
                            jieguo.getChildByName('wuhua').active = true;
                        } else if (score[3] == '8') {
                            //五小
                            jieguo.getChildByName('wuxiao').active = true;
                        }
                    } else {
                        jieguo.active = false;
                    }
                }
            }
        }
        if (this._complete) {
            this._complete.active = false;
        }
    },
    hideLastPai: function hideLastPai() {
        if (this._lastpai) {
            this._lastpai.active = false;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._lastChatTime > 0) {
            this._lastChatTime -= dt;
            if (this._lastChatTime < 0) {
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
        if (this._time > 0) {
            this._time -= dt;
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }
            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    }
});

cc._RFpop();
},{}],"dzpkAll":[function(require,module,exports){
"use strict";
cc._RFpush(module, '08e464wYzRBLqPzfOdEMOZs', 'dzpkAll');
// scripts/dzpk/dzpkAll.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _seats: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null,
        paigroup: {
            default: null,
            type: cc.SpriteAtlas
        },
        back: cc.Node,
        fanhui: cc.Node,
        bg: cc.Node,
        backAlert: cc.Node,
        backAlert_no: cc.Node,
        fan: cc.Node,
        jinbi: cc.Node,
        countdown: cc.Label,
        win: cc.Node,
        lose: cc.Node,
        _pai: null,
        _pais: [],
        _text: null,
        _zongzhu: null,
        _btnFirst: null,
        _btnSecond: null,
        _btnThird: null,
        _Checkbox: [],
        _secondLeft: [],
        _secondOther: [],
        _thirdLeft: [],
        _thirdOther: [],
        _thirdAllIn: null,
        _thirdJiazhu: null,
        _jiaZhu: null,
        _jiaZhu_cover: null,
        _timeout: null,
        timerCounter: 0
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        for (var i = 0; i < 5; i++) {
            this._seats.push(cc.find("Canvas/seat" + i).getComponent("dzpkSeat"));
        }
        this._timeLabel = cc.find("Canvas/time").getComponent(cc.Label);
        this._tips = cc.find("Canvas/tips").getComponent(cc.Label);
        this._difen = cc.find("Canvas/difen").getComponent(cc.Label);
        this._zongzhu = cc.find("Canvas/zongxiazhu/label").getComponent(cc.Label);
        this._text = cc.find("Canvas/text0").getComponent(cc.Label);
        this._text.string = "白手起家(6人)：" + cc.vv.NetMgr.consume_num + "/" + 2 * cc.vv.NetMgr.consume_num + " 扑克牌：5-A 限注(1倍底池)";
        this._pai = cc.find("Canvas/pai");
        for (var i = 0; i < this._pai.childrenCount; i++) {
            this._pais[i] = this._pai.getChildByName("pai" + i);
        };
        this._pai.active = false;
        this._difen.node.active = true;
        this._btnFirst = cc.find("Canvas/buttons/first");
        this._btnSecond = cc.find("Canvas/buttons/second");
        this._btnThird = cc.find("Canvas/buttons/third");
        this._btnThird.active = false;
        this._btnSecond.active = false;
        this._btnFirst.active = false;
        for (var i = 0; i < this._btnFirst.childrenCount; i++) {
            this._Checkbox[i] = this._btnFirst.children[i];
            this._Checkbox[i].getChildByName('button').index = i;
            cc.vv.utils.addClickEvent(this._Checkbox[i].getChildByName('button'), this.node, "dzpkAll", "onBtnClicked");
        };
        for (var i = 0; i < 3; i++) {
            this._secondLeft[i] = this._btnSecond.getChildByName('dichi' + i);
            this._secondLeft[i].index = i;
            cc.vv.utils.addClickEvent(this._secondLeft[i], this.node, "dzpkAll", "onBtnClicked");
        };
        for (var i = 0; i < 3; i++) {
            this._secondOther[i] = this._btnSecond.getChildByName('dichi_cover' + i);
            this._secondOther[i].index = i;
        };
        for (var i = 0; i < 5; i++) {
            this._thirdLeft[i] = this._btnThird.getChildByName('tnum' + i);
            this._thirdLeft[i].index = i;
            cc.vv.utils.addClickEvent(this._thirdLeft[i], this.node, "dzpkAll", "onBtnClicked");
        };
        for (var i = 0; i < 5; i++) {
            this._thirdOther[i] = this._btnThird.getChildByName('tnum_cover' + i);
            this._thirdOther[i].index = i;
        };
        this._thirdJiazhu = this._btnThird.getChildByName('tjiazhu');
        cc.vv.utils.addClickEvent(this._thirdJiazhu, this.node, "dzpkAll", "onBtnClicked");
        this._thirdAllIn = this._btnThird.getChildByName('select').getChildByName('quanxia');
        cc.vv.utils.addClickEvent(this._thirdAllIn, this.node, "dzpkAll", "onBtnClicked");
        this._genPai = this._btnSecond.getChildByName('genpai');
        this._rangPai = this._btnSecond.getChildByName('rangpai');
        this._qiPai = this._btnSecond.getChildByName('qipai');
        this._jiaZhu = this._btnSecond.getChildByName('jiazhu');
        this._jiaZhu_cover = this._btnSecond.getChildByName('jiazhu_cover');
        cc.vv.utils.addClickEvent(this._genPai, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._rangPai, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._qiPai, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._jiaZhu, this.node, "dzpkAll", "onBtnClicked");
        this.addComponent("ReConnect");
        cc.vv.utils.addClickEvent(this.back, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fanhui, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fan, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.bg, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.backAlert_no, this.node, "dzpkAll", "onBtnClicked");
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        cc.vv.net.send("ready");
        if (cc.vv.userMgr.reconnection == 1) {
            //断线重连
            cc.vv.userMgr.reconnection = 0;
            cc.vv.net.send("getGameInfoByUserid");
        }
        cc.vv.audioMgr.playBGM("back.mp3");
        cc.vv.net.send("getUserHolds");
    },
    initView: function initView() {
        this._tips.node.active = true;
        this._zongzhu.string = 0;
        this._difen.string = "底池：" + 0;
        this._difen.money = 0;
    },
    restart: function restart() {
        if (this._zongzhu) this._zongzhu.string = 0;
        if (this._difen) {
            this._difen.string = "底池：" + 0;
            this._difen.money = 0;
        }
        this.win.active = false;
        this.lose.active = false;
        this._pai.active = false;
        this._tips.node.active = true;
        var seats = cc.vv.NetMgr.seats;
        if (seats) {
            for (var i = 0; i < seats.length; ++i) {
                var index = cc.vv.NetMgr.getLocalIndexByUserId(seats[i].userid);
                this._seats[index].restart();
                this._seats[index].status = "";
            }
        }
        cc.vv.net.send("ready");
    },
    initSeats: function initSeats() {
        var seats = cc.vv.NetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.NetMgr.getLocalIndexByUserId(seat.userid);
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "back") {
            this.fanhui.active = true;
        }
        if (event.target.name == "bg") {
            this.fanhui.active = false;
            if (this._btnThird.active) {
                this._btnThird.active = false;
                this._btnSecond.active = true;
            }
        }
        if (event.target.name == "fan") {
            this.fanhui.active = false;
            this.backAlert.active = true;
        }
        if (event.target.name == "no") {
            this.fanhui.active = false;
            this.backAlert.active = false;
        }
        if (event.target.name == "button") {
            for (var i = 0; i < this._Checkbox.length; i++) {
                if (event.target.index == i) {
                    continue;
                } else {
                    this._Checkbox[i].getComponent("CheckBox").checked = false;
                    this._Checkbox[i].getComponent("CheckBox").refresh();
                }
            };
        }
        if (event.target.name == "rangpai") {
            cc.vv.net.send("rangpai");
        }
        if (event.target.name == "qipai") {
            cc.vv.net.send("qipai");
        }
        if (event.target.name == "genpai") {
            cc.vv.net.send("genpai", event.target.money);
        }
        if (event.target.name == "jiazhu") {
            this._btnThird.active = true;
            this._btnSecond.active = false;
        }
        if (event.target.name.indexOf('dichi') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
        if (event.target.name.indexOf('tnum') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
        if (event.target.name.indexOf('tjiazhu') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
        if (event.target.name.indexOf('quanxia') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
    },
    onBtnExit: function onBtnExit() {
        this.backAlert.active = false;
        cc.vv.net.send("exit");
    },
    onBtnExchange: function onBtnExchange() {
        this.backAlert.active = false;
        this.fanhui.active = false;
        cc.vv.userMgr.exchange = 1;
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.NetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            this._lastPlayTime = Date.now() + msgInfo.time;
            if (!cc.sys.isNative) {
                var serverid = msgInfo['msg'];
                window.downloadVoice(serverid);
                return;
            }
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
        }
    },
    //转换对应的牌
    ConversionCardRes: function ConversionCardRes(n) {
        var type = 4;
        var color = 1;
        if (n >= 13 && n < 26) {
            type = 3;
            n = n - 13;
            color = 2;
        } else if (n >= 26 && n < 39) {
            type = 2;
            n = n - 26;
        } else if (n >= 39 && n < 52) {
            type = 1;
            n = n - 39;
            color = 2;
        } else {
            type = 4;
        }
        var num = 0;
        num = n + 2;
        if (num == 14) {
            num = 1;
        }
        var data = {
            num: this.paigroup.getSpriteFrame(num + "-" + color),
            h_s: this.paigroup.getSpriteFrame("huase_small0" + type),
            h_b: this.paigroup.getSpriteFrame("huase_big0" + type)
        };
        return data;
    },
    showOtherSeat: function showOtherSeat(type) {
        var seats = cc.vv.NetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(seats[i].userid);
            if (type == 1) {
                this._seats[index].showBeiPai(true); //显示牌的背面
            }
            if (type == 2) {
                this._seats[index].showOps(); //隐藏其他桌子的操作icon
                this._seats[index].hideScore();
            }
        };
    },
    setBtnOps: function setBtnOps(type, obj) {
        if (type == 1) {
            this._btnFirst.active = false;
            this._btnThird.active = false;
            this._btnSecond.active = true;
            this._btnThird.getChildByName("select").getChildByName("slider").getChildByName("Handle").y = -172;
        }
        if (type == 2) {
            this._btnSecond.active = false;
            this._btnFirst.active = true;
            this._btnThird.active = false;
            this._Checkbox[1].active = true;
            this._Checkbox[2].active = false;
            this._Checkbox[3].active = true;
            this._Checkbox[4].active = false;
        }
        if (type == 3) {
            this._btnThird.active = true;
            this._btnSecond.active = false;
            this._btnFirst.active = false;
        }
        if (type == 4) {
            this._btnThird.active = false;
            this._btnSecond.active = false;
            this._btnFirst.active = false;
        }
        if (type == 5) {
            for (var i = 0; i < this._thirdLeft.length; i++) {
                this._thirdLeft[i].getChildByName('num').getComponent(cc.Label).string = obj[i];
                this._thirdLeft[i].money = obj[i];
                this._thirdOther[i].getChildByName('num').getComponent(cc.Label).string = obj[i];
            }
        }
        if (obj && type != 5) {
            if (obj.canGen) {
                this._genPai.active = true;
                this._rangPai.active = false;
                this._genPai.money = obj.GenMoney;
                this._genPai.getChildByName('num').getComponent(cc.Label).string = "跟" + obj.GenMoney;
                if (obj.needAllIn) {
                    this._genPai.getChildByName('num').getComponent(cc.Label).string = "全下";
                    this._jiaZhu.active = false;
                    this._jiaZhu_cover.active = true;
                } else {
                    this._jiaZhu.active = true;
                    this._jiaZhu_cover.active = false;
                }
            } else {
                this._genPai.active = false;
                this._rangPai.active = true;
                this._jiaZhu_cover.active = false;
            }
            for (var i = 0; i < 3; i++) {
                this._secondLeft[i].getChildByName('title').getComponent(cc.Label).string = obj.extraAddOps[i].desc;
                this._secondLeft[i].money = obj.extraAddOps[i].money;
                this._secondOther[i].getChildByName('title').getComponent(cc.Label).string = obj.extraAddOps[i].desc;
                if (obj.addMaxMoney >= obj.extraAddOps[i].money) {
                    this._secondLeft[i].active = true;
                    this._secondOther[i].active = false;
                } else {
                    this._secondLeft[i].active = false;
                    this._secondOther[i].active = true;
                }
                if (obj.needAllIn && this._genPai.money < obj.extraAddOps[i].money) {
                    this._secondLeft[i].active = false;
                    this._secondOther[i].active = true;
                }
            }
            for (var i = 0; i < 5; i++) {
                if (obj.addMaxMoney >= this._thirdLeft[i].money && obj.addMinMoney <= this._thirdLeft[i].money) {
                    this._thirdLeft[i].active = true;
                    this._thirdOther[i].active = false;
                } else {
                    this._thirdLeft[i].active = false;
                    this._thirdOther[i].active = true;
                }
            };
        }
    },
    refreshFirstBtn: function refreshFirstBtn(data) {
        if (parseInt(data.argStatus) == 1) {
            this._Checkbox[1].active = false;
            this._Checkbox[2].getChildByName("text").getComponent(cc.Label).string = "跟" + data.genMoney;
            this._Checkbox[1].getComponent("CheckBox").checked = false;
            this._Checkbox[1].getComponent("CheckBox").refresh();
            this._Checkbox[2].active = true;
        } else if (parseInt(data.argStatus) == 2) {
            this._Checkbox[1].active = false;
            this._Checkbox[2].active = true;
            this._Checkbox[2].getChildByName("text").getComponent(cc.Label).string = "全下";
            this._Checkbox[3].active = false;
            this._Checkbox[4].active = true;
            this._Checkbox[1].getComponent("CheckBox").checked = false;
            this._Checkbox[1].getComponent("CheckBox").refresh();
            this._Checkbox[3].getComponent("CheckBox").checked = false;
            this._Checkbox[3].getComponent("CheckBox").refresh();
        } else {
            this._Checkbox[1].active = true;
            this._Checkbox[2].active = false;
            this._Checkbox[3].active = true;
            this._Checkbox[4].active = false;
        }
        this._Checkbox[2].money = data.genMoney;
        this._Checkbox[2].getComponent("CheckBox").checked = false;
        this._Checkbox[2].getComponent("CheckBox").refresh();
    },
    prepOps: function prepOps(data) {
        for (var i = 0; i < this._btnFirst.childrenCount; i++) {
            if (this._Checkbox[i].getComponent("CheckBox").checked) {
                if (i == 0 && data.canGuo) {
                    cc.vv.net.send("rangpai");
                } else if (i == 0 && !data.canGuo) {
                    cc.vv.net.send("qipai");
                }
                if (i == 1 && data.canGuo) {
                    cc.vv.net.send("rangpai");
                }
                if (i == 2 && data.canGen) {
                    cc.vv.net.send("genpai");
                    // cc.vv.net.send("jiazhu", this._Checkbox[i].money);
                }
                if (i == 3 && data.canGen) {
                    cc.vv.net.send("genpai", this._Checkbox[2].money);
                }
                this._Checkbox[i].getComponent("CheckBox").checked = false;
                this._Checkbox[i].getComponent("CheckBox").refresh();
            }
        }
    },
    unchecked: function unchecked() {
        for (var i = 0; i < this._btnFirst.childrenCount; i++) {
            this._Checkbox[i].getComponent("CheckBox").checked = false;
            this._Checkbox[i].getComponent("CheckBox").refresh();
        }
    },
    onSliderBack: function onSliderBack(event) {
        this._thirdAllIn.active = false;
        var num = 0;
        if (event.progress >= 0.1 && event.progress < 0.2) {
            num = 100;
        } else if (event.progress >= 0.2 && event.progress < 0.3) {
            num = 200;
        } else if (event.progress >= 0.3 && event.progress < 0.4) {
            num = 300;
        } else if (event.progress >= 0.4 && event.progress < 0.5) {
            num = 400;
        } else if (event.progress >= 0.5 && event.progress < 0.6) {
            num = 500;
        } else if (event.progress >= 0.6 && event.progress < 0.7) {
            num = 600;
        } else if (event.progress >= 0.7 && event.progress < 0.8) {
            num = 700;
        } else if (event.progress >= 0.8 && event.progress < 0.9) {
            num = 800;
        } else if (event.progress >= 0.9 && event.progress < 1) {
            num = 900;
        } else if (event.progress == 1) {
            if (this._seats[0]._score == this._thirdJiazhu.maxMoney) {
                this._thirdAllIn.active = true;
                this._thirdAllIn.money = this._thirdJiazhu.maxMoney;
            }
            num = 1000;
        }
        if (this._thirdJiazhu.firstMoney + num >= this._thirdJiazhu.maxMoney) {
            this._thirdJiazhu.money = this._thirdJiazhu.maxMoney;
        } else {
            this._thirdJiazhu.money = this._thirdJiazhu.firstMoney + num;
        }
        this._thirdJiazhu.getChildByName('label').getComponent(cc.Label).string = this._thirdJiazhu.money;
    },
    //断线重连刷新信息
    ReconnectionInfo: function ReconnectionInfo(data) {
        if (data.addOptions.length == 5) this.setBtnOps(5, data.addOptions);
        this._difen.string = "底池：" + data.diChi;
        this._difen.money = data.diChi;
        this._tips.node.active = false;
        if (data.circleHolds.length > 0) {
            for (var i = 0; i < data.circleHolds.length; i++) {
                var paiRes = this.ConversionCardRes(parseInt(data.circleHolds[i]));
                this._pais[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                this._pais[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                this._pais[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            if (this._pais[data.circleHolds.length - 1]) this._pais[data.circleHolds.length - 1].active = true;
            if (this._pais[data.circleHolds.length]) this._pais[data.circleHolds.length].active = false;
            if (this._pais[data.circleHolds.length + 1]) this._pais[data.circleHolds.length + 1].active = false;
            this._pai.active = true;
        }
        for (var i = 0; i < data.players.length; i++) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.players[i].userid);
            if (data.players[i].canOps) {
                cc.find('Canvas/seat' + index + '/toggle').active = true;
                this._seats[index].setTime(data.timer_Counter);
            } else {
                cc.find('Canvas/seat' + index + '/toggle').active = false;
            }
            var zhu = {
                money: data.players[i].cZhu,
                type: 1
            };
            this._seats[index].setZhu(zhu);
            this._seats[index].setMoney(data.players[i].money);
        }
        this.showOtherSeat(1);
        cc.vv.net.send("getUserInfoByUserid");
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.NetMgr.dataEventHandler = this.node;
        var self = this;
        this.node.on('new_user', function (data) {
            //新人加入房间
            self.initSingleSeat(data.detail);
        });
        this.node.on('game_begin', function (data) {
            var data = data.detail;
            self._tips.node.active = false;
            for (var i = 0; i < data.players.length; i++) {
                var seat = cc.vv.NetMgr.getSeatByID(data.players[i].userid);
                seat.score = data.players[i].money;
                var index = cc.vv.NetMgr.getLocalIndexByUserId(data.players[i].userid);
                var zhu = {
                    money: data.players[i].cZhu,
                    type: 1
                };
                self._seats[index].setZhu(zhu);
                self._seats[index].setMoney(seat.score);
            };
            if (data.gameInfo.addOptions.length == 5) self.setBtnOps(5, data.gameInfo.addOptions);
        });
        this.node.on('socket_MyHolds', function (data) {
            var data = data.detail;
            if (data) {
                if (!self._seats[0]._pai.active) {
                    self._tips.node.active = false;
                    self._seats[0].setPai(data, self);
                }
            }
        });
        this.node.on('game_diChiUpdate', function (data) {
            self._difen.string = "底池：" + data.detail;
            self._difen.money = data.detail;
        });
        this.node.on('game_myInfo', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].setPai(data.holds, self);
            self._seats[index].setMoney(data.money);
            self.showOtherSeat(1);
        });
        this.node.on('game_myTurn', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + index + '/toggle').active = true;
            self._seats[index].setTime();
            self.setBtnOps(1, data);
            self._thirdJiazhu.getChildByName('label').getComponent(cc.Label).string = data.addMinMoney;
            self._thirdJiazhu.money = data.addMinMoney;
            self._thirdJiazhu.firstMoney = data.addMinMoney;
            self._thirdJiazhu.maxMoney = data.addMaxMoney;
            self.prepOps(data);
        });
        this.node.on('game_turnChanged', function (data) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.detail);
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + index + '/toggle').active = true;
            self._seats[index].setTime();
            cc.find('Canvas/seat0/toggle').active = false;
            if (self._seats[0]._pai.active) {
                if (self._seats[0].status == "AllIn") {
                    self.setBtnOps(4);
                } else {
                    self.setBtnOps(2);
                }
            }
        });
        this.node.on('game_oneGuo', function (data) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.detail);
            cc.find('Canvas/seat' + index + '/toggle').active = false;
            self._seats[index].showOps('rangpai');
            if (self._seats[0]._pai.active) {
                self.setBtnOps(2);
            }
        });
        this.node.on('game_oneGen', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].showOps('genpai');
            var d = {
                money: data.cZhu,
                type: 1
            };
            self._seats[index].setMoney(data.money);
            self._seats[index].setZhu(d);
            if (self._seats[0]._pai.active) {
                self.setBtnOps(2);
            }
        });
        this.node.on('game_oneAdd', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].showOps('jiazhu');
            var d = {
                money: data.cZhu,
                type: 1
            };
            self._seats[index].setMoney(data.money);
            self._seats[index].setZhu(d);
            if (self._seats[0]._pai.active) {
                self.setBtnOps(2);
            }
        });
        this.node.on('game_oneAllIn', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].showOps('quanxia');
            var d = {
                money: data.cZhu,
                type: 1
            };
            self._seats[index].setMoney(data.money);
            self._seats[index].setZhu(d);
            self._seats[index].status = data.status;
            if (self._seats[0]._pai.active) {
                if (cc.vv.userMgr.userId == data.userid) {
                    self.setBtnOps(4);
                }
            }
        });
        this.node.on('game_oneQuit', function (data) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.detail);
            cc.find('Canvas/seat' + index + '/toggle').active = false;
            self._seats[index].showOps('qipai');
            self._seats[index].showBeiPai(false);
            if (cc.vv.userMgr.userId == data.detail) self.setBtnOps(4);
        });
        this.node.on('game_playersInNewCircle', function (data) {
            var data = data.detail;
            for (var i = 0; i < data.length; i++) {
                var seat = cc.vv.NetMgr.getSeatByID(data[i].userid);
                if (seat) {
                    seat.score = data.money;
                    var index = cc.vv.NetMgr.getLocalIndexByUserId(data[i].userid);
                    cc.find('Canvas/seat' + index + '/toggle').active = false;
                    if (self._seats[index].status != "AllIn") self._seats[index].showOps();
                    self._seats[index].setMoney(data[i].money);
                    var d = {
                        money: data[i].cZhu,
                        type: 1
                    };
                    self._seats[index].setZhu(d);
                    if (self._seats[index]._paimian && !self._seats[index]._paimian.active) {
                        self._seats[index].hideScore();
                    }
                    if (self._seats[0]._pai.active) {
                        if (self._seats[index].status == "AllIn") {
                            self.setBtnOps(4);
                        } else {
                            self.setBtnOps(2);
                        }
                    } else {
                        self._seats[0].hideScore();
                    }
                }
            };
        });
        this.node.on('game_newCircle', function (data) {
            self._zongzhu.string = self._difen.money;
            var data = data.detail;
            for (var i = 0; i < data.circleHolds.length; i++) {
                var paiRes = self.ConversionCardRes(parseInt(data.circleHolds[i]));
                self._pais[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                self._pais[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                self._pais[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            if (self._pais[data.circleHolds.length - 1]) self._pais[data.circleHolds.length - 1].active = true;
            if (self._pais[data.circleHolds.length]) self._pais[data.circleHolds.length].active = false;
            if (self._pais[data.circleHolds.length + 1]) self._pais[data.circleHolds.length + 1].active = false;
            self._pai.active = true;
        });
        this.node.on('game_caculateResult', function (data) {
            cc.find('Canvas/seat0/toggle').active = false;
        });
        this.node.on('game_myARGStatusChanged', function (data) {
            self.refreshFirstBtn(data.detail);
        });
        this.node.on('game_gameInfoById', function (data) {
            self.ReconnectionInfo(data.detail);
        });
        this.node.on('game_userInfoById', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].setPai(data.holds, self);
            if (data.canOps) {
                self.setBtnOps(1, data);
            } else {
                self.setBtnOps(2, data);
            }
            self._thirdJiazhu.getChildByName('label').getComponent(cc.Label).string = data.addMinMoney;
            self._thirdJiazhu.money = data.addMinMoney;
            self._thirdJiazhu.firstMoney = data.addMinMoney;
            self._thirdJiazhu.maxMoney = data.addMaxMoney;
            self.prepOps(data);
        });
        this.node.on('game_winner', function (data) {
            self.win.active = true;
        });
        this.node.on('game_loser', function (data) {
            self.lose.active = true;
        });
        this.node.on('game_over', function (data) {
            var data = data.detail;
            self.showOtherSeat(2);
            for (var i = 0; i < data.length; i++) {
                var seat = cc.vv.NetMgr.getSeatByID(data[i].userid);
                if (seat) {
                    seat.score = data[i].money;
                    var index = cc.vv.NetMgr.getLocalIndexByUserId(data[i].userid);
                    self._seats[index].showHoldsPai(data[i].holds, self);
                    self._seats[index].setMoney(data[i].money);
                    if (data[i].isWinner) {
                        self._seats[index].showWinText(parseInt(data[i].score[0]));
                    } else {
                        self._seats[index].showWinText();
                    }
                }
            }
            self.setBtnOps(4);
            self._timeout = setTimeout(function () {
                self.restart();
            }, 3000);
        });
        this.node.on('user_state_changed', function (data) {
            var seat = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(seat.userid);
            self._seats[index].seatHide();
        });
        this.node.on('exit_result', function (data) {
            clearInterval(self._timeout);
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.NetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.NetMgr.getLocalIndex(idx);
            var index = data.content;
            var info = cc.vv.zjhchat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.NetMgr.getLocalIndex(idx);
            self._seats[localIdx].emoji(data.content);
        });
        this.node.on('count_down', function (data) {
            var data = data.detail;
            self.countdown.string = data.countDown;
            self.countdown.node.active = true;
            if (data.countDown <= 0) {
                self.countdown.node.active = false;
            }
        });
        this.node.on('exit_room', function (data) {
            //刷新用户钱币数量
            self.getGemsAndCoins();
        });
    },
    //设置金币钻石数量
    getGemsAndCoins: function getGemsAndCoins() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
    },
    onPlayerOver: function onPlayerOver() {
        if (!cc.sys.isNative) {
            window.stopPlayVoice();
        };
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (window.voice && window.voice.localId != null) {
            var localId = window.voice.localId;
            window.voice.localId = null;
            cc.vv.audioMgr.pauseAll();
            window.playVoice(localId);
        }
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;
            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }
        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    }
});

cc._RFpop();
},{}],"dzpkSeat":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'c3d5fiQArFKY7H29sGP47FH', 'dzpkSeat');
// scripts/dzpk/dzpkSeat.js

"use strict";

var _properties;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

cc.Class({
    extends: cc.Component,
    properties: (_properties = {
        _sprIcon: null,
        _ready: null,
        _lblName: null,
        _lblScore: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _isOffline: false,
        _userId: null,
        _time: -1,
        _op: null,
        _pai: null,
        _pais: [],
        _pai1: null,
        _pais1: [],
        _paimian: null,
        _timeLabel: null
    }, _defineProperty(_properties, "_time", -1), _defineProperty(_properties, "_toggle", null), _properties),
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("head").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("money").getComponent(cc.Label);
        this._op = this.node.getChildByName("text");
        this._xiazhu = this.node.getChildByName("xiazhu").getChildByName("money").getComponent(cc.Label);
        this._pai = this.node.getChildByName("pai");
        this._pai1 = this.node.getChildByName("jieguo");
        if (this._pai) {
            for (var i = 0; i < this._pai.childrenCount; i++) {
                this._pais[i] = this._pai.getChildByName("pai" + i);
            };
        }
        if (this._pai1) {
            for (var i = 0; i < this._pai1.childrenCount; i++) {
                this._pais1[i] = this._pai1.getChildByName("pai" + i);
            };
        }
        this._paimian = this.node.getChildByName("paimian");
        this._chatBubble = this.node.getChildByName("ChatBubble");
        this._emoji = this.node.getChildByName("emoji");
        this._count = this.node.getChildByName('count');
        this._op.active = false;
        this._xiazhu.string = 0;
        if (this._pai) this._pai.active = false;
        if (this._paimian) this._paimian.active = false;
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
        this._toggle = this.node.getChildByName("toggle");
        this._timeLabel = this.node.getChildByName("toggle").getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        this.refresh();
    },
    refresh: function refresh() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._chatBubble) {
            this._chatBubble.active = false;
        }
        if (this._emoji) {
            this._emoji.active = false;
        }
        if (this._paimian) this._paimian.active = false;
        if (this._pai) this._pai.active = false;
        if (this._pai1) this._pai1.active = false;
        this.node.active = this._userName != null && this._userName != "";
    },
    restart: function restart() {
        if (this._paimian) this._paimian.active = false;
        if (this._pai) this._pai.active = false;
        if (this._pai1) this._pai1.active = false;
        if (this._op) this._op.active = false;
        if (this._lblName) this._lblName.node.active = true;
        this.node.getChildByName("cover").active = false;
        this.node.getChildByName("xiazhu").active = false;
    },
    setInfo: function setInfo(name, score) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        this.refresh();
    },
    hideScore: function hideScore() {
        this.node.getChildByName("xiazhu").active = false;
    },
    setZhu: function setZhu(data) {
        if (!this.node.getChildByName("xiazhu").active) this.node.getChildByName("xiazhu").active = true;
        if (data.type == 1) {
            this._xiazhu.string = data.money;
        } else {
            this._xiazhu.string = parseInt(this._xiazhu.string) + data.money;
        }
    },
    seatHide: function seatHide() {
        this.node.active = false;
        this._xiazhu.string = 0;
        this.node.getChildByName("xiazhu").active = false;
        this._op.active = false;
        this._userName = "";
        for (var i = 0; i < this._op.childrenCount; i++) {
            this._op.children[i].active = false;
        }
    },
    setReady: function setReady(isReady) {
        this._isReady = isReady;
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
    },
    setID: function setID(id) {
        var idNode = this.node.getChildByName("id");
        if (idNode) {
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;
        }
        this._userId = id;
        if (this._sprIcon) {
            this._sprIcon.setUserID(id);
        }
    },
    getID: function getID() {
        return this._userId;
    },
    chat: function chat(content) {
        if (this._chatBubble == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function emoji(_emoji) {
        if (this._emoji == null) {
            return;
        }
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(_emoji);
        this._lastChatTime = 3;
    },
    voiceMsg: function voiceMsg(show) {
        if (this._voicemsg) {
            this._voicemsg.active = show;
        }
    },
    showAnim: function showAnim(callback) {
        var x = this._lblScore.node.x; //起始点X
        var y = this._lblScore.node.y; //起始点Y
        var endX = this._xiazhu.node.x;
        var endY = this._xiazhu.node.y;
    },
    showOps: function showOps(type) {
        if (!this._op) return;
        if (type) {
            this._op.active = true;
            for (var i = 0; i < this._op.childrenCount; i++) {
                if (this._op.children[i].name == type) {
                    this._op.children[i].active = true;
                } else {
                    this._op.children[i].active = false;
                }
            };
            if (type == "qipai") {
                this.node.getChildByName("cover").active = true;
            }
            this._lblName.node.active = false;
        } else {
            if (this._op.getChildByName("qipai").active) {
                this._lblName.node.active = false;
            } else {
                this._lblName.node.active = true;
                this._op.active = false;
            }
        }
    },
    setPai: function setPai(data, parent) {
        if (data.length == 2 && this._pais.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var paiRes = parent.ConversionCardRes(parseInt(data[i]));
                this._pais[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                this._pais[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                this._pais[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            this._pai.active = true;
        }
    },
    showHoldsPai: function showHoldsPai(data, parent) {
        if (data.length == 2 && this._pais1) {
            for (var i = 0; i < data.length; i++) {
                var paiRes = parent.ConversionCardRes(parseInt(data[i]));
                this._pais1[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                this._pais1[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                this._pais1[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            this._pai1.active = true;
            if (this._paimian) this._paimian.active = false;
            if (this._pai) this._pai.active = false;
        }
    },
    showWinText: function showWinText(type) {
        var title = "";
        switch (type) {
            case 9:
                title = "皇家同花顺赢";
                break;
            case 8:
                title = "同花顺赢";
                break;
            case 7:
                title = "金刚赢";
                break;
            case 6:
                title = "葫芦赢";
                break;
            case 5:
                title = "同花赢";
                break;
            case 4:
                title = "顺子赢";
                break;
            case 3:
                title = "三条赢";
                break;
            case 2:
                title = "双对赢";
                break;
            case 1:
                title = "一对赢";
                break;
            case 0:
                title = "高牌赢";
                break;
        }
        if (title == "") {
            this.node.getChildByName("cover").active = true;
            this._lblName.node.active = true;
        } else {
            if (this._pai1.active) {
                this._lblName.node.active = false;
            } else {
                this._lblName.node.active = true;
            }
        }
        this._pai1.getChildByName("text").getComponent(cc.Label).string = title;
        this.node.getChildByName("xiazhu").active = false;
    },
    showBeiPai: function showBeiPai(flag) {
        if (!this._paimian) return;
        this._paimian.active = flag;
    },
    setMoney: function setMoney(data) {
        //设置该玩家所拥有的的钱
        this._lblScore.string = data;
        this._score = data;
    },
    setTime: function setTime(o) {
        if (o) {
            this._time = o;
        } else {
            this._time = 30;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._lastChatTime > 0) {
            this._lastChatTime -= dt;
            if (this._lastChatTime < 0) {
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
        if (this._time > 0) {
            this._time -= dt;
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }
            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    }
});

cc._RFpop();
},{}],"socket-io":[function(require,module,exports){
(function (global){
"use strict";
cc._RFpush(module, '393290vPc1IIYfh8FrmxcNZ', 'socket-io');
// scripts/3rdparty/socket-io.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (!CC_JSB && !cc.sys.isNative) {
	(function (f) {
		if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && typeof module !== "undefined") {
			module.exports = f();
		} else if (typeof define === "function" && define.amd) {
			define([], f);
		} else {
			var g;
			if (typeof window !== "undefined") {
				g = window;
			} else if (typeof global !== "undefined") {
				g = global;
			} else if (typeof self !== "undefined") {
				g = self;
			} else {
				g = this;
			}
			g.io = f();
		}
	})(function () {
		var define, module, exports;
		return function e(t, n, r) {
			function s(o, u) {
				if (!n[o]) {
					if (!t[o]) {
						var a = typeof require == "function" && require;
						if (!u && a) return a(o, !0);
						if (i) return i(o, !0);
						var f = new Error("Cannot find module '" + o + "'");
						throw f.code = "MODULE_NOT_FOUND", f;
					}
					var l = n[o] = {
						exports: {}
					};
					t[o][0].call(l.exports, function (e) {
						var n = t[o][1][e];
						return s(n ? n : e);
					}, l, l.exports, e, t, n, r);
				}
				return n[o].exports;
			}
			var i = typeof require == "function" && require;
			for (var o = 0; o < r.length; o++) {
				s(r[o]);
			}return s;
		}({
			1: [function (_dereq_, module, exports) {

				module.exports = _dereq_('./lib/');
			}, {
				"./lib/": 2
			}],
			2: [function (_dereq_, module, exports) {

				module.exports = _dereq_('./socket');

				/**
     * Exports parser
     *
     * @api public
     *
     */
				module.exports.parser = _dereq_('engine.io-parser');
			}, {
				"./socket": 3,
				"engine.io-parser": 19
			}],
			3: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * Module dependencies.
      */

					var transports = _dereq_('./transports');
					var Emitter = _dereq_('component-emitter');
					var debug = _dereq_('debug')('engine.io-client:socket');
					var index = _dereq_('indexof');
					var parser = _dereq_('engine.io-parser');
					var parseuri = _dereq_('parseuri');
					var parsejson = _dereq_('parsejson');
					var parseqs = _dereq_('parseqs');

					/**
      * Module exports.
      */

					module.exports = Socket;

					/**
      * Noop function.
      *
      * @api private
      */

					function noop() {}

					/**
      * Socket constructor.
      *
      * @param {String|Object} uri or options
      * @param {Object} options
      * @api public
      */

					function Socket(uri, opts) {
						if (!(this instanceof Socket)) return new Socket(uri, opts);

						opts = opts || {};

						if (uri && 'object' == (typeof uri === "undefined" ? "undefined" : _typeof(uri))) {
							opts = uri;
							uri = null;
						}

						if (uri) {
							uri = parseuri(uri);
							opts.hostname = uri.host;
							opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
							opts.port = uri.port;
							if (uri.query) opts.query = uri.query;
						} else if (opts.host) {
							opts.hostname = parseuri(opts.host).host;
						}

						this.secure = null != opts.secure ? opts.secure : global.location && 'https:' == location.protocol;

						if (opts.hostname && !opts.port) {
							// if no port is specified manually, use the protocol default
							opts.port = this.secure ? '443' : '80';
						}

						this.agent = opts.agent || false;
						this.hostname = opts.hostname || (global.location ? location.hostname : 'localhost');
						this.port = opts.port || (global.location && location.port ? location.port : this.secure ? 443 : 80);
						this.query = opts.query || {};
						if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
						this.upgrade = false !== opts.upgrade;
						this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
						this.forceJSONP = !!opts.forceJSONP;
						this.jsonp = false !== opts.jsonp;
						this.forceBase64 = !!opts.forceBase64;
						this.enablesXDR = !!opts.enablesXDR;
						this.timestampParam = opts.timestampParam || 't';
						this.timestampRequests = opts.timestampRequests;
						this.transports = opts.transports || ['polling', 'websocket'];
						this.readyState = '';
						this.writeBuffer = [];
						this.policyPort = opts.policyPort || 843;
						this.rememberUpgrade = opts.rememberUpgrade || false;
						this.binaryType = null;
						this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
						this.perMessageDeflate = false !== opts.perMessageDeflate ? opts.perMessageDeflate || {} : false;

						if (true === this.perMessageDeflate) this.perMessageDeflate = {};
						if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
							this.perMessageDeflate.threshold = 1024;
						}

						// SSL options for Node.js client
						this.pfx = opts.pfx || null;
						this.key = opts.key || null;
						this.passphrase = opts.passphrase || null;
						this.cert = opts.cert || null;
						this.ca = opts.ca || null;
						this.ciphers = opts.ciphers || null;
						this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;

						// other options for Node.js client
						var freeGlobal = (typeof global === "undefined" ? "undefined" : _typeof(global)) == 'object' && global;
						if (freeGlobal.global === freeGlobal) {
							if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
								this.extraHeaders = opts.extraHeaders;
							}
						}

						this.open();
					}

					Socket.priorWebsocketSuccess = false;

					/**
      * Mix in `Emitter`.
      */

					Emitter(Socket.prototype);

					/**
      * Protocol version.
      *
      * @api public
      */

					Socket.protocol = parser.protocol; // this is an int

					/**
      * Expose deps for legacy compatibility
      * and standalone browser access.
      */

					Socket.Socket = Socket;
					Socket.Transport = _dereq_('./transport');
					Socket.transports = _dereq_('./transports');
					Socket.parser = _dereq_('engine.io-parser');

					/**
      * Creates transport of the given type.
      *
      * @param {String} transport name
      * @return {Transport}
      * @api private
      */

					Socket.prototype.createTransport = function (name) {
						debug('creating transport "%s"', name);
						var query = clone(this.query);

						// append engine.io protocol identifier
						query.EIO = parser.protocol;

						// transport name
						query.transport = name;

						// session id if we already have one
						if (this.id) query.sid = this.id;

						var transport = new transports[name]({
							agent: this.agent,
							hostname: this.hostname,
							port: this.port,
							secure: this.secure,
							path: this.path,
							query: query,
							forceJSONP: this.forceJSONP,
							jsonp: this.jsonp,
							forceBase64: this.forceBase64,
							enablesXDR: this.enablesXDR,
							timestampRequests: this.timestampRequests,
							timestampParam: this.timestampParam,
							policyPort: this.policyPort,
							socket: this,
							pfx: this.pfx,
							key: this.key,
							passphrase: this.passphrase,
							cert: this.cert,
							ca: this.ca,
							ciphers: this.ciphers,
							rejectUnauthorized: this.rejectUnauthorized,
							perMessageDeflate: this.perMessageDeflate,
							extraHeaders: this.extraHeaders
						});

						return transport;
					};

					function clone(obj) {
						var o = {};
						for (var i in obj) {
							if (obj.hasOwnProperty(i)) {
								o[i] = obj[i];
							}
						}
						return o;
					}

					/**
      * Initializes transport to use and starts probe.
      *
      * @api private
      */
					Socket.prototype.open = function () {
						var transport;
						if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
							transport = 'websocket';
						} else if (0 === this.transports.length) {
							// Emit error on next tick so it can be listened to
							var self = this;
							setTimeout(function () {
								self.emit('error', 'No transports available');
							}, 0);
							return;
						} else {
							transport = this.transports[0];
						}
						this.readyState = 'opening';

						// Retry with the next transport if the transport is disabled (jsonp: false)
						try {
							transport = this.createTransport(transport);
						} catch (e) {
							this.transports.shift();
							this.open();
							return;
						}

						transport.open();
						this.setTransport(transport);
					};

					/**
      * Sets the current transport. Disables the existing one (if any).
      *
      * @api private
      */

					Socket.prototype.setTransport = function (transport) {
						debug('setting transport %s', transport.name);
						var self = this;

						if (this.transport) {
							debug('clearing existing transport %s', this.transport.name);
							this.transport.removeAllListeners();
						}

						// set up transport
						this.transport = transport;

						// set up transport listeners
						transport.on('drain', function () {
							self.onDrain();
						}).on('packet', function (packet) {
							self.onPacket(packet);
						}).on('error', function (e) {
							self.onError(e);
						}).on('close', function () {
							self.onClose('transport close');
						});
					};

					/**
      * Probes a transport.
      *
      * @param {String} transport name
      * @api private
      */

					Socket.prototype.probe = function (name) {
						debug('probing transport "%s"', name);
						var transport = this.createTransport(name, {
							probe: 1
						}),
						    failed = false,
						    self = this;

						Socket.priorWebsocketSuccess = false;

						function onTransportOpen() {
							if (self.onlyBinaryUpgrades) {
								var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
								failed = failed || upgradeLosesBinary;
							}
							if (failed) return;

							debug('probe transport "%s" opened', name);
							transport.send([{
								type: 'ping',
								data: 'probe'
							}]);
							transport.once('packet', function (msg) {
								if (failed) return;
								if ('pong' == msg.type && 'probe' == msg.data) {
									debug('probe transport "%s" pong', name);
									self.upgrading = true;
									self.emit('upgrading', transport);
									if (!transport) return;
									Socket.priorWebsocketSuccess = 'websocket' == transport.name;

									debug('pausing current transport "%s"', self.transport.name);
									self.transport.pause(function () {
										if (failed) return;
										if ('closed' == self.readyState) return;
										debug('changing transport and sending upgrade packet');

										cleanup();

										self.setTransport(transport);
										transport.send([{
											type: 'upgrade'
										}]);
										self.emit('upgrade', transport);
										transport = null;
										self.upgrading = false;
										self.flush();
									});
								} else {
									debug('probe transport "%s" failed', name);
									var err = new Error('probe error');
									err.transport = transport.name;
									self.emit('upgradeError', err);
								}
							});
						}

						function freezeTransport() {
							if (failed) return;

							// Any callback called by transport should be ignored since now
							failed = true;

							cleanup();

							transport.close();
							transport = null;
						}

						//Handle any error that happens while probing
						function onerror(err) {
							var error = new Error('probe error: ' + err);
							error.transport = transport.name;

							freezeTransport();

							debug('probe transport "%s" failed because of error: %s', name, err);

							self.emit('upgradeError', error);
						}

						function onTransportClose() {
							onerror("transport closed");
						}

						//When the socket is closed while we're probing
						function onclose() {
							onerror("socket closed");
						}

						//When the socket is upgraded while we're probing
						function onupgrade(to) {
							if (transport && to.name != transport.name) {
								debug('"%s" works - aborting "%s"', to.name, transport.name);
								freezeTransport();
							}
						}

						//Remove all listeners on the transport and on self
						function cleanup() {
							transport.removeListener('open', onTransportOpen);
							transport.removeListener('error', onerror);
							transport.removeListener('close', onTransportClose);
							self.removeListener('close', onclose);
							self.removeListener('upgrading', onupgrade);
						}

						transport.once('open', onTransportOpen);
						transport.once('error', onerror);
						transport.once('close', onTransportClose);

						this.once('close', onclose);
						this.once('upgrading', onupgrade);

						transport.open();
					};

					/**
      * Called when connection is deemed open.
      *
      * @api public
      */

					Socket.prototype.onOpen = function () {
						debug('socket open');
						this.readyState = 'open';
						Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
						this.emit('open');
						this.flush();

						// we check for `readyState` in case an `open`
						// listener already closed the socket
						if ('open' == this.readyState && this.upgrade && this.transport.pause) {
							debug('starting upgrade probes');
							for (var i = 0, l = this.upgrades.length; i < l; i++) {
								this.probe(this.upgrades[i]);
							}
						}
					};

					/**
      * Handles a packet.
      *
      * @api private
      */

					Socket.prototype.onPacket = function (packet) {
						if ('opening' == this.readyState || 'open' == this.readyState) {
							debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

							this.emit('packet', packet);

							// Socket is live - any packet counts
							this.emit('heartbeat');

							switch (packet.type) {
								case 'open':
									this.onHandshake(parsejson(packet.data));
									break;

								case 'pong':
									this.setPing();
									this.emit('pong');
									break;

								case 'error':
									var err = new Error('server error');
									err.code = packet.data;
									this.onError(err);
									break;

								case 'message':
									this.emit('data', packet.data);
									this.emit('message', packet.data);
									break;
							}
						} else {
							debug('packet received with socket readyState "%s"', this.readyState);
						}
					};

					/**
      * Called upon handshake completion.
      *
      * @param {Object} handshake obj
      * @api private
      */

					Socket.prototype.onHandshake = function (data) {
						this.emit('handshake', data);
						this.id = data.sid;
						this.transport.query.sid = data.sid;
						this.upgrades = this.filterUpgrades(data.upgrades);
						this.pingInterval = data.pingInterval;
						this.pingTimeout = data.pingTimeout;
						this.onOpen();
						// In case open handler closes socket
						if ('closed' == this.readyState) return;
						this.setPing();

						// Prolong liveness of socket on heartbeat
						this.removeListener('heartbeat', this.onHeartbeat);
						this.on('heartbeat', this.onHeartbeat);
					};

					/**
      * Resets ping timeout.
      *
      * @api private
      */

					Socket.prototype.onHeartbeat = function (timeout) {
						clearTimeout(this.pingTimeoutTimer);
						var self = this;
						self.pingTimeoutTimer = setTimeout(function () {
							if ('closed' == self.readyState) return;
							self.onClose('ping timeout');
						}, timeout || self.pingInterval + self.pingTimeout);
					};

					/**
      * Pings server every `this.pingInterval` and expects response
      * within `this.pingTimeout` or closes connection.
      *
      * @api private
      */

					Socket.prototype.setPing = function () {
						var self = this;
						clearTimeout(self.pingIntervalTimer);
						self.pingIntervalTimer = setTimeout(function () {
							debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
							self.ping();
							self.onHeartbeat(self.pingTimeout);
						}, self.pingInterval);
					};

					/**
      * Sends a ping packet.
      *
      * @api private
      */

					Socket.prototype.ping = function () {
						var self = this;
						this.sendPacket('ping', function () {
							self.emit('ping');
						});
					};

					/**
      * Called on `drain` event
      *
      * @api private
      */

					Socket.prototype.onDrain = function () {
						this.writeBuffer.splice(0, this.prevBufferLen);

						// setting prevBufferLen = 0 is very important
						// for example, when upgrading, upgrade packet is sent over,
						// and a nonzero prevBufferLen could cause problems on `drain`
						this.prevBufferLen = 0;

						if (0 === this.writeBuffer.length) {
							this.emit('drain');
						} else {
							this.flush();
						}
					};

					/**
      * Flush write buffers.
      *
      * @api private
      */

					Socket.prototype.flush = function () {
						if ('closed' != this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
							debug('flushing %d packets in socket', this.writeBuffer.length);
							this.transport.send(this.writeBuffer);
							// keep track of current length of writeBuffer
							// splice writeBuffer and callbackBuffer on `drain`
							this.prevBufferLen = this.writeBuffer.length;
							this.emit('flush');
						}
					};

					/**
      * Sends a message.
      *
      * @param {String} message.
      * @param {Function} callback function.
      * @param {Object} options.
      * @return {Socket} for chaining.
      * @api public
      */

					Socket.prototype.write = Socket.prototype.send = function (msg, options, fn) {
						this.sendPacket('message', msg, options, fn);
						return this;
					};

					/**
      * Sends a packet.
      *
      * @param {String} packet type.
      * @param {String} data.
      * @param {Object} options.
      * @param {Function} callback function.
      * @api private
      */

					Socket.prototype.sendPacket = function (type, data, options, fn) {
						if ('function' == typeof data) {
							fn = data;
							data = undefined;
						}

						if ('function' == typeof options) {
							fn = options;
							options = null;
						}

						if ('closing' == this.readyState || 'closed' == this.readyState) {
							return;
						}

						options = options || {};
						options.compress = false !== options.compress;

						var packet = {
							type: type,
							data: data,
							options: options
						};
						this.emit('packetCreate', packet);
						this.writeBuffer.push(packet);
						if (fn) this.once('flush', fn);
						this.flush();
					};

					/**
      * Closes the connection.
      *
      * @api private
      */

					Socket.prototype.close = function () {
						if ('opening' == this.readyState || 'open' == this.readyState) {
							this.readyState = 'closing';

							var self = this;

							if (this.writeBuffer.length) {
								this.once('drain', function () {
									if (this.upgrading) {
										waitForUpgrade();
									} else {
										close();
									}
								});
							} else if (this.upgrading) {
								waitForUpgrade();
							} else {
								close();
							}
						}

						function close() {
							self.onClose('forced close');
							debug('socket closing - telling transport to close');
							self.transport.close();
						}

						function cleanupAndClose() {
							self.removeListener('upgrade', cleanupAndClose);
							self.removeListener('upgradeError', cleanupAndClose);
							close();
						}

						function waitForUpgrade() {
							// wait for upgrade to finish since we can't send packets while pausing a transport
							self.once('upgrade', cleanupAndClose);
							self.once('upgradeError', cleanupAndClose);
						}

						return this;
					};

					/**
      * Called upon transport error
      *
      * @api private
      */

					Socket.prototype.onError = function (err) {
						debug('socket error %j', err);
						Socket.priorWebsocketSuccess = false;
						this.emit('error', err);
						this.onClose('transport error', err);
					};

					/**
      * Called upon transport close.
      *
      * @api private
      */

					Socket.prototype.onClose = function (reason, desc) {
						if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
							debug('socket close with reason: "%s"', reason);
							var self = this;

							// clear timers
							clearTimeout(this.pingIntervalTimer);
							clearTimeout(this.pingTimeoutTimer);

							// stop event from firing again for transport
							this.transport.removeAllListeners('close');

							// ensure transport won't stay open
							this.transport.close();

							// ignore further transport communication
							this.transport.removeAllListeners();

							// set ready state
							this.readyState = 'closed';

							// clear session id
							this.id = null;

							// emit close event
							this.emit('close', reason, desc);

							// clean buffers after, so users can still
							// grab the buffers on `close` event
							self.writeBuffer = [];
							self.prevBufferLen = 0;
						}
					};

					/**
      * Filters upgrades, returning only those matching client transports.
      *
      * @param {Array} server upgrades
      * @api private
      *
      */

					Socket.prototype.filterUpgrades = function (upgrades) {
						var filteredUpgrades = [];
						for (var i = 0, j = upgrades.length; i < j; i++) {
							if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
						}
						return filteredUpgrades;
					};
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"./transport": 4,
				"./transports": 5,
				"component-emitter": 15,
				"debug": 17,
				"engine.io-parser": 19,
				"indexof": 23,
				"parsejson": 26,
				"parseqs": 27,
				"parseuri": 28
			}],
			4: [function (_dereq_, module, exports) {
				/**
     * Module dependencies.
     */

				var parser = _dereq_('engine.io-parser');
				var Emitter = _dereq_('component-emitter');

				/**
     * Module exports.
     */

				module.exports = Transport;

				/**
     * Transport abstract constructor.
     *
     * @param {Object} options.
     * @api private
     */

				function Transport(opts) {
					this.path = opts.path;
					this.hostname = opts.hostname;
					this.port = opts.port;
					this.secure = opts.secure;
					this.query = opts.query;
					this.timestampParam = opts.timestampParam;
					this.timestampRequests = opts.timestampRequests;
					this.readyState = '';
					this.agent = opts.agent || false;
					this.socket = opts.socket;
					this.enablesXDR = opts.enablesXDR;

					// SSL options for Node.js client
					this.pfx = opts.pfx;
					this.key = opts.key;
					this.passphrase = opts.passphrase;
					this.cert = opts.cert;
					this.ca = opts.ca;
					this.ciphers = opts.ciphers;
					this.rejectUnauthorized = opts.rejectUnauthorized;

					// other options for Node.js client
					this.extraHeaders = opts.extraHeaders;
				}

				/**
     * Mix in `Emitter`.
     */

				Emitter(Transport.prototype);

				/**
     * Emits an error.
     *
     * @param {String} str
     * @return {Transport} for chaining
     * @api public
     */

				Transport.prototype.onError = function (msg, desc) {
					var err = new Error(msg);
					err.type = 'TransportError';
					err.description = desc;
					this.emit('error', err);
					return this;
				};

				/**
     * Opens the transport.
     *
     * @api public
     */

				Transport.prototype.open = function () {
					if ('closed' == this.readyState || '' == this.readyState) {
						this.readyState = 'opening';
						this.doOpen();
					}

					return this;
				};

				/**
     * Closes the transport.
     *
     * @api private
     */

				Transport.prototype.close = function () {
					if ('opening' == this.readyState || 'open' == this.readyState) {
						this.doClose();
						this.onClose();
					}

					return this;
				};

				/**
     * Sends multiple packets.
     *
     * @param {Array} packets
     * @api private
     */

				Transport.prototype.send = function (packets) {
					if ('open' == this.readyState) {
						this.write(packets);
					} else {
						throw new Error('Transport not open');
					}
				};

				/**
     * Called upon open
     *
     * @api private
     */

				Transport.prototype.onOpen = function () {
					this.readyState = 'open';
					this.writable = true;
					this.emit('open');
				};

				/**
     * Called with data.
     *
     * @param {String} data
     * @api private
     */

				Transport.prototype.onData = function (data) {
					var packet = parser.decodePacket(data, this.socket.binaryType);
					this.onPacket(packet);
				};

				/**
     * Called with a decoded packet.
     */

				Transport.prototype.onPacket = function (packet) {
					this.emit('packet', packet);
				};

				/**
     * Called upon close.
     *
     * @api private
     */

				Transport.prototype.onClose = function () {
					this.readyState = 'closed';
					this.emit('close');
				};
			}, {
				"component-emitter": 15,
				"engine.io-parser": 19
			}],
			5: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * Module dependencies
      */

					var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
					var XHR = _dereq_('./polling-xhr');
					var JSONP = _dereq_('./polling-jsonp');
					var websocket = _dereq_('./websocket');

					/**
      * Export transports.
      */

					exports.polling = polling;
					exports.websocket = websocket;

					/**
      * Polling transport polymorphic constructor.
      * Decides on xhr vs jsonp based on feature detection.
      *
      * @api private
      */

					function polling(opts) {
						var xhr;
						var xd = false;
						var xs = false;
						var jsonp = false !== opts.jsonp;

						if (global.location) {
							var isSSL = 'https:' == location.protocol;
							var port = location.port;

							// some user agents have empty `location.port`
							if (!port) {
								port = isSSL ? 443 : 80;
							}

							xd = opts.hostname != location.hostname || port != opts.port;
							xs = opts.secure != isSSL;
						}

						opts.xdomain = xd;
						opts.xscheme = xs;
						xhr = new XMLHttpRequest(opts);

						if ('open' in xhr && !opts.forceJSONP) {
							return new XHR(opts);
						} else {
							if (!jsonp) throw new Error('JSONP disabled');
							return new JSONP(opts);
						}
					}
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"./polling-jsonp": 6,
				"./polling-xhr": 7,
				"./websocket": 9,
				"xmlhttprequest-ssl": 10
			}],
			6: [function (_dereq_, module, exports) {
				(function (global) {

					/**
      * Module requirements.
      */

					var Polling = _dereq_('./polling');
					var inherit = _dereq_('component-inherit');

					/**
      * Module exports.
      */

					module.exports = JSONPPolling;

					/**
      * Cached regular expressions.
      */

					var rNewline = /\n/g;
					var rEscapedNewline = /\\n/g;

					/**
      * Global JSONP callbacks.
      */

					var callbacks;

					/**
      * Callbacks count.
      */

					var index = 0;

					/**
      * Noop.
      */

					function empty() {}

					/**
      * JSONP Polling constructor.
      *
      * @param {Object} opts.
      * @api public
      */

					function JSONPPolling(opts) {
						Polling.call(this, opts);

						this.query = this.query || {};

						// define global callbacks array if not present
						// we do this here (lazily) to avoid unneeded global pollution
						if (!callbacks) {
							// we need to consider multiple engines in the same page
							if (!global.___eio) global.___eio = [];
							callbacks = global.___eio;
						}

						// callback identifier
						this.index = callbacks.length;

						// add callback to jsonp global
						var self = this;
						callbacks.push(function (msg) {
							self.onData(msg);
						});

						// append to query string
						this.query.j = this.index;

						// prevent spurious errors from being emitted when the window is unloaded
						if (global.document && global.addEventListener) {
							global.addEventListener('beforeunload', function () {
								if (self.script) self.script.onerror = empty;
							}, false);
						}
					}

					/**
      * Inherits from Polling.
      */

					inherit(JSONPPolling, Polling);

					/*
      * JSONP only supports binary as base64 encoded strings
      */

					JSONPPolling.prototype.supportsBinary = false;

					/**
      * Closes the socket.
      *
      * @api private
      */

					JSONPPolling.prototype.doClose = function () {
						if (this.script) {
							this.script.parentNode.removeChild(this.script);
							this.script = null;
						}

						if (this.form) {
							this.form.parentNode.removeChild(this.form);
							this.form = null;
							this.iframe = null;
						}

						Polling.prototype.doClose.call(this);
					};

					/**
      * Starts a poll cycle.
      *
      * @api private
      */

					JSONPPolling.prototype.doPoll = function () {
						var self = this;
						var script = document.createElement('script');

						if (this.script) {
							this.script.parentNode.removeChild(this.script);
							this.script = null;
						}

						script.async = true;
						script.src = this.uri();
						script.onerror = function (e) {
							self.onError('jsonp poll error', e);
						};

						var insertAt = document.getElementsByTagName('script')[0];
						if (insertAt) {
							insertAt.parentNode.insertBefore(script, insertAt);
						} else {
							(document.head || document.body).appendChild(script);
						}
						this.script = script;

						var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);

						if (isUAgecko) {
							setTimeout(function () {
								var iframe = document.createElement('iframe');
								document.body.appendChild(iframe);
								document.body.removeChild(iframe);
							}, 100);
						}
					};

					/**
      * Writes with a hidden iframe.
      *
      * @param {String} data to send
      * @param {Function} called upon flush.
      * @api private
      */

					JSONPPolling.prototype.doWrite = function (data, fn) {
						var self = this;

						if (!this.form) {
							var form = document.createElement('form');
							var area = document.createElement('textarea');
							var id = this.iframeId = 'eio_iframe_' + this.index;
							var iframe;

							form.className = 'socketio';
							form.style.position = 'absolute';
							form.style.top = '-1000px';
							form.style.left = '-1000px';
							form.target = id;
							form.method = 'POST';
							form.setAttribute('accept-charset', 'utf-8');
							area.name = 'd';
							form.appendChild(area);
							document.body.appendChild(form);

							this.form = form;
							this.area = area;
						}

						this.form.action = this.uri();

						function complete() {
							initIframe();
							fn();
						}

						function initIframe() {
							if (self.iframe) {
								try {
									self.form.removeChild(self.iframe);
								} catch (e) {
									self.onError('jsonp polling iframe removal error', e);
								}
							}

							try {
								// ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
								var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
								iframe = document.createElement(html);
							} catch (e) {
								iframe = document.createElement('iframe');
								iframe.name = self.iframeId;
								iframe.src = 'javascript:0';
							}

							iframe.id = self.iframeId;

							self.form.appendChild(iframe);
							self.iframe = iframe;
						}

						initIframe();

						// escape \n to prevent it from being converted into \r\n by some UAs
						// double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
						data = data.replace(rEscapedNewline, '\\\n');
						this.area.value = data.replace(rNewline, '\\n');

						try {
							this.form.submit();
						} catch (e) {}

						if (this.iframe.attachEvent) {
							this.iframe.onreadystatechange = function () {
								if (self.iframe.readyState == 'complete') {
									complete();
								}
							};
						} else {
							this.iframe.onload = complete;
						}
					};
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"./polling": 8,
				"component-inherit": 16
			}],
			7: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * Module requirements.
      */

					var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
					var Polling = _dereq_('./polling');
					var Emitter = _dereq_('component-emitter');
					var inherit = _dereq_('component-inherit');
					var debug = _dereq_('debug')('engine.io-client:polling-xhr');

					/**
      * Module exports.
      */

					module.exports = XHR;
					module.exports.Request = Request;

					/**
      * Empty function
      */

					function empty() {}

					/**
      * XHR Polling constructor.
      *
      * @param {Object} opts
      * @api public
      */

					function XHR(opts) {
						Polling.call(this, opts);

						if (global.location) {
							var isSSL = 'https:' == location.protocol;
							var port = location.port;

							// some user agents have empty `location.port`
							if (!port) {
								port = isSSL ? 443 : 80;
							}

							this.xd = opts.hostname != global.location.hostname || port != opts.port;
							this.xs = opts.secure != isSSL;
						} else {
							this.extraHeaders = opts.extraHeaders;
						}
					}

					/**
      * Inherits from Polling.
      */

					inherit(XHR, Polling);

					/**
      * XHR supports binary
      */

					XHR.prototype.supportsBinary = true;

					/**
      * Creates a request.
      *
      * @param {String} method
      * @api private
      */

					XHR.prototype.request = function (opts) {
						opts = opts || {};
						opts.uri = this.uri();
						opts.xd = this.xd;
						opts.xs = this.xs;
						opts.agent = this.agent || false;
						opts.supportsBinary = this.supportsBinary;
						opts.enablesXDR = this.enablesXDR;

						// SSL options for Node.js client
						opts.pfx = this.pfx;
						opts.key = this.key;
						opts.passphrase = this.passphrase;
						opts.cert = this.cert;
						opts.ca = this.ca;
						opts.ciphers = this.ciphers;
						opts.rejectUnauthorized = this.rejectUnauthorized;

						// other options for Node.js client
						opts.extraHeaders = this.extraHeaders;

						return new Request(opts);
					};

					/**
      * Sends data.
      *
      * @param {String} data to send.
      * @param {Function} called upon flush.
      * @api private
      */

					XHR.prototype.doWrite = function (data, fn) {
						var isBinary = typeof data !== 'string' && data !== undefined;
						var req = this.request({
							method: 'POST',
							data: data,
							isBinary: isBinary
						});
						var self = this;
						req.on('success', fn);
						req.on('error', function (err) {
							self.onError('xhr post error', err);
						});
						this.sendXhr = req;
					};

					/**
      * Starts a poll cycle.
      *
      * @api private
      */

					XHR.prototype.doPoll = function () {
						debug('xhr poll');
						var req = this.request();
						var self = this;
						req.on('data', function (data) {
							self.onData(data);
						});
						req.on('error', function (err) {
							self.onError('xhr poll error', err);
						});
						this.pollXhr = req;
					};

					/**
      * Request constructor
      *
      * @param {Object} options
      * @api public
      */

					function Request(opts) {
						this.method = opts.method || 'GET';
						this.uri = opts.uri;
						this.xd = !!opts.xd;
						this.xs = !!opts.xs;
						this.async = false !== opts.async;
						this.data = undefined != opts.data ? opts.data : null;
						this.agent = opts.agent;
						this.isBinary = opts.isBinary;
						this.supportsBinary = opts.supportsBinary;
						this.enablesXDR = opts.enablesXDR;

						// SSL options for Node.js client
						this.pfx = opts.pfx;
						this.key = opts.key;
						this.passphrase = opts.passphrase;
						this.cert = opts.cert;
						this.ca = opts.ca;
						this.ciphers = opts.ciphers;
						this.rejectUnauthorized = opts.rejectUnauthorized;

						// other options for Node.js client
						this.extraHeaders = opts.extraHeaders;

						this.create();
					}

					/**
      * Mix in `Emitter`.
      */

					Emitter(Request.prototype);

					/**
      * Creates the XHR object and sends the request.
      *
      * @api private
      */

					Request.prototype.create = function () {
						var opts = {
							agent: this.agent,
							xdomain: this.xd,
							xscheme: this.xs,
							enablesXDR: this.enablesXDR
						};

						// SSL options for Node.js client
						opts.pfx = this.pfx;
						opts.key = this.key;
						opts.passphrase = this.passphrase;
						opts.cert = this.cert;
						opts.ca = this.ca;
						opts.ciphers = this.ciphers;
						opts.rejectUnauthorized = this.rejectUnauthorized;

						var xhr = this.xhr = new XMLHttpRequest(opts);
						var self = this;

						try {
							debug('xhr open %s: %s', this.method, this.uri);
							xhr.open(this.method, this.uri, this.async);
							try {
								if (this.extraHeaders) {
									xhr.setDisableHeaderCheck(true);
									for (var i in this.extraHeaders) {
										if (this.extraHeaders.hasOwnProperty(i)) {
											xhr.setRequestHeader(i, this.extraHeaders[i]);
										}
									}
								}
							} catch (e) {}
							if (this.supportsBinary) {
								// This has to be done after open because Firefox is stupid
								// http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
								xhr.responseType = 'arraybuffer';
							}

							if ('POST' == this.method) {
								try {
									if (this.isBinary) {
										xhr.setRequestHeader('Content-type', 'application/octet-stream');
									} else {
										xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
									}
								} catch (e) {}
							}

							// ie6 check
							if ('withCredentials' in xhr) {
								xhr.withCredentials = true;
							}

							if (this.hasXDR()) {
								xhr.onload = function () {
									self.onLoad();
								};
								xhr.onerror = function () {
									self.onError(xhr.responseText);
								};
							} else {
								xhr.onreadystatechange = function () {
									if (4 != xhr.readyState) return;
									if (200 == xhr.status || 1223 == xhr.status) {
										self.onLoad();
									} else {
										// make sure the `error` event handler that's user-set
										// does not throw in the same tick and gets caught here
										setTimeout(function () {
											self.onError(xhr.status);
										}, 0);
									}
								};
							}

							debug('xhr data %s', this.data);
							xhr.send(this.data);
						} catch (e) {
							// Need to defer since .create() is called directly fhrom the constructor
							// and thus the 'error' event can only be only bound *after* this exception
							// occurs.  Therefore, also, we cannot throw here at all.
							setTimeout(function () {
								self.onError(e);
							}, 0);
							return;
						}

						if (global.document) {
							this.index = Request.requestsCount++;
							Request.requests[this.index] = this;
						}
					};

					/**
      * Called upon successful response.
      *
      * @api private
      */

					Request.prototype.onSuccess = function () {
						this.emit('success');
						this.cleanup();
					};

					/**
      * Called if we have data.
      *
      * @api private
      */

					Request.prototype.onData = function (data) {
						this.emit('data', data);
						this.onSuccess();
					};

					/**
      * Called upon error.
      *
      * @api private
      */

					Request.prototype.onError = function (err) {
						this.emit('error', err);
						this.cleanup(true);
					};

					/**
      * Cleans up house.
      *
      * @api private
      */

					Request.prototype.cleanup = function (fromError) {
						if ('undefined' == typeof this.xhr || null === this.xhr) {
							return;
						}
						// xmlhttprequest
						if (this.hasXDR()) {
							this.xhr.onload = this.xhr.onerror = empty;
						} else {
							this.xhr.onreadystatechange = empty;
						}

						if (fromError) {
							try {
								this.xhr.abort();
							} catch (e) {}
						}

						if (global.document) {
							delete Request.requests[this.index];
						}

						this.xhr = null;
					};

					/**
      * Called upon load.
      *
      * @api private
      */

					Request.prototype.onLoad = function () {
						var data;
						try {
							var contentType;
							try {
								contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
							} catch (e) {}
							if (contentType === 'application/octet-stream') {
								data = this.xhr.response;
							} else {
								if (!this.supportsBinary) {
									data = this.xhr.responseText;
								} else {
									try {
										data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
									} catch (e) {
										var ui8Arr = new Uint8Array(this.xhr.response);
										var dataArray = [];
										for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
											dataArray.push(ui8Arr[idx]);
										}

										data = String.fromCharCode.apply(null, dataArray);
									}
								}
							}
						} catch (e) {
							this.onError(e);
						}
						if (null != data) {
							this.onData(data);
						}
					};

					/**
      * Check if it has XDomainRequest.
      *
      * @api private
      */

					Request.prototype.hasXDR = function () {
						return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
					};

					/**
      * Aborts the request.
      *
      * @api public
      */

					Request.prototype.abort = function () {
						this.cleanup();
					};

					/**
      * Aborts pending requests when unloading the window. This is needed to prevent
      * memory leaks (e.g. when using IE) and to ensure that no spurious error is
      * emitted.
      */

					if (global.document) {
						Request.requestsCount = 0;
						Request.requests = {};
						if (global.attachEvent) {
							global.attachEvent('onunload', unloadHandler);
						} else if (global.addEventListener) {
							global.addEventListener('beforeunload', unloadHandler, false);
						}
					}

					function unloadHandler() {
						for (var i in Request.requests) {
							if (Request.requests.hasOwnProperty(i)) {
								Request.requests[i].abort();
							}
						}
					}
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"./polling": 8,
				"component-emitter": 15,
				"component-inherit": 16,
				"debug": 17,
				"xmlhttprequest-ssl": 10
			}],
			8: [function (_dereq_, module, exports) {
				/**
     * Module dependencies.
     */

				var Transport = _dereq_('../transport');
				var parseqs = _dereq_('parseqs');
				var parser = _dereq_('engine.io-parser');
				var inherit = _dereq_('component-inherit');
				var yeast = _dereq_('yeast');
				var debug = _dereq_('debug')('engine.io-client:polling');

				/**
     * Module exports.
     */

				module.exports = Polling;

				/**
     * Is XHR2 supported?
     */

				var hasXHR2 = function () {
					var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
					var xhr = new XMLHttpRequest({
						xdomain: false
					});
					return null != xhr.responseType;
				}();

				/**
     * Polling interface.
     *
     * @param {Object} opts
     * @api private
     */

				function Polling(opts) {
					var forceBase64 = opts && opts.forceBase64;
					if (!hasXHR2 || forceBase64) {
						this.supportsBinary = false;
					}
					Transport.call(this, opts);
				}

				/**
     * Inherits from Transport.
     */

				inherit(Polling, Transport);

				/**
     * Transport name.
     */

				Polling.prototype.name = 'polling';

				/**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @api private
     */

				Polling.prototype.doOpen = function () {
					this.poll();
				};

				/**
     * Pauses polling.
     *
     * @param {Function} callback upon buffers are flushed and transport is paused
     * @api private
     */

				Polling.prototype.pause = function (onPause) {
					var pending = 0;
					var self = this;

					this.readyState = 'pausing';

					function pause() {
						debug('paused');
						self.readyState = 'paused';
						onPause();
					}

					if (this.polling || !this.writable) {
						var total = 0;

						if (this.polling) {
							debug('we are currently polling - waiting to pause');
							total++;
							this.once('pollComplete', function () {
								debug('pre-pause polling complete');
								--total || pause();
							});
						}

						if (!this.writable) {
							debug('we are currently writing - waiting to pause');
							total++;
							this.once('drain', function () {
								debug('pre-pause writing complete');
								--total || pause();
							});
						}
					} else {
						pause();
					}
				};

				/**
     * Starts polling cycle.
     *
     * @api public
     */

				Polling.prototype.poll = function () {
					debug('polling');
					this.polling = true;
					this.doPoll();
					this.emit('poll');
				};

				/**
     * Overloads onData to detect payloads.
     *
     * @api private
     */

				Polling.prototype.onData = function (data) {
					var self = this;
					debug('polling got data %s', data);
					var callback = function callback(packet, index, total) {
						// if its the first message we consider the transport open
						if ('opening' == self.readyState) {
							self.onOpen();
						}

						// if its a close packet, we close the ongoing requests
						if ('close' == packet.type) {
							self.onClose();
							return false;
						}

						// otherwise bypass onData and handle the message
						self.onPacket(packet);
					};

					// decode payload
					parser.decodePayload(data, this.socket.binaryType, callback);

					// if an event did not trigger closing
					if ('closed' != this.readyState) {
						// if we got data we're not polling
						this.polling = false;
						this.emit('pollComplete');

						if ('open' == this.readyState) {
							this.poll();
						} else {
							debug('ignoring poll - transport state "%s"', this.readyState);
						}
					}
				};

				/**
     * For polling, send a close packet.
     *
     * @api private
     */

				Polling.prototype.doClose = function () {
					var self = this;

					function close() {
						debug('writing close packet');
						self.write([{
							type: 'close'
						}]);
					}

					if ('open' == this.readyState) {
						debug('transport open - closing');
						close();
					} else {
						// in case we're trying to close while
						// handshaking is in progress (GH-164)
						debug('transport not open - deferring close');
						this.once('open', close);
					}
				};

				/**
     * Writes a packets payload.
     *
     * @param {Array} data packets
     * @param {Function} drain callback
     * @api private
     */

				Polling.prototype.write = function (packets) {
					var self = this;
					this.writable = false;
					var callbackfn = function callbackfn() {
						self.writable = true;
						self.emit('drain');
					};

					var self = this;
					parser.encodePayload(packets, this.supportsBinary, function (data) {
						self.doWrite(data, callbackfn);
					});
				};

				/**
     * Generates uri for connection.
     *
     * @api private
     */

				Polling.prototype.uri = function () {
					var query = this.query || {};
					var schema = this.secure ? 'https' : 'http';
					var port = '';

					// cache busting is forced
					if (false !== this.timestampRequests) {
						query[this.timestampParam] = yeast();
					}

					if (!this.supportsBinary && !query.sid) {
						query.b64 = 1;
					}

					query = parseqs.encode(query);

					// avoid port if default for schema
					if (this.port && ('https' == schema && this.port != 443 || 'http' == schema && this.port != 80)) {
						port = ':' + this.port;
					}

					// prepend ? to query
					if (query.length) {
						query = '?' + query;
					}

					var ipv6 = this.hostname.indexOf(':') !== -1;
					return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
				};
			}, {
				"../transport": 4,
				"component-inherit": 16,
				"debug": 17,
				"engine.io-parser": 19,
				"parseqs": 27,
				"xmlhttprequest-ssl": 10,
				"yeast": 30
			}],
			9: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * Module dependencies.
      */

					var Transport = _dereq_('../transport');
					var parser = _dereq_('engine.io-parser');
					var parseqs = _dereq_('parseqs');
					var inherit = _dereq_('component-inherit');
					var yeast = _dereq_('yeast');
					var debug = _dereq_('debug')('engine.io-client:websocket');
					var BrowserWebSocket = global.WebSocket || global.MozWebSocket;

					/**
      * Get either the `WebSocket` or `MozWebSocket` globals
      * in the browser or try to resolve WebSocket-compatible
      * interface exposed by `ws` for Node-like environment.
      */

					var WebSocket = BrowserWebSocket;
					if (!WebSocket && typeof window === 'undefined') {
						try {
							WebSocket = _dereq_('ws');
						} catch (e) {}
					}

					/**
      * Module exports.
      */

					module.exports = WS;

					/**
      * WebSocket transport constructor.
      *
      * @api {Object} connection options
      * @api public
      */

					function WS(opts) {
						var forceBase64 = opts && opts.forceBase64;
						if (forceBase64) {
							this.supportsBinary = false;
						}
						this.perMessageDeflate = opts.perMessageDeflate;
						Transport.call(this, opts);
					}

					/**
      * Inherits from Transport.
      */

					inherit(WS, Transport);

					/**
      * Transport name.
      *
      * @api public
      */

					WS.prototype.name = 'websocket';

					/*
      * WebSockets support binary
      */

					WS.prototype.supportsBinary = true;

					/**
      * Opens socket.
      *
      * @api private
      */

					WS.prototype.doOpen = function () {
						if (!this.check()) {
							// let probe timeout
							return;
						}

						var self = this;
						var uri = this.uri();
						var protocols = void 0;
						var opts = {
							agent: this.agent,
							perMessageDeflate: this.perMessageDeflate
						};

						// SSL options for Node.js client
						opts.pfx = this.pfx;
						opts.key = this.key;
						opts.passphrase = this.passphrase;
						opts.cert = this.cert;
						opts.ca = this.ca;
						opts.ciphers = this.ciphers;
						opts.rejectUnauthorized = this.rejectUnauthorized;
						if (this.extraHeaders) {
							opts.headers = this.extraHeaders;
						}

						this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);

						if (this.ws.binaryType === undefined) {
							this.supportsBinary = false;
						}

						if (this.ws.supports && this.ws.supports.binary) {
							this.supportsBinary = true;
							this.ws.binaryType = 'buffer';
						} else {
							this.ws.binaryType = 'arraybuffer';
						}

						this.addEventListeners();
					};

					/**
      * Adds event listeners to the socket
      *
      * @api private
      */

					WS.prototype.addEventListeners = function () {
						var self = this;

						this.ws.onopen = function () {
							self.onOpen();
						};
						this.ws.onclose = function () {
							self.onClose();
						};
						this.ws.onmessage = function (ev) {
							self.onData(ev.data);
						};
						this.ws.onerror = function (e) {
							self.onError('websocket error', e);
						};
					};

					/**
      * Override `onData` to use a timer on iOS.
      * See: https://gist.github.com/mloughran/2052006
      *
      * @api private
      */

					if ('undefined' != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
						WS.prototype.onData = function (data) {
							var self = this;
							setTimeout(function () {
								Transport.prototype.onData.call(self, data);
							}, 0);
						};
					}

					/**
      * Writes data to socket.
      *
      * @param {Array} array of packets.
      * @api private
      */

					WS.prototype.write = function (packets) {
						var self = this;
						this.writable = false;

						// encodePacket efficient as it uses WS framing
						// no need for encodePayload
						var total = packets.length;
						for (var i = 0, l = total; i < l; i++) {
							(function (packet) {
								parser.encodePacket(packet, self.supportsBinary, function (data) {
									if (!BrowserWebSocket) {
										// always create a new object (GH-437)
										var opts = {};
										if (packet.options) {
											opts.compress = packet.options.compress;
										}

										if (self.perMessageDeflate) {
											var len = 'string' == typeof data ? global.Buffer.byteLength(data) : data.length;
											if (len < self.perMessageDeflate.threshold) {
												opts.compress = false;
											}
										}
									}

									//Sometimes the websocket has already been closed but the browser didn't
									//have a chance of informing us about it yet, in that case send will
									//throw an error
									try {
										if (BrowserWebSocket) {
											// TypeError is thrown when passing the second argument on Safari
											self.ws.send(data);
										} else {
											self.ws.send(data, opts);
										}
									} catch (e) {
										debug('websocket closed before onclose event');
									}

									--total || done();
								});
							})(packets[i]);
						}

						function done() {
							self.emit('flush');

							// fake drain
							// defer to next tick to allow Socket to clear writeBuffer
							setTimeout(function () {
								self.writable = true;
								self.emit('drain');
							}, 0);
						}
					};

					/**
      * Called upon close
      *
      * @api private
      */

					WS.prototype.onClose = function () {
						Transport.prototype.onClose.call(this);
					};

					/**
      * Closes socket.
      *
      * @api private
      */

					WS.prototype.doClose = function () {
						if (typeof this.ws !== 'undefined') {
							this.ws.close();
						}
					};

					/**
      * Generates uri for connection.
      *
      * @api private
      */

					WS.prototype.uri = function () {
						var query = this.query || {};
						var schema = this.secure ? 'wss' : 'ws';
						var port = '';

						// avoid port if default for schema
						if (this.port && ('wss' == schema && this.port != 443 || 'ws' == schema && this.port != 80)) {
							port = ':' + this.port;
						}

						// append timestamp to URI
						if (this.timestampRequests) {
							query[this.timestampParam] = yeast();
						}

						// communicate binary support capabilities
						if (!this.supportsBinary) {
							query.b64 = 1;
						}

						query = parseqs.encode(query);

						// prepend ? to query
						if (query.length) {
							query = '?' + query;
						}

						var ipv6 = this.hostname.indexOf(':') !== -1;
						return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
					};

					/**
      * Feature detection for WebSocket.
      *
      * @return {Boolean} whether this transport is available.
      * @api public
      */

					WS.prototype.check = function () {
						return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
					};
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"../transport": 4,
				"component-inherit": 16,
				"debug": 17,
				"engine.io-parser": 19,
				"parseqs": 27,
				"ws": undefined,
				"yeast": 30
			}],
			10: [function (_dereq_, module, exports) {
				// browser shim for xmlhttprequest module
				var hasCORS = _dereq_('has-cors');

				module.exports = function (opts) {
					var xdomain = opts.xdomain;

					// scheme must be same when usign XDomainRequest
					// http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
					var xscheme = opts.xscheme;

					// XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
					// https://github.com/Automattic/engine.io-client/pull/217
					var enablesXDR = opts.enablesXDR;

					// XMLHttpRequest can be disabled on IE
					try {
						if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
							return new XMLHttpRequest();
						}
					} catch (e) {}

					// Use XDomainRequest for IE8 if enablesXDR is true
					// because loading bar keeps flashing when using jsonp-polling
					// https://github.com/yujiosaka/socke.io-ie8-loading-example
					try {
						if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
							return new XDomainRequest();
						}
					} catch (e) {}

					if (!xdomain) {
						try {
							return new ActiveXObject('Microsoft.XMLHTTP');
						} catch (e) {}
					}
				};
			}, {
				"has-cors": 22
			}],
			11: [function (_dereq_, module, exports) {
				module.exports = after;

				function after(count, callback, err_cb) {
					var bail = false;
					err_cb = err_cb || noop;
					proxy.count = count;

					return count === 0 ? callback() : proxy;

					function proxy(err, result) {
						if (proxy.count <= 0) {
							throw new Error('after called too many times');
						}
						--proxy.count;

						// after first error, rest are passed to err_cb
						if (err) {
							bail = true;
							callback(err);
							// future error callbacks will go to error handler
							callback = err_cb;
						} else if (proxy.count === 0 && !bail) {
							callback(null, result);
						}
					}
				}

				function noop() {}
			}, {}],
			12: [function (_dereq_, module, exports) {
				/**
     * An abstraction for slicing an arraybuffer even when
     * ArrayBuffer.prototype.slice is not supported
     *
     * @api public
     */

				module.exports = function (arraybuffer, start, end) {
					var bytes = arraybuffer.byteLength;
					start = start || 0;
					end = end || bytes;

					if (arraybuffer.slice) {
						return arraybuffer.slice(start, end);
					}

					if (start < 0) {
						start += bytes;
					}
					if (end < 0) {
						end += bytes;
					}
					if (end > bytes) {
						end = bytes;
					}

					if (start >= bytes || start >= end || bytes === 0) {
						return new ArrayBuffer(0);
					}

					var abv = new Uint8Array(arraybuffer);
					var result = new Uint8Array(end - start);
					for (var i = start, ii = 0; i < end; i++, ii++) {
						result[ii] = abv[i];
					}
					return result.buffer;
				};
			}, {}],
			13: [function (_dereq_, module, exports) {
				/*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
				(function (chars) {
					"use strict";

					exports.encode = function (arraybuffer) {
						var bytes = new Uint8Array(arraybuffer),
						    i,
						    len = bytes.length,
						    base64 = "";

						for (i = 0; i < len; i += 3) {
							base64 += chars[bytes[i] >> 2];
							base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
							base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
							base64 += chars[bytes[i + 2] & 63];
						}

						if (len % 3 === 2) {
							base64 = base64.substring(0, base64.length - 1) + "=";
						} else if (len % 3 === 1) {
							base64 = base64.substring(0, base64.length - 2) + "==";
						}

						return base64;
					};

					exports.decode = function (base64) {
						var bufferLength = base64.length * 0.75,
						    len = base64.length,
						    i,
						    p = 0,
						    encoded1,
						    encoded2,
						    encoded3,
						    encoded4;

						if (base64[base64.length - 1] === "=") {
							bufferLength--;
							if (base64[base64.length - 2] === "=") {
								bufferLength--;
							}
						}

						var arraybuffer = new ArrayBuffer(bufferLength),
						    bytes = new Uint8Array(arraybuffer);

						for (i = 0; i < len; i += 4) {
							encoded1 = chars.indexOf(base64[i]);
							encoded2 = chars.indexOf(base64[i + 1]);
							encoded3 = chars.indexOf(base64[i + 2]);
							encoded4 = chars.indexOf(base64[i + 3]);

							bytes[p++] = encoded1 << 2 | encoded2 >> 4;
							bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
							bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
						}

						return arraybuffer;
					};
				})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
			}, {}],
			14: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * Create a blob builder even when vendor prefixes exist
      */

					var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MSBlobBuilder || global.MozBlobBuilder;

					/**
      * Check if Blob constructor is supported
      */

					var blobSupported = function () {
						try {
							var a = new Blob(['hi']);
							return a.size === 2;
						} catch (e) {
							return false;
						}
					}();

					/**
      * Check if Blob constructor supports ArrayBufferViews
      * Fails in Safari 6, so we need to map to ArrayBuffers there.
      */

					var blobSupportsArrayBufferView = blobSupported && function () {
						try {
							var b = new Blob([new Uint8Array([1, 2])]);
							return b.size === 2;
						} catch (e) {
							return false;
						}
					}();

					/**
      * Check if BlobBuilder is supported
      */

					var blobBuilderSupported = BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob;

					/**
      * Helper function that maps ArrayBufferViews to ArrayBuffers
      * Used by BlobBuilder constructor and old browsers that didn't
      * support it in the Blob constructor.
      */

					function mapArrayBufferViews(ary) {
						for (var i = 0; i < ary.length; i++) {
							var chunk = ary[i];
							if (chunk.buffer instanceof ArrayBuffer) {
								var buf = chunk.buffer;

								// if this is a subarray, make a copy so we only
								// include the subarray region from the underlying buffer
								if (chunk.byteLength !== buf.byteLength) {
									var copy = new Uint8Array(chunk.byteLength);
									copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
									buf = copy.buffer;
								}

								ary[i] = buf;
							}
						}
					}

					function BlobBuilderConstructor(ary, options) {
						options = options || {};

						var bb = new BlobBuilder();
						mapArrayBufferViews(ary);

						for (var i = 0; i < ary.length; i++) {
							bb.append(ary[i]);
						}

						return options.type ? bb.getBlob(options.type) : bb.getBlob();
					};

					function BlobConstructor(ary, options) {
						mapArrayBufferViews(ary);
						return new Blob(ary, options || {});
					};

					module.exports = function () {
						if (blobSupported) {
							return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
						} else if (blobBuilderSupported) {
							return BlobBuilderConstructor;
						} else {
							return undefined;
						}
					}();
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {}],
			15: [function (_dereq_, module, exports) {

				/**
     * Expose `Emitter`.
     */

				module.exports = Emitter;

				/**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

				function Emitter(obj) {
					if (obj) return mixin(obj);
				};

				/**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

				function mixin(obj) {
					for (var key in Emitter.prototype) {
						obj[key] = Emitter.prototype[key];
					}
					return obj;
				}

				/**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

				Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
					this._callbacks = this._callbacks || {};
					(this._callbacks[event] = this._callbacks[event] || []).push(fn);
					return this;
				};

				/**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

				Emitter.prototype.once = function (event, fn) {
					var self = this;
					this._callbacks = this._callbacks || {};

					function on() {
						self.off(event, on);
						fn.apply(this, arguments);
					}

					on.fn = fn;
					this.on(event, on);
					return this;
				};

				/**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

				Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
					this._callbacks = this._callbacks || {};

					// all
					if (0 == arguments.length) {
						this._callbacks = {};
						return this;
					}

					// specific event
					var callbacks = this._callbacks[event];
					if (!callbacks) return this;

					// remove all handlers
					if (1 == arguments.length) {
						delete this._callbacks[event];
						return this;
					}

					// remove specific handler
					var cb;
					for (var i = 0; i < callbacks.length; i++) {
						cb = callbacks[i];
						if (cb === fn || cb.fn === fn) {
							callbacks.splice(i, 1);
							break;
						}
					}
					return this;
				};

				/**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

				Emitter.prototype.emit = function (event) {
					this._callbacks = this._callbacks || {};
					var args = [].slice.call(arguments, 1),
					    callbacks = this._callbacks[event];

					if (callbacks) {
						callbacks = callbacks.slice(0);
						for (var i = 0, len = callbacks.length; i < len; ++i) {
							callbacks[i].apply(this, args);
						}
					}

					return this;
				};

				/**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

				Emitter.prototype.listeners = function (event) {
					this._callbacks = this._callbacks || {};
					return this._callbacks[event] || [];
				};

				/**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

				Emitter.prototype.hasListeners = function (event) {
					return !!this.listeners(event).length;
				};
			}, {}],
			16: [function (_dereq_, module, exports) {

				module.exports = function (a, b) {
					var fn = function fn() {};
					fn.prototype = b.prototype;
					a.prototype = new fn();
					a.prototype.constructor = a;
				};
			}, {}],
			17: [function (_dereq_, module, exports) {

				/**
     * This is the web browser implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */

				exports = module.exports = _dereq_('./debug');
				exports.log = log;
				exports.formatArgs = formatArgs;
				exports.save = save;
				exports.load = load;
				exports.useColors = useColors;
				exports.storage = 'undefined' != typeof chrome && 'undefined' != typeof chrome.storage ? chrome.storage.local : localstorage();

				/**
     * Colors.
     */

				exports.colors = ['lightseagreen', 'forestgreen', 'goldenrod', 'dodgerblue', 'darkorchid', 'crimson'];

				/**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

				function useColors() {
					// is webkit? http://stackoverflow.com/a/16459606/376773
					return 'WebkitAppearance' in document.documentElement.style ||
					// is firebug? http://stackoverflow.com/a/398120/376773
					window.console && (console.firebug || console.exception && console.table) ||
					// is firefox >= v31?
					// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
					navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31;
				}

				/**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

				exports.formatters.j = function (v) {
					return JSON.stringify(v);
				};

				/**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

				function formatArgs() {
					var args = arguments;
					var useColors = this.useColors;

					args[0] = (useColors ? '%c' : '') + this.namespace + (useColors ? ' %c' : ' ') + args[0] + (useColors ? '%c ' : ' ') + '+' + exports.humanize(this.diff);

					if (!useColors) return args;

					var c = 'color: ' + this.color;
					args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

					// the final "%c" is somewhat tricky, because there could be other
					// arguments passed either before or after the %c, so we need to
					// figure out the correct index to insert the CSS into
					var index = 0;
					var lastC = 0;
					args[0].replace(/%[a-z%]/g, function (match) {
						if ('%%' === match) return;
						index++;
						if ('%c' === match) {
							// we only are interested in the *last* %c
							// (the user may have provided their own)
							lastC = index;
						}
					});

					args.splice(lastC, 0, c);
					return args;
				}

				/**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */

				function log() {
					// this hackery is required for IE8/9, where
					// the `console.log` function doesn't have 'apply'
					return 'object' === (typeof console === "undefined" ? "undefined" : _typeof(console)) && console.log && Function.prototype.apply.call(console.log, console, arguments);
				}

				/**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */

				function save(namespaces) {
					try {
						if (null == namespaces) {
							exports.storage.removeItem('debug');
						} else {
							exports.storage.debug = namespaces;
						}
					} catch (e) {}
				}

				/**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */

				function load() {
					var r;
					try {
						r = exports.storage.debug;
					} catch (e) {}
					return r;
				}

				/**
     * Enable namespaces listed in `localStorage.debug` initially.
     */

				exports.enable(load());

				/**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

				function localstorage() {
					try {
						return window.localStorage;
					} catch (e) {}
				}
			}, {
				"./debug": 18
			}],
			18: [function (_dereq_, module, exports) {

				/**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */

				exports = module.exports = debug;
				exports.coerce = coerce;
				exports.disable = disable;
				exports.enable = enable;
				exports.enabled = enabled;
				exports.humanize = _dereq_('ms');

				/**
     * The currently active debug mode names, and names to skip.
     */

				exports.names = [];
				exports.skips = [];

				/**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lowercased letter, i.e. "n".
     */

				exports.formatters = {};

				/**
     * Previously assigned color.
     */

				var prevColor = 0;

				/**
     * Previous log timestamp.
     */

				var prevTime;

				/**
     * Select a color.
     *
     * @return {Number}
     * @api private
     */

				function selectColor() {
					return exports.colors[prevColor++ % exports.colors.length];
				}

				/**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */

				function debug(namespace) {

					// define the `disabled` version
					function disabled() {}
					disabled.enabled = false;

					// define the `enabled` version
					function enabled() {

						var self = enabled;

						// set `diff` timestamp
						var curr = +new Date();
						var ms = curr - (prevTime || curr);
						self.diff = ms;
						self.prev = prevTime;
						self.curr = curr;
						prevTime = curr;

						// add the `color` if not set
						if (null == self.useColors) self.useColors = exports.useColors();
						if (null == self.color && self.useColors) self.color = selectColor();

						var args = Array.prototype.slice.call(arguments);

						args[0] = exports.coerce(args[0]);

						if ('string' !== typeof args[0]) {
							// anything else let's inspect with %o
							args = ['%o'].concat(args);
						}

						// apply any `formatters` transformations
						var index = 0;
						args[0] = args[0].replace(/%([a-z%])/g, function (match, format) {
							// if we encounter an escaped % then don't increase the array index
							if (match === '%%') return match;
							index++;
							var formatter = exports.formatters[format];
							if ('function' === typeof formatter) {
								var val = args[index];
								match = formatter.call(self, val);

								// now we need to remove `args[index]` since it's inlined in the `format`
								args.splice(index, 1);
								index--;
							}
							return match;
						});

						if ('function' === typeof exports.formatArgs) {
							args = exports.formatArgs.apply(self, args);
						}
						var logFn = enabled.log || exports.log || console.log.bind(console);
						logFn.apply(self, args);
					}
					enabled.enabled = true;

					var fn = exports.enabled(namespace) ? enabled : disabled;

					fn.namespace = namespace;

					return fn;
				}

				/**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */

				function enable(namespaces) {
					exports.save(namespaces);

					var split = (namespaces || '').split(/[\s,]+/);
					var len = split.length;

					for (var i = 0; i < len; i++) {
						if (!split[i]) continue; // ignore empty strings
						namespaces = split[i].replace(/\*/g, '.*?');
						if (namespaces[0] === '-') {
							exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
						} else {
							exports.names.push(new RegExp('^' + namespaces + '$'));
						}
					}
				}

				/**
     * Disable debug output.
     *
     * @api public
     */

				function disable() {
					exports.enable('');
				}

				/**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */

				function enabled(name) {
					var i, len;
					for (i = 0, len = exports.skips.length; i < len; i++) {
						if (exports.skips[i].test(name)) {
							return false;
						}
					}
					for (i = 0, len = exports.names.length; i < len; i++) {
						if (exports.names[i].test(name)) {
							return true;
						}
					}
					return false;
				}

				/**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */

				function coerce(val) {
					if (val instanceof Error) return val.stack || val.message;
					return val;
				}
			}, {
				"ms": 25
			}],
			19: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * Module dependencies.
      */

					var keys = _dereq_('./keys');
					var hasBinary = _dereq_('has-binary');
					var sliceBuffer = _dereq_('arraybuffer.slice');
					var base64encoder = _dereq_('base64-arraybuffer');
					var after = _dereq_('after');
					var utf8 = _dereq_('utf8');

					/**
      * Check if we are running an android browser. That requires us to use
      * ArrayBuffer with polling transports...
      *
      * http://ghinda.net/jpeg-blob-ajax-android/
      */

					var isAndroid = navigator.userAgent.match(/Android/i);

					/**
      * Check if we are running in PhantomJS.
      * Uploading a Blob with PhantomJS does not work correctly, as reported here:
      * https://github.com/ariya/phantomjs/issues/11395
      * @type boolean
      */
					var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

					/**
      * When true, avoids using Blobs to encode payloads.
      * @type boolean
      */
					var dontSendBlobs = isAndroid || isPhantomJS;

					/**
      * Current protocol version.
      */

					exports.protocol = 3;

					/**
      * Packet types.
      */

					var packets = exports.packets = {
						open: 0 // non-ws

						, close: 1 // non-ws

						, ping: 2,
						pong: 3,
						message: 4,
						upgrade: 5,
						noop: 6
					};

					var packetslist = keys(packets);

					/**
      * Premade error packet.
      */

					var err = {
						type: 'error',
						data: 'parser error'
					};

					/**
      * Create a blob api even for blob builder when vendor prefixes exist
      */

					var Blob = _dereq_('blob');

					/**
      * Encodes a packet.
      *
      *     <packet type id> [ <data> ]
      *
      * Example:
      *
      *     5hello world
      *     3
      *     4
      *
      * Binary is encoded in an identical principle
      *
      * @api private
      */

					exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
						if ('function' == typeof supportsBinary) {
							callback = supportsBinary;
							supportsBinary = false;
						}

						if ('function' == typeof utf8encode) {
							callback = utf8encode;
							utf8encode = null;
						}

						var data = packet.data === undefined ? undefined : packet.data.buffer || packet.data;

						if (global.ArrayBuffer && data instanceof ArrayBuffer) {
							return encodeArrayBuffer(packet, supportsBinary, callback);
						} else if (Blob && data instanceof global.Blob) {
							return encodeBlob(packet, supportsBinary, callback);
						}

						// might be an object with { base64: true, data: dataAsBase64String }
						if (data && data.base64) {
							return encodeBase64Object(packet, callback);
						}

						// Sending data as a utf-8 string
						var encoded = packets[packet.type];

						// data fragment is optional
						if (undefined !== packet.data) {
							encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
						}

						return callback('' + encoded);
					};

					function encodeBase64Object(packet, callback) {
						// packet data is an object { base64: true, data: dataAsBase64String }
						var message = 'b' + exports.packets[packet.type] + packet.data.data;
						return callback(message);
					}

					/**
      * Encode packet helpers for binary types
      */

					function encodeArrayBuffer(packet, supportsBinary, callback) {
						if (!supportsBinary) {
							return exports.encodeBase64Packet(packet, callback);
						}

						var data = packet.data;
						var contentArray = new Uint8Array(data);
						var resultBuffer = new Uint8Array(1 + data.byteLength);

						resultBuffer[0] = packets[packet.type];
						for (var i = 0; i < contentArray.length; i++) {
							resultBuffer[i + 1] = contentArray[i];
						}

						return callback(resultBuffer.buffer);
					}

					function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
						if (!supportsBinary) {
							return exports.encodeBase64Packet(packet, callback);
						}

						var fr = new FileReader();
						fr.onload = function () {
							packet.data = fr.result;
							exports.encodePacket(packet, supportsBinary, true, callback);
						};
						return fr.readAsArrayBuffer(packet.data);
					}

					function encodeBlob(packet, supportsBinary, callback) {
						if (!supportsBinary) {
							return exports.encodeBase64Packet(packet, callback);
						}

						if (dontSendBlobs) {
							return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
						}

						var length = new Uint8Array(1);
						length[0] = packets[packet.type];
						var blob = new Blob([length.buffer, packet.data]);

						return callback(blob);
					}

					/**
      * Encodes a packet with binary data in a base64 string
      *
      * @param {Object} packet, has `type` and `data`
      * @return {String} base64 encoded message
      */

					exports.encodeBase64Packet = function (packet, callback) {
						var message = 'b' + exports.packets[packet.type];
						if (Blob && packet.data instanceof global.Blob) {
							var fr = new FileReader();
							fr.onload = function () {
								var b64 = fr.result.split(',')[1];
								callback(message + b64);
							};
							return fr.readAsDataURL(packet.data);
						}

						var b64data;
						try {
							b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
						} catch (e) {
							// iPhone Safari doesn't let you apply with typed arrays
							var typed = new Uint8Array(packet.data);
							var basic = new Array(typed.length);
							for (var i = 0; i < typed.length; i++) {
								basic[i] = typed[i];
							}
							b64data = String.fromCharCode.apply(null, basic);
						}
						message += global.btoa(b64data);
						return callback(message);
					};

					/**
      * Decodes a packet. Changes format to Blob if requested.
      *
      * @return {Object} with `type` and `data` (if any)
      * @api private
      */

					exports.decodePacket = function (data, binaryType, utf8decode) {
						// String data
						if (typeof data == 'string' || data === undefined) {
							if (data.charAt(0) == 'b') {
								return exports.decodeBase64Packet(data.substr(1), binaryType);
							}

							if (utf8decode) {
								try {
									data = utf8.decode(data);
								} catch (e) {
									return err;
								}
							}
							var type = data.charAt(0);

							if (Number(type) != type || !packetslist[type]) {
								return err;
							}

							if (data.length > 1) {
								return {
									type: packetslist[type],
									data: data.substring(1)
								};
							} else {
								return {
									type: packetslist[type]
								};
							}
						}

						var asArray = new Uint8Array(data);
						var type = asArray[0];
						var rest = sliceBuffer(data, 1);
						if (Blob && binaryType === 'blob') {
							rest = new Blob([rest]);
						}
						return {
							type: packetslist[type],
							data: rest
						};
					};

					/**
      * Decodes a packet encoded in a base64 string
      *
      * @param {String} base64 encoded message
      * @return {Object} with `type` and `data` (if any)
      */

					exports.decodeBase64Packet = function (msg, binaryType) {
						var type = packetslist[msg.charAt(0)];
						if (!global.ArrayBuffer) {
							return {
								type: type,
								data: {
									base64: true,
									data: msg.substr(1)
								}
							};
						}

						var data = base64encoder.decode(msg.substr(1));

						if (binaryType === 'blob' && Blob) {
							data = new Blob([data]);
						}

						return {
							type: type,
							data: data
						};
					};

					/**
      * Encodes multiple messages (payload).
      *
      *     <length>:data
      *
      * Example:
      *
      *     11:hello world2:hi
      *
      * If any contents are binary, they will be encoded as base64 strings. Base64
      * encoded strings are marked with a b before the length specifier
      *
      * @param {Array} packets
      * @api private
      */

					exports.encodePayload = function (packets, supportsBinary, callback) {
						if (typeof supportsBinary == 'function') {
							callback = supportsBinary;
							supportsBinary = null;
						}

						var isBinary = hasBinary(packets);

						if (supportsBinary && isBinary) {
							if (Blob && !dontSendBlobs) {
								return exports.encodePayloadAsBlob(packets, callback);
							}

							return exports.encodePayloadAsArrayBuffer(packets, callback);
						}

						if (!packets.length) {
							return callback('0:');
						}

						function setLengthHeader(message) {
							return message.length + ':' + message;
						}

						function encodeOne(packet, doneCallback) {
							exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function (message) {
								doneCallback(null, setLengthHeader(message));
							});
						}

						map(packets, encodeOne, function (err, results) {
							return callback(results.join(''));
						});
					};

					/**
      * Async array map using after
      */

					function map(ary, each, done) {
						var result = new Array(ary.length);
						var next = after(ary.length, done);

						var eachWithIndex = function eachWithIndex(i, el, cb) {
							each(el, function (error, msg) {
								result[i] = msg;
								cb(error, result);
							});
						};

						for (var i = 0; i < ary.length; i++) {
							eachWithIndex(i, ary[i], next);
						}
					}

					/*
      * Decodes data when a payload is maybe expected. Possible binary contents are
      * decoded from their base64 representation
      *
      * @param {String} data, callback method
      * @api public
      */

					exports.decodePayload = function (data, binaryType, callback) {
						if (typeof data != 'string') {
							return exports.decodePayloadAsBinary(data, binaryType, callback);
						}

						if (typeof binaryType === 'function') {
							callback = binaryType;
							binaryType = null;
						}

						var packet;
						if (data == '') {
							// parser error - ignoring payload
							return callback(err, 0, 1);
						}

						var length = '',
						    n,
						    msg;

						for (var i = 0, l = data.length; i < l; i++) {
							var chr = data.charAt(i);

							if (':' != chr) {
								length += chr;
							} else {
								if ('' == length || length != (n = Number(length))) {
									// parser error - ignoring payload
									return callback(err, 0, 1);
								}

								msg = data.substr(i + 1, n);

								if (length != msg.length) {
									// parser error - ignoring payload
									return callback(err, 0, 1);
								}

								if (msg.length) {
									packet = exports.decodePacket(msg, binaryType, true);

									if (err.type == packet.type && err.data == packet.data) {
										// parser error in individual packet - ignoring payload
										return callback(err, 0, 1);
									}

									var ret = callback(packet, i + n, l);
									if (false === ret) return;
								}

								// advance cursor
								i += n;
								length = '';
							}
						}

						if (length != '') {
							// parser error - ignoring payload
							return callback(err, 0, 1);
						}
					};

					/**
      * Encodes multiple messages (payload) as binary.
      *
      * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
      * 255><data>
      *
      * Example:
      * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
      *
      * @param {Array} packets
      * @return {ArrayBuffer} encoded payload
      * @api private
      */

					exports.encodePayloadAsArrayBuffer = function (packets, callback) {
						if (!packets.length) {
							return callback(new ArrayBuffer(0));
						}

						function encodeOne(packet, doneCallback) {
							exports.encodePacket(packet, true, true, function (data) {
								return doneCallback(null, data);
							});
						}

						map(packets, encodeOne, function (err, encodedPackets) {
							var totalLength = encodedPackets.reduce(function (acc, p) {
								var len;
								if (typeof p === 'string') {
									len = p.length;
								} else {
									len = p.byteLength;
								}
								return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
							}, 0);

							var resultArray = new Uint8Array(totalLength);

							var bufferIndex = 0;
							encodedPackets.forEach(function (p) {
								var isString = typeof p === 'string';
								var ab = p;
								if (isString) {
									var view = new Uint8Array(p.length);
									for (var i = 0; i < p.length; i++) {
										view[i] = p.charCodeAt(i);
									}
									ab = view.buffer;
								}

								if (isString) {
									// not true binary
									resultArray[bufferIndex++] = 0;
								} else {
									// true binary
									resultArray[bufferIndex++] = 1;
								}

								var lenStr = ab.byteLength.toString();
								for (var i = 0; i < lenStr.length; i++) {
									resultArray[bufferIndex++] = parseInt(lenStr[i]);
								}
								resultArray[bufferIndex++] = 255;

								var view = new Uint8Array(ab);
								for (var i = 0; i < view.length; i++) {
									resultArray[bufferIndex++] = view[i];
								}
							});

							return callback(resultArray.buffer);
						});
					};

					/**
      * Encode as Blob
      */

					exports.encodePayloadAsBlob = function (packets, callback) {
						function encodeOne(packet, doneCallback) {
							exports.encodePacket(packet, true, true, function (encoded) {
								var binaryIdentifier = new Uint8Array(1);
								binaryIdentifier[0] = 1;
								if (typeof encoded === 'string') {
									var view = new Uint8Array(encoded.length);
									for (var i = 0; i < encoded.length; i++) {
										view[i] = encoded.charCodeAt(i);
									}
									encoded = view.buffer;
									binaryIdentifier[0] = 0;
								}

								var len = encoded instanceof ArrayBuffer ? encoded.byteLength : encoded.size;

								var lenStr = len.toString();
								var lengthAry = new Uint8Array(lenStr.length + 1);
								for (var i = 0; i < lenStr.length; i++) {
									lengthAry[i] = parseInt(lenStr[i]);
								}
								lengthAry[lenStr.length] = 255;

								if (Blob) {
									var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
									doneCallback(null, blob);
								}
							});
						}

						map(packets, encodeOne, function (err, results) {
							return callback(new Blob(results));
						});
					};

					/*
      * Decodes data when a payload is maybe expected. Strings are decoded by
      * interpreting each byte as a key code for entries marked to start with 0. See
      * description of encodePayloadAsBinary
      *
      * @param {ArrayBuffer} data, callback method
      * @api public
      */

					exports.decodePayloadAsBinary = function (data, binaryType, callback) {
						if (typeof binaryType === 'function') {
							callback = binaryType;
							binaryType = null;
						}

						var bufferTail = data;
						var buffers = [];

						var numberTooLong = false;
						while (bufferTail.byteLength > 0) {
							var tailArray = new Uint8Array(bufferTail);
							var isString = tailArray[0] === 0;
							var msgLength = '';

							for (var i = 1;; i++) {
								if (tailArray[i] == 255) break;

								if (msgLength.length > 310) {
									numberTooLong = true;
									break;
								}

								msgLength += tailArray[i];
							}

							if (numberTooLong) return callback(err, 0, 1);

							bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
							msgLength = parseInt(msgLength);

							var msg = sliceBuffer(bufferTail, 0, msgLength);
							if (isString) {
								try {
									msg = String.fromCharCode.apply(null, new Uint8Array(msg));
								} catch (e) {
									// iPhone Safari doesn't let you apply to typed arrays
									var typed = new Uint8Array(msg);
									msg = '';
									for (var i = 0; i < typed.length; i++) {
										msg += String.fromCharCode(typed[i]);
									}
								}
							}

							buffers.push(msg);
							bufferTail = sliceBuffer(bufferTail, msgLength);
						}

						var total = buffers.length;
						buffers.forEach(function (buffer, i) {
							callback(exports.decodePacket(buffer, binaryType, true), i, total);
						});
					};
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"./keys": 20,
				"after": 11,
				"arraybuffer.slice": 12,
				"base64-arraybuffer": 13,
				"blob": 14,
				"has-binary": 21,
				"utf8": 29
			}],
			20: [function (_dereq_, module, exports) {

				/**
     * Gets the keys for an object.
     *
     * @return {Array} keys
     * @api private
     */

				module.exports = Object.keys || function keys(obj) {
					var arr = [];
					var has = Object.prototype.hasOwnProperty;

					for (var i in obj) {
						if (has.call(obj, i)) {
							arr.push(i);
						}
					}
					return arr;
				};
			}, {}],
			21: [function (_dereq_, module, exports) {
				(function (global) {

					/*
      * Module requirements.
      */

					var isArray = _dereq_('isarray');

					/**
      * Module exports.
      */

					module.exports = hasBinary;

					/**
      * Checks for binary data.
      *
      * Right now only Buffer and ArrayBuffer are supported..
      *
      * @param {Object} anything
      * @api public
      */

					function hasBinary(data) {

						function _hasBinary(obj) {
							if (!obj) return false;

							if (global.Buffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer || global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
								return true;
							}

							if (isArray(obj)) {
								for (var i = 0; i < obj.length; i++) {
									if (_hasBinary(obj[i])) {
										return true;
									}
								}
							} else if (obj && 'object' == (typeof obj === "undefined" ? "undefined" : _typeof(obj))) {
								if (obj.toJSON) {
									obj = obj.toJSON();
								}

								for (var key in obj) {
									if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
										return true;
									}
								}
							}

							return false;
						}

						return _hasBinary(data);
					}
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"isarray": 24
			}],
			22: [function (_dereq_, module, exports) {

				/**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

				try {
					module.exports = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
				} catch (err) {
					// if XMLHttp support is disabled in IE then it will throw
					// when trying to create
					module.exports = false;
				}
			}, {}],
			23: [function (_dereq_, module, exports) {

				var indexOf = [].indexOf;

				module.exports = function (arr, obj) {
					if (indexOf) return arr.indexOf(obj);
					for (var i = 0; i < arr.length; ++i) {
						if (arr[i] === obj) return i;
					}
					return -1;
				};
			}, {}],
			24: [function (_dereq_, module, exports) {
				module.exports = Array.isArray || function (arr) {
					return Object.prototype.toString.call(arr) == '[object Array]';
				};
			}, {}],
			25: [function (_dereq_, module, exports) {
				/**
     * Helpers.
     */

				var s = 1000;
				var m = s * 60;
				var h = m * 60;
				var d = h * 24;
				var y = d * 365.25;

				/**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} options
     * @return {String|Number}
     * @api public
     */

				module.exports = function (val, options) {
					options = options || {};
					if ('string' == typeof val) return parse(val);
					return options.long ? long(val) : short(val);
				};

				/**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

				function parse(str) {
					str = '' + str;
					if (str.length > 10000) return;
					var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
					if (!match) return;
					var n = parseFloat(match[1]);
					var type = (match[2] || 'ms').toLowerCase();
					switch (type) {
						case 'years':
						case 'year':
						case 'yrs':
						case 'yr':
						case 'y':
							return n * y;
						case 'days':
						case 'day':
						case 'd':
							return n * d;
						case 'hours':
						case 'hour':
						case 'hrs':
						case 'hr':
						case 'h':
							return n * h;
						case 'minutes':
						case 'minute':
						case 'mins':
						case 'min':
						case 'm':
							return n * m;
						case 'seconds':
						case 'second':
						case 'secs':
						case 'sec':
						case 's':
							return n * s;
						case 'milliseconds':
						case 'millisecond':
						case 'msecs':
						case 'msec':
						case 'ms':
							return n;
					}
				}

				/**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

				function short(ms) {
					if (ms >= d) return Math.round(ms / d) + 'd';
					if (ms >= h) return Math.round(ms / h) + 'h';
					if (ms >= m) return Math.round(ms / m) + 'm';
					if (ms >= s) return Math.round(ms / s) + 's';
					return ms + 'ms';
				}

				/**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

				function long(ms) {
					return plural(ms, d, 'day') || plural(ms, h, 'hour') || plural(ms, m, 'minute') || plural(ms, s, 'second') || ms + ' ms';
				}

				/**
     * Pluralization helper.
     */

				function plural(ms, n, name) {
					if (ms < n) return;
					if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
					return Math.ceil(ms / n) + ' ' + name + 's';
				}
			}, {}],
			26: [function (_dereq_, module, exports) {
				(function (global) {
					/**
      * JSON parse.
      *
      * @see Based on jQuery#parseJSON (MIT) and JSON2
      * @api private
      */

					var rvalidchars = /^[\],:{}\s]*$/;
					var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
					var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
					var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
					var rtrimLeft = /^\s+/;
					var rtrimRight = /\s+$/;

					module.exports = function parsejson(data) {
						if ('string' != typeof data || !data) {
							return null;
						}

						data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

						// Attempt to parse using the native JSON parser first
						if (global.JSON && JSON.parse) {
							return JSON.parse(data);
						}

						if (rvalidchars.test(data.replace(rvalidescape, '@').replace(rvalidtokens, ']').replace(rvalidbraces, ''))) {
							return new Function('return ' + data)();
						}
					};
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {}],
			27: [function (_dereq_, module, exports) {
				/**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */

				exports.encode = function (obj) {
					var str = '';

					for (var i in obj) {
						if (obj.hasOwnProperty(i)) {
							if (str.length) str += '&';
							str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
						}
					}

					return str;
				};

				/**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

				exports.decode = function (qs) {
					var qry = {};
					var pairs = qs.split('&');
					for (var i = 0, l = pairs.length; i < l; i++) {
						var pair = pairs[i].split('=');
						qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
					}
					return qry;
				};
			}, {}],
			28: [function (_dereq_, module, exports) {
				/**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */

				var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

				var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];

				module.exports = function parseuri(str) {
					var src = str,
					    b = str.indexOf('['),
					    e = str.indexOf(']');

					if (b != -1 && e != -1) {
						str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
					}

					var m = re.exec(str || ''),
					    uri = {},
					    i = 14;

					while (i--) {
						uri[parts[i]] = m[i] || '';
					}

					if (b != -1 && e != -1) {
						uri.source = src;
						uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
						uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
						uri.ipv6uri = true;
					}

					return uri;
				};
			}, {}],
			29: [function (_dereq_, module, exports) {
				(function (global) {
					/*! https://mths.be/utf8js v2.0.0 by @mathias */
					;
					(function (root) {

						// Detect free variables `exports`
						var freeExports = (typeof exports === "undefined" ? "undefined" : _typeof(exports)) == 'object' && exports;

						// Detect free variable `module`
						var freeModule = (typeof module === "undefined" ? "undefined" : _typeof(module)) == 'object' && module && module.exports == freeExports && module;

						// Detect free variable `global`, from Node.js or Browserified code,
						// and use it as `root`
						var freeGlobal = (typeof global === "undefined" ? "undefined" : _typeof(global)) == 'object' && global;
						if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
							root = freeGlobal;
						}

						/*--------------------------------------------------------------------------*/

						var stringFromCharCode = String.fromCharCode;

						// Taken from https://mths.be/punycode
						function ucs2decode(string) {
							var output = [];
							var counter = 0;
							var length = string.length;
							var value;
							var extra;
							while (counter < length) {
								value = string.charCodeAt(counter++);
								if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
									// high surrogate, and there is a next character
									extra = string.charCodeAt(counter++);
									if ((extra & 0xFC00) == 0xDC00) {
										// low surrogate
										output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
									} else {
										// unmatched surrogate; only append this code unit, in case the next
										// code unit is the high surrogate of a surrogate pair
										output.push(value);
										counter--;
									}
								} else {
									output.push(value);
								}
							}
							return output;
						}

						// Taken from https://mths.be/punycode
						function ucs2encode(array) {
							var length = array.length;
							var index = -1;
							var value;
							var output = '';
							while (++index < length) {
								value = array[index];
								if (value > 0xFFFF) {
									value -= 0x10000;
									output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
									value = 0xDC00 | value & 0x3FF;
								}
								output += stringFromCharCode(value);
							}
							return output;
						}

						function checkScalarValue(codePoint) {
							if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
								throw Error('Lone surrogate U+' + codePoint.toString(16).toUpperCase() + ' is not a scalar value');
							}
						}
						/*--------------------------------------------------------------------------*/

						function createByte(codePoint, shift) {
							return stringFromCharCode(codePoint >> shift & 0x3F | 0x80);
						}

						function encodeCodePoint(codePoint) {
							if ((codePoint & 0xFFFFFF80) == 0) {
								// 1-byte sequence
								return stringFromCharCode(codePoint);
							}
							var symbol = '';
							if ((codePoint & 0xFFFFF800) == 0) {
								// 2-byte sequence
								symbol = stringFromCharCode(codePoint >> 6 & 0x1F | 0xC0);
							} else if ((codePoint & 0xFFFF0000) == 0) {
								// 3-byte sequence
								checkScalarValue(codePoint);
								symbol = stringFromCharCode(codePoint >> 12 & 0x0F | 0xE0);
								symbol += createByte(codePoint, 6);
							} else if ((codePoint & 0xFFE00000) == 0) {
								// 4-byte sequence
								symbol = stringFromCharCode(codePoint >> 18 & 0x07 | 0xF0);
								symbol += createByte(codePoint, 12);
								symbol += createByte(codePoint, 6);
							}
							symbol += stringFromCharCode(codePoint & 0x3F | 0x80);
							return symbol;
						}

						function utf8encode(string) {
							var codePoints = ucs2decode(string);
							var length = codePoints.length;
							var index = -1;
							var codePoint;
							var byteString = '';
							while (++index < length) {
								codePoint = codePoints[index];
								byteString += encodeCodePoint(codePoint);
							}
							return byteString;
						}

						/*--------------------------------------------------------------------------*/

						function readContinuationByte() {
							if (byteIndex >= byteCount) {
								throw Error('Invalid byte index');
							}

							var continuationByte = byteArray[byteIndex] & 0xFF;
							byteIndex++;

							if ((continuationByte & 0xC0) == 0x80) {
								return continuationByte & 0x3F;
							}

							// If we end up here, it’s not a continuation byte
							throw Error('Invalid continuation byte');
						}

						function decodeSymbol() {
							var byte1;
							var byte2;
							var byte3;
							var byte4;
							var codePoint;

							if (byteIndex > byteCount) {
								throw Error('Invalid byte index');
							}

							if (byteIndex == byteCount) {
								return false;
							}

							// Read first byte
							byte1 = byteArray[byteIndex] & 0xFF;
							byteIndex++;

							// 1-byte sequence (no continuation bytes)
							if ((byte1 & 0x80) == 0) {
								return byte1;
							}

							// 2-byte sequence
							if ((byte1 & 0xE0) == 0xC0) {
								var byte2 = readContinuationByte();
								codePoint = (byte1 & 0x1F) << 6 | byte2;
								if (codePoint >= 0x80) {
									return codePoint;
								} else {
									throw Error('Invalid continuation byte');
								}
							}

							// 3-byte sequence (may include unpaired surrogates)
							if ((byte1 & 0xF0) == 0xE0) {
								byte2 = readContinuationByte();
								byte3 = readContinuationByte();
								codePoint = (byte1 & 0x0F) << 12 | byte2 << 6 | byte3;
								if (codePoint >= 0x0800) {
									checkScalarValue(codePoint);
									return codePoint;
								} else {
									throw Error('Invalid continuation byte');
								}
							}

							// 4-byte sequence
							if ((byte1 & 0xF8) == 0xF0) {
								byte2 = readContinuationByte();
								byte3 = readContinuationByte();
								byte4 = readContinuationByte();
								codePoint = (byte1 & 0x0F) << 0x12 | byte2 << 0x0C | byte3 << 0x06 | byte4;
								if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
									return codePoint;
								}
							}

							throw Error('Invalid UTF-8 detected');
						}

						var byteArray;
						var byteCount;
						var byteIndex;

						function utf8decode(byteString) {
							byteArray = ucs2decode(byteString);
							byteCount = byteArray.length;
							byteIndex = 0;
							var codePoints = [];
							var tmp;
							while ((tmp = decodeSymbol()) !== false) {
								codePoints.push(tmp);
							}
							return ucs2encode(codePoints);
						}

						/*--------------------------------------------------------------------------*/

						var utf8 = {
							'version': '2.0.0',
							'encode': utf8encode,
							'decode': utf8decode
						};

						// Some AMD build optimizers, like r.js, check for specific condition patterns
						// like the following:
						if (typeof define == 'function' && _typeof(define.amd) == 'object' && define.amd) {
							define(function () {
								return utf8;
							});
						} else if (freeExports && !freeExports.nodeType) {
							if (freeModule) {
								// in Node.js or RingoJS v0.8.0+
								freeModule.exports = utf8;
							} else {
								// in Narwhal or RingoJS v0.7.0-
								var object = {};
								var hasOwnProperty = object.hasOwnProperty;
								for (var key in utf8) {
									hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
								}
							}
						} else {
							// in Rhino or a web browser
							root.utf8 = utf8;
						}
					})(this);
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {}],
			30: [function (_dereq_, module, exports) {
				'use strict';

				var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''),
				    length = 64,
				    map = {},
				    seed = 0,
				    i = 0,
				    prev;

				/**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
				function encode(num) {
					var encoded = '';

					do {
						encoded = alphabet[num % length] + encoded;
						num = Math.floor(num / length);
					} while (num > 0);

					return encoded;
				}

				/**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */
				function decode(str) {
					var decoded = 0;

					for (i = 0; i < str.length; i++) {
						decoded = decoded * length + map[str.charAt(i)];
					}

					return decoded;
				}

				/**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
				function yeast() {
					var now = encode(+new Date());

					if (now !== prev) return seed = 0, prev = now;
					return now + '.' + encode(seed++);
				}

				//
				// Map each character to its index.
				//
				for (; i < length; i++) {
					map[alphabet[i]] = i;
				} //
				// Expose the `yeast`, `encode` and `decode` functions.
				//
				yeast.encode = encode;
				yeast.decode = decode;
				module.exports = yeast;
			}, {}],
			31: [function (_dereq_, module, exports) {

				/**
     * Module dependencies.
     */

				var url = _dereq_('./url');
				var parser = _dereq_('socket.io-parser');
				var Manager = _dereq_('./manager');
				var debug = _dereq_('debug')('socket.io-client');

				/**
     * Module exports.
     */

				module.exports = exports = lookup;

				/**
     * Managers cache.
     */

				var cache = exports.managers = {};

				/**
     * Looks up an existing `Manager` for multiplexing.
     * If the user summons:
     *
     *   `io('http://localhost/a');`
     *   `io('http://localhost/b');`
     *
     * We reuse the existing instance based on same scheme/port/host,
     * and we initialize sockets for each namespace.
     *
     * @api public
     */

				function lookup(uri, opts) {
					if ((typeof uri === "undefined" ? "undefined" : _typeof(uri)) == 'object') {
						opts = uri;
						uri = undefined;
					}

					opts = opts || {};

					var parsed = url(uri);
					var source = parsed.source;
					var id = parsed.id;
					var path = parsed.path;
					var sameNamespace = cache[id] && path in cache[id].nsps;
					var newConnection = opts.forceNew || opts['force new connection'] || false === opts.multiplex || sameNamespace;

					var io;

					if (newConnection) {
						debug('ignoring socket cache for %s', source);
						io = Manager(source, opts);
					} else {
						if (!cache[id]) {
							debug('new io instance for %s', source);
							cache[id] = Manager(source, opts);
						}
						io = cache[id];
					}

					return io.socket(parsed.path);
				}

				/**
     * Protocol version.
     *
     * @api public
     */

				exports.protocol = parser.protocol;

				/**
     * `connect`.
     *
     * @param {String} uri
     * @api public
     */

				exports.connect = lookup;

				/**
     * Expose constructors for standalone build.
     *
     * @api public
     */

				exports.Manager = _dereq_('./manager');
				exports.Socket = _dereq_('./socket');
			}, {
				"./manager": 32,
				"./socket": 34,
				"./url": 35,
				"debug": 39,
				"socket.io-parser": 47
			}],
			32: [function (_dereq_, module, exports) {

				/**
     * Module dependencies.
     */

				var eio = _dereq_('engine.io-client');
				var Socket = _dereq_('./socket');
				var Emitter = _dereq_('component-emitter');
				var parser = _dereq_('socket.io-parser');
				var on = _dereq_('./on');
				var bind = _dereq_('component-bind');
				var debug = _dereq_('debug')('socket.io-client:manager');
				var indexOf = _dereq_('indexof');
				var Backoff = _dereq_('backo2');

				/**
     * IE6+ hasOwnProperty
     */

				var has = Object.prototype.hasOwnProperty;

				/**
     * Module exports
     */

				module.exports = Manager;

				/**
     * `Manager` constructor.
     *
     * @param {String} engine instance or engine uri/opts
     * @param {Object} options
     * @api public
     */

				function Manager(uri, opts) {
					if (!(this instanceof Manager)) return new Manager(uri, opts);
					if (uri && 'object' == (typeof uri === "undefined" ? "undefined" : _typeof(uri))) {
						opts = uri;
						uri = undefined;
					}
					opts = opts || {};

					opts.path = opts.path || '/socket.io';
					this.nsps = {};
					this.subs = [];
					this.opts = opts;
					this.reconnection(opts.reconnection !== false);
					this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
					this.reconnectionDelay(opts.reconnectionDelay || 1000);
					this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
					this.randomizationFactor(opts.randomizationFactor || 0.5);
					this.backoff = new Backoff({
						min: this.reconnectionDelay(),
						max: this.reconnectionDelayMax(),
						jitter: this.randomizationFactor()
					});
					this.timeout(null == opts.timeout ? 20000 : opts.timeout);
					this.readyState = 'closed';
					this.uri = uri;
					this.connecting = [];
					this.lastPing = null;
					this.encoding = false;
					this.packetBuffer = [];
					this.encoder = new parser.Encoder();
					this.decoder = new parser.Decoder();
					this.autoConnect = opts.autoConnect !== false;
					if (this.autoConnect) this.open();
				}

				/**
     * Propagate given event to sockets and emit on `this`
     *
     * @api private
     */

				Manager.prototype.emitAll = function () {
					this.emit.apply(this, arguments);
					for (var nsp in this.nsps) {
						if (has.call(this.nsps, nsp)) {
							this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
						}
					}
				};

				/**
     * Update `socket.id` of all sockets
     *
     * @api private
     */

				Manager.prototype.updateSocketIds = function () {
					for (var nsp in this.nsps) {
						if (has.call(this.nsps, nsp)) {
							this.nsps[nsp].id = this.engine.id;
						}
					}
				};

				/**
     * Mix in `Emitter`.
     */

				Emitter(Manager.prototype);

				/**
     * Sets the `reconnection` config.
     *
     * @param {Boolean} true/false if it should automatically reconnect
     * @return {Manager} self or value
     * @api public
     */

				Manager.prototype.reconnection = function (v) {
					if (!arguments.length) return this._reconnection;
					this._reconnection = !!v;
					return this;
				};

				/**
     * Sets the reconnection attempts config.
     *
     * @param {Number} max reconnection attempts before giving up
     * @return {Manager} self or value
     * @api public
     */

				Manager.prototype.reconnectionAttempts = function (v) {
					if (!arguments.length) return this._reconnectionAttempts;
					this._reconnectionAttempts = v;
					return this;
				};

				/**
     * Sets the delay between reconnections.
     *
     * @param {Number} delay
     * @return {Manager} self or value
     * @api public
     */

				Manager.prototype.reconnectionDelay = function (v) {
					if (!arguments.length) return this._reconnectionDelay;
					this._reconnectionDelay = v;
					this.backoff && this.backoff.setMin(v);
					return this;
				};

				Manager.prototype.randomizationFactor = function (v) {
					if (!arguments.length) return this._randomizationFactor;
					this._randomizationFactor = v;
					this.backoff && this.backoff.setJitter(v);
					return this;
				};

				/**
     * Sets the maximum delay between reconnections.
     *
     * @param {Number} delay
     * @return {Manager} self or value
     * @api public
     */

				Manager.prototype.reconnectionDelayMax = function (v) {
					if (!arguments.length) return this._reconnectionDelayMax;
					this._reconnectionDelayMax = v;
					this.backoff && this.backoff.setMax(v);
					return this;
				};

				/**
     * Sets the connection timeout. `false` to disable
     *
     * @return {Manager} self or value
     * @api public
     */

				Manager.prototype.timeout = function (v) {
					if (!arguments.length) return this._timeout;
					this._timeout = v;
					return this;
				};

				/**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @api private
     */

				Manager.prototype.maybeReconnectOnOpen = function () {
					// Only try to reconnect if it's the first time we're connecting
					if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
						// keeps reconnection from firing twice for the same reconnection loop
						this.reconnect();
					}
				};

				/**
     * Sets the current transport `socket`.
     *
     * @param {Function} optional, callback
     * @return {Manager} self
     * @api public
     */

				Manager.prototype.open = Manager.prototype.connect = function (fn) {
					debug('readyState %s', this.readyState);
					if (~this.readyState.indexOf('open')) return this;

					debug('opening %s', this.uri);
					this.engine = eio(this.uri, this.opts);
					var socket = this.engine;
					var self = this;
					this.readyState = 'opening';
					this.skipReconnect = false;

					// emit `open`
					var openSub = on(socket, 'open', function () {
						self.onopen();
						fn && fn();
					});

					// emit `connect_error`
					var errorSub = on(socket, 'error', function (data) {
						debug('connect_error');
						self.cleanup();
						self.readyState = 'closed';
						self.emitAll('connect_error', data);
						if (fn) {
							var err = new Error('Connection error');
							err.data = data;
							fn(err);
						} else {
							// Only do this if there is no fn to handle the error
							self.maybeReconnectOnOpen();
						}
					});

					// emit `connect_timeout`
					if (false !== this._timeout) {
						var timeout = this._timeout;
						debug('connect attempt will timeout after %d', timeout);

						// set timer
						var timer = setTimeout(function () {
							debug('connect attempt timed out after %d', timeout);
							openSub.destroy();
							socket.close();
							socket.emit('error', 'timeout');
							self.emitAll('connect_timeout', timeout);
						}, timeout);

						this.subs.push({
							destroy: function destroy() {
								clearTimeout(timer);
							}
						});
					}

					this.subs.push(openSub);
					this.subs.push(errorSub);

					return this;
				};

				/**
     * Called upon transport open.
     *
     * @api private
     */

				Manager.prototype.onopen = function () {
					debug('open');

					// clear old subs
					this.cleanup();

					// mark as open
					this.readyState = 'open';
					this.emit('open');

					// add new subs
					var socket = this.engine;
					this.subs.push(on(socket, 'data', bind(this, 'ondata')));
					this.subs.push(on(socket, 'ping', bind(this, 'onping')));
					this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
					this.subs.push(on(socket, 'error', bind(this, 'onerror')));
					this.subs.push(on(socket, 'close', bind(this, 'onclose')));
					this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
				};

				/**
     * Called upon a ping.
     *
     * @api private
     */

				Manager.prototype.onping = function () {
					this.lastPing = new Date();
					this.emitAll('ping');
				};

				/**
     * Called upon a packet.
     *
     * @api private
     */

				Manager.prototype.onpong = function () {
					this.emitAll('pong', new Date() - this.lastPing);
				};

				/**
     * Called with data.
     *
     * @api private
     */

				Manager.prototype.ondata = function (data) {
					this.decoder.add(data);
				};

				/**
     * Called when parser fully decodes a packet.
     *
     * @api private
     */

				Manager.prototype.ondecoded = function (packet) {
					this.emit('packet', packet);
				};

				/**
     * Called upon socket error.
     *
     * @api private
     */

				Manager.prototype.onerror = function (err) {
					debug('error', err);
					this.emitAll('error', err);
				};

				/**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @api public
     */

				Manager.prototype.socket = function (nsp) {
					var socket = this.nsps[nsp];
					if (!socket) {
						socket = new Socket(this, nsp);
						this.nsps[nsp] = socket;
						var self = this;
						socket.on('connecting', onConnecting);
						socket.on('connect', function () {
							socket.id = self.engine.id;
						});

						if (this.autoConnect) {
							// manually call here since connecting evnet is fired before listening
							onConnecting();
						}
					}

					function onConnecting() {
						if (!~indexOf(self.connecting, socket)) {
							self.connecting.push(socket);
						}
					}

					return socket;
				};

				/**
     * Called upon a socket close.
     *
     * @param {Socket} socket
     */

				Manager.prototype.destroy = function (socket) {
					var index = indexOf(this.connecting, socket);
					if (~index) this.connecting.splice(index, 1);
					if (this.connecting.length) return;

					this.close();
				};

				/**
     * Writes a packet.
     *
     * @param {Object} packet
     * @api private
     */

				Manager.prototype.packet = function (packet) {
					debug('writing packet %j', packet);
					var self = this;

					if (!self.encoding) {
						// encode, then write to engine with result
						self.encoding = true;
						this.encoder.encode(packet, function (encodedPackets) {
							for (var i = 0; i < encodedPackets.length; i++) {
								self.engine.write(encodedPackets[i], packet.options);
							}
							self.encoding = false;
							self.processPacketQueue();
						});
					} else {
						// add packet to the queue
						self.packetBuffer.push(packet);
					}
				};

				/**
     * If packet buffer is non-empty, begins encoding the
     * next packet in line.
     *
     * @api private
     */

				Manager.prototype.processPacketQueue = function () {
					if (this.packetBuffer.length > 0 && !this.encoding) {
						var pack = this.packetBuffer.shift();
						this.packet(pack);
					}
				};

				/**
     * Clean up transport subscriptions and packet buffer.
     *
     * @api private
     */

				Manager.prototype.cleanup = function () {
					debug('cleanup');

					var sub;
					while (sub = this.subs.shift()) {
						sub.destroy();
					}this.packetBuffer = [];
					this.encoding = false;
					this.lastPing = null;

					this.decoder.destroy();
				};

				/**
     * Close the current socket.
     *
     * @api private
     */

				Manager.prototype.close = Manager.prototype.disconnect = function () {
					debug('disconnect');
					this.skipReconnect = true;
					this.reconnecting = false;
					if ('opening' == this.readyState) {
						// `onclose` will not fire because
						// an open event never happened
						this.cleanup();
					}
					this.backoff.reset();
					this.readyState = 'closed';
					if (this.engine) this.engine.close();
				};

				/**
     * Called upon engine close.
     *
     * @api private
     */

				Manager.prototype.onclose = function (reason) {
					debug('onclose');

					this.cleanup();
					this.backoff.reset();
					this.readyState = 'closed';
					this.emit('close', reason);

					if (this._reconnection && !this.skipReconnect) {
						this.reconnect();
					}
				};

				/**
     * Attempt a reconnection.
     *
     * @api private
     */

				Manager.prototype.reconnect = function () {
					if (this.reconnecting || this.skipReconnect) return this;

					var self = this;

					if (this.backoff.attempts >= this._reconnectionAttempts) {
						debug('reconnect failed');
						this.backoff.reset();
						this.emitAll('reconnect_failed');
						this.reconnecting = false;
					} else {
						var delay = this.backoff.duration();
						debug('will wait %dms before reconnect attempt', delay);

						this.reconnecting = true;
						var timer = setTimeout(function () {
							if (self.skipReconnect) return;

							debug('attempting reconnect');
							self.emitAll('reconnect_attempt', self.backoff.attempts);
							self.emitAll('reconnecting', self.backoff.attempts);

							// check again for the case socket closed in above events
							if (self.skipReconnect) return;

							self.open(function (err) {
								if (err) {
									debug('reconnect attempt error');
									self.reconnecting = false;
									self.reconnect();
									self.emitAll('reconnect_error', err.data);
								} else {
									debug('reconnect success');
									self.onreconnect();
								}
							});
						}, delay);

						this.subs.push({
							destroy: function destroy() {
								clearTimeout(timer);
							}
						});
					}
				};

				/**
     * Called upon successful reconnect.
     *
     * @api private
     */

				Manager.prototype.onreconnect = function () {
					var attempt = this.backoff.attempts;
					this.reconnecting = false;
					this.backoff.reset();
					this.updateSocketIds();
					this.emitAll('reconnect', attempt);
				};
			}, {
				"./on": 33,
				"./socket": 34,
				"backo2": 36,
				"component-bind": 37,
				"component-emitter": 38,
				"debug": 39,
				"engine.io-client": 1,
				"indexof": 42,
				"socket.io-parser": 47
			}],
			33: [function (_dereq_, module, exports) {

				/**
     * Module exports.
     */

				module.exports = on;

				/**
     * Helper for subscriptions.
     *
     * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
     * @param {String} event name
     * @param {Function} callback
     * @api public
     */

				function on(obj, ev, fn) {
					obj.on(ev, fn);
					return {
						destroy: function destroy() {
							obj.removeListener(ev, fn);
						}
					};
				}
			}, {}],
			34: [function (_dereq_, module, exports) {

				/**
     * Module dependencies.
     */

				var parser = _dereq_('socket.io-parser');
				var Emitter = _dereq_('component-emitter');
				var toArray = _dereq_('to-array');
				var on = _dereq_('./on');
				var bind = _dereq_('component-bind');
				var debug = _dereq_('debug')('socket.io-client:socket');
				var hasBin = _dereq_('has-binary');

				/**
     * Module exports.
     */

				module.exports = exports = Socket;

				/**
     * Internal events (blacklisted).
     * These events can't be emitted by the user.
     *
     * @api private
     */

				var events = {
					connect: 1,
					connect_error: 1,
					connect_timeout: 1,
					connecting: 1,
					disconnect: 1,
					error: 1,
					reconnect: 1,
					reconnect_attempt: 1,
					reconnect_failed: 1,
					reconnect_error: 1,
					reconnecting: 1,
					ping: 1,
					pong: 1
				};

				/**
     * Shortcut to `Emitter#emit`.
     */

				var emit = Emitter.prototype.emit;

				/**
     * `Socket` constructor.
     *
     * @api public
     */

				function Socket(io, nsp) {
					this.io = io;
					this.nsp = nsp;
					this.json = this; // compat
					this.ids = 0;
					this.acks = {};
					this.receiveBuffer = [];
					this.sendBuffer = [];
					this.connected = false;
					this.disconnected = true;
					if (this.io.autoConnect) this.open();
				}

				/**
     * Mix in `Emitter`.
     */

				Emitter(Socket.prototype);

				/**
     * Subscribe to open, close and packet events
     *
     * @api private
     */

				Socket.prototype.subEvents = function () {
					if (this.subs) return;

					var io = this.io;
					this.subs = [on(io, 'open', bind(this, 'onopen')), on(io, 'packet', bind(this, 'onpacket')), on(io, 'close', bind(this, 'onclose'))];
				};

				/**
     * "Opens" the socket.
     *
     * @api public
     */

				Socket.prototype.open = Socket.prototype.connect = function () {
					if (this.connected) return this;

					this.subEvents();
					this.io.open(); // ensure open
					if ('open' == this.io.readyState) this.onopen();
					this.emit('connecting');
					return this;
				};

				/**
     * Sends a `message` event.
     *
     * @return {Socket} self
     * @api public
     */

				Socket.prototype.send = function () {
					var args = toArray(arguments);
					args.unshift('message');
					this.emit.apply(this, args);
					return this;
				};

				/**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @param {String} event name
     * @return {Socket} self
     * @api public
     */

				Socket.prototype.emit = function (ev) {
					if (events.hasOwnProperty(ev)) {
						emit.apply(this, arguments);
						return this;
					}

					var args = toArray(arguments);
					var parserType = parser.EVENT; // default
					if (hasBin(args)) {
						parserType = parser.BINARY_EVENT;
					} // binary
					var packet = {
						type: parserType,
						data: args
					};

					packet.options = {};
					packet.options.compress = !this.flags || false !== this.flags.compress;

					// event ack callback
					if ('function' == typeof args[args.length - 1]) {
						debug('emitting packet with ack id %d', this.ids);
						this.acks[this.ids] = args.pop();
						packet.id = this.ids++;
					}

					if (this.connected) {
						this.packet(packet);
					} else {
						this.sendBuffer.push(packet);
					}

					delete this.flags;

					return this;
				};

				/**
     * Sends a packet.
     *
     * @param {Object} packet
     * @api private
     */

				Socket.prototype.packet = function (packet) {
					packet.nsp = this.nsp;
					this.io.packet(packet);
				};

				/**
     * Called upon engine `open`.
     *
     * @api private
     */

				Socket.prototype.onopen = function () {
					debug('transport is open - connecting');

					// write connect packet if necessary
					if ('/' != this.nsp) {
						this.packet({
							type: parser.CONNECT
						});
					}
				};

				/**
     * Called upon engine `close`.
     *
     * @param {String} reason
     * @api private
     */

				Socket.prototype.onclose = function (reason) {
					debug('close (%s)', reason);
					this.connected = false;
					this.disconnected = true;
					delete this.id;
					this.emit('disconnect', reason);
				};

				/**
     * Called with socket packet.
     *
     * @param {Object} packet
     * @api private
     */

				Socket.prototype.onpacket = function (packet) {
					if (packet.nsp != this.nsp) return;

					switch (packet.type) {
						case parser.CONNECT:
							this.onconnect();
							break;

						case parser.EVENT:
							this.onevent(packet);
							break;

						case parser.BINARY_EVENT:
							this.onevent(packet);
							break;

						case parser.ACK:
							this.onack(packet);
							break;

						case parser.BINARY_ACK:
							this.onack(packet);
							break;

						case parser.DISCONNECT:
							this.ondisconnect();
							break;

						case parser.ERROR:
							this.emit('error', packet.data);
							break;
					}
				};

				/**
     * Called upon a server event.
     *
     * @param {Object} packet
     * @api private
     */

				Socket.prototype.onevent = function (packet) {
					var args = packet.data || [];
					debug('emitting event %j', args);

					if (null != packet.id) {
						debug('attaching ack callback to event');
						args.push(this.ack(packet.id));
					}

					if (this.connected) {
						emit.apply(this, args);
					} else {
						this.receiveBuffer.push(args);
					}
				};

				/**
     * Produces an ack callback to emit with an event.
     *
     * @api private
     */

				Socket.prototype.ack = function (id) {
					var self = this;
					var sent = false;
					return function () {
						// prevent double callbacks
						if (sent) return;
						sent = true;
						var args = toArray(arguments);
						debug('sending ack %j', args);

						var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
						self.packet({
							type: type,
							id: id,
							data: args
						});
					};
				};

				/**
     * Called upon a server acknowlegement.
     *
     * @param {Object} packet
     * @api private
     */

				Socket.prototype.onack = function (packet) {
					var ack = this.acks[packet.id];
					if ('function' == typeof ack) {
						debug('calling ack %s with %j', packet.id, packet.data);
						ack.apply(this, packet.data);
						delete this.acks[packet.id];
					} else {
						debug('bad ack %s', packet.id);
					}
				};

				/**
     * Called upon server connect.
     *
     * @api private
     */

				Socket.prototype.onconnect = function () {
					this.connected = true;
					this.disconnected = false;
					this.emit('connect');
					this.emitBuffered();
				};

				/**
     * Emit buffered events (received and emitted).
     *
     * @api private
     */

				Socket.prototype.emitBuffered = function () {
					var i;
					for (i = 0; i < this.receiveBuffer.length; i++) {
						emit.apply(this, this.receiveBuffer[i]);
					}
					this.receiveBuffer = [];

					for (i = 0; i < this.sendBuffer.length; i++) {
						this.packet(this.sendBuffer[i]);
					}
					this.sendBuffer = [];
				};

				/**
     * Called upon server disconnect.
     *
     * @api private
     */

				Socket.prototype.ondisconnect = function () {
					debug('server disconnect (%s)', this.nsp);
					this.destroy();
					this.onclose('io server disconnect');
				};

				/**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @api private.
     */

				Socket.prototype.destroy = function () {
					if (this.subs) {
						// clean subscriptions to avoid reconnections
						for (var i = 0; i < this.subs.length; i++) {
							this.subs[i].destroy();
						}
						this.subs = null;
					}

					this.io.destroy(this);
				};

				/**
     * Disconnects the socket manually.
     *
     * @return {Socket} self
     * @api public
     */

				Socket.prototype.close = Socket.prototype.disconnect = function () {
					if (this.connected) {
						debug('performing disconnect (%s)', this.nsp);
						this.packet({
							type: parser.DISCONNECT
						});
					}

					// remove socket from pool
					this.destroy();

					if (this.connected) {
						// fire events
						this.onclose('io client disconnect');
					}
					return this;
				};

				/**
     * Sets the compress flag.
     *
     * @param {Boolean} if `true`, compresses the sending data
     * @return {Socket} self
     * @api public
     */

				Socket.prototype.compress = function (compress) {
					this.flags = this.flags || {};
					this.flags.compress = compress;
					return this;
				};
			}, {
				"./on": 33,
				"component-bind": 37,
				"component-emitter": 38,
				"debug": 39,
				"has-binary": 41,
				"socket.io-parser": 47,
				"to-array": 51
			}],
			35: [function (_dereq_, module, exports) {
				(function (global) {

					/**
      * Module dependencies.
      */

					var parseuri = _dereq_('parseuri');
					var debug = _dereq_('debug')('socket.io-client:url');

					/**
      * Module exports.
      */

					module.exports = url;

					/**
      * URL parser.
      *
      * @param {String} url
      * @param {Object} An object meant to mimic window.location.
      *                 Defaults to window.location.
      * @api public
      */

					function url(uri, loc) {
						var obj = uri;

						// default to window.location
						var loc = loc || global.location;
						if (null == uri) uri = loc.protocol + '//' + loc.host;

						// relative path support
						if ('string' == typeof uri) {
							if ('/' == uri.charAt(0)) {
								if ('/' == uri.charAt(1)) {
									uri = loc.protocol + uri;
								} else {
									uri = loc.host + uri;
								}
							}

							if (!/^(https?|wss?):\/\//.test(uri)) {
								debug('protocol-less url %s', uri);
								if ('undefined' != typeof loc) {
									uri = loc.protocol + '//' + uri;
								} else {
									uri = 'https://' + uri;
								}
							}

							// parse
							debug('parse %s', uri);
							obj = parseuri(uri);
						}

						// make sure we treat `localhost:80` and `localhost` equally
						if (!obj.port) {
							if (/^(http|ws)$/.test(obj.protocol)) {
								obj.port = '80';
							} else if (/^(http|ws)s$/.test(obj.protocol)) {
								obj.port = '443';
							}
						}

						obj.path = obj.path || '/';

						var ipv6 = obj.host.indexOf(':') !== -1;
						var host = ipv6 ? '[' + obj.host + ']' : obj.host;

						// define unique id
						obj.id = obj.protocol + '://' + host + ':' + obj.port;
						// define href
						obj.href = obj.protocol + '://' + host + (loc && loc.port == obj.port ? '' : ':' + obj.port);

						return obj;
					}
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"debug": 39,
				"parseuri": 45
			}],
			36: [function (_dereq_, module, exports) {

				/**
     * Expose `Backoff`.
     */

				module.exports = Backoff;

				/**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

				function Backoff(opts) {
					opts = opts || {};
					this.ms = opts.min || 100;
					this.max = opts.max || 10000;
					this.factor = opts.factor || 2;
					this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
					this.attempts = 0;
				}

				/**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

				Backoff.prototype.duration = function () {
					var ms = this.ms * Math.pow(this.factor, this.attempts++);
					if (this.jitter) {
						var rand = Math.random();
						var deviation = Math.floor(rand * this.jitter * ms);
						ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
					}
					return Math.min(ms, this.max) | 0;
				};

				/**
     * Reset the number of attempts.
     *
     * @api public
     */

				Backoff.prototype.reset = function () {
					this.attempts = 0;
				};

				/**
     * Set the minimum duration
     *
     * @api public
     */

				Backoff.prototype.setMin = function (min) {
					this.ms = min;
				};

				/**
     * Set the maximum duration
     *
     * @api public
     */

				Backoff.prototype.setMax = function (max) {
					this.max = max;
				};

				/**
     * Set the jitter
     *
     * @api public
     */

				Backoff.prototype.setJitter = function (jitter) {
					this.jitter = jitter;
				};
			}, {}],
			37: [function (_dereq_, module, exports) {
				/**
     * Slice reference.
     */

				var slice = [].slice;

				/**
     * Bind `obj` to `fn`.
     *
     * @param {Object} obj
     * @param {Function|String} fn or string
     * @return {Function}
     * @api public
     */

				module.exports = function (obj, fn) {
					if ('string' == typeof fn) fn = obj[fn];
					if ('function' != typeof fn) throw new Error('bind() requires a function');
					var args = slice.call(arguments, 2);
					return function () {
						return fn.apply(obj, args.concat(slice.call(arguments)));
					};
				};
			}, {}],
			38: [function (_dereq_, module, exports) {

				/**
     * Expose `Emitter`.
     */

				module.exports = Emitter;

				/**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

				function Emitter(obj) {
					if (obj) return mixin(obj);
				};

				/**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

				function mixin(obj) {
					for (var key in Emitter.prototype) {
						obj[key] = Emitter.prototype[key];
					}
					return obj;
				}

				/**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

				Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
					this._callbacks = this._callbacks || {};
					(this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
					return this;
				};

				/**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

				Emitter.prototype.once = function (event, fn) {
					function on() {
						this.off(event, on);
						fn.apply(this, arguments);
					}

					on.fn = fn;
					this.on(event, on);
					return this;
				};

				/**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

				Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
					this._callbacks = this._callbacks || {};

					// all
					if (0 == arguments.length) {
						this._callbacks = {};
						return this;
					}

					// specific event
					var callbacks = this._callbacks['$' + event];
					if (!callbacks) return this;

					// remove all handlers
					if (1 == arguments.length) {
						delete this._callbacks['$' + event];
						return this;
					}

					// remove specific handler
					var cb;
					for (var i = 0; i < callbacks.length; i++) {
						cb = callbacks[i];
						if (cb === fn || cb.fn === fn) {
							callbacks.splice(i, 1);
							break;
						}
					}
					return this;
				};

				/**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

				Emitter.prototype.emit = function (event) {
					this._callbacks = this._callbacks || {};
					var args = [].slice.call(arguments, 1),
					    callbacks = this._callbacks['$' + event];

					if (callbacks) {
						callbacks = callbacks.slice(0);
						for (var i = 0, len = callbacks.length; i < len; ++i) {
							callbacks[i].apply(this, args);
						}
					}

					return this;
				};

				/**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

				Emitter.prototype.listeners = function (event) {
					this._callbacks = this._callbacks || {};
					return this._callbacks['$' + event] || [];
				};

				/**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

				Emitter.prototype.hasListeners = function (event) {
					return !!this.listeners(event).length;
				};
			}, {}],
			39: [function (_dereq_, module, exports) {
				arguments[4][17][0].apply(exports, arguments);
			}, {
				"./debug": 40,
				"dup": 17
			}],
			40: [function (_dereq_, module, exports) {
				arguments[4][18][0].apply(exports, arguments);
			}, {
				"dup": 18,
				"ms": 44
			}],
			41: [function (_dereq_, module, exports) {
				(function (global) {

					/*
      * Module requirements.
      */

					var isArray = _dereq_('isarray');

					/**
      * Module exports.
      */

					module.exports = hasBinary;

					/**
      * Checks for binary data.
      *
      * Right now only Buffer and ArrayBuffer are supported..
      *
      * @param {Object} anything
      * @api public
      */

					function hasBinary(data) {

						function _hasBinary(obj) {
							if (!obj) return false;

							if (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer || global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
								return true;
							}

							if (isArray(obj)) {
								for (var i = 0; i < obj.length; i++) {
									if (_hasBinary(obj[i])) {
										return true;
									}
								}
							} else if (obj && 'object' == (typeof obj === "undefined" ? "undefined" : _typeof(obj))) {
								// see: https://github.com/Automattic/has-binary/pull/4
								if (obj.toJSON && 'function' == typeof obj.toJSON) {
									obj = obj.toJSON();
								}

								for (var key in obj) {
									if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
										return true;
									}
								}
							}

							return false;
						}

						return _hasBinary(data);
					}
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"isarray": 43
			}],
			42: [function (_dereq_, module, exports) {
				arguments[4][23][0].apply(exports, arguments);
			}, {
				"dup": 23
			}],
			43: [function (_dereq_, module, exports) {
				arguments[4][24][0].apply(exports, arguments);
			}, {
				"dup": 24
			}],
			44: [function (_dereq_, module, exports) {
				arguments[4][25][0].apply(exports, arguments);
			}, {
				"dup": 25
			}],
			45: [function (_dereq_, module, exports) {
				arguments[4][28][0].apply(exports, arguments);
			}, {
				"dup": 28
			}],
			46: [function (_dereq_, module, exports) {
				(function (global) {
					/*global Blob,File*/

					/**
      * Module requirements
      */

					var isArray = _dereq_('isarray');
					var isBuf = _dereq_('./is-buffer');

					/**
      * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
      * Anything with blobs or files should be fed through removeBlobs before coming
      * here.
      *
      * @param {Object} packet - socket.io event packet
      * @return {Object} with deconstructed packet and list of buffers
      * @api public
      */

					exports.deconstructPacket = function (packet) {
						var buffers = [];
						var packetData = packet.data;

						function _deconstructPacket(data) {
							if (!data) return data;

							if (isBuf(data)) {
								var placeholder = {
									_placeholder: true,
									num: buffers.length
								};
								buffers.push(data);
								return placeholder;
							} else if (isArray(data)) {
								var newData = new Array(data.length);
								for (var i = 0; i < data.length; i++) {
									newData[i] = _deconstructPacket(data[i]);
								}
								return newData;
							} else if ('object' == (typeof data === "undefined" ? "undefined" : _typeof(data)) && !(data instanceof Date)) {
								var newData = {};
								for (var key in data) {
									newData[key] = _deconstructPacket(data[key]);
								}
								return newData;
							}
							return data;
						}

						var pack = packet;
						pack.data = _deconstructPacket(packetData);
						pack.attachments = buffers.length; // number of binary 'attachments'
						return {
							packet: pack,
							buffers: buffers
						};
					};

					/**
      * Reconstructs a binary packet from its placeholder packet and buffers
      *
      * @param {Object} packet - event packet with placeholders
      * @param {Array} buffers - binary buffers to put in placeholder positions
      * @return {Object} reconstructed packet
      * @api public
      */

					exports.reconstructPacket = function (packet, buffers) {
						var curPlaceHolder = 0;

						function _reconstructPacket(data) {
							if (data && data._placeholder) {
								var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
								return buf;
							} else if (isArray(data)) {
								for (var i = 0; i < data.length; i++) {
									data[i] = _reconstructPacket(data[i]);
								}
								return data;
							} else if (data && 'object' == (typeof data === "undefined" ? "undefined" : _typeof(data))) {
								for (var key in data) {
									data[key] = _reconstructPacket(data[key]);
								}
								return data;
							}
							return data;
						}

						packet.data = _reconstructPacket(packet.data);
						packet.attachments = undefined; // no longer useful
						return packet;
					};

					/**
      * Asynchronously removes Blobs or Files from data via
      * FileReader's readAsArrayBuffer method. Used before encoding
      * data as msgpack. Calls callback with the blobless data.
      *
      * @param {Object} data
      * @param {Function} callback
      * @api private
      */

					exports.removeBlobs = function (data, callback) {
						function _removeBlobs(obj, curKey, containingObject) {
							if (!obj) return obj;

							// convert any blob
							if (global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
								pendingBlobs++;

								// async filereader
								var fileReader = new FileReader();
								fileReader.onload = function () {
									// this.result == arraybuffer
									if (containingObject) {
										containingObject[curKey] = this.result;
									} else {
										bloblessData = this.result;
									}

									// if nothing pending its callback time
									if (! --pendingBlobs) {
										callback(bloblessData);
									}
								};

								fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
							} else if (isArray(obj)) {
								// handle array
								for (var i = 0; i < obj.length; i++) {
									_removeBlobs(obj[i], i, obj);
								}
							} else if (obj && 'object' == (typeof obj === "undefined" ? "undefined" : _typeof(obj)) && !isBuf(obj)) {
								// and object
								for (var key in obj) {
									_removeBlobs(obj[key], key, obj);
								}
							}
						}

						var pendingBlobs = 0;
						var bloblessData = data;
						_removeBlobs(bloblessData);
						if (!pendingBlobs) {
							callback(bloblessData);
						}
					};
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {
				"./is-buffer": 48,
				"isarray": 43
			}],
			47: [function (_dereq_, module, exports) {

				/**
     * Module dependencies.
     */

				var debug = _dereq_('debug')('socket.io-parser');
				var json = _dereq_('json3');
				var isArray = _dereq_('isarray');
				var Emitter = _dereq_('component-emitter');
				var binary = _dereq_('./binary');
				var isBuf = _dereq_('./is-buffer');

				/**
     * Protocol version.
     *
     * @api public
     */

				exports.protocol = 4;

				/**
     * Packet types.
     *
     * @api public
     */

				exports.types = ['CONNECT', 'DISCONNECT', 'EVENT', 'BINARY_EVENT', 'ACK', 'BINARY_ACK', 'ERROR'];

				/**
     * Packet type `connect`.
     *
     * @api public
     */

				exports.CONNECT = 0;

				/**
     * Packet type `disconnect`.
     *
     * @api public
     */

				exports.DISCONNECT = 1;

				/**
     * Packet type `event`.
     *
     * @api public
     */

				exports.EVENT = 2;

				/**
     * Packet type `ack`.
     *
     * @api public
     */

				exports.ACK = 3;

				/**
     * Packet type `error`.
     *
     * @api public
     */

				exports.ERROR = 4;

				/**
     * Packet type 'binary event'
     *
     * @api public
     */

				exports.BINARY_EVENT = 5;

				/**
     * Packet type `binary ack`. For acks with binary arguments.
     *
     * @api public
     */

				exports.BINARY_ACK = 6;

				/**
     * Encoder constructor.
     *
     * @api public
     */

				exports.Encoder = Encoder;

				/**
     * Decoder constructor.
     *
     * @api public
     */

				exports.Decoder = Decoder;

				/**
     * A socket.io Encoder instance
     *
     * @api public
     */

				function Encoder() {}

				/**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     * @param {Function} callback - function to handle encodings (likely engine.write)
     * @return Calls callback with Array of encodings
     * @api public
     */

				Encoder.prototype.encode = function (obj, callback) {
					debug('encoding packet %j', obj);

					if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
						encodeAsBinary(obj, callback);
					} else {
						var encoding = encodeAsString(obj);
						callback([encoding]);
					}
				};

				/**
     * Encode packet as string.
     *
     * @param {Object} packet
     * @return {String} encoded
     * @api private
     */

				function encodeAsString(obj) {
					var str = '';
					var nsp = false;

					// first is type
					str += obj.type;

					// attachments if we have them
					if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
						str += obj.attachments;
						str += '-';
					}

					// if we have a namespace other than `/`
					// we append it followed by a comma `,`
					if (obj.nsp && '/' != obj.nsp) {
						nsp = true;
						str += obj.nsp;
					}

					// immediately followed by the id
					if (null != obj.id) {
						if (nsp) {
							str += ',';
							nsp = false;
						}
						str += obj.id;
					}

					// json data
					if (null != obj.data) {
						if (nsp) str += ',';
						str += json.stringify(obj.data);
					}

					debug('encoded %j as %s', obj, str);
					return str;
				}

				/**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     *
     * @param {Object} packet
     * @return {Buffer} encoded
     * @api private
     */

				function encodeAsBinary(obj, callback) {

					function writeEncoding(bloblessData) {
						var deconstruction = binary.deconstructPacket(bloblessData);
						var pack = encodeAsString(deconstruction.packet);
						var buffers = deconstruction.buffers;

						buffers.unshift(pack); // add packet info to beginning of data list
						callback(buffers); // write all the buffers
					}

					binary.removeBlobs(obj, writeEncoding);
				}

				/**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     * @api public
     */

				function Decoder() {
					this.reconstructor = null;
				}

				/**
     * Mix in `Emitter` with Decoder.
     */

				Emitter(Decoder.prototype);

				/**
     * Decodes an ecoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     * @return {Object} packet
     * @api public
     */

				Decoder.prototype.add = function (obj) {
					var packet;
					if ('string' == typeof obj) {
						packet = decodeString(obj);
						if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) {
							// binary packet's json
							this.reconstructor = new BinaryReconstructor(packet);

							// no attachments, labeled binary but no binary data to follow
							if (this.reconstructor.reconPack.attachments === 0) {
								this.emit('decoded', packet);
							}
						} else {
							// non-binary full packet
							this.emit('decoded', packet);
						}
					} else if (isBuf(obj) || obj.base64) {
						// raw binary data
						if (!this.reconstructor) {
							throw new Error('got binary data when not reconstructing a packet');
						} else {
							packet = this.reconstructor.takeBinaryData(obj);
							if (packet) {
								// received final buffer
								this.reconstructor = null;
								this.emit('decoded', packet);
							}
						}
					} else {
						throw new Error('Unknown type: ' + obj);
					}
				};

				/**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     * @api private
     */

				function decodeString(str) {
					var p = {};
					var i = 0;

					// look up type
					p.type = Number(str.charAt(0));
					if (null == exports.types[p.type]) return error();

					// look up attachments if type binary
					if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
						var buf = '';
						while (str.charAt(++i) != '-') {
							buf += str.charAt(i);
							if (i == str.length) break;
						}
						if (buf != Number(buf) || str.charAt(i) != '-') {
							throw new Error('Illegal attachments');
						}
						p.attachments = Number(buf);
					}

					// look up namespace (if any)
					if ('/' == str.charAt(i + 1)) {
						p.nsp = '';
						while (++i) {
							var c = str.charAt(i);
							if (',' == c) break;
							p.nsp += c;
							if (i == str.length) break;
						}
					} else {
						p.nsp = '/';
					}

					// look up id
					var next = str.charAt(i + 1);
					if ('' !== next && Number(next) == next) {
						p.id = '';
						while (++i) {
							var c = str.charAt(i);
							if (null == c || Number(c) != c) {
								--i;
								break;
							}
							p.id += str.charAt(i);
							if (i == str.length) break;
						}
						p.id = Number(p.id);
					}

					// look up json data
					if (str.charAt(++i)) {
						try {
							p.data = json.parse(str.substr(i));
						} catch (e) {
							return error();
						}
					}

					debug('decoded %s as %j', str, p);
					return p;
				}

				/**
     * Deallocates a parser's resources
     *
     * @api public
     */

				Decoder.prototype.destroy = function () {
					if (this.reconstructor) {
						this.reconstructor.finishedReconstruction();
					}
				};

				/**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     * @api private
     */

				function BinaryReconstructor(packet) {
					this.reconPack = packet;
					this.buffers = [];
				}

				/**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     * @api private
     */

				BinaryReconstructor.prototype.takeBinaryData = function (binData) {
					this.buffers.push(binData);
					if (this.buffers.length == this.reconPack.attachments) {
						// done with buffer list
						var packet = binary.reconstructPacket(this.reconPack, this.buffers);
						this.finishedReconstruction();
						return packet;
					}
					return null;
				};

				/**
     * Cleans up binary packet reconstruction variables.
     *
     * @api private
     */

				BinaryReconstructor.prototype.finishedReconstruction = function () {
					this.reconPack = null;
					this.buffers = [];
				};

				function error(data) {
					return {
						type: exports.ERROR,
						data: 'parser error'
					};
				}
			}, {
				"./binary": 46,
				"./is-buffer": 48,
				"component-emitter": 49,
				"debug": 39,
				"isarray": 43,
				"json3": 50
			}],
			48: [function (_dereq_, module, exports) {
				(function (global) {

					module.exports = isBuf;

					/**
      * Returns true if obj is a buffer or an arraybuffer.
      *
      * @api private
      */

					function isBuf(obj) {
						return global.Buffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer;
					}
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {}],
			49: [function (_dereq_, module, exports) {
				arguments[4][15][0].apply(exports, arguments);
			}, {
				"dup": 15
			}],
			50: [function (_dereq_, module, exports) {
				(function (global) {
					/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
					;
					(function () {
						// Detect the `define` function exposed by asynchronous module loaders. The
						// strict `define` check is necessary for compatibility with `r.js`.
						var isLoader = typeof define === "function" && define.amd;

						// A set of types used to distinguish objects from primitives.
						var objectTypes = {
							"function": true,
							"object": true
						};

						// Detect the `exports` object exposed by CommonJS implementations.
						var freeExports = objectTypes[typeof exports === "undefined" ? "undefined" : _typeof(exports)] && exports && !exports.nodeType && exports;

						// Use the `global` object exposed by Node (including Browserify via
						// `insert-module-globals`), Narwhal, and Ringo as the default context,
						// and the `window` object in browsers. Rhino exports a `global` function
						// instead.
						var root = objectTypes[typeof window === "undefined" ? "undefined" : _typeof(window)] && window || this,
						    freeGlobal = freeExports && objectTypes[typeof module === "undefined" ? "undefined" : _typeof(module)] && module && !module.nodeType && (typeof global === "undefined" ? "undefined" : _typeof(global)) == "object" && global;

						if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
							root = freeGlobal;
						}

						// Public: Initializes JSON 3 using the given `context` object, attaching the
						// `stringify` and `parse` functions to the specified `exports` object.
						function runInContext(context, exports) {
							context || (context = root["Object"]());
							exports || (exports = root["Object"]());

							// Native constructor aliases.
							var Number = context["Number"] || root["Number"],
							    String = context["String"] || root["String"],
							    Object = context["Object"] || root["Object"],
							    Date = context["Date"] || root["Date"],
							    SyntaxError = context["SyntaxError"] || root["SyntaxError"],
							    TypeError = context["TypeError"] || root["TypeError"],
							    Math = context["Math"] || root["Math"],
							    nativeJSON = context["JSON"] || root["JSON"];

							// Delegate to the native `stringify` and `parse` implementations.
							if ((typeof nativeJSON === "undefined" ? "undefined" : _typeof(nativeJSON)) == "object" && nativeJSON) {
								exports.stringify = nativeJSON.stringify;
								exports.parse = nativeJSON.parse;
							}

							// Convenience aliases.
							var objectProto = Object.prototype,
							    getClass = objectProto.toString,
							    _isProperty,
							    _forEach,
							    undef;

							// Test the `Date#getUTC*` methods. Based on work by @Yaffle.
							var isExtended = new Date(-3509827334573292);
							try {
								// The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
								// results for certain dates in Opera >= 10.53.
								isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
								// Safari < 2.0.2 stores the internal millisecond time value correctly,
								// but clips the values returned by the date methods to the range of
								// signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
								isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
							} catch (exception) {}

							// Internal: Determines whether the native `JSON.stringify` and `parse`
							// implementations are spec-compliant. Based on work by Ken Snyder.
							function has(name) {
								if (has[name] !== undef) {
									// Return cached feature test result.
									return has[name];
								}
								var isSupported;
								if (name == "bug-string-char-index") {
									// IE <= 7 doesn't support accessing string characters using square
									// bracket notation. IE 8 only supports this for primitives.
									isSupported = "a"[0] != "a";
								} else if (name == "json") {
									// Indicates whether both `JSON.stringify` and `JSON.parse` are
									// supported.
									isSupported = has("json-stringify") && has("json-parse");
								} else {
									var value,
									    serialized = "{\"a\":[1,true,false,null,\"\\u0000\\b\\n\\f\\r\\t\"]}";
									// Test `JSON.stringify`.
									if (name == "json-stringify") {
										var stringify = exports.stringify,
										    stringifySupported = typeof stringify == "function" && isExtended;
										if (stringifySupported) {
											// A test function object with a custom `toJSON` method.
											(value = function value() {
												return 1;
											}).toJSON = value;
											try {
												stringifySupported =
												// Firefox 3.1b1 and b2 serialize string, number, and boolean
												// primitives as object literals.
												stringify(0) === "0" &&
												// FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
												// literals.
												stringify(new Number()) === "0" && stringify(new String()) == '""' &&
												// FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
												// does not define a canonical JSON representation (this applies to
												// objects with `toJSON` properties as well, *unless* they are nested
												// within an object or array).
												stringify(getClass) === undef &&
												// IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
												// FF 3.1b3 pass this test.
												stringify(undef) === undef &&
												// Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
												// respectively, if the value is omitted entirely.
												stringify() === undef &&
												// FF 3.1b1, 2 throw an error if the given value is not a number,
												// string, array, object, Boolean, or `null` literal. This applies to
												// objects with custom `toJSON` methods as well, unless they are nested
												// inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
												// methods entirely.
												stringify(value) === "1" && stringify([value]) == "[1]" &&
												// Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
												// `"[null]"`.
												stringify([undef]) == "[null]" &&
												// YUI 3.0.0b1 fails to serialize `null` literals.
												stringify(null) == "null" &&
												// FF 3.1b1, 2 halts serialization if an array contains a function:
												// `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
												// elides non-JSON values from objects and arrays, unless they
												// define custom `toJSON` methods.
												stringify([undef, getClass, null]) == "[null,null,null]" &&
												// Simple serialization test. FF 3.1b1 uses Unicode escape sequences
												// where character escape codes are expected (e.g., `\b` => `\u0008`).
												stringify({
													"a": [value, true, false, null, "\x00\b\n\f\r\t"]
												}) == serialized &&
												// FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
												stringify(null, value) === "1" && stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
												// JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
												// serialize extended years.
												stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
												// The milliseconds are optional in ES 5, but required in 5.1.
												stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
												// Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
												// four-digit years instead of six-digit years. Credits: @Yaffle.
												stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
												// Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
												// values less than 1000. Credits: @Yaffle.
												stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
											} catch (exception) {
												stringifySupported = false;
											}
										}
										isSupported = stringifySupported;
									}
									// Test `JSON.parse`.
									if (name == "json-parse") {
										var parse = exports.parse;
										if (typeof parse == "function") {
											try {
												// FF 3.1b1, b2 will throw an exception if a bare literal is provided.
												// Conforming implementations should also coerce the initial argument to
												// a string prior to parsing.
												if (parse("0") === 0 && !parse(false)) {
													// Simple parsing test.
													value = parse(serialized);
													var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
													if (parseSupported) {
														try {
															// Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
															parseSupported = !parse('"\t"');
														} catch (exception) {}
														if (parseSupported) {
															try {
																// FF 4.0 and 4.0.1 allow leading `+` signs and leading
																// decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
																// certain octal literals.
																parseSupported = parse("01") !== 1;
															} catch (exception) {}
														}
														if (parseSupported) {
															try {
																// FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
																// points. These environments, along with FF 3.1b1 and 2,
																// also allow trailing commas in JSON objects and arrays.
																parseSupported = parse("1.") !== 1;
															} catch (exception) {}
														}
													}
												}
											} catch (exception) {
												parseSupported = false;
											}
										}
										isSupported = parseSupported;
									}
								}
								return has[name] = !!isSupported;
							}

							if (!has("json")) {
								// Common `[[Class]]` name aliases.
								var functionClass = "[object Function]",
								    dateClass = "[object Date]",
								    numberClass = "[object Number]",
								    stringClass = "[object String]",
								    arrayClass = "[object Array]",
								    booleanClass = "[object Boolean]";

								// Detect incomplete support for accessing string characters by index.
								var charIndexBuggy = has("bug-string-char-index");

								// Define additional utility methods if the `Date` methods are buggy.
								if (!isExtended) {
									var floor = Math.floor;
									// A mapping between the months of the year and the number of days between
									// January 1st and the first of the respective month.
									var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
									// Internal: Calculates the number of days between the Unix epoch and the
									// first day of the given month.
									var getDay = function getDay(year, month) {
										return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
									};
								}

								// Internal: Determines if a property is a direct property of the given
								// object. Delegates to the native `Object#hasOwnProperty` method.
								if (!(_isProperty = objectProto.hasOwnProperty)) {
									_isProperty = function isProperty(property) {
										var members = {},
										    constructor;
										if ((members.__proto__ = null, members.__proto__ = {
											// The *proto* property cannot be set multiple times in recent
											// versions of Firefox and SeaMonkey.
											"toString": 1
										}, members).toString != getClass) {
											// Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
											// supports the mutable *proto* property.
											_isProperty = function isProperty(property) {
												// Capture and break the object's prototype chain (see section 8.6.2
												// of the ES 5.1 spec). The parenthesized expression prevents an
												// unsafe transformation by the Closure Compiler.
												var original = this.__proto__,
												    result = property in (this.__proto__ = null, this);
												// Restore the original prototype chain.
												this.__proto__ = original;
												return result;
											};
										} else {
											// Capture a reference to the top-level `Object` constructor.
											constructor = members.constructor;
											// Use the `constructor` property to simulate `Object#hasOwnProperty` in
											// other environments.
											_isProperty = function isProperty(property) {
												var parent = (this.constructor || constructor).prototype;
												return property in this && !(property in parent && this[property] === parent[property]);
											};
										}
										members = null;
										return _isProperty.call(this, property);
									};
								}

								// Internal: Normalizes the `for...in` iteration algorithm across
								// environments. Each enumerated key is yielded to a `callback` function.
								_forEach = function forEach(object, callback) {
									var size = 0,
									    Properties,
									    members,
									    property;

									// Tests for bugs in the current environment's `for...in` algorithm. The
									// `valueOf` property inherits the non-enumerable flag from
									// `Object.prototype` in older versions of IE, Netscape, and Mozilla.
									(Properties = function Properties() {
										this.valueOf = 0;
									}).prototype.valueOf = 0;

									// Iterate over a new instance of the `Properties` class.
									members = new Properties();
									for (property in members) {
										// Ignore all properties inherited from `Object.prototype`.
										if (_isProperty.call(members, property)) {
											size++;
										}
									}
									Properties = members = null;

									// Normalize the iteration algorithm.
									if (!size) {
										// A list of non-enumerable properties inherited from `Object.prototype`.
										members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
										// IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
										// properties.
										_forEach = function forEach(object, callback) {
											var isFunction = getClass.call(object) == functionClass,
											    property,
											    length;
											var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[_typeof(object.hasOwnProperty)] && object.hasOwnProperty || _isProperty;
											for (property in object) {
												// Gecko <= 1.0 enumerates the `prototype` property of functions under
												// certain conditions; IE does not.
												if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
													callback(property);
												}
											}
											// Manually invoke the callback for each non-enumerable property.
											for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property)) {}
										};
									} else if (size == 2) {
										// Safari <= 2.0.4 enumerates shadowed properties twice.
										_forEach = function forEach(object, callback) {
											// Create a set of iterated properties.
											var members = {},
											    isFunction = getClass.call(object) == functionClass,
											    property;
											for (property in object) {
												// Store each property name to prevent double enumeration. The
												// `prototype` property of functions is not enumerated due to cross-
												// environment inconsistencies.
												if (!(isFunction && property == "prototype") && !_isProperty.call(members, property) && (members[property] = 1) && _isProperty.call(object, property)) {
													callback(property);
												}
											}
										};
									} else {
										// No bugs detected; use the standard `for...in` algorithm.
										_forEach = function forEach(object, callback) {
											var isFunction = getClass.call(object) == functionClass,
											    property,
											    isConstructor;
											for (property in object) {
												if (!(isFunction && property == "prototype") && _isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
													callback(property);
												}
											}
											// Manually invoke the callback for the `constructor` property due to
											// cross-environment inconsistencies.
											if (isConstructor || _isProperty.call(object, property = "constructor")) {
												callback(property);
											}
										};
									}
									return _forEach(object, callback);
								};

								// Public: Serializes a JavaScript `value` as a JSON string. The optional
								// `filter` argument may specify either a function that alters how object and
								// array members are serialized, or an array of strings and numbers that
								// indicates which properties should be serialized. The optional `width`
								// argument may be either a string or number that specifies the indentation
								// level of the output.
								if (!has("json-stringify")) {
									// Internal: A map of control characters and their escaped equivalents.
									var Escapes = {
										92: "\\\\",
										34: '\\"',
										8: "\\b",
										12: "\\f",
										10: "\\n",
										13: "\\r",
										9: "\\t"
									};

									// Internal: Converts `value` into a zero-padded string such that its
									// length is at least equal to `width`. The `width` must be <= 6.
									var leadingZeroes = "000000";
									var toPaddedString = function toPaddedString(width, value) {
										// The `|| 0` expression is necessary to work around a bug in
										// Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
										return (leadingZeroes + (value || 0)).slice(-width);
									};

									// Internal: Double-quotes a string `value`, replacing all ASCII control
									// characters (characters with code unit values between 0 and 31) with
									// their escaped equivalents. This is an implementation of the
									// `Quote(value)` operation defined in ES 5.1 section 15.12.3.
									var unicodePrefix = "\\u00";
									var quote = function quote(value) {
										var result = '"',
										    index = 0,
										    length = value.length,
										    useCharIndex = !charIndexBuggy || length > 10;
										var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
										for (; index < length; index++) {
											var charCode = value.charCodeAt(index);
											// If the character is a control character, append its Unicode or
											// shorthand escape sequence; otherwise, append the character as-is.
											switch (charCode) {
												case 8:
												case 9:
												case 10:
												case 12:
												case 13:
												case 34:
												case 92:
													result += Escapes[charCode];
													break;
												default:
													if (charCode < 32) {
														result += unicodePrefix + toPaddedString(2, charCode.toString(16));
														break;
													}
													result += useCharIndex ? symbols[index] : value.charAt(index);
											}
										}
										return result + '"';
									};

									// Internal: Recursively serializes an object. Implements the
									// `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
									var serialize = function serialize(property, object, callback, properties, whitespace, indentation, stack) {
										var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
										try {
											// Necessary for host object support.
											value = object[property];
										} catch (exception) {}
										if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object" && value) {
											className = getClass.call(value);
											if (className == dateClass && !_isProperty.call(value, "toJSON")) {
												if (value > -1 / 0 && value < 1 / 0) {
													// Dates are serialized according to the `Date#toJSON` method
													// specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
													// for the ISO 8601 date time string format.
													if (getDay) {
														// Manually compute the year, month, date, hours, minutes,
														// seconds, and milliseconds if the `getUTC*` methods are
														// buggy. Adapted from @Yaffle's `date-shim` project.
														date = floor(value / 864e5);
														for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++) {}
														for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++) {}
														date = 1 + date - getDay(year, month);
														// The `time` value specifies the time within the day (see ES
														// 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
														// to compute `A modulo B`, as the `%` operator does not
														// correspond to the `modulo` operation for negative numbers.
														time = (value % 864e5 + 864e5) % 864e5;
														// The hours, minutes, seconds, and milliseconds are obtained by
														// decomposing the time within the day. See section 15.9.1.10.
														hours = floor(time / 36e5) % 24;
														minutes = floor(time / 6e4) % 60;
														seconds = floor(time / 1e3) % 60;
														milliseconds = time % 1e3;
													} else {
														year = value.getUTCFullYear();
														month = value.getUTCMonth();
														date = value.getUTCDate();
														hours = value.getUTCHours();
														minutes = value.getUTCMinutes();
														seconds = value.getUTCSeconds();
														milliseconds = value.getUTCMilliseconds();
													}
													// Serialize extended years correctly.
													value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) + "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
													// Months, dates, hours, minutes, and seconds should have two
													// digits; milliseconds should have three.
													"T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
													// Milliseconds are optional in ES 5.0, but required in 5.1.
													"." + toPaddedString(3, milliseconds) + "Z";
												} else {
													value = null;
												}
											} else if (typeof value.toJSON == "function" && (className != numberClass && className != stringClass && className != arrayClass || _isProperty.call(value, "toJSON"))) {
												// Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
												// `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
												// ignores all `toJSON` methods on these objects unless they are
												// defined directly on an instance.
												value = value.toJSON(property);
											}
										}
										if (callback) {
											// If a replacement function was provided, call it to obtain the value
											// for serialization.
											value = callback.call(object, property, value);
										}
										if (value === null) {
											return "null";
										}
										className = getClass.call(value);
										if (className == booleanClass) {
											// Booleans are represented literally.
											return "" + value;
										} else if (className == numberClass) {
											// JSON numbers must be finite. `Infinity` and `NaN` are serialized as
											// `"null"`.
											return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
										} else if (className == stringClass) {
											// Strings are double-quoted and escaped.
											return quote("" + value);
										}
										// Recursively serialize objects and arrays.
										if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object") {
											// Check for cyclic structures. This is a linear search; performance
											// is inversely proportional to the number of unique nested objects.
											for (length = stack.length; length--;) {
												if (stack[length] === value) {
													// Cyclic structures cannot be serialized by `JSON.stringify`.
													throw TypeError();
												}
											}
											// Add the object to the stack of traversed objects.
											stack.push(value);
											results = [];
											// Save the current indentation level and indent one additional level.
											prefix = indentation;
											indentation += whitespace;
											if (className == arrayClass) {
												// Recursively serialize array elements.
												for (index = 0, length = value.length; index < length; index++) {
													element = serialize(index, value, callback, properties, whitespace, indentation, stack);
													results.push(element === undef ? "null" : element);
												}
												result = results.length ? whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : "[" + results.join(",") + "]" : "[]";
											} else {
												// Recursively serialize object members. Members are selected from
												// either a user-specified list of property names, or the object
												// itself.
												_forEach(properties || value, function (property) {
													var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
													if (element !== undef) {
														// According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
														// is not the empty string, let `member` {quote(property) + ":"}
														// be the concatenation of `member` and the `space` character."
														// The "`space` character" refers to the literal space
														// character, not the `space` {width} argument provided to
														// `JSON.stringify`.
														results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
													}
												});
												result = results.length ? whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : "{" + results.join(",") + "}" : "{}";
											}
											// Remove the object from the traversed object stack.
											stack.pop();
											return result;
										}
									};

									// Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
									exports.stringify = function (source, filter, width) {
										var whitespace, callback, properties, className;
										if (objectTypes[typeof filter === "undefined" ? "undefined" : _typeof(filter)] && filter) {
											if ((className = getClass.call(filter)) == functionClass) {
												callback = filter;
											} else if (className == arrayClass) {
												// Convert the property names array into a makeshift set.
												properties = {};
												for (var index = 0, length = filter.length, value; index < length; value = filter[index++], (className = getClass.call(value), className == stringClass || className == numberClass) && (properties[value] = 1)) {}
											}
										}
										if (width) {
											if ((className = getClass.call(width)) == numberClass) {
												// Convert the `width` to an integer and create a string containing
												// `width` number of space characters.
												if ((width -= width % 1) > 0) {
													for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ") {}
												}
											} else if (className == stringClass) {
												whitespace = width.length <= 10 ? width : width.slice(0, 10);
											}
										}
										// Opera <= 7.54u2 discards the values associated with empty string keys
										// (`""`) only if they are used directly within an object member list
										// (e.g., `!("" in { "": 1})`).
										return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
									};
								}

								// Public: Parses a JSON source string.
								if (!has("json-parse")) {
									var fromCharCode = String.fromCharCode;

									// Internal: A map of escaped control characters and their unescaped
									// equivalents.
									var Unescapes = {
										92: "\\",
										34: '"',
										47: "/",
										98: "\b",
										116: "\t",
										110: "\n",
										102: "\f",
										114: "\r"
									};

									// Internal: Stores the parser state.
									var Index, Source;

									// Internal: Resets the parser state and throws a `SyntaxError`.
									var abort = function abort() {
										Index = Source = null;
										throw SyntaxError();
									};

									// Internal: Returns the next token, or `"$"` if the parser has reached
									// the end of the source string. A token may be a string, number, `null`
									// literal, or Boolean literal.
									var lex = function lex() {
										var source = Source,
										    length = source.length,
										    value,
										    begin,
										    position,
										    isSigned,
										    charCode;
										while (Index < length) {
											charCode = source.charCodeAt(Index);
											switch (charCode) {
												case 9:
												case 10:
												case 13:
												case 32:
													// Skip whitespace tokens, including tabs, carriage returns, line
													// feeds, and space characters.
													Index++;
													break;
												case 123:
												case 125:
												case 91:
												case 93:
												case 58:
												case 44:
													// Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
													// the current position.
													value = charIndexBuggy ? source.charAt(Index) : source[Index];
													Index++;
													return value;
												case 34:
													// `"` delimits a JSON string; advance to the next character and
													// begin parsing the string. String tokens are prefixed with the
													// sentinel `@` character to distinguish them from punctuators and
													// end-of-string tokens.
													for (value = "@", Index++; Index < length;) {
														charCode = source.charCodeAt(Index);
														if (charCode < 32) {
															// Unescaped ASCII control characters (those with a code unit
															// less than the space character) are not permitted.
															abort();
														} else if (charCode == 92) {
															// A reverse solidus (`\`) marks the beginning of an escaped
															// control character (including `"`, `\`, and `/`) or Unicode
															// escape sequence.
															charCode = source.charCodeAt(++Index);
															switch (charCode) {
																case 92:
																case 34:
																case 47:
																case 98:
																case 116:
																case 110:
																case 102:
																case 114:
																	// Revive escaped control characters.
																	value += Unescapes[charCode];
																	Index++;
																	break;
																case 117:
																	// `\u` marks the beginning of a Unicode escape sequence.
																	// Advance to the first character and validate the
																	// four-digit code point.
																	begin = ++Index;
																	for (position = Index + 4; Index < position; Index++) {
																		charCode = source.charCodeAt(Index);
																		// A valid sequence comprises four hexdigits (case-
																		// insensitive) that form a single hexadecimal value.
																		if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
																			// Invalid Unicode escape sequence.
																			abort();
																		}
																	}
																	// Revive the escaped character.
																	value += fromCharCode("0x" + source.slice(begin, Index));
																	break;
																default:
																	// Invalid escape sequence.
																	abort();
															}
														} else {
															if (charCode == 34) {
																// An unescaped double-quote character marks the end of the
																// string.
																break;
															}
															charCode = source.charCodeAt(Index);
															begin = Index;
															// Optimize for the common case where a string is valid.
															while (charCode >= 32 && charCode != 92 && charCode != 34) {
																charCode = source.charCodeAt(++Index);
															}
															// Append the string as-is.
															value += source.slice(begin, Index);
														}
													}
													if (source.charCodeAt(Index) == 34) {
														// Advance to the next character and return the revived string.
														Index++;
														return value;
													}
													// Unterminated string.
													abort();
												default:
													// Parse numbers and literals.
													begin = Index;
													// Advance past the negative sign, if one is specified.
													if (charCode == 45) {
														isSigned = true;
														charCode = source.charCodeAt(++Index);
													}
													// Parse an integer or floating-point value.
													if (charCode >= 48 && charCode <= 57) {
														// Leading zeroes are interpreted as octal literals.
														if (charCode == 48 && (charCode = source.charCodeAt(Index + 1), charCode >= 48 && charCode <= 57)) {
															// Illegal octal literal.
															abort();
														}
														isSigned = false;
														// Parse the integer component.
														for (; Index < length && (charCode = source.charCodeAt(Index), charCode >= 48 && charCode <= 57); Index++) {}
														// Floats cannot contain a leading decimal point; however, this
														// case is already accounted for by the parser.
														if (source.charCodeAt(Index) == 46) {
															position = ++Index;
															// Parse the decimal component.
															for (; position < length && (charCode = source.charCodeAt(position), charCode >= 48 && charCode <= 57); position++) {}
															if (position == Index) {
																// Illegal trailing decimal.
																abort();
															}
															Index = position;
														}
														// Parse exponents. The `e` denoting the exponent is
														// case-insensitive.
														charCode = source.charCodeAt(Index);
														if (charCode == 101 || charCode == 69) {
															charCode = source.charCodeAt(++Index);
															// Skip past the sign following the exponent, if one is
															// specified.
															if (charCode == 43 || charCode == 45) {
																Index++;
															}
															// Parse the exponential component.
															for (position = Index; position < length && (charCode = source.charCodeAt(position), charCode >= 48 && charCode <= 57); position++) {}
															if (position == Index) {
																// Illegal empty exponent.
																abort();
															}
															Index = position;
														}
														// Coerce the parsed value to a JavaScript number.
														return +source.slice(begin, Index);
													}
													// A negative sign may only precede numbers.
													if (isSigned) {
														abort();
													}
													// `true`, `false`, and `null` literals.
													if (source.slice(Index, Index + 4) == "true") {
														Index += 4;
														return true;
													} else if (source.slice(Index, Index + 5) == "false") {
														Index += 5;
														return false;
													} else if (source.slice(Index, Index + 4) == "null") {
														Index += 4;
														return null;
													}
													// Unrecognized token.
													abort();
											}
										}
										// Return the sentinel `$` character if the parser has reached the end
										// of the source string.
										return "$";
									};

									// Internal: Parses a JSON `value` token.
									var get = function get(value) {
										var results, hasMembers;
										if (value == "$") {
											// Unexpected end of input.
											abort();
										}
										if (typeof value == "string") {
											if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
												// Remove the sentinel `@` character.
												return value.slice(1);
											}
											// Parse object and array literals.
											if (value == "[") {
												// Parses a JSON array, returning a new JavaScript array.
												results = [];
												for (;; hasMembers || (hasMembers = true)) {
													value = lex();
													// A closing square bracket marks the end of the array literal.
													if (value == "]") {
														break;
													}
													// If the array literal contains elements, the current token
													// should be a comma separating the previous element from the
													// next.
													if (hasMembers) {
														if (value == ",") {
															value = lex();
															if (value == "]") {
																// Unexpected trailing `,` in array literal.
																abort();
															}
														} else {
															// A `,` must separate each array element.
															abort();
														}
													}
													// Elisions and leading commas are not permitted.
													if (value == ",") {
														abort();
													}
													results.push(get(value));
												}
												return results;
											} else if (value == "{") {
												// Parses a JSON object, returning a new JavaScript object.
												results = {};
												for (;; hasMembers || (hasMembers = true)) {
													value = lex();
													// A closing curly brace marks the end of the object literal.
													if (value == "}") {
														break;
													}
													// If the object literal contains members, the current token
													// should be a comma separator.
													if (hasMembers) {
														if (value == ",") {
															value = lex();
															if (value == "}") {
																// Unexpected trailing `,` in object literal.
																abort();
															}
														} else {
															// A `,` must separate each object member.
															abort();
														}
													}
													// Leading commas are not permitted, object property names must be
													// double-quoted strings, and a `:` must separate each property
													// name and value.
													if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
														abort();
													}
													results[value.slice(1)] = get(lex());
												}
												return results;
											}
											// Unexpected token encountered.
											abort();
										}
										return value;
									};

									// Internal: Updates a traversed object member.
									var update = function update(source, property, callback) {
										var element = walk(source, property, callback);
										if (element === undef) {
											delete source[property];
										} else {
											source[property] = element;
										}
									};

									// Internal: Recursively traverses a parsed JSON object, invoking the
									// `callback` function for each value. This is an implementation of the
									// `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
									var walk = function walk(source, property, callback) {
										var value = source[property],
										    length;
										if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object" && value) {
											// `forEach` can't be used to traverse an array in Opera <= 8.54
											// because its `Object#hasOwnProperty` implementation returns `false`
											// for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
											if (getClass.call(value) == arrayClass) {
												for (length = value.length; length--;) {
													update(value, length, callback);
												}
											} else {
												_forEach(value, function (property) {
													update(value, property, callback);
												});
											}
										}
										return callback.call(source, property, value);
									};

									// Public: `JSON.parse`. See ES 5.1 section 15.12.2.
									exports.parse = function (source, callback) {
										var result, value;
										Index = 0;
										Source = "" + source;
										result = get(lex());
										// If a JSON string contains multiple tokens, it is invalid.
										if (lex() != "$") {
											abort();
										}
										// Reset the parser state.
										Index = Source = null;
										return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
									};
								}
							}

							exports["runInContext"] = runInContext;
							return exports;
						}

						if (freeExports && !isLoader) {
							// Export for CommonJS environments.
							runInContext(root, freeExports);
						} else {
							// Export for web browsers and JavaScript engines.
							var nativeJSON = root.JSON,
							    previousJSON = root["JSON3"],
							    isRestored = false;

							var JSON3 = runInContext(root, root["JSON3"] = {
								// Public: Restores the original value of the global `JSON` object and
								// returns a reference to the `JSON3` object.
								"noConflict": function noConflict() {
									if (!isRestored) {
										isRestored = true;
										root.JSON = nativeJSON;
										root["JSON3"] = previousJSON;
										nativeJSON = previousJSON = null;
									}
									return JSON3;
								}
							});

							root.JSON = {
								"parse": JSON3.parse,
								"stringify": JSON3.stringify
							};
						}

						// Export for asynchronous module loaders.
						if (isLoader) {
							define(function () {
								return JSON3;
							});
						}
					}).call(this);
				}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
			}, {}],
			51: [function (_dereq_, module, exports) {
				module.exports = toArray;

				function toArray(list, index) {
					var array = [];

					index = index || 0;

					for (var i = index || 0; i < list.length; i++) {
						array[i - index] = list[i];
					}

					return array;
				}
			}, {}]
		}, {}, [31])(31);
	});
}

cc._RFpop();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"zjhSeat":[function(require,module,exports){
"use strict";
cc._RFpush(module, '020adKLAxlBQpYhX6DfXNDM', 'zjhSeat');
// scripts/zjh/zjhSeat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _sprIcon: null,
        _zhuang: null,
        _ready: null,
        _offline: null,
        _lblName: null,
        _lblScore: null,
        _nddayingjia: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _dayingjia: false,
        _isOffline: false,
        _isReady: false,
        _isZhuang: false,
        _userId: null,
        _isKanPai: false,
        _isQiPai: false,
        _isShu: false,
        _timeLabel: null,
        _time: -1
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("head").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("money").getComponent(cc.Label);
        this._costMoney = this.node.getChildByName("zjh14").getChildByName("xiazhu").getComponent(cc.Label);
        this._kanicon = this.node.getChildByName("kanicon");
        this._shuicon = this.node.getChildByName("shuicon");
        this._qiicon = this.node.getChildByName("qiicon");
        this._kanpai = this.node.getChildByName("kanpai");
        this._saykanpai = this.node.getChildByName("saykanpai");
        this._genzhu = this.node.getChildByName("genzhu");
        this._jiazhu = this.node.getChildByName("jiazhu");
        this._fangqi = this.node.getChildByName("fangqi");
        this._pkButton = this.node.getChildByName("pk_button");
        this._chatBubble = this.node.getChildByName("ChatBubble");
        this._yanhua = this.node.getChildByName("yanhua");
        this._yanhuaAnim = this._yanhua.getComponent(cc.Animation);
        this._timeLabel = this.node.getChildByName("toggle").getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        cc.vv.utils.addClickEvent(this._pkButton, this.node, "zjhSeat", "onClickPkButton");
        // this._voicemsg = this.node.getChildByName("voicemsg");
        // if (this._voicemsg) {
        //     this._voicemsg.active = false;
        // }
        // if (this._sprIcon && this._sprIcon.getComponent(cc.Button)) {
        //     cc.vv.utils.addClickEvent(this._sprIcon, this.node, "Seat", "onIconClicked");
        // }
        // this._offline = this.node.getChildByName("offline");
        // this._ready = this.node.getChildByName("ready");
        this._zhuang = this.node.getChildByName("zhuang");
        // this._nddayingjia = this.node.getChildByName("dayingjia");
        this._emoji = this.node.getChildByName("emoji");
        this.refresh();
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
    },
    onIconClicked: function onIconClicked() {
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if (this._userId != null && this._userId > 0) {
            var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if (cc.vv.baseInfoMap) {
                var info = cc.vv.baseInfoMap[this._userId];
                if (info) {
                    sex = info.sex;
                }
            }
        }
    },
    refresh: function refresh() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._nddayingjia != null) {
            this._nddayingjia.active = this._dayingjia == true;
        }
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
        if (this._zhuang) {
            this._zhuang.active = this._isZhuang;
        }
        this.node.active = this._userName != null && this._userName != "";
        if (this._kanicon) {
            this._kanicon.active = this._isKanPai;
        }
        if (this._shuicon) {
            this._shuicon.active = this._isShu;
        }
        if (this._qiicon) {
            this._qiicon.active = this._isQiPai;
        }
        if (this._kanpai) {
            this._kanpai.active = false;
        }
        if (this._saykanpai) {
            this._saykanpai.active = false;
        }
        if (this._genzhu) {
            this._genzhu.active = false;
        }
        if (this._jiazhu) {
            this._jiazhu.active = false;
        }
        if (this._fangqi) {
            this._fangqi.active = false;
        }
        if (this._pkButton) {
            this._pkButton.active = false;
        }
        if (this._chatBubble) {
            this._chatBubble.active = false;
        }
        if (this._emoji) {
            this._emoji.active = false;
        }
        if (this._yanhua) {
            this._yanhua.active = false;
        }
    },
    setInfo: function setInfo(name, score) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        this.refresh();
    },
    setZhuang: function setZhuang(value) {
        this._isZhuang = value;
        if (this._zhuang) {
            this._zhuang.active = value;
        } else {
            this._zhuang = this.node.getChildByName("zhuang");
            this._zhuang.active = value;
        }
    },
    setReady: function setReady(isReady) {
        this._isReady = isReady;
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
    },
    setID: function setID(id) {
        var idNode = this.node.getChildByName("id");
        if (idNode) {
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;
        }
        this._userId = id;
        if (this._sprIcon) {
            this._sprIcon.setUserID(id);
        }
    },
    getID: function getID() {
        return this._userId;
    },
    setOffline: function setOffline(isOffline) {
        this._isOffline = isOffline;
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    chat: function chat(content) {
        if (this._chatBubble == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function emoji(_emoji) {
        //emoji = JSON.parse(emoji);
        if (this._emoji == null) {
            return;
        }
        console.log(_emoji);
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(_emoji);
        this._lastChatTime = 3;
    },
    voiceMsg: function voiceMsg(show) {
        if (this._voicemsg) {
            this._voicemsg.active = show;
        }
    },
    setMoney: function setMoney(data) {
        //设置该玩家所拥有的的钱
        this._lblScore.string = data;
        this._score = data;
    },
    setCostMoney: function setCostMoney(data) {
        //设置该玩家本局所压的注
        if (data) {
            this._costMoney.string = data;
        }
        if (!this.node.getChildByName("zjh14").active) this.node.getChildByName("zjh14").active = true;
    },
    showGenZhu: function showGenZhu() {
        var self = this;
        self._genzhu.active = true;
        setTimeout(function () {
            self._genzhu.active = false;
        }, 1000);
    },
    showKanPai: function showKanPai() {
        var self = this;
        self._kanicon.active = true;
        self._saykanpai.active = true;
        setTimeout(function () {
            self._saykanpai.active = false;
        }, 1000);
    },
    showJiaZhu: function showJiaZhu() {
        var self = this;
        self._jiazhu.active = true;
        setTimeout(function () {
            self._jiazhu.active = false;
        }, 1000);
    },
    showQiPai: function showQiPai(status) {
        var self = this;
        if (status == 'shu') {
            self._shuicon.active = true;
        } else {
            self._qiicon.active = true;
            self._fangqi.active = true;
            setTimeout(function () {
                if (self._fangqi) {
                    self._fangqi.active = false;
                }
            }, 1000);
        }
    },
    showPkButton: function showPkButton() {
        if (this._pkButton) {
            this._pkButton.active = true;
        }
    },
    hidePkButton: function hidePkButton() {
        if (this._pkButton) {
            this._pkButton.active = false;
        }
    },
    onClickPkButton: function onClickPkButton() {
        cc.vv.gameNetMgr.dispatchEvent('clickPkButton', this._userId);
    },
    showYanhua: function showYanhua() {
        if (this._yanhua) {
            this._yanhua.active = true;
            this._yanhuaAnim.play('yanhua');
        }
    },
    setTime: function setTime(o) {
        if (o) {
            this._time = 0;
        } else {
            this._time = 30;
        }
    },
    fanPai: function fanPai(spriteFrames) {
        var self = this;
        for (var i = 0; i < 3; i++) {
            var zhengpai = self._kanpai.getChildByName('zhengpai' + i);
            var paiObj = spriteFrames[i];
            var numRes = paiObj['num'];
            var huase_bigRes = paiObj['huase_big'];
            var huase_smallRes = paiObj['huase_small'];
            zhengpai.getChildByName('num').getComponent(cc.Sprite).spriteFrame = numRes;
            zhengpai.getChildByName('huase_big').getComponent(cc.Sprite).spriteFrame = huase_bigRes;
            zhengpai.getChildByName('huase_small').getComponent(cc.Sprite).spriteFrame = huase_smallRes;
            // zhengpai.getComponent(cc.Sprite).spriteFrame = spriteFrames[i];
        }
        self.hideFupai();
        self._kanpai.active = true;
    },
    hideFupai: function hideFupai() {
        var self = this;
        for (var i = 0; i < 3; i++) {
            var fupai = self.node.getChildByName('fupai' + i);
            fupai.active = false;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._lastChatTime > 0) {
            this._lastChatTime -= dt;
            if (this._lastChatTime < 0) {
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
        if (this._time > 0) {
            this._time -= dt;
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }
            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    }
});

cc._RFpop();
},{}]},{},["socket-io","AnysdkMgr","AudioMgr","Collapse","CqNetMgr","DnNetMgr","DzpkNetMgr","GameNetMgr","Global","HTTP","JbsNetMgr","MahjongMgr","MjNetMgr","Net","ReplayMgr","UserMgr","Utils","VoiceMgr","ZjhNetMgr","Alert","Announcement","Charge","ChargeType","Chat","CheckBox","CreateRoom","DnChat","DzpkChat","Folds","GameOver","GameResult","Hall","History","ImageLoader","Jbs","JoinGameInput","Login","MJGame","MJRoom","Morra","MorraGame","NewHall","NoticeTip","OnBack","PengGangs","PopupMgr","RadioButton","RadioGroupMgr","ReConnect","ReplayCtrl","Seat","SelectDn","SelectDzpk","SelectMj","SelectZjh","Settings","Share","TimePointer","UserSign","Voice","WaitingConnection","ZjhChat","dnAll","dnSeat","dzpkAll","dzpkSeat","all","zjhSeat"]);
