var vumigo = require("vumigo_v01");
var jed = require("jed");

if (typeof api === "undefined") {
    // testing hook (supplies api when it is not passed in by the real sandbox)
    var api = this.api = new vumigo.dummy_api.DummyApi();
}

var EndState = vumigo.states.EndState;
var FreeText = vumigo.states.FreeText;
var ChoiceState = vumigo.states.ChoiceState;
var Choice = vumigo.states.Choice;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;

function ExampleApp() {
    var self = this;
    self.counter_prefix = 'user-counter-for-';
    // The first state to enter
    StateCreator.call(self, 'number');

    self.add_state(new FreeText(
        'number',
        'action',
        'Give me a number!'
    ));

    self.add_state(new ChoiceState(
        'action',
        'done',
        'Ok, now what?',
        [
            new Choice('plus_one', 'Add one!'),
            new Choice('minus_one', 'Subtract one!'),
            new Choice('done', 'I\'m done here!')
        ],
        'Sorry, invalid option, yes or no only',
        {
            on_enter: function() {
                var key = self.counter_prefix + im.user_addr;
                var number = parseInt(im.get_user_answer('number'), 10);
                return im.api_request('kv.set', {
                    key: key,
                    value: number
                });
            }
        }
    ));

    self.log_result = function() {
        return function (result) {
            var p = im.log('Got result ' + JSON.stringify(result));
            p.add_callback(function() { return result; });
            return p;
        };
    };

    self.add_creator('done', function(state_name, im) {
        var key = self.counter_prefix + im.user_addr;
        var p = im.api_request('kv.get', {
            key: key
        });
        p.add_callback(self.log_result());
        if(im.get_user_answer('action') == 'plus_one') {
            p.add_callback(function(result) {
                return im.api_request('kv.incr', {
                    key: key,
                    amount: 1
                });
            });
            p.add_callback(self.log_result());
        }

        if(im.get_user_answer('action') == 'minus_one') {
            p.add_callback(function(result) {
                return im.api_request('kv.incr', {
                    key: key,
                    amount: -1
                });
            });
            p.add_callback(self.log_result());
        }

        p.add_callback(function(result) {
            return new EndState(
                'done',
                'Your counter is ' + result.value,
                'number');
        });
        p.add_callback(self.log_result());
        return p;
    });
}

// launch app
var states = new ExampleApp();
var im = new InteractionMachine(api, states);
im.attach();
