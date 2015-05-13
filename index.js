/**
 * Module dependencies
 */

var _ = require('lodash');
var Machine = require('machine');


/**
 * machine-as-action
 *
 * Build a conventional controller action (i.e. route handling function)
 * from a machine definition.  This wraps the machine in a function which
 * negotiates exits to the appropriate response method (e.g. res.negotiate)
 * and passes in all of the request parameters as inputs, as well as a few
 * other useful env variables including:
 *  • req
 *  • res
 *
 * @param  {Object} machineDef
 * @return {Function}
 */

module.exports = function machineAsAction(opts) {

  opts = opts||{};

  // Use either `opts` or `opts.machine` as the machine definition
  var machineDef;
  if (!opts.machine) {
    machineDef = opts;
  }
  else {
    machineDef = opts.machine;
  }


  return function _requestHandler(req, res) {

    if (!req.allParams) {
      throw new Error('Currently, `machine-as-action` requires `req.allParams()` to exist (i.e. a Sails.js app with the request hook enabled)');
    }
    if (!res.negotiate) {
      throw new Error('Currently, `machine-as-action` requires `res.negotiate()` to exist (i.e. a Sails.js app with the responses hook enabled)');
    }
    if (!res.json) {
      throw new Error('Currently, `machine-as-action` requires `res.json()` to exist (i.e. a Sails.js or Express app)');
    }

    // TODO: ....be smart about upstreams here....

    // Build machine, applying defaults
    var wetMachine = Machine.build(_.extend({
      identity: machineDef.friendlyName||'anonymous-action',
      inputs: {},
      exits: {
        success: {
          description: 'Done.'
        },
        error: {
          description: 'Unexpected error occurred.'
        }
      },
      fn: function (inputs, exits){
        exits.error(new Error('Not implemented yet!'));
      }
    },machineDef||{}));

    // Build input configuration for machine using request parameters
    var inputConfiguration = _.extend({}, req.allParams());
    var liveMachine = wetMachine.configure(inputConfiguration);
    // Provide `env.req` and `env.res`
    liveMachine.setEnvironment({
      req: req,
      res: res
    });
    // Now run the machine, proxying exits to the response.
    return liveMachine.exec({
      error: function (err){
        return res.negotiate(err);
      },
      success: function (result){
        // TODO: handle other types of result data
        // try {
        // if (machineDef.exits.success.example === '*') {
        //   // ...be smart about streams here...
        // }
        // catch (e){return res.negotiate(e);}

        if (_.isUndefined(result)) {
          return res.send(200);
        }
        return res.json(result);
      }
    });
  };
};