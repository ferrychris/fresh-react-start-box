import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, userType } = await req.json()

    // Only send welcome emails to racers
    if (userType !== 'racer') {
      return new Response(
        JSON.stringify({ message: 'Welcome email only sent to racers' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Email content for racers
    const emailContent = {
      to: email,
      subject: '🏁 Welcome to OnlyRaceFans - Start Building Your Racing Empire!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to OnlyRaceFans</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6600, #CC5200); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { background: white; padding: 30px; border: 1px solid #ddd; }
            .feature { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #FF6600; border-radius: 5px; }
            .cta-button { display: inline-block; background: #FF6600; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 10px 10px; }
            .highlight { color: #FF6600; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏆 OnlyRaceFans</div>
              <h1>Welcome to the Racing Revolution, ${name}!</h1>
              <p>Your journey to racing stardom starts now</p>
            </div>
            
            <div class="content">
              <h2>🎉 You're In! Welcome to the Elite Racing Community</h2>
              
              <p>Hey ${name},</p>
              
              <p>Welcome to <strong>OnlyRaceFans</strong> - the premier platform where racing dreams become reality! You've just joined an exclusive community of professional racers who are turning their passion into profit.</p>
              
              <div class="feature">
                <h3>🚀 What You Can Do Now:</h3>
                <ul>
                  <li><strong>Build Your Fanbase:</strong> Connect with racing fans who want to support your journey</li>
                  <li><strong>Monetize Your Passion:</strong> Set up subscription tiers and receive tips from supporters</li>
                  <li><strong>Share Your Story:</strong> Post exclusive content, race updates, and behind-the-scenes footage</li>
                  <li><strong>Find Sponsors:</strong> Showcase your car and attract potential sponsors</li>
                </ul>
              </div>
              
              <div class="feature">
                <h3>💰 Start Earning Today:</h3>
                <p>Our racers typically earn <span class="highlight">$500-$2,000+ per month</span> through fan subscriptions, tips, and sponsorship opportunities. The more you engage with your fans, the more you can earn!</p>
              </div>
              
              <div class="feature">
                <h3>🏁 Next Steps:</h3>
                <ol>
                  <li>Complete your profile setup with photos and racing info</li>
                  <li>Upload your first post to introduce yourself to fans</li>
                  <li>Set up your subscription tiers and pricing</li>
                  <li>Share your OnlyRaceFans profile on social media</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL') || 'https://onlyracefans.co'}/dashboard" class="cta-button">
                  🏆 Complete Your Profile Setup
                </a>
              </div>
              
              <div class="feature">
                <h3>🤝 Need Help Getting Started?</h3>
                <p>Our team is here to help you succeed! Reach out to us at <a href="mailto:support@onlyracefans.co">support@onlyracefans.co</a> if you have any questions.</p>
                
                <p><strong>Pro Tips for Success:</strong></p>
                <ul>
                  <li>Post regularly to keep fans engaged</li>
                  <li>Share race day content and behind-the-scenes moments</li>
                  <li>Interact with your supporters in comments</li>
                  <li>Use high-quality photos and videos</li>
                </ul>
              </div>
              
              <p>We're excited to see you build your racing empire on OnlyRaceFans. Let's make this season your most successful yet!</p>
              
              <p>Race hard, earn more! 🏁</p>
              
              <p><strong>The OnlyRaceFans Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 OnlyRaceFans. All rights reserved.</p>
              <p>You're receiving this email because you signed up as a racer on OnlyRaceFans.</p>
              <p>Visit us at <a href="${Deno.env.get('SITE_URL') || 'https://onlyracefans.co'}">${Deno.env.get('SITE_URL') || 'onlyracefans.co'}</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to OnlyRaceFans, ${name}!
        
        You've just joined the premier platform for racing professionals. Here's what you can do:
        
        🚀 Build Your Fanbase - Connect with racing fans who want to support your journey
        💰 Monetize Your Passion - Set up subscription tiers and receive tips
        📸 Share Your Story - Post exclusive content and race updates
        🤝 Find Sponsors - Showcase your car and attract sponsors
        
        Next Steps:
        1. Complete your profile setup
        2. Upload your first post
        3. Set up subscription tiers
        4. Share your profile on social media
        
        Visit your dashboard: ${Deno.env.get('SITE_URL') || 'https://onlyracefans.co'}/dashboard
        
        Need help? Contact us at support@onlyracefans.co
        
        Race hard, earn more!
        The OnlyRaceFans Team
      `
    }

    // Send email using a service like Resend, SendGrid, or similar
    // For this example, we'll use a generic email service
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email send')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email skipped - email service not configured',
          note: 'Configure RESEND_API_KEY in Supabase Edge Function secrets to enable emails'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OnlyRaceFans <welcome@onlyracefans.co>',
        to: [emailContent.to],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`)
    }

    const result = await emailResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        emailId: result.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending welcome email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send welcome email',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})