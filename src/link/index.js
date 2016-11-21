import createLink from './link.js'

export default function mount (props, el) {
  const component = createLink(props, el)
  if (el) {
    component.render()
    component.componentDidMount()
  } else {
    return component.render()
  }
}
