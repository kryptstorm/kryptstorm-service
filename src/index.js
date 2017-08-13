// External modules
import _ from "lodash";
import Bluebird from "bluebird";
import Axios from "axios";

// Seneca plugin
export default function XService({
  maps = {},
  beforeHooks = {},
  afterHooks = {},
  allowMethods = ["POST", "GET", "PUT", "DELETE"]
}) {
  //
  // Proccess external services
  //
  // Default mapper
  const _mapper = data => data;
  // Check a pattern is external (does npt register on this instance)
  const _isExternalPattern = pattern =>
    _.isString(pattern) &&
    (_.isObject(maps[pattern]) || _.isString(maps[pattern]));
  // Register act, this function will help user run external services
  const _act = (pattern, patternParams) => {
    // Make seneca.act return a promise
    const act = Bluebird.promisify(this.act, { context: this });

    // Because the map only receive a string as a key
    // So, if the pattern is not a string, it is original seneca pattern (use object)
    // Just return the original action, simple!!! :)
    if (!_isExternalPattern(pattern)) {
      return act(pattern, patternParams);
    }

    // We need to call an external service
    const _externalPattern = maps[pattern];
    const {
      method = "GET",
      url,
      mapper,
      query,
      params,
      body
    } = _externalPattern;
    // Only handle allow method
    if (!_.includes(allowMethods, method)) {
      return Bluebird.reject(
        new Error(
          `The method ${method} is not allow. Only accept: ` +
            allowMethods.join(",")
        )
      );
    }

    // Tranform response to our format
    let transformResponse = [_mapper];
    if (_.isFunction(mapper)) {
      transformResponse.push(mapper);
    }

    if (method === "GET") {
      return Axios.get(url, { transformResponse }).then(({ data }) => {
        return Bluebird.resolve(data);
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
  let _beforeHooks = _resolvePattern(beforeHooks.global),
    _afterHooks = _resolvePattern(afterHooks.global);

  // Check all pattern has been exist
  const _verifyPatterns = patterns => {
    let errors;
    _.each(patterns, pattern => {
      if (!this.has(pattern) && !_isExternalPattern(pattern))
        errors = Bluebird.reject(
          new Error(`Pattern ${pattern} has not been registered.`)
        );
    });
    // An error has been exist, return it
    if (errors) return errors;
    return Bluebird.resolve(patterns);
  };

  // XService method
  const XService$ = {
    act: (pattern, patternParams) => {
      return _verifyPatterns([
        ..._beforeHooks,
        ..._resolvePattern(beforeHooks[pattern]),
        pattern,
        ..._resolvePattern(afterHooks[pattern]),
        ..._afterHooks
      ]).then(patterns =>
        _.reduce(
          patterns,
          (instance, pattern) =>
            instance.then(result => {
              const {
                errorCode$ = "ERROR_NONE",
                message$ = "",
                data$ = {}
              } = result;

              // If errorCode$ is not equal to ERROR_NONE, response error code and error message
              if (errorCode$ !== "ERROR_NONE") {
                return Bluebird.reject(new Error(message$));
              }

              // Handle this pattern and merge previous result to params
              return _act(pattern, patternParams).then(_result =>
                Bluebird.resolve(_.merge({}, result, _result))
              );
            }),
          Bluebird.resolve({})
        )
      );
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

const _resolvePattern = pattern => {
  if (_.isString(pattern)) return [pattern];
  if (_.isArray(pattern)) return pattern;
  return [];
};
