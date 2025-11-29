import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';

function DockerChecker({ children }) {
  const [status, setStatus] = useState({
    checking: true,
    installed: false,
    running: false,
    hasImage: false,
    error: null,
    progress: 0,
    progressMessage: '',
    stage: 'checking'
  });

  const checkDocker = async () => {
    try {
      // Step 1: Check if Docker is installed
      setStatus(prev => ({ ...prev, stage: 'checking', error: null, checking: true }));
      const installCheck = await window.docker.checkInstalled();

      if (!installCheck.success) {
        setStatus(prev => ({
          ...prev,
          checking: false,
          error: 'Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop'
        }));
        return;
      }

      setStatus(prev => ({ ...prev, installed: true }));

      // Step 2: Check if Docker is running
      const runningCheck = await window.docker.checkRunning();

      if (!runningCheck.success) {
        setStatus(prev => ({
          ...prev,
          error: 'Docker is not running. Starting Docker...',
          stage: 'starting'
        }));

        // Try to start Docker
        const startResult = await window.docker.start();

        if (!startResult.success) {
          setStatus(prev => ({
            ...prev,
            checking: false,
            error: 'Failed to start Docker. Please start Docker Desktop manually.'
          }));
          return;
        }
      }

      setStatus(prev => ({ ...prev, running: true }));

      // Step 3: Check if Ubuntu image exists
      const imageCheck = await window.docker.checkImage('ubuntu:latest');

      if (!imageCheck.success) {
        setStatus(prev => ({
          ...prev,
          checking: false,
          error: 'Failed to check Docker images: ' + imageCheck.error
        }));
        return;
      }

      if (!imageCheck.hasImage) {
        setStatus(prev => ({
          ...prev,
          error: null,
          stage: 'pulling',
          progressMessage: 'Downloading Ubuntu image...'
        }));

        // Listen for progress updates
        window.docker.onPullProgress((data) => {
          console.log('the data we are getting', data);
          setStatus(prev => ({
            ...prev,
            progress: data.progress || prev.progress,
            progressMessage: data.message || prev.progressMessage
          }));
        });

        // Pull the image
        const pullResult = await window.docker.pullImage('ubuntu:latest');

        // Remove progress listener
        window.docker.removePullProgressListener();

        if (!pullResult.success) {
          setStatus(prev => ({
            ...prev,
            checking: false,
            error: 'Failed to pull Ubuntu image: ' + pullResult.error
          }));
          return;
        }
      }

      // All checks passed!
      setStatus({
        checking: false,
        installed: true,
        running: true,
        hasImage: true,
        error: null,
        stage: 'ready',
        progress: 100,
        progressMessage: 'Ready!'
      });

    } catch (error) {
      setStatus(prev => ({
        ...prev,
        checking: false,
        error: 'An unexpected error occurred: ' + error.message
      }));
    }
  };

  useEffect(() => {
    checkDocker();
  }, []);

  // If ready, show the main app
  if (status.stage === 'ready') {
    return <>{children}</>;
  }

  // Otherwise, show Docker status screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-text-main mb-2">Docker Setup</h1>
          <p className="text-border">Checking Docker environment...</p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-6">
          {/* Docker Installed */}
          <div className="flex items-center space-x-3">
            {status.installed ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : status.checking && status.stage === 'checking' ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-300 flex-shrink-0" />
            )}
            <span className={status.installed ? 'text-green-600 font-medium' : 'text-gray-600'}>
              Docker Installed
            </span>
          </div>

          {/* Docker Running */}
          <div className="flex items-center space-x-3">
            {status.running ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : status.stage === 'starting' ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-300 flex-shrink-0" />
            )}
            <span className={status.running ? 'text-green-600 font-medium' : 'text-gray-600'}>
              Docker Running
            </span>
          </div>

          {/* Ubuntu Image */}
          <div className="flex items-center space-x-3">
            {status.hasImage ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : status.stage === 'pulling' ? (
              <Download className="w-6 h-6 text-primary animate-bounce flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-gray-300 flex-shrink-0" />
            )}
            <span className={status.hasImage ? 'text-green-600 font-medium' : 'text-gray-600'}>
              Ubuntu Image Ready
            </span>
          </div>
        </div>

        {/* Progress Bar for Image Download */}
        {status.stage === 'pulling' && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300 ease-out"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {status.progress > 0 ? `${status.progress}%` : 'Starting download...'} - {status.progressMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-700 text-sm">{status.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {status.checking && !status.error && (
          <div className="flex items-center justify-center space-x-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Initializing Docker environment...</span>
          </div>
        )}

        {/* Retry Button */}
        {status.error && !status.checking && (
          <button
            onClick={checkDocker}
            className="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default DockerChecker;
