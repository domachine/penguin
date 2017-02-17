const renderHref = ({ language, href }) =>
  `/${language}${href}`

export default function createLink (ownProps, el) {
  return {
    render: () =>
      render(Object.assign({
        href: ownProps.href || '',
        innerHTML: ownProps.innerHTML || ''
      }, ownProps), el)
  }
}

function render (props, el) {
  if (!el) return { attrs: { href: renderHref(props) } }
  const href = renderHref(props)
  if (props.innerHTML !== el.innerHTML) el.innerHTML = props.innerHTML
  if (href !== el.getAttribute('href')) el.setAttribute('href', href)
}
