import { supabase } from "../lib/supabase";

// Company CRUD operations
export const createCompany = async (companyData) => {
  try {
    const { data, error } = await supabase.from("companies").insert(companyData).select().single();
    if (error) throw error;
    return { success: true, company: data };
  } catch (error) {
    console.error("Error creating company:", error);
    return { success: false, error: error.message };
  }
};

export const getUserCompanies = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("company_members")
      .select(`
        company_id,
        role,
        company:companies (
          id,
          company_name
        )
      `)
      .eq("user_id", user.id);

    if (error) throw error;
    // Map the result to return flat company objects with role included
    return { 
      success: true, 
      companies: data
        .filter(m => m.company) // Filter out any null companies just in case
        .map(m => ({ 
          id: m.company.id,
          company_name: m.company.company_name,
          role: m.role 
        })) 
    };
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return { success: false, error: error.message };
  }
};

export const getWorkbenchFiles = async (workbenchId) => {
  try {
    const { data, error } = await supabase.from("workbench_files").select("*").eq("workbench_id", workbenchId);
    if (error) throw error;
    return { success: true, files: data };
  } catch (error) {
    console.error("Error fetching workbench files:", error);
    return { success: false, error: error.message };
  }
};

export const getCompanies = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch companies where the user is a member
    // Simplified query to avoid RLS infinite recursion on profiles table
    const { data: memberData, error: memberError } = await supabase
      .from("company_members")
      .select(`
        company_id,
        role,
        company:companies (
          *
        )
      `)
      .eq("user_id", user.id);

    if (memberError) throw memberError;

    // Map the result to return flat company objects with role included
    const mappedCompanies = (memberData || [])
      .filter(m => m.company)
      .map(m => ({
        ...m.company,
        role: m.role,
        // Add a placeholder for owner to prevent crashes in UI
        owner: {
          full_name: "Owner",
          email: ""
        }
      }));

    return { success: true, companies: mappedCompanies };
  } catch (error) {
    console.error("Error fetching companies:", error);
    return { success: false, error: error.message };
  }
};

export const getCompanyDetails = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select(`
        *,
        owner:profiles!companies_owner_id_fkey (
          full_name,
          email
        )
      `)
      .eq("id", companyId)
      .single();

    if (error) {
      // If direct query fails (possibly due to RLS recursion), try fetching from the list RPC
      console.warn("Direct company details query failed, trying RPC list fallback:", error.message);
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_companies_with_owners");
      if (rpcError) throw rpcError;

      const company = rpcData.find((c) => c.id === companyId);
      if (!company) throw new Error("Company not found");

      return {
        success: true,
        company: {
          ...company,
          owner: {
            full_name: company.owner_name,
            email: company.owner_email,
          },
        },
      };
    }

    return { success: true, company: data };
  } catch (error) {
    console.error("Error fetching company details:", error);
    return { success: false, error: error.message };
  }
};

export const updateCompany = async (companyId, updates) => {
  try {
    const { data, error } = await supabase.from("companies").update(updates).eq("id", companyId).select().single();
    if (error) throw error;
    return { success: true, company: data };
  } catch (error) {
    console.error("Error updating company:", error);
    return { success: false, error: error.message };
  }
};

export const deleteCompany = async (companyId) => {
  try {
    const { error } = await supabase.from("companies").delete().eq("id", companyId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting company:", error);
    return { success: false, error: error.message };
  }
};

// Company Invitations
export const inviteMember = async (companyId, email, role) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Check if the email belongs to an existing user
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    const isExistingUser = !!profile;

    // 2. Insert invitation
    const { data, error } = await supabase
      .from("company_invitations")
      .insert({
        company_id: companyId,
        email: email.trim().toLowerCase(),
        role: role,
        invited_by: user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error("An invitation has already been sent to this email for this company.");
      }
      throw error;
    }

    return { 
      success: true, 
      invitation: data,
      isExistingUser 
    };
  } catch (error) {
    console.error("Error inviting member:", error);
    return { success: false, error: error.message };
  }
};

export const getMyPendingInvitations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, invitations: [] };

    const { data, error } = await supabase
      .from("company_invitations")
      .select(`
        *,
        company:companies (
          id,
          company_name
        )
      `)
      .eq("email", user.email);

    if (error) throw error;
    return { success: true, invitations: data };
  } catch (error) {
    console.error("Error fetching my invitations:", error);
    return { success: false, error: error.message };
  }
};

export const respondToInvitation = async (invitationId, accept) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (accept) {
      // 1. Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();
      
      if (inviteError) throw inviteError;

      // 2. Add to company_members
      const { error: memberError } = await supabase
        .from("company_members")
        .insert({
          company_id: invitation.company_id,
          user_id: user.id,
          role: invitation.role
        });

      if (memberError && memberError.code !== '23505') throw memberError;
    }

    // 3. Delete invitation regardless of accept/reject
    await supabase.from("company_invitations").delete().eq("id", invitationId);

    return { success: true };
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return { success: false, error: error.message };
  }
};

export const getInvitations = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from("company_invitations")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return { success: true, invitations: data };
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return { success: false, error: error.message };
  }
};

export const cancelInvitation = async (invitationId) => {
  try {
    const { error } = await supabase
      .from("company_invitations")
      .delete()
      .eq("id", invitationId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return { success: false, error: error.message };
  }
};

export const getInvitationByToken = async (token) => {
  try {
    const { data, error } = await supabase
      .from("company_invitations")
      .select(`
        *,
        company:companies (
          company_name
        ),
        invited_by_profile:profiles!company_invitations_invited_by_fkey (
          full_name,
          email
        )
      `)
      .eq("token", token)
      .single();

    if (error) throw error;
    return { success: true, invitation: data };
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return { success: false, error: error.message };
  }
};

export const acceptInvitation = async (token) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please login to accept the invitation");

    // 1. Get invitation details
    const { success: inviteSuccess, invitation, error: inviteError } = await getInvitationByToken(token);
    if (!inviteSuccess) throw new Error(inviteError);

    // 2. Add member to company
    const { error: memberError } = await supabase
      .from("company_members")
      .insert({
        company_id: invitation.company_id,
        user_id: user.id,
        role: invitation.role
      });

    if (memberError) {
      if (memberError.code === '23505') {
        throw new Error("You are already a member of this company");
      }
      throw memberError;
    }

    // 3. Delete the invitation
    await supabase.from("company_invitations").delete().eq("id", invitation.id);

    return { success: true, companyId: invitation.company_id };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { success: false, error: error.message };
  }
};

// Company Members CRUD operations
export const getCompanyMembers = async (companyId) => {
  try {
    const { data, error } = await supabase.from("company_members").select("*, profiles(full_name, email)").eq("company_id", companyId);
    if (error) throw error;
    return { success: true, members: data };
  } catch (error) {
    console.error("Error fetching company members:", error);
    return { success: false, error: error.message };
  }
};

export const addCompanyMember = async (companyId, userId, role) => {
  try {
    const { data, error } = await supabase.from("company_members").insert({ company_id: companyId, user_id: userId, role }).select().single();
    if (error) throw error;
    return { success: true, member: data };
  } catch (error) {
    console.error("Error adding company member:", error);
    return { success: false, error: error.message };
  }
};

export const updateCompanyMemberRole = async (memberId, newRole) => {
  try {
    const { data, error } = await supabase.from("company_members").update({ role: newRole }).eq("id", memberId).select().single();
    if (error) throw error;
    return { success: true, member: data };
  } catch (error) {
    console.error("Error updating company member role:", error);
    return { success: false, error: error.message };
  }
};

export const removeCompanyMember = async (memberId) => {
  try {
    const { error } = await supabase.from("company_members").delete().eq("id", memberId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error removing company member:", error);
    return { success: false, error: error.message };
  }
};

export const getCompanyWorkbenches = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from("workbenches")
      .select("*")
      .eq("company_id", companyId)
      .eq("type", "company"); // Only return shared company workbenches
    if (error) throw error;
    return { success: true, workbenches: data };
  } catch (error) {
    console.error("Error fetching company workbenches:", error);
    return { success: false, error: error.message };
  }
};
