import { combineReducers } from 'redux'

import { object as objectPathRegexp, page as pagePathRegexp } from './path_regexps'

import {
  UPDATE_FIELDS,
  SET_EDITABLE,
  LOAD,
  LOAD_SUCCESS,
  LOAD_FAILURE,
  SAVE,
  SAVE_SUCCESS,
  SAVE_FAILURE,
  HYDRATE
} from '../actions'

export default combineReducers({
  fields,
  locals,
  globals,
  languages,
  context,
  isEditable,
  isLoading,
  isSaving,
  error,
  isBuilt
})

function fields (state = {}, action) {
  switch (action.type) {
    case UPDATE_FIELDS:
      return Object.assign({}, state, action.update)
    case HYDRATE:
      return action.state.fields
    default:
      return state
  }
}

function locals (state = {}, action) {
  switch (action.type) {
    case HYDRATE:
      return action.state.locals
    default:
      return state
  }
}

function globals (state = {}, action) {
  switch (action.type) {
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

function isBuilt (state = false, action) {
  return state
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
    case LOAD:
      return true
    case LOAD_SUCCESS:
    case LOAD_FAILURE:
      return false
    default:
      return state
  }
}

function isSaving (state = false, action) {
  switch (action.type) {
    case SAVE:
      return true
    case SAVE_SUCCESS:
    case SAVE_FAILURE:
      return false
    default:
      return state
  }
}

function error (state = null, action) {
  switch (action.type) {
    case SAVE_SUCCESS:
    case LOAD_SUCCESS:
      return null
    case SAVE_FAILURE:
    case LOAD_FAILURE:
      return action.error
    default:
      return state
  }
}

function context (state = null, action) {
  switch (action.type) {
    case LOAD: {
      const match =
        action.pathname.match(objectPathRegexp) ||
        action.pathname.match(pagePathRegexp)
      return match.length === 4
        ? {
          match,
          language: match[1],
          type: match[2],
          id: match[3],
          isNew: match[3] === 'new'
        }
        : { match, language: match[1], name: match[2] || 'index' }
    }
    default:
      return state
  }
}
