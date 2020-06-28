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
