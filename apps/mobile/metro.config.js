// Permite importar o pacote compartilhado do monorepo (packages/shared).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const shared = path.resolve(__dirname, '../../packages/shared');
config.watchFolders = [shared];
config.resolver.extraNodeModules = { '@adotai/shared': shared };
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
module.exports = config;
