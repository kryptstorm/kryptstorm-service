"use strict";

var _querystring = require("querystring");

var _querystring2 = _interopRequireDefault(_querystring);

var _seneca = require("seneca");

var _seneca2 = _interopRequireDefault(_seneca);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var _chai = require("chai");

var _2 = require(".");

var _3 = _interopRequireDefault(_2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Defined function - what will return test app instance
// System modules
var App = function App() {
  return (0, _seneca2.default)({
    timeout: 10000,
    log: "test",
    debug: { undead: true }
  });
};

// Defined basic test


// Internal modules


// External modules
describe("XService - Call external API - what is not belong to Kryptstorm", function () {
  // Init test app
  var app = App();

  // Register XService
  app.use(_3.default, {
    maps: {
      "faker:name, properties:firstName": {
        // Required fields
        method: "GET", // Method will be call - default is "get"
        url: "http://faker.hook.io", // Uri to external service
        mapper: function mapper(data) {
          return { data$: { firstName: data } };
        }, // Map the result, because may be we will call an service is not belog to kryptstorm
        // Optional fields
        query: _querystring2.default.stringify({ property: "name.firstName" }), // the sevice query
        params: {}, // The service method parameters
        body: {} // The request body (for create, update and patch)
      }
    }
  });

  // Before hook for test, all thing you need will be prepare at there
  before(function (done) {
    // App is ready to test
    app.ready(function () {
      return done();
    });
  });

  it("faker.hook.io - Get firstName", function (done) {
    app.XService$.act("faker:name, properties:firstName").then(function (_ref) {
      var _ref$errorCode$ = _ref.errorCode$,
          errorCode$ = _ref$errorCode$ === undefined ? "ERROR_NONE" : _ref$errorCode$,
          data$ = _ref.data$;

      // If errorCode$ is not equal to ERROR_NONE, that mean we an error :) easy
      (0, _chai.expect)(errorCode$).to.be.equal("ERROR_NONE");

      // If action has been successful, data$ must be an object
      (0, _chai.expect)(data$).to.be.an("object");

      // And our data must be exist
      (0, _chai.expect)(data$.firstName).to.be.exist;

      // Test is successful
      done();
    }).catch(done);
  });
});

describe("XService - Hooks", function () {
  describe("Global hooks", function () {
    // Init test app
    var app = App();

    // Register XService
    app.use(_3.default, {
      beforeHooks: {
        global: ["x_service:hook, before:global"]
      },
      afterHooks: {
        global: ["x_service:hook, after:global"]
      }
    });

    // Before hook for test, all thing you need will be prepare at there
    before(function (done) {
      app.add("x_service:hook, before:global", function (args, done) {
        return done(null, { data$: { before: "hook" } });
      });
      app.add("x_service:test", function (args, done) {
        return done(null, { data$: { main: "handler" } });
      });
      app.add("x_service:hook, after:global", function (args, done) {
        return done(null, { data$: { after: "hook" } });
      });
      // App is ready to test
      app.ready(function () {
        return done();
      });
    });

    it("Global", function (done) {
      app.XService$.act("x_service:test").then(function (_ref2) {
        var _ref2$errorCode$ = _ref2.errorCode$,
            errorCode$ = _ref2$errorCode$ === undefined ? "ERROR_NONE" : _ref2$errorCode$,
            data$ = _ref2.data$;

        // If errorCode$ is not equal to ERROR_NONE, that mean we an error :) easy
        (0, _chai.expect)(errorCode$).to.be.equal("ERROR_NONE");

        // If action has been successful, data$ must be an object
        (0, _chai.expect)(data$).to.be.an("object");

        // And our data must be exist
        (0, _chai.expect)(data$.before).to.be.equal("hook");
        (0, _chai.expect)(data$.main).to.be.equal("handler");
        (0, _chai.expect)(data$.after).to.be.equal("hook");

        // Test is successful
        done();
      }).catch(done);
    });
  });

  describe("Pattern hooks", function () {
    // Init test app
    var app = App();

    // Register XService
    app.use(_3.default, {
      beforeHooks: {
        "x_service:test": ["x_service:hook, before:service"]
      },
      afterHooks: {
        "x_service:test": ["x_service:hook, after:service"]
      }
    });

    // Before hook for test, all thing you need will be prepare at there
    before(function (done) {
      app.add("x_service:hook, before:service", function (args, done) {
        return done(null, { data$: { before: "hook" } });
      });
      app.add("x_service:test", function (args, done) {
        return done(null, { data$: { main: "handler" } });
      });
      app.add("x_service:hook, after:service", function (args, done) {
        return done(null, { data$: { after: "hook" } });
      });
      // App is ready to test
      app.ready(function () {
        return done();
      });
    });

    it("Pattern", function (done) {
      app.XService$.act("x_service:test").then(function (_ref3) {
        var _ref3$errorCode$ = _ref3.errorCode$,
            errorCode$ = _ref3$errorCode$ === undefined ? "ERROR_NONE" : _ref3$errorCode$,
            data$ = _ref3.data$;

        // If errorCode$ is not equal to ERROR_NONE, that mean we an error :) easy
        (0, _chai.expect)(errorCode$).to.be.equal("ERROR_NONE");

        // If action has been successful, data$ must be an object
        (0, _chai.expect)(data$).to.be.an("object");

        // And our data must be exist
        (0, _chai.expect)(data$.before).to.be.equal("hook");
        (0, _chai.expect)(data$.main).to.be.equal("handler");
        (0, _chai.expect)(data$.after).to.be.equal("hook");

        // Test is successful
        done();
      }).catch(done);
    });
  });
});