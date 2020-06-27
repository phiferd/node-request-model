# node-request-model
Node.js / Express middleware to simplify handling requests.

Eliminates boilerplate code responsible for basic parameter validation, default value handling, and
type conversion.  Also, it creates an easy-to-read description of what is expected by the route.

## install

`npm install --save node-request-model`

## Usage

```javascript
const model = require('node-request-model');


...


// Models are declared as middleware. They can be added to any route (GET, POST, etc...) and
// the results will be stored in the req.model variable by default. 
app.post('customer/:customer/register',
  model({
    // shorthand for {type: 'string', required: true}
    customer: 'string', 
  
    // optional value
    height: {type: 'float', required: false},

    // enforce enums
    foodChoice: {type: 'string', enum: ['pizza', 'taco', 'salad']},

    // booleans are converted to true if the value is "true", 1, or "1", otherwise false 
    subscribe: 'bool',
  
    // objects are always pulled from the body
    preferences: {type: 'object'},

    // forces node-request-model to look first in req.body and then in req.query if no value
    // is found in the body. It will not look in req.params 
    image: {type: 'string', sources: ['body', 'query']},

    // looks for "my_field" in the request and stores the result in req.model.myField
    myField: {type: 'string', name: 'my_field'}
  }),
  (req, res) => {
    // If any validation checks have failed, a 400 response is returned to the caller
    // Otherwise, req.model has the values (already cast to their correct types)

    // By default, values are pulled from req.params, req.query, and req.body (in that order)
    console.log('Model', req.model);

    res.json(req.model);
  } 
)

// Models are declared as middleware. They can be added to any route (GET, POST, etc...) and
// the results will be stored in the req.model variable by default. 
app.get('customer/:customer',
  model({customer: 'string'}, 'somethingElse'),
  (req, res) => {
    // The optional second parameter can be used to override which property will hold the 
    // the model output
    console.log('Model', req.somethingElse)
    
    res.json(req.somethingElse);
  } 
)

```
