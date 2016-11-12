import test from 'ava'
import { spy } from 'sinon'
import 'babel-register'

import reduce from './reducers'
import {
  updateLocalFields,
  updateGlobalFields,
  update,
  setEditable,
  switchLanguage
} from './actions'
import {
  createValueSelector,
  localFields,
  globalFields,
  isEditable,
  currentLanguage,
  languages
} from './selectors'

test('leaves unchanged state untouched', t => {
  const state = reduce(undefined, {})
  t.is(reduce(state, {}), state)
})

test('updates local data', t => {
  const titleValue = createValueSelector()
  const fooValue = createValueSelector()
  const state = {
    currentLanguage: 'en',
    locals: { fields: {}, noLangFields: [] },
    globals: { noLangFields: [] }
  }
  const update = { title: { values: { en: 'test' } }, foo: { values: { en: ['bar'] } } }
  const action = updateLocalFields(update)
  const newState = reduce(state, action)
  t.deepEqual(localFields(newState), Object.assign({}, state.locals.fields, update))
  t.is(titleValue(newState, 'title'), update.title.values.en)
  t.is(fooValue(newState, 'foo'), update.foo.values.en)
})

test('updates global data', t => {
  const titleValue = createValueSelector()
  const fooValue = createValueSelector()
  const state = {
    currentLanguage: 'en',
    globals: { fields: { title: '' }, noLangFields: [] },
    locals: { fields: {}, noLangFields: [] }
  }
  const update = { title: { values: { en: 'test' } }, foo: { values: { en: ['bar'] } } }
  const action = updateGlobalFields(update)
  const newState = reduce(state, action)
  t.deepEqual(globalFields(newState), Object.assign({}, state.globals.fields, update))
  t.is(titleValue(newState, 'title'), update.title.values.en)
  t.is(fooValue(newState, 'foo'), update.foo.values.en)
  t.is(newState.globals.fields.title, update.title)
})

test('updates both globals and record data', t => {
  const state = {
    defaultLanguage: 'en',
    languages: ['en', 'de'],
    currentLanguage: 'de',
    globals: {
      fields: {
        title: { values: { en: 'Fooish stuff' } },
        foo: { values: {} }
      },
      noLangFields: []
    },
    locals: { fields: {}, noLangFields: [] },
    noLangFields: []
  }
  const updateData = { title: 'test', foo: [], bar: 42 }
  const { title, foo, bar } = updateData
  const dispatch = spy()
  const getState = () => state
  const action = update(updateData)
  action(dispatch, getState)
  t.truthy(dispatch.calledTwice)
  t.deepEqual(
    dispatch.args[0][0],
    updateLocalFields({ bar: { values: { [state.currentLanguage]: bar } } })
  )
  t.deepEqual(
    dispatch.args[1][0],
    updateGlobalFields({
      title: {
        values: {
          [state.currentLanguage]: title,
          en: state.globals.fields.title.values.en
        }
      },
      foo: {
        values: { [state.currentLanguage]: foo }
      }
    })
  )
})

test('toggles the editable flag', t => {
  const state = {
    isEditable: false
  }
  const newState = reduce(state, setEditable(true))
  t.is(isEditable(newState), true)
})

test('switches the language', t => {
  const state = {
    defaultLanguage: 'en',
    languages: ['de', 'en', 'fr'],
    currentLanguage: 'de'
  }
  const frLangState = reduce(state, switchLanguage('fr'))
  t.is(currentLanguage(frLangState), 'fr')
  t.is(languages(state), state.languages)
})

test('updates local no-lang fields properly', t => {
  const logoValue = createValueSelector()
  let state = {
    defaultLanguage: 'en',
    languages: ['de', 'en', 'fr'],
    currentLanguage: 'de',
    locals: {
      noLangFields: ['logo'],
      fields: {}
    },
    globals: {
      noLangFields: []
    }
  }
  const dispatch = action => (state = reduce(state, action))
  update({ logo: 'my value' })(dispatch, () => state)
  t.is(logoValue(state, 'logo'), 'my value')
  t.deepEqual(state.locals.fields.logo, { value: 'my value' })
})

test('updates global no-lang fields properly', t => {
  const logoValue = createValueSelector()
  let state = {
    defaultLanguage: 'en',
    languages: ['de', 'en', 'fr'],
    currentLanguage: 'de',
    locals: {
      noLangFields: [],
      fields: {}
    },
    globals: {
      noLangFields: ['logo'],
      fields: {
        logo: null
      }
    }
  }
  const dispatch = action => (state = reduce(state, action))
  update({ logo: 'my value' })(dispatch, () => state)
  t.is(logoValue(state, 'logo'), 'my value')
  t.deepEqual(state.globals.fields.logo, { value: 'my value' })
})
