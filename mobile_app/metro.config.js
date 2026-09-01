const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Override Metro's Node builtin blocker for 'buffer'.
// react-native-svg imports 'buffer' which Metro blocks by default.
// This custom resolver redirects it to the npm 'buffer' package instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "buffer") {
    return {
      type: "sourceFile",
      filePath: require.resolve("buffer/"),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
