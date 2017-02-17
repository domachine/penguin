import createSaveButton from './save_button.js'

export function render (props) {
  return { replace: '' }
}

export function mount (props, el) {
  if (process.env.PENGUIN_ENV === 'production') return
  const component = createSaveButton(props, el)
  component.render()
  component.componentDidMount()
}
