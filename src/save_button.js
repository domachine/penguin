import xtend from 'xtend'

function createSaveButton (ownProps, el) {
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

  function render (props, el) {
    const disabled = props.isSaving
    if (props.innerHTML !== el.innerHTML) el.innerHTML = props.innerHTML
    if (disabled !== el.disabled) el.disabled = disabled
  }

  function mapStateToProps ({ isSaving }) {
    return { isSaving }
  }
}

export function render () {
  return { replace: '' }
}

export function mount (ctx, props, el) {
  if (process.env.PENGUIN_ENV === 'production') return
  const component = createSaveButton(xtend(props, ctx), el)
  component.render()
  component.componentDidMount()
}
