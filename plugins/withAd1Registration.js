const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAd1Registration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // 1. Intentar en assets (permite guiones medios)
      const assetsPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/assets');
      if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath, { recursive: true });
      const filePath1 = path.join(assetsPath, 'adi-registration.properties');
      fs.writeFileSync(filePath1, 'CMCULODCWEAI2AAAAAAAAAAAA');

      // 2. Intentar en resources (estándar de Java para .properties)
      const resrcPath = path.join(config.modRequest.platformProjectRoot, 'app/src/main/resources');
      if (!fs.existsSync(resrcPath)) fs.mkdirSync(resrcPath, { recursive: true });
      const filePath2 = path.join(resrcPath, 'adi-registration.properties');
      fs.writeFileSync(filePath2, 'CMCULODCWEAI2AAAAAAAAAAAA');

      return config;
    },
  ]);
};
