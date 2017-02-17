import { combineReducers } from 'redux'

import {
  UPDATE_FIELDS,
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
  isSaving,
  error
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
      return null
    case SAVE_FAILURE:
      return action.error
    default:
      return state
  }
}
