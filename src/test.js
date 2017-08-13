// System modules
import Querystring from "querystring";

// External modules
import Seneca from "seneca";
import _ from "lodash";
import Bluebird from "bluebird";
import { expect } from "chai";

// Internal modules
import XService from ".";

// Defined function - what will return test app instance
const App = () =>
  Seneca({
    timeout: 10000,
    log: "test",
    debug: { undead: true }
  });

// Defined basic test
describe("XService - Call external API - what is not belong to Kryptstorm", function() {
  // Init test app
  const app = App();

  // Register XService
  app.use(XService, {
    maps: {
      "faker:name, properties:firstName": {
        // Required fields
        method: "GET", // Method will be call - default is "get"
        url: "http://faker.hook.io", // Uri to external service
        mapper: data => ({ data$: { firstName: data } }), // Map the result, because may be we will call an service is not belog to kryptstorm
        // Optional fields
        query: Querystring.stringify({ property: "name.firstName" }), // the sevice query
        params: {}, // The service method parameters
        body: {} // The request body (for create, update and patch)
      }
    }
  });

  // Before hook for test, all thing you need will be prepare at there
  before(done => {
    // App is ready to test
    app.ready(() => done());
  });

  it("faker.hook.io - Get firstName", function(done) {
    app.XService$
      .act("faker:name, properties:firstName")
      .then(({ errorCode$ = "ERROR_NONE", data$ }) => {
        // If errorCode$ is not equal to ERROR_NONE, that mean we an error :) easy
        expect(errorCode$).to.be.equal("ERROR_NONE");

        // If action has been successful, data$ must be an object
        expect(data$).to.be.an("object");

        // And our data must be exist
        expect(data$.firstName).to.be.exist;

        // Test is successful
        done();
      })
      .catch(done);
  });
});

describe("XService - Hooks", function() {
  describe("Global hooks", function() {
    // Init test app
    const app = App();

    // Register XService
    app.use(XService, {
      beforeHooks: {
        global: ["x_service:hook, before:global"]
      },
      afterHooks: {
        global: ["x_service:hook, after:global"]
      }
    });

    // Before hook for test, all thing you need will be prepare at there
    before(done => {
      app.add("x_service:hook, before:global", function(args, done) {
        return done(null, { data$: { before: "hook" } });
      });
      app.add("x_service:test", function(args, done) {
        return done(null, { data$: { main: "handler" } });
      });
      app.add("x_service:hook, after:global", function(args, done) {
        return done(null, { data$: { after: "hook" } });
      });
      // App is ready to test
      app.ready(() => done());
    });

    it("Global", function(done) {
      app.XService$
        .act("x_service:test")
        .then(({ errorCode$ = "ERROR_NONE", data$ }) => {
          // If errorCode$ is not equal to ERROR_NONE, that mean we an error :) easy
          expect(errorCode$).to.be.equal("ERROR_NONE");

          // If action has been successful, data$ must be an object
          expect(data$).to.be.an("object");

          // And our data must be exist
          expect(data$.before).to.be.equal("hook");
          expect(data$.main).to.be.equal("handler");
          expect(data$.after).to.be.equal("hook");

          // Test is successful
          done();
        })
        .catch(done);
    });
  });

  describe("Pattern hooks", function() {
    // Init test app
    const app = App();

    // Register XService
    app.use(XService, {
      beforeHooks: {
        "x_service:test": ["x_service:hook, before:service"]
      },
      afterHooks: {
        "x_service:test": ["x_service:hook, after:service"]
      }
    });

    // Before hook for test, all thing you need will be prepare at there
    before(done => {
      app.add("x_service:hook, before:service", function(args, done) {
        return done(null, { data$: { before: "hook" } });
      });
      app.add("x_service:test", function(args, done) {
        return done(null, { data$: { main: "handler" } });
      });
      app.add("x_service:hook, after:service", function(args, done) {
        return done(null, { data$: { after: "hook" } });
      });
      // App is ready to test
      app.ready(() => done());
    });

    it("Pattern", function(done) {
      app.XService$
        .act("x_service:test")
        .then(({ errorCode$ = "ERROR_NONE", data$ }) => {
          // If errorCode$ is not equal to ERROR_NONE, that mean we an error :) easy
          expect(errorCode$).to.be.equal("ERROR_NONE");

          // If action has been successful, data$ must be an object
          expect(data$).to.be.an("object");

          // And our data must be exist
          expect(data$.before).to.be.equal("hook");
          expect(data$.main).to.be.equal("handler");
          expect(data$.after).to.be.equal("hook");

          // Test is successful
          done();
        })
        .catch(done);
    });
  });
});
