import EventEmitter from 'events'
import xtend from 'xtend'

function createSavedIndicator (ownProps, el) {
  const { store } = ownProps
  const savedStore = createSavedStore({
    timeout: Number(ownProps.timeout) || 5000
  })
  let state = { hidden: true }
  return {
    componentDidMount () {
      savedStore.on('show', () => {
        state = { hidden: false }
        render(calcProps(), el)
      })
      savedStore.on('hide', () => {
        state = { hidden: true }
        render(calcProps(), el)
      })
      store.subscribe(onUpdate)
    },
    render () {
      return render(calcProps(), el)
    }
  }

  function onUpdate () {
    const props = calcProps()
    savedStore.update(props)
  }

  function calcProps () {
    const storeState = store.getState()
    return Object.assign({}, mapStateToProps(storeState), state)
  }

  function render (props, el) {
    const display = props.hidden ? 'none' : ''
    if (display !== el.style.display) el.style.display = display
  }

  function mapStateToProps ({ isSaving, error }) {
    return { isSaving, error }
  }
}

function createSavedStore ({ timeout }) {
  let state = false
  let currentID = 0
  let timer = null
  const eventEmitter = new EventEmitter()

  return Object.assign(eventEmitter, { update })

  function emitShow () { eventEmitter.emit('show') }

  function emitHide () { eventEmitter.emit('hide') }

  function update ({ isSaving: s, error }) {
    if (state && !s && !error) startTimer(++currentID)
    state = s
  }

  function startTimer (id) {
    if (timer) clearTimeout(timer)
    emitShow()
    timer = setTimeout(() => {
      if (currentID === id) emitHide()
    }, timeout)
  }
}

export function render () {
  return { replace: '' }
}

export function mount (ctx, props, el) {
  const component = createSavedIndicator(xtend(props, ctx), el)
  component.render()
  component.componentDidMount()
}
