import EventEmitter from 'events'

import { isSaving, isBuilt, error } from '../selectors'

const renderIndicator = ({ tagName, className, id, innerHTML, hidden }) =>
  `<${tagName}
    ${className ? `class='${className}'` : ''}
    ${id ? `id='${id}'` : ''}
    ${hidden ? 'style=\'display:none\'' : ''}
    data-component='SavedIndicator'
  >${innerHTML}</${tagName}>`

export default function createSavedIndicator (ownProps, el) {
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
    return Object.assign({
      tagName: ownProps.tagName || 'div',
      innerHTML: ownProps.innerHTML || '',
      className: ownProps.className || '',
      id: ownProps.id || ''
    }, mapStateToProps(storeState), state)
  }
}

function render (props, el) {
  if (!el && !props.isBuilt) return { replace: renderIndicator(props) }
  else if (!el) return { replace: '' }
  const display = props.hidden ? 'none' : ''
  if (props.id) el.setAttribute('id', props.id)
  else el.removeAttribute('id')
  if (props.className) el.setAttribute('class', props.className)
  else el.removeAttribute('class')
  if (display !== el.style.display) el.style.display = display
}

function mapStateToProps (state) {
  return {
    isSaving: isSaving(state),
    error: error(state),
    isBuilt: isBuilt(state)
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
