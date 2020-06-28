# node-request-model
Mongoose-inspired Node.js / Express middleware to simplify handling requests.

Eliminates boilerplate code responsible for basic parameter validation, default value handling, and
type conversion.  Also, it creates an easy-to-read description of what is expected by the route.

## install

`npm install --save node-request-model`

## Usage

```javascript
const model = require('node-request-model');


// ...


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
  
    // objects are always pulled from the body. This assumes json body parser was run earlier
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

## Re-using models


person.js
```javascript
module.exports = {
  firstName: "string",
  lastName: "string"
}
```

address.js
```javascript
module.exports = {
  street1: 'string',
  street2: {type: 'string', default: ''},
  city: 'string',
  state: {
    type: 'string',
    validation: (s) => s.length === 2
  },
  
  // example regex test. More complex logic (e.g. country dependent)
  // doesn't belong in request validation logic. 
  postalCode: {
    type: 'string',
    validation: (s) => /^[0-9]{5}(?:-[0-9]{4})?$/.test(s)
  }
}
```

In the route, models definitions can be combined using the spread operator. 
Nested models are not supported.   

```javascript
app.post('customer/:customer',
  model({
    ...require('./person.js'),
    ...require('./address.js')
  }),
  (req, res) => {
    // The optional second parameter can be used to override which property will hold the 
    // the model output
    console.log('Model', req.model)
    
    res.json(req.model);
  } 
)

```

## Functional defaults

Functions can be used to specify default values. The function will be evaluated for each request.

```javascript

app.post('customer',
  model({
    firstName: 'string',
    lastName: 'string',
  
    // A function can be passed as a default. 
    // The function will be evaluated for each request.
    registeredAt: {type: 'int', default: Date.now}
  }),
  (req, res) => {
    // req.model.registeredAt will be the current time, unless a value was explicitly
    // passed by the client.
    console.log('Model', req.model)
  } 
)

```


