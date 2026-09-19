const assert = require('node:assert/strict');
const test = require('node:test');
const express = require('express');
const request = require('supertest');

test('weakness searches use the resolved type pairs with Express 5', () => {
  const databasePath = require.resolve('../../database/db');
  const redisPath = require.resolve('../../database/redis');
  const routePath = require.resolve('../../routes/pokemonAll');
  const queries = [];

  require.cache[databasePath] = {
    exports: {
      db: {
        any: (query) => {
          queries.push(query);
          if (queries.length === 1) {
            return Promise.resolve([{type_1: 4, type_2: 12}]);
          }
          return Promise.resolve([]);
        },
      },
    },
  };
  require.cache[redisPath] = {
    exports: {
      get: () => Promise.resolve(null),
      set: () => {},
    },
  };
  delete require.cache[routePath];

  const app = express();
  app.use('/pokemon', require(routePath));

  return request(app).get('/pokemon?weaknesses=3').then((response) => {
    assert.equal(response.status, 200);
    assert.equal(queries.length, 2);
    assert.match(queries[1], /pt0\.type_id = 4 AND pt1\.type_id = 12/);

    delete require.cache[routePath];
    delete require.cache[redisPath];
    delete require.cache[databasePath];
  });
});
