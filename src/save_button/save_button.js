import { isSaving, isBuilt } from '../selectors'
import { save } from '../actions'

const renderButton = ({ className, id, innerHTML }, disabled) =>
  `<button
    type='button'
    ${className ? `class='${className}'` : ''}
    ${id ? `id='${id}'` : ''}
    data-component='SaveButton'
    data-props='${JSON.stringify({ className, id, innerHTML })}'
    ${disabled ? 'disabled=\'disabled\'' : ''}
  >${innerHTML}</button>`

export default function createSaveButton (ownProps, el) {
  const { store } = ownProps
  return {
    componentDidMount () {
      store.subscribe(onUpdate)
      el.onclick = onClick
    },
    render: onUpdate
  }

  function onClick (e) {
    e.preventDefault()
    store.dispatch(save())
  }

  function onUpdate () {
    return render(calcProps(store.getState()), el)
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
  if (!el && !props.isBuilt) return { replace: renderButton(props, true) }
  else if (!el) return { replace: '' }
  const disabled = props.isSaving
  if (props.id) el.setAttribute('id', props.id)
  else el.removeAttribute('id')
  if (props.className) el.setAttribute('class', props.className)
  else el.removeAttribute('class')
  if (props.innerHTML !== el.innerHTML) el.innerHTML = props.innerHTML
  if (disabled !== el.disabled) el.disabled = disabled
}

function mapStateToProps (state) {
  return {
    isSaving: isSaving(state),
    isBuilt: isBuilt(state)
  }
}
