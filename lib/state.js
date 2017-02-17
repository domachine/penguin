'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var config = _ref.config;

  var _parseKeyConfig = parseKeyConfig(config.globals),
      globalKeys = _parseKeyConfig.keys,
      globalNotLocalized = _parseKeyConfig.notLocalized;

  return function (_ref2) {
    var fields = _ref2.fields,
        meta = _ref2.meta,
        language = _ref2.language;
    return {
      fields: fields,
      locals: { notLocalized: parseKeyConfig(meta.keys).notLocalized },
      globals: {
        keys: globalKeys,
        notLocalized: globalNotLocalized
      },
      languages: config.languages,
      context: language ? { language: language } : null
    };
  };
};

function parseKeyConfig() {
  var cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  var keys = cfg.map(function (field) {
    return typeof field === 'string' ? field : field[0];
  });
  var notLocalized = cfg.reduce(function (noLangFields, key) {
    var fieldName = typeof key === 'string' ? key : key[0];
    var opts = (typeof key === 'string' ? null : key[1]) || {};
    var localized = opts.localized == null ? true : opts.localized;
    return !localized ? noLangFields.concat([fieldName]) : noLangFields;
  }, []);
  return { keys: keys, notLocalized: notLocalized };
}