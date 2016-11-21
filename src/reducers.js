import { combineReducers } from 'redux'

import {
  UPDATE_LOCAL_FIELDS,
  UPDATE_GLOBAL_FIELDS,
  SET_EDITABLE,
  SET_LOADING,
  SWITCH_LANGUAGE,
  HYDRATE
} from './actions'

export default combineReducers({
  locals,
  globals,
  languages,
  defaultLanguage,
  currentLanguage,
  isEditable,
  isLoading
})

function locals (state = {}, action) {
  switch (action.type) {
    case UPDATE_LOCAL_FIELDS:
      return Object.assign({}, state, {
        fields: Object.assign({}, state.fields, action.update)
      })
    case HYDRATE:
      return action.state.locals
    default:
      return state
  }
}

function globals (state = {}, action) {
  switch (action.type) {
    case UPDATE_GLOBAL_FIELDS:
      return Object.assign({}, state, {
        fields: Object.assign({}, state.fields, action.update)
      })
    case HYDRATE:
      return action.state.globals
    default:
      return state
  }
}

function languages (state = [], action) {
  switch (action.type) {
    case HYDRATE:
      return action.state.languages
    default:
      return state
  }
}

function defaultLanguage (state = null, action) {
  switch (action.type) {
    case HYDRATE:
      return action.state.defaultLanguage
    default:
      return state
  }
}

function currentLanguage (state = null, action) {
  switch (action.type) {
    case SWITCH_LANGUAGE:
      return action.lang
    case HYDRATE:
      return action.state.currentLanguage
    default:
      return state
  }
}

function isEditable (state = false, action) {
  switch (action.type) {
    case SET_EDITABLE:
      return action.value
    default:
      return state
  }
}

function isLoading (state = false, action) {
  switch (action.type) {
    case SET_LOADING:
      return action.value
    default:
      return state
  }
}
