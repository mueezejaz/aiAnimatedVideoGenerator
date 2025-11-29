import { useState } from 'react';
import DockerChecker from './components/DockerChecker.jsx';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <DockerChecker>
      {/* This is your main app - only shows when Docker is ready */}
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1
            onClick={() => setCount(pre => pre + 1)}
            className='text-5xl text-primary cursor-pointer hover:text-secondary transition-colors'
          >
            Docker is Ready! Count: {count}
          </h1>
          <p className="text-text-main mt-4 text-center">
            Your main application is now running with Docker support
          </p>
        </div>
      </div>
    </DockerChecker>
  );
}

export default App;
