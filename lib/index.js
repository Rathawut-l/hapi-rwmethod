/**
 * Created by rathawut on 5/27/16.
 */
const fs = require('fs');
const path = require('path');

const SEC = 1000;
const MINUTE = 60 * SEC;
const HOUR = 60 * MINUTE;

const hapiRoute = {
  register: function register(server, options, next) {
    const methodExtnames = options.methodExtnames || ['.js'];
    const absMethodsDirPath = path.join(process.cwd(), options.methodsDir);
    const indexFilename = 'index';

    function fn(absCurrentDirPath) {
      const items = fs.readdirSync(absCurrentDirPath);
      items.forEach((itemName) => {
        const absItemPath = path.join(absCurrentDirPath, itemName);
        if (fs.lstatSync(absItemPath).isDirectory()) { // Recursive
          fn(absItemPath);
          return;
        }
        const itemExtname = path.extname(absItemPath);
        const itemExtnameIndex = methodExtnames.indexOf(itemExtname);
        if (itemExtnameIndex !== 0) { // Skip non-method-extnames files
          return;
        }
        let methodName = absItemPath.substring(
          absMethodsDirPath.length + 1, absItemPath.length - methodExtnames[itemExtnameIndex].length
        );
        if (methodName.endsWith(`/${indexFilename}`)) {
          methodName = methodName.substring(0, methodName.length - indexFilename.length - 1);
        }
        let methodsConfig = require(absItemPath);
        if (!Array.isArray(methodsConfig)) {
          methodsConfig = [methodsConfig];
        }
        for (let i = 0; i < methodsConfig.length; i++) {
          if (!methodsConfig[i].name) { // Override path
            methodsConfig[i].name = methodName.split('/').join('.');
          }
          if (!methodsConfig[i].options) {
            methodsConfig[i].options = {
              cache: {
                expiresIn: 24 * HOUR,
                generateTimeout: 3 * MINUTE,
              },
            };
          }
          console.log(`Add the method => server.methods.${methodsConfig[i].name}`);
          server.method(methodsConfig[i]);
        }
      });
    }

    fn(absMethodsDirPath);
    next();
  },
};

hapiRoute.register.attributes = {
  name: 'hapi-method',
  version: '1.0.0',
};

module.exports = hapiRoute;
