import createSavedIndicator from './saved_indicator.js'

export function render (props) {
  return { replace: '' }
}

export function mount (props, el) {
  const component = createSavedIndicator(props, el)
  component.render()
  component.componentDidMount()
}
