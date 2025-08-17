import nodemailer from "nodemailer"

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

export async function sendPasswordResetEmail(email, resetToken) {
  try {
    const transporter = createTransporter()
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?resetToken=${resetToken}`
    
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
              To reset your password, copy and paste this token into the reset form on our website:
            </p>
            
            <div style="background: white; padding: 15px; border-left: 4px solid #FF6B35; margin: 20px 0;">
              <code style="color: #2C3E50; font-size: 16px; font-weight: bold;">${resetToken}</code>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Or <a href="${resetUrl}" style="color: #FF6B35; text-decoration: none;">click here to reset your password</a>
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

    const result = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('Email sending error:', error)
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
