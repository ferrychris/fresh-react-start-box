import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      racerEmail, 
      racerName, 
      sponsorName, 
      sponsorEmail, 
      spotName, 
      spotPrice, 
      message, 
      budget 
    } = await req.json()

    if (!racerEmail || !racerName || !sponsorName || !sponsorEmail) {
      throw new Error('Missing required email information')
    }

    // Email to Racer
    const racerEmailContent = {
      to: racerEmail,
      subject: `🏁 New Sponsorship Inquiry for ${spotName} - ${sponsorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6600, #CC5200); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .inquiry-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #FF6600; border-radius: 5px; }
            .cta-button { display: inline-block; background: #FF6600; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 10px 10px; }
            .highlight { color: #FF6600; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 New Sponsorship Inquiry!</h1>
              <p>Someone wants to sponsor your ${spotName}</p>
            </div>
            
            <div class="content">
              <h2>Great news, ${racerName}!</h2>
              
              <p>You have a new sponsorship inquiry from <strong>${sponsorName}</strong> for your <span class="highlight">${spotName}</span> sponsorship spot.</p>
              
              <div class="inquiry-box">
                <h3>📋 Inquiry Details:</h3>
                <ul>
                  <li><strong>Company/Brand:</strong> ${sponsorName}</li>
                  <li><strong>Contact Email:</strong> ${sponsorEmail}</li>
                  <li><strong>Sponsorship Spot:</strong> ${spotName}</li>
                  <li><strong>Your Price:</strong> $${spotPrice}/race</li>
                  ${budget ? `<li><strong>Their Budget:</strong> ${budget}</li>` : ''}
                </ul>
                
                ${message ? `
                  <h4>💬 Their Message:</h4>
                  <p style="font-style: italic; background: white; padding: 15px; border-radius: 5px;">"${message}"</p>
                ` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="mailto:${sponsorEmail}?subject=Re: ${spotName} Sponsorship Inquiry&body=Hi ${sponsorName},%0D%0A%0D%0AThank you for your interest in sponsoring my ${spotName}!%0D%0A%0D%0AI'd love to discuss this opportunity with you.%0D%0A%0D%0ABest regards,%0D%0A${racerName}" class="cta-button">
                  📧 Reply to ${sponsorName}
                </a>
              </div>
              
              <div class="inquiry-box">
                <h3>🚀 Next Steps:</h3>
                <ol>
                  <li><strong>Reply within 24-48 hours</strong> - Quick responses show professionalism</li>
                  <li><strong>Discuss terms</strong> - Confirm pricing, duration, logo requirements</li>
                  <li><strong>Send logo specs</strong> - Provide dimensions and file format requirements</li>
                  <li><strong>Finalize agreement</strong> - Set payment terms and race schedule</li>
                  <li><strong>Update your OnlyRaceFans</strong> - Mark the spot as "sponsored" once confirmed</li>
                </ol>
              </div>
              
              <p><strong>💡 Pro Tips:</strong></p>
              <ul>
                <li>Ask for their logo in high resolution (300 DPI minimum)</li>
                <li>Clarify how many races the sponsorship covers</li>
                <li>Discuss social media promotion requirements</li>
                <li>Set clear expectations for logo placement and size</li>
              </ul>
              
              <p>This inquiry came through your OnlyRaceFans sponsorship marketplace. Keep building your profile to attract more sponsors!</p>
              
              <p>Race hard, earn more! 🏁</p>
              
              <p><strong>The OnlyRaceFans Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 OnlyRaceFans. All rights reserved.</p>
              <p>Manage your sponsorship spots: <a href="${Deno.env.get('SITE_URL') || 'https://onlyracefans.co'}/racer/${racerName}/sponsorship">View Your Sponsorship Page</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Email to Sponsor (Confirmation)
    const sponsorEmailContent = {
      to: sponsorEmail,
      subject: `✅ Sponsorship Inquiry Submitted - ${racerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .summary-box { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745; border-radius: 5px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 10px 10px; }
            .highlight { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Inquiry Submitted Successfully!</h1>
              <p>Your sponsorship inquiry has been sent to ${racerName}</p>
            </div>
            
            <div class="content">
              <h2>Thank you, ${sponsorName}!</h2>
              
              <p>We've successfully submitted your sponsorship inquiry to <strong>${racerName}</strong>. Here's a summary of your inquiry:</p>
              
              <div class="summary-box">
                <h3>📋 Your Inquiry Summary:</h3>
                <ul>
                  <li><strong>Racer:</strong> ${racerName}</li>
                  <li><strong>Sponsorship Spot:</strong> ${spotName}</li>
                  <li><strong>Price:</strong> $${spotPrice}/race</li>
                  <li><strong>Your Company:</strong> ${sponsorName}</li>
                  <li><strong>Contact Email:</strong> ${sponsorEmail}</li>
                  ${budget ? `<li><strong>Your Budget:</strong> ${budget}</li>` : ''}
                </ul>
                
                ${message ? `
                  <h4>💬 Your Message:</h4>
                  <p style="font-style: italic; background: white; padding: 15px; border-radius: 5px;">"${message}"</p>
                ` : ''}
              </div>
              
              <div class="summary-box">
                <h3>⏰ What Happens Next:</h3>
                <ol>
                  <li><strong>${racerName} will contact you directly</strong> at ${sponsorEmail} within 24-48 hours</li>
                  <li><strong>Discuss sponsorship details</strong> - pricing, duration, logo requirements</li>
                  <li><strong>Finalize the agreement</strong> - payment terms and race schedule</li>
                  <li><strong>Provide your logo</strong> - high-resolution files for car placement</li>
                  <li><strong>See your brand on track!</strong> - watch your logo race to victory</li>
                </ol>
              </div>
              
              <p><strong>💡 While You Wait:</strong></p>
              <ul>
                <li>Prepare your logo files in high resolution (300 DPI)</li>
                <li>Think about any specific placement requirements</li>
                <li>Consider additional marketing opportunities with the racer</li>
                <li>Follow ${racerName} on social media to stay updated</li>
              </ul>
              
              <p>Thank you for supporting grassroots racing! Your sponsorship helps drivers pursue their dreams and keeps the sport thriving.</p>
              
              <p>Questions? Reply to this email or contact us at <a href="mailto:support@onlyracefans.co">support@onlyracefans.co</a></p>
              
              <p><strong>The OnlyRaceFans Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 OnlyRaceFans. All rights reserved.</p>
              <p>Visit us at <a href="${Deno.env.get('SITE_URL') || 'https://onlyracefans.co'}">${Deno.env.get('SITE_URL') || 'onlyracefans.co'}</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Send emails using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.log('⚠️ RESEND_API_KEY not configured, logging emails instead')
      console.log('📧 Would send racer email:', racerEmailContent)
      console.log('📧 Would send sponsor email:', sponsorEmailContent)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Emails logged (email service not configured)',
          note: 'Configure RESEND_API_KEY in Supabase Edge Function secrets to enable emails'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Send email to racer
    const racerEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OnlyRaceFans Sponsorships <sponsorships@onlyracefans.co>',
        to: [racerEmailContent.to],
        subject: racerEmailContent.subject,
        html: racerEmailContent.html,
      }),
    })

    // Send confirmation email to sponsor
    const sponsorEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OnlyRaceFans Sponsorships <sponsorships@onlyracefans.co>',
        to: [sponsorEmailContent.to],
        subject: sponsorEmailContent.subject,
        html: sponsorEmailContent.html,
      }),
    })

    const racerResult = racerEmailResponse.ok ? await racerEmailResponse.json() : null
    const sponsorResult = sponsorEmailResponse.ok ? await sponsorEmailResponse.json() : null

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sponsorship emails sent successfully',
        racerEmailId: racerResult?.id,
        sponsorEmailId: sponsorResult?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending sponsorship emails:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send sponsorship emails',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})