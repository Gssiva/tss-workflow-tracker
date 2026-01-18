import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS attacks
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface NotificationRequest {
  type: "task_assigned" | "task_assigned_admin" | "task_completed" | "daily_work_uploaded";
  recipientEmail?: string;
  recipientName?: string;
  taskTitle?: string;
  taskDescription?: string;
  expectedTimeHours?: number;
  assignedBy?: string;
  completedBy?: string;
  assignedToNames?: string[];
  // For daily work upload notifications
  to?: string;
  uploaderName?: string;
  mentionedUsers?: string[];
  imageUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured. Please add RESEND_API_KEY.");
    }

    const body: NotificationRequest = await req.json();
    console.log("Received notification request:", JSON.stringify(body, null, 2));
    
    const { type } = body;

    let subject = "";
    let htmlContent = "";
    let toEmail = "";

    if (type === "task_assigned") {
      const { recipientEmail, recipientName, taskTitle, taskDescription, expectedTimeHours, assignedBy } = body;
      toEmail = recipientEmail || "";
      
      // Sanitize all user inputs
      const safeRecipientName = escapeHtml(recipientName || '');
      const safeTaskTitle = escapeHtml(taskTitle || '');
      const safeTaskDescription = escapeHtml(taskDescription || '');
      const safeAssignedBy = escapeHtml(assignedBy || '');
      
      subject = `New Task Assigned: ${safeTaskTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Task Assigned to You</h2>
          <p>Hello${safeRecipientName ? ` ${safeRecipientName}` : ''},</p>
          <p>A new task has been assigned to you:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${safeTaskTitle}</h3>
            ${safeTaskDescription ? `<p style="margin: 0 0 10px 0; color: #666;">${safeTaskDescription}</p>` : ''}
            ${expectedTimeHours ? `<p style="margin: 0; color: #666;"><strong>Expected completion time:</strong> ${expectedTimeHours} hours</p>` : ''}
          </div>
          ${safeAssignedBy ? `<p style="color: #888; font-size: 14px;">Assigned by: ${safeAssignedBy}</p>` : ''}
          <p>Please log in to your account to view and complete this task.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from TSS Tracker.</p>
        </div>
      `;
    } else if (type === "task_assigned_admin") {
      const { recipientEmail, recipientName, taskTitle, taskDescription, expectedTimeHours, assignedToNames } = body;
      toEmail = recipientEmail || "";
      
      // Sanitize all user inputs
      const safeRecipientName = escapeHtml(recipientName || '');
      const safeTaskTitle = escapeHtml(taskTitle || '');
      const safeTaskDescription = escapeHtml(taskDescription || '');
      const safeAssigneesList = (assignedToNames || []).map(escapeHtml).join(', ') || 'employees';
      
      subject = `Task Assignment Update: ${safeTaskTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Task Assignment Notification</h2>
          <p>Hello${safeRecipientName ? ` ${safeRecipientName}` : ' Admin'},</p>
          <p>A new task has been assigned to the following employees:</p>
          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${safeTaskTitle}</h3>
            ${safeTaskDescription ? `<p style="margin: 0 0 10px 0; color: #666;">${safeTaskDescription}</p>` : ''}
            ${expectedTimeHours ? `<p style="margin: 0 0 10px 0; color: #666;"><strong>Expected completion time:</strong> ${expectedTimeHours} hours</p>` : ''}
            <p style="margin: 0; color: #333;"><strong>Assigned to:</strong> ${safeAssigneesList}</p>
          </div>
          <p>Please log in to the admin dashboard to track progress.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from TSS Tracker.</p>
        </div>
      `;
    } else if (type === "task_completed") {
      const { recipientEmail, taskTitle, taskDescription, completedBy } = body;
      toEmail = recipientEmail || "";
      
      // Sanitize all user inputs
      const safeTaskTitle = escapeHtml(taskTitle || '');
      const safeTaskDescription = escapeHtml(taskDescription || '');
      const safeCompletedBy = escapeHtml(completedBy || '');
      
      subject = `Task Completed: ${safeTaskTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">Task Completed</h2>
          <p>Hello Admin,</p>
          <p>A task has been marked as complete:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${safeTaskTitle}</h3>
            ${safeTaskDescription ? `<p style="margin: 0 0 10px 0; color: #666;">${safeTaskDescription}</p>` : ''}
          </div>
          ${safeCompletedBy ? `<p style="color: #666;"><strong>Completed by:</strong> ${safeCompletedBy}</p>` : ''}
          <p>Please log in to review the completed task.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from TSS Tracker.</p>
        </div>
      `;
    } else if (type === "daily_work_uploaded") {
      const { to, uploaderName, mentionedUsers, imageUrl } = body;
      toEmail = to || "";
      
      // Sanitize all user inputs
      const safeUploaderName = escapeHtml(uploaderName || '');
      const safeMentionedList = (mentionedUsers || []).map(escapeHtml);
      // Validate and sanitize URL - only allow https URLs
      const safeImageUrl = imageUrl && imageUrl.startsWith('https://') ? imageUrl : '';
      
      subject = `Daily Work Upload: ${safeUploaderName}`;
      const mentionedListHtml = safeMentionedList.length > 0 
        ? `<p><strong>Also working:</strong> ${safeMentionedList.join(', ')}</p>` 
        : '';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Daily Work Image Uploaded</h2>
          <p>Hello Admin,</p>
          <p><strong>${safeUploaderName}</strong> has uploaded their daily work image.</p>
          ${mentionedListHtml}
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${safeImageUrl ? `<a href="${safeImageUrl}" style="color: #2563eb;">View uploaded image</a>` : '<p>Image link unavailable</p>'}
          </div>
          <p>Please log in to the admin dashboard to view all daily work uploads.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from TSS Tracker.</p>
        </div>
      `;
    } else {
      throw new Error(`Unknown notification type: ${type}`);
    }

    if (!toEmail) {
      throw new Error("Recipient email is required");
    }

    console.log(`Sending email to: ${toEmail}, Subject: ${subject}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TSS Tracker <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Resend API response:", JSON.stringify(emailResult, null, 2));

    if (!emailResponse.ok) {
      console.error("Email send failed:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully to:", toEmail);

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
