import createInplace from './inplace'

export function render (props) {
  const component = createInplace(props)
  return component.render()
}

export function mount (props, el) {
  const component = createInplace(props, el)
  component.render()
  component.componentDidMount()
}
