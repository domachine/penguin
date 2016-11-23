import createSavedIndicator from './saved_indicator.js'

export default function mount (props, el) {
  const component = createSavedIndicator(props, el)
  if (el) {
    component.render()
    component.componentDidMount()
  } else {
    return component.render()
  }
}
