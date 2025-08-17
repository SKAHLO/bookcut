import { Resend } from 'resend'

export async function sendPasswordResetEmail(email, resetToken) {
  try {
    console.log('=== Resend Password Reset Email ===')
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('Sending to:', email)
    console.log('Reset token:', resetToken)
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    // Initialize Resend inside the function to avoid build errors
    const resend = new Resend(process.env.RESEND_API_KEY)

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?resetToken=${resetToken}`
    console.log('Reset URL:', resetUrl)
    
    const { data, error } = await resend.emails.send({
      from: 'BookCut <noreply@bookcut.vercel.app>',
      to: email,
      subject: 'BookCut - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">BookCut</h1>
          </div>
          
          <div style="padding: 30px 20px; background: #f9f9f9;">
            <h2 style="color: #2C3E50; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #555; line-height: 1.6;">
              You requested a password reset for your BookCut account. If you didn't make this request, you can safely ignore this email.
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #555; line-height: 1.6; text-align: center;">
              Or manually enter this token: <br>
              <code style="color: #2C3E50; font-size: 16px; font-weight: bold; background: #f5f5f5; padding: 5px 10px; border-radius: 3px;">${resetToken}</code>
            </p>
            
            <p style="color: #555; line-height: 1.6; text-align: center;">
              <a href="${resetUrl}" style="color: #FF6B35; text-decoration: none;">Direct link to reset page</a>
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This token will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <div style="background: #2C3E50; padding: 15px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">
              © 2024 BookCut. All rights reserved.
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Password reset email sent via Resend:', data.id)
    console.log('=== Resend Email Success ===')
    return { success: true, id: data.id }
    
  } catch (error) {
    console.error('❌ Resend email error:', error)
    console.log('=== Resend Email Failed ===')
    return { success: false, error: error.message }
  }
}
