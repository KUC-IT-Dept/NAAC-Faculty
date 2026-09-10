let n = 1;
module.exports = { genId: () => 'fakeid' + (n++).toString().padStart(6, '0') };
