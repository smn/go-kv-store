var fs = require("fs");
var assert = require("assert");
var vumigo = require("vumigo_v01");
var app = require("../lib/go-kv-store");

// This just checks that you hooked you InteractionMachine
// up to the api correctly and called im.attach();
describe("test api", function() {
    it("should exist", function() {
        assert.ok(app.api);
    });
    it("should have an on_inbound_message method", function() {
        assert.ok(app.api.on_inbound_message);
    });
    it("should have an on_inbound_event method", function() {
        assert.ok(app.api.on_inbound_event);
    });
});

describe("Key Value store application", function() {

    var tester = new vumigo.test_utils.ImTester(app.api, {
        async: true,
        custom_setup: function(api) {
            // prime the kv store with a value
            api.kv_store['user-counter-for-1234567'] = 10;
        }
    });

    it('should ask for a starting number', function(done) {
        var p = tester.check_state({
            user: null,
            content: null,
            next_state: 'number',
            response: 'Give me a number!'
        });
        p.then(done, done);
    });

    it('should add one', function(done) {
        var p = tester.check_state({
            user: {
                current_state: 'action',
            },
            content: '1',
            next_state: 'done',
            response: 'Your counter is 11',
            continue_session: false
        }).then(done, done);
    });

    it('should subtract one', function(done) {
        var p = tester.check_state({
            user: {
                current_state: 'action',
            },
            content: '2',
            next_state: 'done',
            response: 'Your counter is 9',
            continue_session: false
        }).then(done, done);
    });

    it('should echo the value', function(done) {
        var p = tester.check_state({
            user: {
                current_state: 'action',
            },
            content: '3',
            next_state: 'done',
            response: 'Your counter is 10',
            continue_session: false
        }).then(done, done);
    });
});