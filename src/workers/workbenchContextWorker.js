import { supabase } from '../lib/supabase';

class WorkbenchContextWorker {
  constructor() {
    this.currentWorkbench = null;
    this.currentFiles = [];
    this.isProcessing = false;
  }

  /**
   * Initialize the workbench context worker
   */
  init() {
    console.log('Workbench Context Worker initialized');
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for workbench selection
   */
  setupEventListeners() {
    // Listen for workbench selection events
    window.addEventListener('workbenchSelected', this.handleWorkbenchSelected.bind(this));
    
    // Listen for workbench detachment
    window.addEventListener('workbenchDetached', this.handleWorkbenchDetached.bind(this));
  }

  /**
   * Handle workbench selection
   * @param {CustomEvent} event - The workbench selection event
   */
  async handleWorkbenchSelected(event) {
    const { workbench } = event.detail || {};
    if (!workbench?.id) {
      console.error('No workbench data provided');
      return;
    }

    this.currentWorkbench = workbench;
    console.log(`Workbench selected: ${workbench.name} (${workbench.id})`);
    
    // Start processing workbench files
    await this.processWorkbenchFiles(workbench.id);
  }

  /**
   * Handle workbench detachment
   */
  handleWorkbenchDetached() {
    console.log('Workbench detached');
    this.currentWorkbench = null;
    this.currentFiles = [];
    this.emitContextUpdated();
  }

  /**
   * Process all files associated with a workbench
   * @param {string} workbenchId - The ID of the workbench
   */
  async processWorkbenchFiles(workbenchId) {
    if (this.isProcessing) {
      console.log('Already processing workbench files');
      return;
    }

    this.isProcessing = true;
    console.log(`Processing files for workbench: ${workbenchId}`);

    try {
      // 1. Fetch workbench files metadata
      const { data: files, error } = await supabase
        .from('workbench_files')
        .select('*')
        .eq('workbench_id', workbenchId);

      if (error) throw error;

      if (!files || files.length === 0) {
        console.log('No files found for this workbench');
        this.currentFiles = [];
        this.emitContextUpdated();
        return;
      }

      // 2. Process each file to get its content
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            // Get the file content from Supabase Storage
            const { data: fileContent, error: downloadError } = await supabase.storage
              .from('workbench-files')
              .download(file.bucket_path);

            if (downloadError) {
              console.error(`Error downloading file ${file.file_name}:`, downloadError);
              return null;
            }

            // Read the file content as text
            const content = await fileContent.text();
            
            return {
              id: file.id,
              name: file.file_name,
              type: file.file_type,
              size: file.file_size,
              content: content.substring(0, 10000), // Limit content size for LLM context
              metadata: file.metadata || {}
            };
          } catch (error) {
            console.error(`Error processing file ${file.file_name}:`, error);
            return null;
          }
        })
      );

      // Filter out any failed file processing
      this.currentFiles = processedFiles.filter(file => file !== null);
      console.log(`Processed ${this.currentFiles.length} files for context`);
      
      // Emit event with the processed context
      this.emitContextUpdated();

    } catch (error) {
      console.error('Error processing workbench files:', error);
      this.emitError(error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get the current workbench context
   * @returns {Object} The current workbench context
   */
  getCurrentContext() {
    if (!this.currentWorkbench) {
      return null;
    }

    return {
      workbench: {
        id: this.currentWorkbench.id,
        name: this.currentWorkbench.name,
        description: this.currentWorkbench.description,
        type: this.currentWorkbench.type,
        createdAt: this.currentWorkbench.created_at
      },
      files: this.currentFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        contentPreview: file.content.substring(0, 200) + '...', // Preview for logging
        metadata: file.metadata
      })),
      // Prepare context for LLM
      llmContext: this.prepareLLMContext()
    };
  }

  /**
   * Prepare context in a format suitable for the LLM
   * @returns {string} Formatted context string
   */
  prepareLLMContext() {
    if (this.currentFiles.length === 0) {
      return `Workbench: ${this.currentWorkbench.name}\nNo files available for context.`;
    }

    let context = `Workbench: ${this.currentWorkbench.name}\n`;
    if (this.currentWorkbench.description) {
      context += `Description: ${this.currentWorkbench.description}\n\n`;
    }

    context += 'Files included for context:\n\n';
    
    this.currentFiles.forEach((file, index) => {
      context += `--- FILE ${index + 1}: ${file.name} (${file.type}, ${this.formatFileSize(file.size)}) ---\n`;
      context += file.content + '\n\n';
    });

    return context;
  }

  /**
   * Format file size in a human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Emit context updated event
   */
  emitContextUpdated() {
    const context = this.getCurrentContext();
    window.dispatchEvent(new CustomEvent('workbenchContextUpdated', { 
      detail: { context } 
    }));
    console.log('Workbench context updated:', context);
  }

  /**
   * Emit error event
   * @param {Error} error - The error that occurred
   */
  emitError(error) {
    window.dispatchEvent(new CustomEvent('workbenchContextError', { 
      detail: { error: error.message || 'An error occurred' } 
    }));
    console.error('Workbench Context Error:', error);
  }
}

// Create and export a singleton instance
export const workbenchContextWorker = new WorkbenchContextWorker();

// Auto-initialize when imported
workbenchContextWorker.init();

export default workbenchContextWorker;
