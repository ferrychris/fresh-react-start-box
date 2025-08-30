import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { testPostCreation } from './test-post-integration';

interface TestResult {
  success: boolean;
  createdPost?: any;
  posts?: any[];
  error?: unknown;
}

const TestRunner: React.FC = () => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const runTest = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Starting post integration test...');
    
    try {
      // Override console.log to capture logs
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        addLog(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      console.error = (...args) => {
        originalConsoleError(...args);
        addLog('ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      const testResult = await testPostCreation();
      setResult(testResult);
      
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    } catch (error) {
      addLog(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
      setResult({ success: false, error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl max-w-3xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Post Integration Test</h2>
        <div className="flex space-x-3">
          <Link 
            to="/fan-dashboard" 
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors"
          >
            Fan Dashboard
          </Link>
          <Link 
            to="/" 
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
      
      <p className="text-slate-300 mb-6">
        This test runner verifies that post creation and retrieval is working correctly with the Supabase backend.
        You must be logged in to run this test successfully.
      </p>
      
      <button
        onClick={runTest}
        disabled={loading}
        className={`px-4 py-2 rounded-md font-medium ${
          loading 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-fedex-orange hover:bg-fedex-orange/80'
        } text-white transition-colors`}
      >
        {loading ? 'Running Test...' : 'Run Post Integration Test'}
      </button>
      
      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Test Logs</h3>
          <div className="bg-slate-800 p-4 rounded-md overflow-auto max-h-80">
            {logs.map((log, index) => (
              <div key={index} className={`text-sm font-mono mb-1 ${
                log.startsWith('ERROR') ? 'text-red-400' : 
                log.includes('✅') ? 'text-green-400' : 'text-gray-300'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Test Result</h3>
          <div className={`p-4 rounded-md ${
            result.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
          }`}>
            <div className="text-lg font-bold mb-2">
              {result.success 
                ? '✅ Test Passed!' 
                : '❌ Test Failed!'
              }
            </div>
            {result.createdPost && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold text-white">Created Post:</h4>
                <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto mt-1">
                  {JSON.stringify(result.createdPost, null, 2)}
                </pre>
              </div>
            )}
            {result.error && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold text-red-400">Error:</h4>
                <pre className="bg-slate-800 p-2 rounded text-xs overflow-auto mt-1 text-red-300">
                  {JSON.stringify(result.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;
