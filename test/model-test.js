const assert = require('assert');
const model = require('../index');

const buildSpy = (method) => {
  const state = {calls: 0};
  return {
    get calls() {
      return state.calls;
    },
    [method]: () => {
      state.calls++;
    }
  }
}

const response = () => {
  const state = {code: 0};
  return {
    get code() {
      return state.code;
    },
    status: (code) => {
      state.code = code;
      return {send: () => {}}
    }
  }
}

describe('model', function () {
  it('should parse parameters', function () {
    runTest({
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
    runTest({
      x: {type: 'int', default: 10}
    },
      {
      },
      {
        x: 10
      })
  });

  it('reads in priority order', function () {
    runTest({
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
    runTest({
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
    runTest(
      { x: {type: 'object'}},
      {body: {x: {a: 1, b: 2, c: 3}}},
      {x: {a: 1, b: 2, c: 3}}
    )
  });

  it('allows valid enum values', function () {
    runTest(
      { food: {type: 'string', enum: ['pizza', 'hamburger', 'steak']}},
      {body: {food: 'pizza'}},
      {food: 'pizza'}
    )
  });

  it('does not allow invalid enum values', function () {
    expectError(
      { food: {type: 'string', enum: ['pizza', 'hamburger', 'steak']}},
      {body: {food: 'eggs'}}
    )
  });

  it('converts names', function () {
    runTest(
      { food: {type: 'string', name: "food_choice"}},
      {body: {food_choice: 'pizza'}},
      {food: 'pizza'}
    )
  });

  function expectError(definition, req) {
    runTest(definition, req, {}, 0, 400);
  }

  function runTest(definition, req, expectedResult, nextCalls=1, status=200) {
    const middleware = model(definition);
    const res = response();
    const spy = buildSpy('next');

    middleware(req, res, spy.next);

    if (status >= 200 && status < 300) {
      assert.strictEqual(spy.calls, nextCalls, `Next should have been called ${nextCalls} time, got ${spy.calls}`);
      assert.deepStrictEqual(req.model, expectedResult, `Expected req.model did not match actual`);
    }
    else {
      assert.strictEqual(res.code, status, "Validation error should have been thrown");
    }
  }
});
