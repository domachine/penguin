import { combineReducers } from 'redux'

import {
  UPDATE_LOCAL_FIELDS,
  UPDATE_GLOBAL_FIELDS,
  SET_EDITABLE,
  LOAD,
  LOAD_SUCCESS,
  LOAD_FAILURE,
  SAVE,
  SAVE_SUCCESS,
  SAVE_FAILURE,
  SWITCH_LANGUAGE,
  HYDRATE
} from '../actions'

export default combineReducers({
  locals,
  globals,
  languages,
  currentLanguage,
  isEditable,
  isLoading,
  isSaving,
  error,
  isBuilt
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
