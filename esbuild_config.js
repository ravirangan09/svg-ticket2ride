module.exports = {
  entryPoints: ['client/index.js'],
  format: 'esm',
  bundle: true,
  loader: {
    '.woff2': 'file',
    '.woff': 'file',
    '.jpg': 'file',
    '.svg': 'file'
  },
  logLevel: 'info',
  assetNames: 'assets/[name]-[hash]',
  outdir: 'dist'
}
