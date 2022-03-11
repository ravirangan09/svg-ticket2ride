const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

const pick = (obj, keys) => Object.assign({}, ...keys.map(k=>k in obj ? {[k]: obj[k]}: {}));

const reject = (obj, keys) => Object.assign({}, ...Object.keys(obj)
                                .filter(k => !keys.includes(k))
                                .map(k => ({[k]: obj[k]})));    

module.exports = {
  shuffle,
  pick,
  reject
}
