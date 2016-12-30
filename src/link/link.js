import { currentLanguage } from '../selectors'

const renderHref = ({ currentLanguage, href }) =>
  currentLanguage
    ? `/${currentLanguage}${href}`
    : '#'

export default function createLink (ownProps, el) {
  const { store } = ownProps
  return {
    componentDidMount () { store.subscribe(onUpdate) },
    render: onUpdate
  }

  function onUpdate () {
    return render(calcProps(store.getState()), el)
  }

  function calcProps (state) {
    return Object.assign({
      href: ownProps.href || '',
      innerHTML: ownProps.innerHTML || ''
    }, mapStateToProps(state))
  }
}

function render (props, el) {
  if (!el) return { attrs: { href: renderHref(props) } }
  const href = renderHref(props)
  if (props.innerHTML !== el.innerHTML) el.innerHTML = props.innerHTML
  if (href !== el.getAttribute('href')) el.setAttribute('href', href)
}

function mapStateToProps (state) {
  return {
    currentLanguage: currentLanguage(state)
  }
}
