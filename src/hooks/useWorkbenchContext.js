import { useWorkbench } from '../context/WorkbenchContext.jsx';

/**
 * Hook to access workbench context in React components
 * @returns {Object} Workbench context state and methods
 */
export function useWorkbenchContext() {
  return useWorkbench();
}

export default useWorkbenchContext;
