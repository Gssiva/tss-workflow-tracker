import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "task_assigned" | "task_completed" | "daily_work_uploaded";
  recipientEmail?: string;
  recipientName?: string;
  taskTitle?: string;
  taskDescription?: string;
  expectedTimeHours?: number;
  assignedBy?: string;
  completedBy?: string;
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
    const body: NotificationRequest = await req.json();
    const { type } = body;

    let subject = "";
    let htmlContent = "";
    let toEmail = "";

    if (type === "task_assigned") {
      const { recipientEmail, recipientName, taskTitle, taskDescription, expectedTimeHours, assignedBy } = body;
      toEmail = recipientEmail || "";
      subject = `New Task Assigned: ${taskTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Task Assigned to You</h2>
          <p>Hello${recipientName ? ` ${recipientName}` : ''},</p>
          <p>A new task has been assigned to you:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${taskTitle}</h3>
            ${taskDescription ? `<p style="margin: 0 0 10px 0; color: #666;">${taskDescription}</p>` : ''}
            ${expectedTimeHours ? `<p style="margin: 0; color: #666;"><strong>Expected completion time:</strong> ${expectedTimeHours} hours</p>` : ''}
          </div>
          ${assignedBy ? `<p style="color: #888; font-size: 14px;">Assigned by: ${assignedBy}</p>` : ''}
          <p>Please log in to your account to view and complete this task.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from your task management system.</p>
        </div>
      `;
    } else if (type === "task_completed") {
      const { recipientEmail, taskTitle, taskDescription, completedBy } = body;
      toEmail = recipientEmail || "";
      subject = `Task Completed: ${taskTitle}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">Task Completed</h2>
          <p>Hello Admin,</p>
          <p>A task has been marked as complete:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${taskTitle}</h3>
            ${taskDescription ? `<p style="margin: 0 0 10px 0; color: #666;">${taskDescription}</p>` : ''}
          </div>
          ${completedBy ? `<p style="color: #666;"><strong>Completed by:</strong> ${completedBy}</p>` : ''}
          <p>Please log in to review the completed task.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from your task management system.</p>
        </div>
      `;
    } else if (type === "daily_work_uploaded") {
      const { to, uploaderName, mentionedUsers, imageUrl } = body;
      toEmail = to || "";
      subject = `Daily Work Upload: ${uploaderName}`;
      const mentionedList = mentionedUsers && mentionedUsers.length > 0 
        ? `<p><strong>Also working:</strong> ${mentionedUsers.join(', ')}</p>` 
        : '';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Daily Work Image Uploaded</h2>
          <p>Hello Admin,</p>
          <p><strong>${uploaderName}</strong> has uploaded their daily work image.</p>
          ${mentionedList}
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <a href="${imageUrl}" style="color: #2563eb;">View uploaded image</a>
          </div>
          <p>Please log in to the admin dashboard to view all daily work uploads.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated notification from your task management system.</p>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Task Manager <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify(emailResponse), {
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
