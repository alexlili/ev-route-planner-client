// config-overrides.js
module.exports = function override(config, env) {
    config.module.rules.push({
      test: /symbol\.ts$/,
      use: ['ignore-loader']
    });
  
    return config;
  };
  