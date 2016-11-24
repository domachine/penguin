import createSavedIndicator from './saved_indicator.js'

export function render (props) {
  const component = createSavedIndicator(props)
  return component.render()
}

export function mount (props, el) {
  const component = createSavedIndicator(props, el)
  component.render()
  component.componentDidMount()
}
