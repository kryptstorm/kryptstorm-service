"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = XService;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } // External modules


// Seneca plugin
function XService(_ref) {
  var _this = this;

  var _ref$maps = _ref.maps,
      maps = _ref$maps === undefined ? {} : _ref$maps,
      _ref$beforeHooks = _ref.beforeHooks,
      beforeHooks = _ref$beforeHooks === undefined ? {} : _ref$beforeHooks,
      _ref$afterHooks = _ref.afterHooks,
      afterHooks = _ref$afterHooks === undefined ? {} : _ref$afterHooks,
      _ref$allowMethods = _ref.allowMethods,
      allowMethods = _ref$allowMethods === undefined ? ["POST", "GET", "PUT", "DELETE"] : _ref$allowMethods;

  //
  // Proccess external services
  //
  // Default mapper
  var _mapper = function _mapper(data) {
    return data;
  };
  // Check a pattern is external (does npt register on this instance)
  var _isExternalPattern = function _isExternalPattern(pattern) {
    return _lodash2.default.isString(pattern) && (_lodash2.default.isObject(maps[pattern]) || _lodash2.default.isString(maps[pattern]));
  };
  // Register act, this function will help user run external services
  var _act = function _act(pattern, patternParams) {
    // Make seneca.act return a promise
    var act = _bluebird2.default.promisify(_this.act, { context: _this });

    // Because the map only receive a string as a key
    // So, if the pattern is not a string, it is original seneca pattern (use object)
    // Just return the original action, simple!!! :)
    if (!_isExternalPattern(pattern)) {
      return act(pattern, patternParams);
    }

    // We need to call an external service
    var _externalPattern = maps[pattern];
    var _externalPattern$meth = _externalPattern.method,
        method = _externalPattern$meth === undefined ? "GET" : _externalPattern$meth,
        url = _externalPattern.url,
        mapper = _externalPattern.mapper,
        query = _externalPattern.query,
        params = _externalPattern.params,
        body = _externalPattern.body;
    // Only handle allow method

    if (!_lodash2.default.includes(allowMethods, method)) {
      return _bluebird2.default.reject(new Error("The method " + method + " is not allow. Only accept: " + allowMethods.join(",")));
    }

    // Tranform response to our format
    var transformResponse = [_mapper];
    if (_lodash2.default.isFunction(mapper)) {
      transformResponse.push(mapper);
    }

    if (method === "GET") {
      return _axios2.default.get(url, { transformResponse: transformResponse }).then(function (_ref2) {
        var data = _ref2.data;

        return _bluebird2.default.resolve(data);
      });
    }
  };

  //
  // Process hooks
  //
  // If you defined hooks, please make sure all pattern of hook is exist
  // If service cannot find one of pattern you provide,
  // hook will return an exception an don't execute anything

  // Register global hook
  var _beforeHooks = _resolvePattern(beforeHooks.global),
      _afterHooks = _resolvePattern(afterHooks.global);

  // Check all pattern has been exist
  var _verifyPatterns = function _verifyPatterns(patterns) {
    var errors = void 0;
    _lodash2.default.each(patterns, function (pattern) {
      if (!_this.has(pattern) && !_isExternalPattern(pattern)) errors = _bluebird2.default.reject(new Error("Pattern " + pattern + " has not been registered."));
    });
    // An error has been exist, return it
    if (errors) return errors;
    return _bluebird2.default.resolve(patterns);
  };

  // XService method
  var XService$ = {
    act: function act(pattern, patternParams) {
      return _verifyPatterns([].concat(_toConsumableArray(_beforeHooks), _toConsumableArray(_resolvePattern(beforeHooks[pattern])), [pattern], _toConsumableArray(_resolvePattern(afterHooks[pattern])), _toConsumableArray(_afterHooks))).then(function (patterns) {
        return _lodash2.default.reduce(patterns, function (instance, pattern) {
          return instance.then(function (result) {
            var _result$errorCode$ = result.errorCode$,
                errorCode$ = _result$errorCode$ === undefined ? "ERROR_NONE" : _result$errorCode$,
                _result$message$ = result.message$,
                message$ = _result$message$ === undefined ? "" : _result$message$,
                _result$data$ = result.data$,
                data$ = _result$data$ === undefined ? {} : _result$data$;

            // If errorCode$ is not equal to ERROR_NONE, response error code and error message

            if (errorCode$ !== "ERROR_NONE") {
              return _bluebird2.default.reject(new Error(message$));
            }

            // Handle this pattern and merge previous result to params
            return _act(pattern, patternParams).then(function (_result) {
              return _bluebird2.default.resolve(_lodash2.default.merge({}, result, _result));
            });
          });
        }, _bluebird2.default.resolve({}));
      });
    }
  };

  // Inject our method to seneca
  this.decorate("XService$", XService$);

  // Init function
  this.add("init:XService", function initXService(args, done) {
    return done();
  });

  // You must return service name, it must is the name you registered on init function
  return { name: "XService" };
}

var _resolvePattern = function _resolvePattern(pattern) {
  if (_lodash2.default.isString(pattern)) return [pattern];
  if (_lodash2.default.isArray(pattern)) return pattern;
  return [];
};