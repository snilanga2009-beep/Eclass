import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bundled = require('./bundle.cjs');
const app = bundled.default || bundled;

export default (req, res) => {
  return app(req, res);
};
