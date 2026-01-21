/**
 * User Credits Service - Manage message credits
 */

import { supabase } from "../lib/supabase";

/**
 * Credit costs for different platform features
 */
export const CREDIT_COSTS = {
  chat_message: 1,
  create_kpi: 2,
  create_workbench: 3,
  generate_basic_report: 5,
  generate_advanced_report: 15,
  create_company: 5,
  // Legacy aliases for backward compatibility if needed
  MESSAGE: 1,
  KPI_CREATE: 2,
  WORKBENCH_CREATE: 3,
  REPORT_GENERATE: 5,
  COMPANY_CREATE: 5,
  KPI: 2,
  WORKBENCH: 3,
  REPORT: 5,
  COMPANY: 5,
};

/**
 * Get user's current balance from credits table
 */
export async function getUserCredits(userId) {
  try {
    const { data, error } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no record exists, create one with initial credits (30 for free plan)
      if (error.code === "PGRST116") {
        console.log(
          "📝 No credits record found, creating one for user:",
          userId
        );

        // Get user's plan credits (default to 30 for free plan)
        let initialCredits = 30;
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("plan_id, plans(credits_per_month)")
            .eq("id", userId)
            .single();

          if (profileData?.plans?.credits_per_month) {
            initialCredits = profileData.plans.credits_per_month;
          }
        } catch {
          console.log("Could not fetch plan credits, using default 30");
        }

        const { data: newData, error: insertError } = await supabase
          .from("credits")
          .insert({
            user_id: userId,
            balance: initialCredits,
          })
          .select("balance")
          .single();

        if (insertError) {
          console.error("Failed to initialize credits:", insertError);
          throw insertError;
        }

        return { success: true, credits: newData.balance };
      }

      console.error("Error fetching user credits:", error);
      return { success: false, credits: null, error: error.message };
    }

    return { success: true, credits: data.balance };
  } catch (error) {
    console.error("Error getting user credits:", error);
    return { success: false, credits: null, error: error.message };
  }
}

/**
 * Decrement user's credits for various platform features
 * @param {string} userId - User ID
 * @param {number} amount - Amount of credits to deduct (default 1 for messages)
 * @param {string} action - Type of action: 'message', 'workbench', 'kpi', 'report'
 * @param {string} workbenchId - Optional workbench ID for context
 * @param {object} metadata - Additional metadata (e.g., report type, KPI name)
 */
export async function decrementCredits(userId, amount = 1, action = "chat_message") {
  try {
    // Ensure credits record exists and get current balance
    const creditResponse = await getUserCredits(userId);
    
    if (!creditResponse.success) {
      console.error("Error ensuring user credits exist:", creditResponse.error);
      return { success: false, credits: null, error: creditResponse.error };
    }

    const creditsBefore = creditResponse.credits;

    // Check if user has enough credits
    if (creditsBefore < amount) {
      return {
        success: false,
        credits: creditsBefore,
        error: "insufficient_credits",
        message: `Insufficient credits. You need ${amount} credits but only have ${creditsBefore}.`,
        available: creditsBefore,
      };
    }

    // Use atomic update via RPC
    const { data, error } = await supabase.rpc("debit_credits", {
      p_user_id: userId,
      p_action: action,
    });

    if (error || !data || !data[0] || !data[0].success) {
      console.error("Error updating credits:", error || data[0].reason);
      return { success: false, credits: creditsBefore, error: error?.message || data[0]?.reason };
    }

    // Re-fetch credits to get the updated balance
    const { credits: creditsAfter, error: fetchNewError } = await getUserCredits(userId);

    if (fetchNewError) {
      console.error("Error re-fetching credits after debit:", fetchNewError);
      return { success: false, credits: creditsBefore, error: fetchNewError.message };
    }

    return {
      success: true,
      credits: creditsAfter,
      credits_before: creditsBefore,
      credits_after: creditsAfter,
      used: amount,
    };
  } catch (error) {
    console.error("Error decrementing credits:", error);
    return { success: false, credits: null, error: error.message };
  }
}

/**
 * Add credits to user account (for purchases, upgrades, etc.)
 */
export async function addCredits(userId, amount, action = "add_credits") {
  try {
    const { data, error } = await supabase.rpc("grant_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_action: action,
    });

    if (error || !data || !data[0] || !data[0].success) {
      console.error("Error adding credits:", error || data[0].reason);
      return { success: false, error: error?.message || data[0]?.reason };
    }

    // Re-fetch credits to get the updated balance
    const { credits: creditsAfter, error: fetchNewError } = await getUserCredits(userId);

    if (fetchNewError) {
      console.error("Error re-fetching credits after grant:", fetchNewError);
      return { success: false, error: fetchNewError.message };
    }

    return { success: true, credits: creditsAfter };
  } catch (error) {
    console.error("Error adding credits:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get message history for user
 */
export async function getMessageHistory(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from("message_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, history: data };
  } catch (error) {
    console.error("Error fetching message history:", error);
    return { success: false, error: error.message, history: [] };
  }
}

/**
 * Sync credits from database to localStorage (for UI display only)
 */
export async function syncCredits(userId) {
  try {
    const result = await getUserCredits(userId);
    if (result.success && result.credits !== null) {
      localStorage.setItem("message_tokens", result.credits.toString());
    }
    return result;
  } catch (error) {
    console.error("Error syncing credits:", error);
    return { success: false, credits: null, error: error.message };
  }
}
