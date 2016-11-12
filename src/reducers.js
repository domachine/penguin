import { combineReducers } from 'redux'

import {
  UPDATE_LOCAL_FIELDS,
  UPDATE_GLOBAL_FIELDS,
  SET_EDITABLE,
  SWITCH_LANGUAGE
} from './actions'

export default combineReducers({
  locals,
  globals,
  languages,
  defaultLanguage,
  currentLanguage,
  isEditable
})

function locals (state = null, action) {
  switch (action.type) {
    case UPDATE_LOCAL_FIELDS:
      return Object.assign({}, state, {
        fields: Object.assign({}, state.fields, action.update)
      })
    default:
      return state
  }
}

function globals (state = null, action) {
  switch (action.type) {
    case UPDATE_GLOBAL_FIELDS:
      return Object.assign({}, state, {
        fields: Object.assign({}, state.fields, action.update)
      })
    default:
      return state
  }
}

function languages (state = [], action) {
  switch (action.type) {
    default:
      return state
  }
}

function defaultLanguage (state = null, action) {
  switch (action.type) {
    default:
      return state
  }
}

function currentLanguage (state = null, action) {
  switch (action.type) {
    case SWITCH_LANGUAGE:
      return action.lang
    default:
      return state
  }
}

function isEditable (state = true, action) {
  switch (action.type) {
    case SET_EDITABLE:
      return action.value
    default:
      return state
  }
}
