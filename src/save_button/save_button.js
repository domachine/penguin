import { isSaving, isBuilt } from '../selectors'

export default function createSaveButton (ownProps, el) {
  const { store, save } = ownProps
  return {
    componentDidMount () {
      store.subscribe(onUpdate)
      el.onclick = onClick
    },
    render: onUpdate
  }

  function onClick (e) {
    e.preventDefault()
    save()
  }

  function onUpdate () {
    return render(calcProps(store.getState()), el)
  }

  function calcProps (state) {
    return Object.assign({ innerHTML: ownProps.innerHTML || '' },
      mapStateToProps(state))
  }
}

function render (props, el) {
  if (!el && !props.isBuilt) return props.innerHTML
  else if (!el) return { replace: '' }
  const disabled = props.isSaving
  if (props.innerHTML !== el.innerHTML) el.innerHTML = props.innerHTML
  if (disabled !== el.disabled) el.disabled = disabled
}

function mapStateToProps (state) {
  return {
    isSaving: isSaving(state),
    isBuilt: isBuilt(state)
  }
}
