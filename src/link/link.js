const renderLink = ({ currentLanguage, className, id, href, innerHTML }) =>
  `<a
    ${className ? `class='${className}'` : ''}
    ${id ? `id='${id}'` : ''}
    data-component='Link'
    data-props='${JSON.stringify({ href, innerHTML })}'
    href='${renderHref({ currentLanguage, href })}'
  >${innerHTML}</a>`

const renderHref = ({ currentLanguage, href }) =>
  currentLanguage
    ? `/${currentLanguage}${href}`
    : '#'

export default function createLink (ownProps, el) {
  const { store } = ownProps
  return {
    componentDidMount () {
      store.subscribe(state => render(calcProps(state), el))
    },
    render () {
      return render(calcProps(store.getState()), el)
    }
  }

  function calcProps (state) {
    return Object.assign({
      href: ownProps.href || '',
      innerHTML: ownProps.innerHTML || '',
      className: ownProps.className || '',
      id: ownProps.id || ''
    }, mapStateToProps(state))
  }
}

function render (props, el) {
  if (!el) return { replace: renderLink(props) }
  const href = renderHref(props)
  if (props.id) el.setAttribute('id', props.id)
  else el.removeAttribute('id')
  if (props.className) el.setAttribute('class', props.className)
  else el.removeAttribute('class')
  if (props.innerHTML !== el.innerHTML) el.innerHTML = props.innerHTML
  if (href !== el.getAttribute('href')) el.setAttribute('href', href)
}

function mapStateToProps (state) {
  return {
    currentLanguage: state.currentLanguage
  }
}
