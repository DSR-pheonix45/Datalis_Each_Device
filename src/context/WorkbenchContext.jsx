import { createContext, useContext, useState, useEffect } from 'react';
import { workbenchContextWorker } from '../workers/workbenchContextWorker';

const WorkbenchContext = createContext();

export function WorkbenchProvider({ children }) {
  const [context, setContext] = useState(workbenchContextWorker.getCurrentContext());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listen for context updates from the worker
  useEffect(() => {
    const handleContextUpdate = (event) => {
      setContext(event.detail.context);
      setIsLoading(false);
      setError(null);
    };

    const handleError = (event) => {
      setError(event.detail.error);
      setIsLoading(false);
    };

    window.addEventListener('workbenchContextUpdated', handleContextUpdate);
    window.addEventListener('workbenchContextError', handleError);

    // Initialize with current context
    setContext(workbenchContextWorker.getCurrentContext());

    return () => {
      window.removeEventListener('workbenchContextUpdated', handleContextUpdate);
      window.removeEventListener('workbenchContextError', handleError);
    };
  }, []);

  // Expose worker methods
  const value = {
    context,
    isLoading,
    error,
    selectWorkbench: (workbench) => {
      setIsLoading(true);
      window.dispatchEvent(new CustomEvent('workbenchSelected', { detail: { workbench } }));
    },
    detachWorkbench: () => {
      window.dispatchEvent(new CustomEvent('workbenchDetached'));
    },
    refreshContext: () => {
      if (context?.workbench?.id) {
        setIsLoading(true);
        workbenchContextWorker.processWorkbenchFiles(context.workbench.id)
          .catch(err => {
            setError(err.message);
            setIsLoading(false);
          });
      }
    },
    getLLMContext: workbenchContextWorker.prepareLLMContext.bind(workbenchContextWorker)
  };

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbench() {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
}
