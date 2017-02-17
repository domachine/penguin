export const HYDRATE = 'HYDRATE'
export const UPDATE_FIELDS = 'UPDATE_FIELDS'
export const SAVE = 'SAVE'
export const SAVE_SUCCESS = 'SAVE_SUCCESS'
export const SAVE_FAILURE = 'SAVE_FAILURE'

export function update (update) {
  return { type: UPDATE_FIELDS, update }
}

export function saveSuccess () {
  return { type: SAVE_SUCCESS }
}

export function saveFailure () {
  return { type: SAVE_FAILURE }
}
