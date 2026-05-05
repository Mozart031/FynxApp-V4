const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAd1Registration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/raw');
      if (!fs.existsSync(resPath)) {
        fs.mkdirSync(resPath, { recursive: true });
      }
      const filePath = path.join(resPath, 'ad1-registration.properties');
      fs.writeFileSync(filePath, 'CMCULODCWEAI2AAAAAAAAAAAAA');
      return config;
    },
  ]);
};
