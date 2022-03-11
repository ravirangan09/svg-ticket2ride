const BUILD_CONFIG = require('./esbuild_config');
const DEV_CONFIG = Object.assign({}, BUILD_CONFIG, { watch: true })
require('esbuild').build(DEV_CONFIG).then(result=>{
  console.log(result)
})

