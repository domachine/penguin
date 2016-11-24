import createSaveButton from './save_button.js'

export function render (props) {
  const component = createSaveButton(props)
  return component.render()
}

export function mount (props, el) {
  const component = createSaveButton(props, el)
  component.render()
  component.componentDidMount()
}
