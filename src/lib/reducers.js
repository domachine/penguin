import { combineReducers } from 'redux'

import {
  UPDATE_FIELDS,
  SAVE,
  SAVE_SUCCESS,
  SAVE_FAILURE,
  PUBLISH,
  PUBLISH_SUCCESS,
  PUBLISH_FAILURE,
  HYDRATE
} from '../actions'

export default combineReducers({
  fields,
  locals,
  globals,
  languages,
  isSaving,
  isPublishing,
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

function isPublishing (state = false, action) {
  switch (action.type) {
    case PUBLISH:
      return true
    case PUBLISH_SUCCESS:
    case PUBLISH_FAILURE:
      return false
    default:
      return state
  }
}

function error (state = null, action) {
  switch (action.type) {
    case PUBLISH_SUCCESS:
    case SAVE_SUCCESS:
      return null
    case PUBLISH_FAILURE:
    case SAVE_FAILURE:
      return action.error
    default:
      return state
  }
}
