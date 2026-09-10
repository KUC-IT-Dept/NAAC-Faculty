let counter = 1;
function genId() {
  return 'fakeid' + (counter++).toString().padStart(6, '0');
}
function clone(x) { return JSON.parse(JSON.stringify(x)); }
module.exports = { genId, clone };
