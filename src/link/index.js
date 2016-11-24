import createLink from './link.js'

export function render (props) {
  const component = createLink(props)
  return component.render()
}

export function mount (props, el) {
  const component = createLink(props, el)
  component.render()
  component.componentDidMount()
}
