import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 onClick={() => { setCount(pre => pre + 1) }} className='text-5xl text-primary'> what is this  {count}</h1 >
    </>
  )
}

export default App
