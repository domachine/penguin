import createSaveButton from './save_button.js'

export default function mount (props, el) {
  const component = createSaveButton(props, el)
  if (el) {
    component.render()
    component.componentDidMount()
  } else {
    return component.render()
  }
}
