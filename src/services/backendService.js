import { supabase } from "../lib/supabase";

/**
 * Backend Service
 * 
 * All write operations in Dabby MUST go through this service,
 * which calls Supabase Edge Functions. Direct writes to tables
 * are strictly forbidden by the system philosophy.
 */

export const backendService = {
  /**
   * Creates a manual record (transaction, compliance, budget, or party)
   */
  async createRecord(workbenchId, recordType, summary, metadata) {
    try {
      const { data, error } = await supabase.functions.invoke('create-record', {
        body: {
          workbench_id: workbenchId,
          record_type: recordType,
          summary,
          metadata
        }
      });

      if (error) {
        console.error('Edge Function Error (create-record):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call create-record:', err);
      throw err;
    }
  },

  /**
   * Pushes a financial adjustment
   */
  async pushAdjustment(workbenchId, originalRecordId, adjustmentType, reason, metadata) {
    try {
      const { data, error } = await supabase.functions.invoke('push-adjustment', {
        body: {
          workbench_id: workbenchId,
          original_record_id: originalRecordId,
          adjustment_type: adjustmentType,
          reason,
          metadata
        }
      });

      if (error) {
        console.error('Edge Function Error (push-adjustment):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call push-adjustment:', err);
      throw err;
    }
  },



  /**
   * Creates a new workbench and assigns the current user as founder
   */
  async createWorkbench(name, booksStartDate, description = null) {
    try {
      console.log(`[DEBUG] backendService: Calling create-workbench for "${name}"`);
      const { data, error } = await supabase.functions.invoke('create-workbench', {
        body: {
          name,
          books_start_date: booksStartDate,
          description
        }
      });

      if (error) {
        console.error('Edge Function Error (create-workbench):', error);
        console.error('Error context:', JSON.stringify(error.context || {}, null, 2));
        throw error;
      }

      // Handle business logic error returned with 200 status
      if (data && data.error) {
        console.error('Edge Function Business Error (create-workbench):', data.error);
        console.error('Full error data:', JSON.stringify(data, null, 2));
        throw new Error(data.error);
      }

      console.log('[DEBUG] backendService: create-workbench success:', data);
      return data;
    } catch (err) {
      console.error('Failed to call create-workbench:', err);
      console.error('Error details:', err.message);
      throw err;
    }
  },

  /**
   * Saves a chat message and updates the session
   */
  async saveChatMessage(sessionId, role, content, metadata, workbenchId = null) {
    try {
      const { data, error } = await supabase.functions.invoke('save-chat-message', {
        body: {
          session_id: sessionId,
          role,
          content,
          metadata,
          workbench_id: workbenchId
        }
      });

      if (error) {
        console.error('Edge Function Error (save-chat-message):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call save-chat-message:', err);
      throw err;
    }
  },

  /**
   * Creates a new chat session
   */
  async createChatSession(title, workbenchId = null) {
    try {
      const { data, error } = await supabase.functions.invoke('create-chat-session', {
        body: {
          title,
          workbench_id: workbenchId
        }
      });

      if (error) {
        console.error('Edge Function Error (create-chat-session):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call create-chat-session:', err);
      throw err;
    }
  },

  /**
   * Confirms a record and creates ledger entries
   */
  async confirmRecord(recordId) {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-record', {
        body: { record_id: recordId }
      });

      if (error) {
        console.error('Edge Function Error (confirm-record):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call confirm-record:', err);
      throw err;
    }
  },

  /**
   * Runs the reconciliation engine for a workbench
   */
  async runReconciliation(workbenchId) {
    try {
      const { data, error } = await supabase.functions.invoke('run-reconciliation', {
        body: { workbench_id: workbenchId }
      });

      if (error) {
        console.error('Edge Function Error (run-reconciliation):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call run-reconciliation:', err);
      throw err;
    }
  },

  /**
   * Fetches the health status and intelligence metrics for a workbench
   */
  async getWorkbenchIntelligence(workbenchId) {
    try {
      const { data, error } = await supabase.functions.invoke('get-intelligence', {
        body: { workbench_id: workbenchId }
      });

      if (error) {
        console.error('Edge Function Error (get-intelligence):', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Failed to call get-intelligence:', err);
      throw err;
    }
  }
};
