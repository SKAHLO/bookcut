import nodemailer from "nodemailer"

// Create transporter optimized for Vercel
const createTransporter = () => {
  console.log('Creating Gmail transporter for Vercel...')
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST)
  console.log('EMAIL_USER:', process.env.EMAIL_USER)
  console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS)
  
  return nodemailer.createTransport({
    service: 'gmail', // Use service instead of host for better Vercel compatibility
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true, // Use connection pooling for serverless
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
  })
}

export async function sendPasswordResetEmail(email, resetToken) {
  try {
    console.log('=== Gmail Password Reset Email ===')
    console.log('Sending to:', email)
    console.log('Reset token:', resetToken)
    
    const transporter = createTransporter()
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?resetToken=${resetToken}`
    console.log('Reset URL:', resetUrl)
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "BookCut - Password Reset Request",
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
              Click the button below to reset your password, or use the token manually:
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
    }

    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })
    
    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Password reset email sent via Gmail:', result.messageId)
    console.log('=== Gmail Email Success ===')
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('❌ Gmail email error:', error)
    console.error('Error details:', error.message)
    console.log('=== Gmail Email Failed ===')
    return { success: false, error: error.message }
  }
}

export async function sendWelcomeEmail(email, name, userType) {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to BookCut${userType === 'barber' ? ' - Barber' : ''}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to BookCut!</h1>
          </div>
          
          <div style="padding: 30px 20px; background: #f9f9f9;">
            <h2 style="color: #2C3E50;">Hi ${name}!</h2>
            
            <p style="color: #555; line-height: 1.6;">
              Welcome to BookCut! We're excited to have you join our community of ${userType === 'barber' ? 'professional barbers' : 'satisfied customers'}.
            </p>
            
            ${userType === 'barber' ? `
              <p style="color: #555; line-height: 1.6;">
                As a barber, you can now:
              </p>
              <ul style="color: #555; line-height: 1.6;">
                <li>Set up your business profile</li>
                <li>Add your services and pricing</li>
                <li>Manage your availability</li>
                <li>Receive bookings from customers</li>
              </ul>
              
              <p style="color: #555; line-height: 1.6;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/barber/settings" style="color: #FF6B35;">Complete your profile</a> to start receiving bookings!
              </p>
            ` : `
              <p style="color: #555; line-height: 1.6;">
                You can now find and book appointments with the best barbers in your area.
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user/dashboard" style="color: #FF6B35;">Start exploring barbers</a> near you!
              </p>
            `}
          </div>
          
          <div style="background: #2C3E50; padding: 15px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">
              © 2024 BookCut. All rights reserved.
            </p>
          </div>
        </div>
      `
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Welcome email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('Welcome email error:', error)
    return { success: false, error: error.message }
  }
}
