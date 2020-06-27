const assert = require('assert');
const model = require('../index');

describe('model', function () {
  it('should parse parameters', function () {
    withModel({
      customer: 'string',
      points: {type: 'int', default: 10},
      subscriber: 'bool',
      percentage: 'float',
      json: 'object'
    })
      .request({
        query: {
          customer: 'dan',
          subscriber: 'true',
          points: 20,
          percentage: 99.3
        },
        body: {
          json: {hello: 'world'}
        }
      })
      .expect({
        customer: 'dan',
        subscriber: true,
        points: 20,
        percentage: 99.3,
        json: {hello: 'world'}
      })
  });

  it('throws on invalid definition', function () {
    withModel({customer: 'badType'})
      .request({query: {customer: 'something'}})
      .expectError();
  });

  it('throws on missing required params', function () {
    withModel({required: 'string'})
      .request({query: {x: 1}})
      .expectError();
  });

  it('uses defaults', function () {
    withModel({x: {type: 'int', default: 10}})
      .request({})
      .expect({x: 10})
  });

  it('converts booleans', function () {
    withModel({
      b1: 'bool',
      b2: 'bool',
      b3: 'bool',
      b4: 'bool',
      b5: 'bool'
    })
      .request({
        query: {
          b1: '1',
          b2: 1,
          b3: 'true',
          b4: true,
          b5: 'something else'
        }
      })
      .expect({
        b1: true,
        b2: true,
        b3: true,
        b4: true,
        b5: false
      })
  });

  it('reads in priority order', function () {
    withModel({
      x: 'string',
      y: 'string',
      z: 'string'
    })
      .request({
        params: {x: 'paramsX'},
        query: {x: 'queryX', y: 'queryY'},
        body: {x: 'bodyX', y: 'bodyY', z: 'bodyZ'}
      })
      .expect({
        x: 'paramsX',
        y: 'queryY',
        z: 'bodyZ'
      });
  });

  it('reads from sources', function () {
    withModel({
      x: {type: 'string', sources: ['body']},
      y: 'string',
      z: 'string'
    })
      .request(
        {
          params: {x: 'paramsX'},
          query: {x: 'queryX', y: 'queryY'},
          body: {x: 'bodyX', y: 'bodyY', z: 'bodyZ'}
        })
      .expect(
        {
          x: 'bodyX',
          y: 'queryY',
          z: 'bodyZ'
        });
  });


  it('reads objects', function () {
    withModel({x: {type: 'object'}})
      .request({
        body: {
          x: {a: 1, b: 2, c: 3}
        }
      })
      .expect({
        x: {a: 1, b: 2, c: 3}
      })
  });

  it('allows valid enum values', function () {
    withModel({
      food: {type: 'string', enum: ['pizza', 'hamburger', 'steak']}
    })
      .request({body: {food: 'pizza'}})
      .expect({food: 'pizza'})
  });

  it('should allow the model property to be overridden', function () {
    withModel({food: 'string'}, "dataObj")
      .request({body: {food: 'pizza'}})
      .expect({food: 'pizza'});
  });

  it('does not allow invalid enum values', function () {
    withModel({food: {type: 'string', enum: ['pizza', 'hamburger', 'steak']}})
      .request({body: {food: 'eggs'}})
      .expectError();
  });

  it('converts names', function () {
    withModel({food: {type: 'string', name: "food_choice"}})
      .request({body: {food_choice: 'pizza'}})
      .expect({food: 'pizza'})
  });

  /**
   * Helper function that creates and runs the model middleware.
   *
   * @param definition A model definition
   * @param modelProp The output property. defaults to 'model'
   * @returns {{request: (function(*=): {expect: expect, expectError: expectError})}}
   */
  function withModel(definition, modelProp = "model") {
    const middleware = model(definition, modelProp);
    return {
      request: (req) => {
        return {
          expect: (expected) => {
            let nextCalls = 0;
            middleware(req, {}, () => nextCalls++);

            assert.strictEqual(nextCalls, 1, `Next should have been called once, got ${nextCalls}`);
            assert.deepStrictEqual(req[modelProp], expected, `Expected req.${modelProp} did not match actual`);
          },

          expectError: () => {
            let statusCode = -1;
            const res = {
              status: (code) => {
                statusCode = code;
                return {
                  send: () => {
                  }
                }
              }
            };

            let nextCalls = 0;
            middleware(req, res, () => nextCalls++);

            assert.strictEqual(nextCalls, 0, `Next should NOT be called when validation fails`);
            assert.strictEqual(statusCode, 400, "Request should have been rejected with status code 400");
          }
        }
      }
    }
  }
});
