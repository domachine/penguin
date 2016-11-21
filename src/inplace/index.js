import createInplace from './inplace'

export default function mount (props, el) {
  const component = createInplace(props, el)
  if (el) {
    component.render()
    component.componentDidMount()
  } else {
    return component.render()
  }
}
