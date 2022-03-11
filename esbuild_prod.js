const BUILD_CONFIG = require('./esbuild_config');
const PROD_CONFIG = Object.assign({}, BUILD_CONFIG, { minify: true })
require('esbuild').build(PROD_CONFIG).catch(()=>process.exit(1));


