function getDate(extra) {
	var dat = new Date; //生成日期  
	var year = dat.getFullYear(); //取得年  
	var month = dat.getMonth() + 1; //取得月,js从0开始取,所以+1  
	var date1 = dat.getDate(); //取得天  
	var hour = dat.getHours(); //取得小时  
	var minutes = dat.getMinutes(); //取得分钟  
	var second = dat.getSeconds(); //取得秒  
	var haomiao = dat.getMilliseconds();
	dat = undefined;
	return year + "-" + month + "-" + date1 + " " + hour + ":" + minutes + ":" + second + " " + haomiao + extra;
}

console.oldlog = console.log;
console.oldtrace = console.trace;
console.olddebug = console.debug;
console.oldinfo = console.info;
console.oldwarn = console.warn;
console.olderror = console.error;


function log() {
	process.stdout.write(getDate('-log-: '));
	console.oldlog.apply(console, arguments);
}

function trace() {
	process.stdout.write(getDate('-trace-: '));
	console.oldtrace.apply(console, arguments);
}

function info() {
	process.stdout.write(getDate('-info-: '));
	console.oldinfo.apply(console, arguments);
}

function warn() {
	process.stdout.write(getDate('-warn-: '));
	console.oldwarn.apply(console, arguments);
}

function error() {
	process.stderr.write(getDate('-error-: '));
	console.olderror.apply(console, arguments);
}

function debug() {
	process.stdout.write(getDate('-debug-: '));
	console.olddebug.apply(console, arguments);
}

console.log = log;
console.debug = debug;
console.trace = trace;
console.info = info;
console.warn = warn;
console.error = error;

global.log = log;
global.debug = debug;
global.trace = trace;
global.info = info;
global.warn = warn;
global.error = error;

module.exports = global;