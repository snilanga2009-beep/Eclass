const bundled = require('./bundle.cjs');
const app = bundled.default || bundled;

module.exports = (req, res) => {
  return app(req, res);
};
