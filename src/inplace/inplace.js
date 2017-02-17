import he from 'he'

import { createValueSelector } from '../selectors'
import { update } from '../actions'

export default function createInplace (ownProps, el) {
  const { store, field } = ownProps
  if (!field) {
    if (!el) return ''
    console.error('Inplace needs a \'field\' prop to work on')
    return
  }
  const calcProps = createPropCalculator(ownProps)
  return {
    componentDidMount () {
      if (el) el.oninput = onInput
      store.subscribe(onUpdate)
    },
    render: onUpdate
  }

  function onUpdate () {
    return render(calcProps(store.getState()), el)
  }

  function onInput (e) {
    const value = e.target.innerText
    store.dispatch(update({ [field]: value }))
  }
}

function createPropCalculator (props) {
  const value = createValueSelector()
  let innerText = ''
  if (props.innerHTML) innerText = he.decode(props.innerHTML)
  return function calcProps (state) {
    let v = value(state, props.field)
    return Object.assign({ value: v == null ? innerText : v })
  }
}

function render (props, el) {
  const { value } = props
  if (!el) return props.value
  const contenteditable = process.env.PENGUIN_ENV === 'development'
    ? 'true'
    : 'false'
  if (el.getAttribute('contenteditable') !== contenteditable) {
    el.setAttribute('contenteditable', contenteditable)
  }
  if (el.innerText !== value) el.innerText = value
}
