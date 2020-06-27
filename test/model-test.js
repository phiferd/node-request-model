const assert = require('assert');
const model = require('../index');

describe('model', function () {
  it('should parse parameters', function () {
    expectModel({
        customer: 'string',
        points: {type: 'int', default: 10},
        subscriber: 'bool',
        percentage: 'float'
      },
      {
        query: {
          customer: 'dan',
          subscriber: 'true',
          points: 20,
          percentage: 99.3
        }
      },
      {
        customer: 'dan',
        subscriber: true,
        points: 20,
        percentage: 99.3
      }
    )
  });

  it('throws on invalid definition', function () {
    expectError(
      {customer: 'badType'},
      {query: {customer: 'something'}})
  });

  it('throws on missing required params', function () {
    expectError(
      {required: 'string'},
      {query: {x: 1}})
  });

  it('uses defaults', function () {
    expectModel({
      x: {type: 'int', default: 10}
    },
      {
      },
      {
        x: 10
      })
  });

  it('reads in priority order', function () {
    expectModel({
        x: 'string',
        y: 'string',
        z: 'string'
      },
      {
        params: {x: 'paramsX'},
        query: {x: 'queryX', y: 'queryY'},
        body: {x: 'bodyX', y: 'bodyY', z: 'bodyZ'}
      },
      {
        x: 'paramsX',
        y: 'queryY',
        z: 'bodyZ'
      });
  });

  it('reads from sources', function () {
    expectModel({
        x: {type: 'string', sources: ['body']},
        y: 'string',
        z: 'string'
      },
      {
        params: {x: 'paramsX'},
        query: {x: 'queryX', y: 'queryY'},
        body: {x: 'bodyX', y: 'bodyY', z: 'bodyZ'}
      },
      {
        x: 'bodyX',
        y: 'queryY',
        z: 'bodyZ'
      });
  });


  it('reads objects', function () {
    expectModel(
      { x: {type: 'object'}},
      {body: {x: {a: 1, b: 2, c: 3}}},
      {x: {a: 1, b: 2, c: 3}}
    )
  });

  it('allows valid enum values', function () {
    expectModel(
      { food: {type: 'string', enum: ['pizza', 'hamburger', 'steak']}},
      {body: {food: 'pizza'}},
      {food: 'pizza'}
    )
  });

  it('should allow the model property to be overridden', function () {
    expectModel(
      { food: 'string'},
      {body: {food: 'pizza'}},
      {food: 'pizza'},
      "dataObj"
    )
  });

  it('does not allow invalid enum values', function () {
    expectError(
      { food: {type: 'string', enum: ['pizza', 'hamburger', 'steak']}},
      {body: {food: 'eggs'}}
    )
  });

  it('converts names', function () {
    expectModel(
      { food: {type: 'string', name: "food_choice"}},
      {body: {food_choice: 'pizza'}},
      {food: 'pizza'}
    )
  });

  function expectError(definition, req) {
    const middleware = model(definition);

    let statusCode = -1;
    const res = {
      status: (code) => {
        statusCode = code;
        return {send: () => {}}
      }
    };

    let nextCalls = 0;
    middleware(req, res, () => nextCalls++);

    assert.strictEqual(nextCalls, 0, `Next should NOT be called when validation fails`);
    assert.strictEqual(statusCode, 400, "Request should have been rejected with status code 400");
  }

  function expectModel(definition, req, expectedModel, modelProp="model") {
    const middleware = model(definition, modelProp);

    let nextCalls = 0;
    middleware(req, {}, () => nextCalls++);

    assert.strictEqual(nextCalls, 1, `Next should have been called once, got ${nextCalls}`);
    assert.deepStrictEqual(req[modelProp], expectedModel, `Expected req.${modelProp} did not match actual`);
  }
});
