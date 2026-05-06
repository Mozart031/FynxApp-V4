const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAd1Registration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // Place in assets directory to avoid Android resource naming restrictions (which prohibit hyphens)
      const assetsPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/assets');
      if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath, { recursive: true });
      }
      
      // Use EXACT filename requested by Google
      const filePath = path.join(assetsPath, 'ad1-registration.properties');
      
      // Use EXACT token from the user
      fs.writeFileSync(filePath, 'CMCULODCWEAI2AAAAAAAAAAAA');
      return config;
    },
  ]);
};
