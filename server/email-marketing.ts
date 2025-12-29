// Email marketing utilities for Professional Diver - Diver Well Training
// This module handles support tickets, Google review requests, and user communications

import { config } from 'dotenv';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

// Load environment variables
config();
config({ path: '.env.local', override: false });

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface WelcomeEmailData {
  name: string;
  email: string;
  password: string;
  role: string;
  isSuperAdmin?: boolean;
  isPartnerAdmin?: boolean;
}

interface SupportTicket {
  userId: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
}

interface ReviewRequest {
  userId: string;
  email: string;
  name: string;
  completedCourses: number;
  avgScore: number;
}

interface PurchaseThankYouData {
  name: string;
  email: string;
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  expirationDate: Date;
  loginEmail: string;
  loginPassword?: string;
  amount?: number; // in cents
  transactionId?: string;
  invoiceNumber?: string;
  paymentDate?: Date;
}

interface FollowUpEmailData {
  name: string;
  email: string;
  emailNumber: number; // 1-7 for different follow-up emails
  trialExpiresAt?: Date;
}

interface TestimonialPromoData {
  name: string;
  email: string;
  subscriptionType: 'MONTHLY' | 'ANNUAL';
  subscriptionStartDate?: Date;
}

export class EmailMarketing {
  private fromEmail = "1pull@professionaldiver.app";
  private supportEmail = "1pull@professionaldiver.app";
  private sendGridApiKey: string | undefined;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize SendGrid if API key is available
    this.sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (this.sendGridApiKey) {
      sgMail.setApiKey(this.sendGridApiKey);
    }

    // Initialize SMTP transporter for Google Workspace
    this.initializeSMTP();
  }

  private initializeSMTP() {
    // Google Workspace SMTP configuration
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || '1pull@professionaldiver.app';
    const smtpPassword = process.env.SMTP_PASSWORD; // App Password from Google Workspace

    if (smtpPassword) {
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      // Verify SMTP connection
      this.smtpTransporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error);
        } else {
          console.log('✅ SMTP connection verified for', smtpUser);
        }
      });
    }
  }

  // Support ticket templates
  private getTicketConfirmationTemplate(ticket: SupportTicket): EmailTemplate {
    return {
      subject: `Support Ticket Confirmation - ${ticket.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Support Ticket Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af;">Professional Diver</h1>
              <p style="color: #64748b;">Diver Well Training</p>
            </div>
            
            <h2 style="color: #1e40af;">Support Ticket Received</h2>
            
            <p>Hello ${ticket.name},</p>
            
            <p>We've received your support request and will respond within 24 hours. Here are the details:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${ticket.subject}</p>
              <p><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</p>
              <p><strong>Submitted:</strong> ${ticket.createdAt.toLocaleDateString()}</p>
              <p><strong>Message:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 4px;">${ticket.message}</p>
            </div>
            
            <p>Our diving education specialists are reviewing your request. For urgent matters, please contact us directly at ${this.supportEmail}.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p>Professional Diver - Diver Well Training</p>
              <p>Brand-neutral commercial diving education</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Professional Diver - Diver Well Training
        Support Ticket Confirmation
        
        Hello ${ticket.name},
        
        We've received your support request and will respond within 24 hours.
        
        Subject: ${ticket.subject}
        Priority: ${ticket.priority.toUpperCase()}
        Submitted: ${ticket.createdAt.toLocaleDateString()}
        
        Message:
        ${ticket.message}
        
        Our diving education specialists are reviewing your request.
        For urgent matters, contact: ${this.supportEmail}
        
        Best regards,
        Professional Diver - Diver Well Training Team
      `
    };
  }

  // Google review request template
  private getReviewRequestTemplate(request: ReviewRequest): EmailTemplate {
    return {
      subject: "Share Your Professional Diver Experience 🌟",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Review Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af;">Professional Diver</h1>
              <p style="color: #64748b;">Diver Well Training</p>
            </div>
            
            <h2 style="color: #1e40af;">How's Your Learning Experience?</h2>
            
            <p>Hello ${request.name},</p>
            
            <p>Congratulations on completing ${request.completedCourses} courses with an average score of ${request.avgScore}%! 🎉</p>
            
            <p>We'd love to hear about your experience with our brand-neutral commercial diving education platform. Your feedback helps other diving professionals discover quality training resources.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://g.page/r/professional-diver-reviews" 
                 style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Leave a Google Review
              </a>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">Your Progress:</h3>
              <ul style="margin: 0;">
                <li>Courses Completed: ${request.completedCourses}</li>
                <li>Average Score: ${request.avgScore}%</li>
                <li>Professional diving knowledge gained through brand-neutral content</li>
              </ul>
            </div>
            
            <p>Thank you for choosing Professional Diver for your commercial diving education. Your success in the industry is our priority!</p>
            
            <p style="font-size: 14px; color: #64748b;">
              If you have any concerns or suggestions, please reply to this email or contact our support team at ${this.supportEmail}.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p>Professional Diver - Diver Well Training</p>
              <p>Brand-neutral commercial diving education</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Professional Diver - Diver Well Training
        
        Hello ${request.name},
        
        Congratulations on completing ${request.completedCourses} courses with an average score of ${request.avgScore}%!
        
        We'd love to hear about your experience with our brand-neutral commercial diving education platform.
        
        Please consider leaving a Google review: https://g.page/r/professional-diver-reviews
        
        Your Progress:
        - Courses Completed: ${request.completedCourses}
        - Average Score: ${request.avgScore}%
        - Professional diving knowledge gained through brand-neutral content
        
        Thank you for choosing Professional Diver for your commercial diving education.
        
        Best regards,
        Professional Diver - Diver Well Training Team
      `
    };
  }

  // Welcome email for new trial users
  private getWelcomeTrialTemplate(user: { name: string; email: string }): EmailTemplate {
    return {
      subject: "Welcome to Professional Diver - Your 24-Hour Trial Starts Now! 🤿",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Professional Diver</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af;">Professional Diver</h1>
              <p style="color: #64748b;">Diver Well Training</p>
            </div>
            
            <h2 style="color: #1e40af;">Welcome to Professional Diving Education!</h2>
            
            <p>Hello ${user.name},</p>
            
            <p>Welcome to Professional Diver - Diver Well Training! Your 24-hour free trial has begun, giving you full access to our brand-neutral commercial diving education platform.</p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">What You Can Access:</h3>
              <ul style="margin: 0;">
                <li>📚 Comprehensive learning tracks</li>
                <li>🧠 AI-powered diving consultant</li>
                <li>📝 Timed mock examinations</li>
                <li>📊 Progress tracking and analytics</li>
                <li>🎯 Spaced repetition learning system</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://professionaldiver.app/dashboard" 
                 style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Start Learning Now
              </a>
            </div>
            
            <p>Need help getting started? Contact our support team at ${this.supportEmail} or use the AI Consultant built into the platform.</p>
            
            <div style="background: #fefce8; padding: 15px; border-radius: 8px; border-left: 4px solid #fbbf24;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">
                🔒 Brand-Neutral Content: All our materials are original, reworded content that maintains educational quality while remaining independent of any certification bodies.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p>Professional Diver - Diver Well Training</p>
              <p>Commercial diving education that's compliant and congruent</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Professional Diver - Diver Well Training
        
        Hello ${user.name},
        
        Welcome to Professional Diver! Your 24-hour free trial has begun.
        
        What You Can Access:
        - Comprehensive learning tracks
        - AI-powered diving consultant  
        - Timed mock examinations
        - Progress tracking and analytics
        - Spaced repetition learning system
        
        Start learning: https://professionaldiver.app/dashboard
        
        Need help? Contact: ${this.supportEmail}
        
        All our content is brand-neutral, original, and educationally focused.
        
        Best regards,
        Professional Diver - Diver Well Training Team
      `
    };
  }

  // Send support ticket confirmation
  async sendTicketConfirmation(ticket: SupportTicket): Promise<boolean> {
    try {
      const template = this.getTicketConfirmationTemplate(ticket);
      
      // In a real implementation, this would integrate with SendGrid or similar service
      console.log('Sending support ticket confirmation email:', {
        to: ticket.email,
        subject: template.subject,
        priority: ticket.priority
      });
      
      // Would also create internal ticket in support system
      await this.createInternalTicket(ticket);
      
      return true;
    } catch (error) {
      console.error('Error sending support ticket confirmation:', error);
      return false;
    }
  }

  // Send review request
  async sendReviewRequest(request: ReviewRequest): Promise<boolean> {
    try {
      const template = this.getReviewRequestTemplate(request);
      
      console.log('Sending review request email:', {
        to: request.email,
        subject: template.subject,
        courses: request.completedCourses
      });
      
      return true;
    } catch (error) {
      console.error('Error sending review request:', error);
      return false;
    }
  }

  // Send welcome trial email
  async sendWelcomeTrialEmail(user: { name: string; email: string }): Promise<boolean> {
    try {
      const template = this.getWelcomeTrialTemplate(user);

      // Try SMTP first (Google Workspace)
      if (this.smtpTransporter) {
        try {
          await this.smtpTransporter.sendMail({
            from: `"Professional Diver" <${this.fromEmail}>`,
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Welcome trial email sent to ${user.email} via SMTP`);
          return true;
        } catch (smtpError) {
          console.error('SMTP send failed, trying SendGrid...', smtpError);
        }
      }

      // Fallback to SendGrid if available
      if (this.sendGridApiKey) {
        try {
          await sgMail.send({
            to: user.email,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Welcome trial email sent to ${user.email} via SendGrid`);
          return true;
        } catch (sgError) {
          console.error('SendGrid send failed:', sgError);
        }
      }

      // Log for manual sending if both fail
      console.log('📧 Welcome trial email (no email service configured):', {
        to: user.email,
        subject: template.subject,
      });
      return false;
    } catch (error) {
      console.error('Error sending welcome trial email:', error);
      return false;
    }
  }

  // Create internal support ticket
  private async createInternalTicket(ticket: SupportTicket): Promise<void> {
    // This would integrate with a ticketing system like Zendesk, Freshdesk, etc.
    console.log('Creating internal support ticket:', {
      id: `PDT-${Date.now()}`,
      user: ticket.email,
      subject: ticket.subject,
      priority: ticket.priority,
      message: ticket.message
    });
  }

  // Trigger review request based on user progress
  async checkAndRequestReview(userId: string): Promise<void> {
    try {
      // This would check user progress and send review request if criteria met
      // Example criteria: completed 3+ courses, average score 80%+, no recent review request
      
      const mockUser = {
        userId,
        email: 'user@example.com',
        name: 'Professional Diver',
        completedCourses: 5,
        avgScore: 87
      };

      if (mockUser.completedCourses >= 3 && mockUser.avgScore >= 80) {
        await this.sendReviewRequest(mockUser);
      }
    } catch (error) {
      console.error('Error checking review request criteria:', error);
    }
  }

  // Welcome email template for admin users
  private getWelcomeAdminTemplate(data: WelcomeEmailData): EmailTemplate {
    const affiliateSection = data.isSuperAdmin ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">💰 Partner Affiliate Program</h3>
        <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
          As Super Admin, you have full access to manage the affiliate program. You can:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #333;">
          <li style="margin-bottom: 10px;">Create and manage affiliate accounts</li>
          <li style="margin-bottom: 10px;">Track all referrals and commissions</li>
          <li style="margin-bottom: 10px;">Process payouts via Stripe or PayPal</li>
          <li style="margin-bottom: 10px;">View comprehensive affiliate analytics</li>
          <li style="margin-bottom: 10px;">Manage sub-affiliates and commission structures</li>
        </ul>
        <div style="text-align: center; margin-top: 25px;">
          <a href="https://professionaldiver.app/affiliate" 
             style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Access Affiliate Dashboard
          </a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
          💡 <strong>Commission Rate:</strong> Standard affiliates earn 50% commission on all referrals. You can customize rates for premium partners.
        </p>
      </div>
    ` : data.isPartnerAdmin ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">🤝 Partner Affiliate Program</h3>
        <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
          As a Partner Admin, you can participate in our affiliate program to earn commissions by referring new users to the platform.
        </p>
        <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 8px 0; font-size: 14px;"><strong>Commission Rate:</strong> <span style="color: #f59e0b; font-weight: bold;">50%</span> of all referred subscriptions</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Minimum Payout:</strong> $50</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Payout Schedule:</strong> Monthly</p>
        </div>
        <h4 style="color: #92400e; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">How to Get Started:</h4>
        <ol style="margin: 0; padding-left: 20px; color: #333;">
          <li style="margin-bottom: 8px;">Log in to your account</li>
          <li style="margin-bottom: 8px;">Navigate to the Affiliate Dashboard</li>
          <li style="margin-bottom: 8px;">Create your affiliate account (if not already created)</li>
          <li style="margin-bottom: 8px;">Get your unique affiliate code (format: PD12345678)</li>
          <li style="margin-bottom: 8px;">Share your referral link: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">https://professionaldiver.app/?ref=YOUR_CODE</code></li>
          <li style="margin-bottom: 8px;">Track your referrals and earnings in real-time</li>
        </ol>
        <div style="text-align: center; margin-top: 25px;">
          <a href="https://professionaldiver.app/affiliate" 
             style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Access Affiliate Dashboard
          </a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
          💡 <strong>Tip:</strong> Share your referral link on social media, in emails, or on your website. Every successful referral earns you commission!
        </p>
      </div>
    ` : '';

    const adminFeatures = data.isSuperAdmin 
      ? "Manage all platform features including user management, content editing, analytics, CRM, operations center, affiliate program, and system configuration."
      : data.isPartnerAdmin
      ? "Access platform development tools, content management, user analytics, and operations center. Note: Affiliate and finance features are restricted."
      : "Access your dashboard and start learning.";

    return {
      subject: `Welcome to Professional Divers App - ${data.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Partner Admin'} Access 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Professional Divers App</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
            <div style="background: linear-gradient(135deg, #0066CC 0%, #004499 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Professional Divers App</h1>
              <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">by Diver Well Training</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #0066CC; margin-top: 0; font-size: 24px;">Welcome, ${data.name}! 🎉</h2>
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Thank you for joining Professional Divers App! We're excited to have you on board. This email contains everything you need to get started, including your login credentials, app setup instructions, and partner affiliate program details.
              </p>
              <div style="background: #f0f9ff; border-left: 4px solid #0066CC; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #0066CC; margin-top: 0; font-size: 20px;">🔐 Your Login Credentials</h3>
                <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> <span style="color: #0066CC; font-family: monospace;">${data.email}</span></p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Password:</strong> <span style="color: #0066CC; font-family: monospace;">${data.password}</span></p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Role:</strong> <span style="color: #0066CC;">${data.role}</span></p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://professionaldiver.app/signin" 
                     style="display: inline-block; background: #0066CC; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Login to Your Account
                  </a>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
                  ⚠️ <strong>Security Note:</strong> Please change your password after your first login for security purposes. You can update it in your Profile Settings.
                </p>
              </div>
              <div style="background: #fefce8; border-left: 4px solid #fbbf24; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">📱 Mobile App Setup Instructions</h3>
                <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
                  Professional Divers App works perfectly on mobile devices! You can install it on your phone or tablet for quick access, just like a native app.
                </p>
                <div style="margin: 20px 0;">
                  <h4 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">🍎 For iPhone/iPad Users:</h4>
                  <ol style="margin: 0; padding-left: 20px; color: #333;">
                    <li style="margin-bottom: 8px;">Open <strong>Safari</strong> browser (not Chrome)</li>
                    <li style="margin-bottom: 8px;">Navigate to <strong>professionaldiver.app</strong></li>
                    <li style="margin-bottom: 8px;">Tap the <strong>Share button</strong> (square with arrow) at the bottom</li>
                    <li style="margin-bottom: 8px;">Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li style="margin-bottom: 8px;">Tap <strong>"Add"</strong> to finish</li>
                  </ol>
                </div>
                <div style="margin: 20px 0;">
                  <h4 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">🤖 For Android Users:</h4>
                  <ol style="margin: 0; padding-left: 20px; color: #333;">
                    <li style="margin-bottom: 8px;">Open <strong>Chrome</strong> browser</li>
                    <li style="margin-bottom: 8px;">Navigate to <strong>professionaldiver.app</strong></li>
                    <li style="margin-bottom: 8px;">Tap the <strong>three-dot menu</strong> (⋮) in the top-right</li>
                    <li style="margin-bottom: 8px;">Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                    <li style="margin-bottom: 8px;">Tap <strong>"Add"</strong> to confirm</li>
                  </ol>
                </div>
                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://professionaldiver.app/install-app" 
                     style="display: inline-block; background: #fbbf24; color: #333; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                    View Full Installation Guide
                  </a>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
                  💡 <strong>Tip:</strong> Once installed, the app will open in full-screen mode and work offline for previously viewed content!
                </p>
              </div>
              ${affiliateSection}
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #15803d; margin-top: 0; font-size: 20px;">🚀 Getting Started</h3>
                <p style="font-size: 15px; color: #333; margin-bottom: 15px;">Here's what you can do right now:</p>
                <ul style="margin: 0; padding-left: 20px; color: #333;">
                  <li style="margin-bottom: 10px;"><strong>Explore Learning Tracks:</strong> Browse our comprehensive diving education courses</li>
                  <li style="margin-bottom: 10px;"><strong>Take Practice Exams:</strong> Test your knowledge with timed mock examinations</li>
                  <li style="margin-bottom: 10px;"><strong>Use AI Tutor:</strong> Get personalized help from our AI-powered diving consultant</li>
                  <li style="margin-bottom: 10px;"><strong>Track Progress:</strong> Monitor your learning journey with detailed analytics</li>
                  <li style="margin-bottom: 10px;"><strong>Access Admin Dashboard:</strong> ${adminFeatures}</li>
                </ul>
                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://professionaldiver.app/dashboard" 
                     style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Go to Dashboard
                  </a>
                </div>
              </div>
              <div style="border-top: 2px solid #e5e7eb; padding-top: 30px; margin-top: 40px;">
                <h3 style="color: #0066CC; font-size: 18px; margin-bottom: 15px;">💬 Need Help?</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Our support team is here to help you succeed:</p>
                <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                  <li style="margin-bottom: 8px;"><strong>Email:</strong> ${this.supportEmail}</li>
                  <li style="margin-bottom: 8px;"><strong>In-App Support:</strong> Use the chat feature in your dashboard</li>
                  <li style="margin-bottom: 8px;"><strong>Documentation:</strong> Visit /install-app for setup guides</li>
                </ul>
              </div>
            </div>
            <div style="background: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #ffffff;">Professional Divers App</p>
              <p style="margin: 0 0 10px 0; font-size: 12px;">by Diver Well Training</p>
              <p style="margin: 0; font-size: 11px;">
                Brand-neutral commercial diving education platform
              </p>
              <p style="margin: 15px 0 0 0; font-size: 11px;">
                © 2025 Diver Well Training. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Professional Divers App by Diver Well Training

Welcome, ${data.name}! 🎉

Thank you for joining Professional Divers App! We're excited to have you on board.

YOUR LOGIN CREDENTIALS
Email: ${data.email}
Password: ${data.password}
Role: ${data.role}

Login URL: https://professionaldiver.app/signin

⚠️ Security Note: Please change your password after your first login.

MOBILE APP SETUP
iOS: Safari → Share → Add to Home Screen
Android: Chrome → Menu → Add to Home Screen
Full Guide: https://professionaldiver.app/install-app

GETTING STARTED
- Explore Learning Tracks
- Take Practice Exams
- Use AI Tutor
- Track Progress
- Access Admin Dashboard: ${adminFeatures}

Dashboard: https://professionaldiver.app/dashboard

Need Help?
Email: ${this.supportEmail}
In-App Support: Use the chat feature

© 2025 Diver Well Training. All rights reserved.
      `
    };
  }

  // Purchase Thank You Email Template
  private getPurchaseThankYouTemplate(data: PurchaseThankYouData): EmailTemplate {
    const subscriptionDuration = data.subscriptionType === 'MONTHLY' ? 'month' : 'year';
    const expirationDate = data.expirationDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const paymentDate = data.paymentDate ? data.paymentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const amount = data.amount ? (data.amount / 100).toFixed(2) : (data.subscriptionType === 'MONTHLY' ? '25.00' : '250.00');
    const invoiceNumber = data.invoiceNumber || data.transactionId || `INV-${Date.now()}`;
    const transactionId = data.transactionId || 'N/A';

    return {
      subject: "Thank You for Your Purchase - Professional Diver Training App 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Your Purchase</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Thank You!</h1>
              <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">Your subscription is now active</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #16a34a; margin-top: 0; font-size: 24px;">Welcome, ${data.name}!</h2>
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Thank you for subscribing to Professional Diver Training App! Your ${subscriptionDuration}ly subscription is now active and you have full access to our comprehensive commercial diving education platform.
              </p>
              
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1e40af; margin-top: 0; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">📄 Receipt / Invoice</h3>
                <div style="background: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 15px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #666;"><strong>Invoice Number:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right; font-family: monospace;">${invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #666;"><strong>Transaction ID:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right; font-family: monospace;">${transactionId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #666;"><strong>Payment Date:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">${paymentDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #666;"><strong>Product:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">Professional Diver Training App</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #666;"><strong>Subscription:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #333; text-align: right;">${data.subscriptionType === 'MONTHLY' ? 'Monthly' : 'Annual'}</td>
                    </tr>
                    <tr style="border-top: 2px solid #e2e8f0; margin-top: 10px;">
                      <td style="padding: 12px 0 8px 0; font-size: 16px; color: #1e40af;"><strong>Amount Paid:</strong></td>
                      <td style="padding: 12px 0 8px 0; font-size: 18px; color: #16a34a; text-align: right; font-weight: bold;">$${amount}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #666;"><strong>Status:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #16a34a; text-align: right; font-weight: bold;">✅ Paid</td>
                    </tr>
                  </table>
                </div>
                <p style="font-size: 12px; color: #64748b; margin: 15px 0 0 0; text-align: center;">
                  This receipt serves as your official invoice. Please keep this for your records.
                </p>
              </div>
              
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #15803d; margin-top: 0; font-size: 20px;">🔐 Your Login Credentials</h3>
                <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> <span style="color: #15803d; font-family: monospace;">${data.loginEmail}</span></p>
                  ${data.loginPassword ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Password:</strong> <span style="color: #15803d; font-family: monospace;">${data.loginPassword}</span></p>` : ''}
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Subscription:</strong> <span style="color: #15803d;">${data.subscriptionType === 'MONTHLY' ? 'Monthly' : 'Annual'}</span></p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Expires:</strong> <span style="color: #15803d;">${expirationDate}</span></p>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="https://professionaldiver.app/signin" 
                     style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Login to Your Account
                  </a>
                </div>
                ${data.loginPassword ? `<p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
                  ⚠️ <strong>Security Note:</strong> Please change your password after your first login. You can update it in your Profile Settings.
                </p>` : ''}
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">🤝 Become a Partner & Earn</h3>
                <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
                  Love the Professional Diver Training App? Become a partner and earn 50% commission on every referral you bring to the platform!
                </p>
                <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Commission Rate:</strong> <span style="color: #f59e0b; font-weight: bold;">50%</span> of all referred subscriptions</p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Minimum Payout:</strong> $50</p>
                  <p style="margin: 8px 0; font-size: 14px;"><strong>Payout Schedule:</strong> Monthly</p>
                </div>
                <h4 style="color: #92400e; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">How It Works:</h4>
                <ol style="margin: 0; padding-left: 20px; color: #333;">
                  <li style="margin-bottom: 8px;">Log in to your account</li>
                  <li style="margin-bottom: 8px;">Navigate to the Partner Dashboard</li>
                  <li style="margin-bottom: 8px;">Create your affiliate account (takes 2 minutes)</li>
                  <li style="margin-bottom: 8px;">Get your unique referral link and code</li>
                  <li style="margin-bottom: 8px;">Share with your network and earn commissions!</li>
                </ol>
                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://professionaldiver.app/affiliate" 
                     style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                    Become a Partner Now
                  </a>
                </div>
              </div>

              <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #0369a1; margin-top: 0; font-size: 20px;">📚 How to Navigate the Platform</h3>
                <p style="font-size: 15px; color: #333; margin-bottom: 15px;">Get the most out of your subscription:</p>
                
                <div style="margin: 20px 0;">
                  <h4 style="color: #0369a1; font-size: 16px; margin-bottom: 10px;">1. 📖 Learning Tracks</h4>
                  <p style="color: #333; margin-bottom: 10px; font-size: 14px;">
                    Explore comprehensive courses organized by specialty:
                  </p>
                  <ul style="margin: 0 0 15px 20px; padding: 0; color: #333; font-size: 14px;">
                    <li style="margin-bottom: 5px;">NDT Inspection & Testing</li>
                    <li style="margin-bottom: 5px;">Life Support Technician (LST)</li>
                    <li style="margin-bottom: 5px;">Assistant Life Support Technician (ALST)</li>
                    <li style="margin-bottom: 5px;">Commercial Dive Supervisor</li>
                    <li style="margin-bottom: 5px;">And many more...</li>
                  </ul>
                  <p style="margin: 0;"><a href="https://professionaldiver.app/tracks" style="color: #0284c7; text-decoration: none; font-weight: bold;">View All Learning Tracks →</a></p>
                </div>

                <div style="margin: 20px 0;">
                  <h4 style="color: #0369a1; font-size: 16px; margin-bottom: 10px;">2. 📝 Professional Exams</h4>
                  <p style="color: #333; margin-bottom: 10px; font-size: 14px;">
                    Take timed mock examinations to test your knowledge and prepare for certifications:
                  </p>
                  <ul style="margin: 0 0 15px 20px; padding: 0; color: #333; font-size: 14px;">
                    <li style="margin-bottom: 5px;">Timed exam conditions</li>
                    <li style="margin-bottom: 5px;">Instant feedback and explanations</li>
                    <li style="margin-bottom: 5px;">Progress tracking</li>
                    <li style="margin-bottom: 5px;">Performance analytics</li>
                  </ul>
                  <p style="margin: 0;"><a href="https://professionaldiver.app/dashboard" style="color: #0284c7; text-decoration: none; font-weight: bold;">Take a Practice Exam →</a></p>
                </div>

                <div style="margin: 20px 0;">
                  <h4 style="color: #0369a1; font-size: 16px; margin-bottom: 10px;">3. 🧠 AI Learning Path</h4>
                  <p style="color: #333; margin-bottom: 10px; font-size: 14px;">
                    Get personalized learning recommendations based on your goals and progress:
                  </p>
                  <p style="margin: 0;"><a href="https://professionaldiver.app/learning-path" style="color: #0284c7; text-decoration: none; font-weight: bold;">Get Your Personalized Learning Path →</a></p>
                </div>

                <div style="margin: 20px 0;">
                  <h4 style="color: #0369a1; font-size: 16px; margin-bottom: 10px;">4. 💬 AI Tutor & Support</h4>
                  <p style="color: #333; margin-bottom: 10px; font-size: 14px;">
                    Get instant help from our AI-powered diving consultant anytime you need clarification or support.
                  </p>
                  <p style="margin: 0;"><a href="https://professionaldiver.app/dashboard" style="color: #0284c7; text-decoration: none; font-weight: bold;">Chat with AI Tutor →</a></p>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                  <a href="https://professionaldiver.app/dashboard" 
                     style="display: inline-block; background: #0284c7; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Start Learning Now
                  </a>
                </div>
              </div>

              <div style="border-top: 2px solid #e5e7eb; padding-top: 30px; margin-top: 40px;">
                <h3 style="color: #16a34a; font-size: 18px; margin-bottom: 15px;">💬 Need Help?</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Our support team is here to help you succeed:</p>
                <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                  <li style="margin-bottom: 8px;"><strong>Email:</strong> ${this.supportEmail}</li>
                  <li style="margin-bottom: 8px;"><strong>In-App Support:</strong> Use the chat feature in your dashboard</li>
                  <li style="margin-bottom: 8px;"><strong>Platform Guide:</strong> Visit /dashboard for tutorials</li>
                </ul>
              </div>
            </div>
            <div style="background: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #ffffff;">Professional Diver</p>
              <p style="margin: 0 0 10px 0; font-size: 12px;">by Diver Well Training</p>
              <p style="margin: 0; font-size: 11px;">Brand-neutral commercial diving education platform</p>
              <p style="margin: 15px 0 0 0; font-size: 11px;">© 2025 Diver Well Training. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Professional Diver Training App - Thank You for Your Purchase!

Welcome, ${data.name}!

Thank you for subscribing to Professional Diver Training App! Your ${subscriptionDuration}ly subscription is now active.

RECEIPT / INVOICE
Invoice Number: ${invoiceNumber}
Transaction ID: ${transactionId}
Payment Date: ${paymentDate}
Product: Professional Diver Training App
Subscription: ${data.subscriptionType === 'MONTHLY' ? 'Monthly' : 'Annual'}
Amount Paid: $${amount}
Status: ✅ Paid

This receipt serves as your official invoice. Please keep this for your records.

YOUR LOGIN CREDENTIALS
Email: ${data.loginEmail}
${data.loginPassword ? `Password: ${data.loginPassword}` : ''}
Subscription: ${data.subscriptionType === 'MONTHLY' ? 'Monthly' : 'Annual'}
Expires: ${expirationDate}

Login: https://professionaldiver.app/signin

BECOME A PARTNER & EARN
- 50% commission on all referrals
- Minimum payout: $50
- Monthly payouts
- Get your referral link: https://professionaldiver.app/affiliate

HOW TO NAVIGATE THE PLATFORM

1. Learning Tracks
Explore comprehensive courses organized by specialty
View: https://professionaldiver.app/tracks

2. Professional Exams
Take timed mock examinations to test your knowledge
View: https://professionaldiver.app/dashboard

3. AI Learning Path
Get personalized learning recommendations
View: https://professionaldiver.app/learning-path

4. AI Tutor & Support
Get instant help from our AI-powered diving consultant
Available in your dashboard

Start Learning: https://professionaldiver.app/dashboard

Need Help?
Email: ${this.supportEmail}
In-App Support: Use the chat feature in your dashboard

© 2025 Diver Well Training. All rights reserved.
      `
    };
  }

  // Get text version of follow-up email
  private getFollowUpEmailTextVersion(data: FollowUpEmailData): string {
    const templates = {
      1: `Professional Diver - Diver Well Training

Don't Miss Out - Your Trial Ends Soon!

Hello ${data.name},

We noticed you haven't subscribed yet, and your trial is ending soon. You still have time to unlock full access to Professional Diver's comprehensive commercial diving education platform!

What You'll Get:
- Unlimited access to all learning tracks
- Professional exam simulations
- AI-powered learning path recommendations
- Progress tracking and analytics
- 24/7 AI tutor support

Subscribe Now: https://professionaldiver.app/dashboard

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`,

      2: `Professional Diver - Diver Well Training

Last Chance: Special Offer Just for You

Hello ${data.name},

We'd love to have you join our community of professional divers. As a special thank you for trying our platform, we're offering you priority access to our training programs.

Why Professional Diver?
- Brand-neutral content you can trust
- Comprehensive coverage of all diving specialties
- Proven results from industry professionals
- Regular content updates and new courses

Claim Your Subscription: https://professionaldiver.app/dashboard

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`,

      3: `Professional Diver - Diver Well Training

See What You're Missing - Success Stories from Our Students

Hello ${data.name},

Thousands of professional divers have used our platform to advance their careers. Here's what makes Professional Diver different:

What Our Students Achieve:
- Higher exam pass rates
- Confidence in their knowledge
- Career advancement opportunities
- Access to exclusive industry content

Start Your Journey: https://professionaldiver.app/dashboard

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`,

      4: `Professional Diver - Diver Well Training

Questions? We're Here to Help!

Hello ${data.name},

We understand that choosing the right training platform is important. If you have any questions about Professional Diver, we're here to help!

Common Questions:
Q: Is the content up-to-date?
A: Yes! We regularly update our content to reflect the latest industry standards.

Q: Can I access on mobile?
A: Absolutely! Our platform works perfectly on all devices.

Q: What if I'm not satisfied?
A: We offer full support and are committed to your success.

Contact Support: ${this.supportEmail}
Explore Platform: https://professionaldiver.app/dashboard

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`,

      5: `Professional Diver - Diver Well Training

One More Thing - Become a Partner & Earn!

Hello ${data.name},

Did you know that when you subscribe, you can also become a partner and earn 50% commission on every referral?

Partner Benefits:
- 50% commission on all referrals
- Monthly payouts (minimum $50)
- Real-time tracking dashboard
- Unique referral links and codes
- No limit on earnings

Learn About Partner Program: https://professionaldiver.app/affiliate

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`,

      6: `Professional Diver - Diver Well Training

Final Reminder - Don't Let This Opportunity Pass You By

Hello ${data.name},

This is our final reminder. Professional Diver is the most comprehensive commercial diving education platform available, and we'd hate to see you miss out.

What Happens Next:
Without a subscription, you'll lose access to:
- All premium learning tracks
- Professional exam simulations
- AI-powered learning assistance
- Progress tracking and analytics

Subscribe Now - Don't Miss Out: https://professionaldiver.app/dashboard

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`,

      7: `Professional Diver - Diver Well Training

We'd Love Your Feedback - Help Us Improve

Hello ${data.name},

We understand you've decided not to subscribe at this time, and we respect your decision. Your feedback would help us improve and serve the diving community better.

Quick Questions:
- What features would you like to see?
- Was there something that didn't meet your expectations?
- How can we improve our platform?

Share Your Feedback: ${this.supportEmail}?subject=Platform Feedback
Revisit Platform: https://professionaldiver.app/dashboard

P.S. You can always return and subscribe whenever you're ready. We'll be here!

Professional Diver - Diver Well Training
Brand-neutral commercial diving education`
    };

    return templates[data.emailNumber as keyof typeof templates] || templates[1];
  }

  // Follow-up Email Templates for Non-Purchasers
  private getFollowUpEmailTemplate(data: FollowUpEmailData): EmailTemplate {
    const templates = {
      1: {
        subject: "Don't Miss Out - Your Trial Ends Soon! ⏰",
        title: "Your Trial is Running Out",
        content: `
          <p>Hello ${data.name},</p>
          <p>We noticed you haven't subscribed yet, and your trial is ending soon. You still have time to unlock full access to Professional Diver's comprehensive commercial diving education platform!</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">What You'll Get:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Unlimited access to all learning tracks</li>
              <li>Professional exam simulations</li>
              <li>AI-powered learning path recommendations</li>
              <li>Progress tracking and analytics</li>
              <li>24/7 AI tutor support</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://professionaldiver.app/dashboard" 
               style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Subscribe Now & Save
            </a>
          </div>
        `
      },
      2: {
        subject: "Last Chance: Special Offer Just for You 🎁",
        title: "Special Limited-Time Offer",
        content: `
          <p>Hello ${data.name},</p>
          <p>We'd love to have you join our community of professional divers. As a special thank you for trying our platform, we're offering you priority access to our training programs.</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Why Professional Diver?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Brand-neutral content you can trust</li>
              <li>Comprehensive coverage of all diving specialties</li>
              <li>Proven results from industry professionals</li>
              <li>Regular content updates and new courses</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://professionaldiver.app/dashboard" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Claim Your Subscription
            </a>
          </div>
        `
      },
      3: {
        subject: "See What You're Missing - Success Stories from Our Students 💪",
        title: "Join Thousands of Successful Divers",
        content: `
          <p>Hello ${data.name},</p>
          <p>Thousands of professional divers have used our platform to advance their careers. Here's what makes Professional Diver different:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="color: #15803d; margin-top: 0;">What Our Students Achieve:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Higher exam pass rates</li>
              <li>Confidence in their knowledge</li>
              <li>Career advancement opportunities</li>
              <li>Access to exclusive industry content</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://professionaldiver.app/dashboard" 
               style="display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Start Your Journey Today
            </a>
          </div>
        `
      },
      4: {
        subject: "Questions? We're Here to Help! 💬",
        title: "Let's Answer Your Questions",
        content: `
          <p>Hello ${data.name},</p>
          <p>We understand that choosing the right training platform is important. If you have any questions about Professional Diver, we're here to help!</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">Common Questions:</h3>
            <p><strong>Q: Is the content up-to-date?</strong><br>
            A: Yes! We regularly update our content to reflect the latest industry standards.</p>
            <p><strong>Q: Can I access on mobile?</strong><br>
            A: Absolutely! Our platform works perfectly on all devices.</p>
            <p><strong>Q: What if I'm not satisfied?</strong><br>
            A: We offer full support and are committed to your success.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${this.supportEmail}" 
               style="display: inline-block; background: #0284c7; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Contact Support
            </a>
            <a href="https://professionaldiver.app/dashboard" 
               style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-left: 10px;">
              Explore Platform
            </a>
          </div>
        `
      },
      5: {
        subject: "One More Thing - Become a Partner & Earn! 💰",
        title: "Earn While You Learn",
        content: `
          <p>Hello ${data.name},</p>
          <p>Did you know that when you subscribe, you can also become a partner and earn 50% commission on every referral?</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Partner Benefits:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>50% commission on all referrals</li>
              <li>Monthly payouts (minimum $50)</li>
              <li>Real-time tracking dashboard</li>
              <li>Unique referral links and codes</li>
              <li>No limit on earnings</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://professionaldiver.app/affiliate" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Learn About Partner Program
            </a>
          </div>
        `
      },
      6: {
        subject: "Final Reminder - Don't Let This Opportunity Pass You By 🚀",
        title: "Your Last Chance",
        content: `
          <p>Hello ${data.name},</p>
          <p>This is our final reminder. Professional Diver is the most comprehensive commercial diving education platform available, and we'd hate to see you miss out.</p>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="color: #991b1b; margin-top: 0;">What Happens Next:</h3>
            <p>Without a subscription, you'll lose access to:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>All premium learning tracks</li>
              <li>Professional exam simulations</li>
              <li>AI-powered learning assistance</li>
              <li>Progress tracking and analytics</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://professionaldiver.app/dashboard" 
               style="display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Subscribe Now - Don't Miss Out
            </a>
          </div>
        `
      },
      7: {
        subject: "We'd Love Your Feedback - Help Us Improve 📝",
        title: "Your Opinion Matters",
        content: `
          <p>Hello ${data.name},</p>
          <p>We understand you've decided not to subscribe at this time, and we respect your decision. Your feedback would help us improve and serve the diving community better.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">Quick Questions:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>What features would you like to see?</li>
              <li>Was there something that didn't meet your expectations?</li>
              <li>How can we improve our platform?</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${this.supportEmail}?subject=Platform Feedback" 
               style="display: inline-block; background: #0284c7; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Share Your Feedback
            </a>
            <a href="https://professionaldiver.app/dashboard" 
               style="display: inline-block; background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-left: 10px;">
              Revisit Platform
            </a>
          </div>
          <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #64748b;">
            P.S. You can always return and subscribe whenever you're ready. We'll be here!
          </p>
        `
      }
    };

    const template = templates[data.emailNumber as keyof typeof templates] || templates[1];

    return {
      subject: template.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${template.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af;">Professional Diver</h1>
              <p style="color: #64748b;">Diver Well Training</p>
            </div>
            <h2 style="color: #1e40af;">${template.title}</h2>
            ${template.content}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
              <p>Professional Diver - Diver Well Training</p>
              <p>Brand-neutral commercial diving education</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: this.getFollowUpEmailTextVersion(data)
    };
  }

  // Send purchase thank you email
  async sendPurchaseThankYouEmail(data: PurchaseThankYouData): Promise<boolean> {
    try {
      const template = this.getPurchaseThankYouTemplate(data);

      // Try SMTP first (Google Workspace)
      if (this.smtpTransporter) {
        try {
          await this.smtpTransporter.sendMail({
            from: `"Professional Diver" <${this.fromEmail}>`,
            to: data.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Purchase thank you email sent to ${data.email} via SMTP`);
          return true;
        } catch (smtpError) {
          console.error('SMTP send failed, trying SendGrid...', smtpError);
        }
      }

      // Fallback to SendGrid if available
      if (this.sendGridApiKey) {
        try {
          await sgMail.send({
            to: data.email,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Purchase thank you email sent to ${data.email} via SendGrid`);
          return true;
        } catch (sgError) {
          console.error('SendGrid send failed:', sgError);
        }
      }

      // Log for manual sending if both fail
      console.log('📧 Purchase thank you email (no email service configured):', {
        to: data.email,
        subject: template.subject,
      });
      return false;
    } catch (error) {
      console.error('Error sending purchase thank you email:', error);
      return false;
    }
  }

  // Testimonial Promo Email Template
  private getTestimonialPromoTemplate(data: TestimonialPromoData): EmailTemplate {
    const subscriptionPeriod = data.subscriptionType === 'MONTHLY' ? 'month' : 'year';
    
    return {
      subject: "Earn a FREE Month - Share Your Professional Diver Experience! 🎁",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Earn a Free Month - Share Your Experience</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎁 Special Offer!</h1>
              <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">Earn a FREE month of subscription</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #d97706; margin-top: 0; font-size: 24px;">Hello ${data.name}!</h2>
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Thank you for being a valued member of Professional Diver! We'd love to hear about your experience and, as a token of appreciation, we're offering you a <strong>FREE month</strong> of your ${subscriptionPeriod}ly subscription in exchange for your testimonial.
              </p>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">✨ What We Need:</h3>
                <div style="margin: 20px 0;">
                  <h4 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">1. Written Testimonial 📝</h4>
                  <p style="color: #333; font-size: 14px; margin-bottom: 15px;">
                    Share your thoughts about how Professional Diver has helped you in your commercial diving career. Be specific about:
                  </p>
                  <ul style="margin: 0 0 15px 20px; padding: 0; color: #333; font-size: 14px;">
                    <li style="margin-bottom: 5px;">What you've learned or achieved</li>
                    <li style="margin-bottom: 5px;">Features you found most valuable</li>
                    <li style="margin-bottom: 5px;">How it's helped your career</li>
                    <li style="margin-bottom: 5px;">Why you'd recommend it to others</li>
                  </ul>
                </div>
                
                <div style="margin: 20px 0;">
                  <h4 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">2. Video Testimonial 🎥</h4>
                  <p style="color: #333; font-size: 14px; margin-bottom: 15px;">
                    Record a short video (2-3 minutes) sharing your experience. You can:
                  </p>
                  <ul style="margin: 0 0 15px 20px; padding: 0; color: #333; font-size: 14px;">
                    <li style="margin-bottom: 5px;">Use your phone or webcam</li>
                    <li style="margin-bottom: 5px;">Speak naturally - we want your authentic voice</li>
                    <li style="margin-bottom: 5px;">Mention your name and role/title</li>
                    <li style="margin-bottom: 5px;">Share what makes Professional Diver special to you</li>
                  </ul>
                </div>
              </div>

              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #15803d; margin-top: 0; font-size: 20px;">🎁 What You Get:</h3>
                <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 8px 0; font-size: 16px;"><strong style="color: #15803d; font-size: 24px;">FREE Month</strong> added to your subscription</p>
                  <p style="margin: 8px 0; font-size: 14px; color: #666;">
                    Your testimonial will be featured on our landing pages, social media, and marketing materials to help other diving professionals discover our platform.
                  </p>
                </div>
              </div>

              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1e40af; margin-top: 0; font-size: 20px;">📋 How to Submit:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #333;">
                  <li style="margin-bottom: 10px;">Write your testimonial (or prepare your talking points for the video)</li>
                  <li style="margin-bottom: 10px;">Record your video testimonial (2-3 minutes)</li>
                  <li style="margin-bottom: 10px;">Upload your video and submit your written testimonial using the form below</li>
                  <li style="margin-bottom: 10px;">Our team will review and approve your testimonial</li>
                  <li style="margin-bottom: 10px;">Once approved, we'll add a FREE month to your subscription!</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://professionaldiver.app/testimonials/submit" 
                   style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Submit Your Testimonial Now
                </a>
              </div>

              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                  <strong>Terms:</strong> Testimonial must be approved by our team. Free month will be added within 48 hours of approval. 
                  Valid for ${data.subscriptionType === 'MONTHLY' ? 'monthly' : 'annual'} subscribers only. 
                  One free month per customer.
                </p>
              </div>

              <div style="border-top: 2px solid #e5e7eb; padding-top: 30px; margin-top: 40px;">
                <h3 style="color: #d97706; font-size: 18px; margin-bottom: 15px;">💬 Questions?</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">If you have any questions about this offer, feel free to reach out:</p>
                <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                  <li style="margin-bottom: 8px;"><strong>Email:</strong> ${this.supportEmail}</li>
                  <li style="margin-bottom: 8px;"><strong>Subject:</strong> Testimonial Offer Question</li>
                </ul>
              </div>
            </div>
            <div style="background: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #ffffff;">Professional Diver</p>
              <p style="margin: 0 0 10px 0; font-size: 12px;">by Diver Well Training</p>
              <p style="margin: 0; font-size: 11px;">Brand-neutral commercial diving education platform</p>
              <p style="margin: 15px 0 0 0; font-size: 11px;">© 2025 Diver Well Training. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Professional Diver - Earn a FREE Month!

Hello ${data.name}!

Thank you for being a valued member of Professional Diver! We'd love to hear about your experience and, as a token of appreciation, we're offering you a FREE month of your ${subscriptionPeriod}ly subscription in exchange for your testimonial.

WHAT WE NEED:

1. Written Testimonial
Share your thoughts about how Professional Diver has helped you in your commercial diving career. Be specific about:
- What you've learned or achieved
- Features you found most valuable
- How it's helped your career
- Why you'd recommend it to others

2. Video Testimonial (2-3 minutes)
Record a short video sharing your experience. You can:
- Use your phone or webcam
- Speak naturally - we want your authentic voice
- Mention your name and role/title
- Share what makes Professional Diver special to you

WHAT YOU GET:
✨ FREE Month added to your subscription
✨ Your testimonial featured on our landing pages and marketing materials

HOW TO SUBMIT:
1. Write your testimonial (or prepare your talking points)
2. Record your video testimonial (2-3 minutes)
3. Upload and submit using: https://professionaldiver.app/testimonials/submit
4. Our team will review and approve
5. Once approved, we'll add a FREE month to your subscription!

Submit Your Testimonial: https://professionaldiver.app/testimonials/submit

TERMS: Testimonial must be approved by our team. Free month will be added within 48 hours of approval. Valid for ${data.subscriptionType === 'MONTHLY' ? 'monthly' : 'annual'} subscribers only. One free month per customer.

Questions? Email: ${this.supportEmail}
Subject: Testimonial Offer Question

© 2025 Diver Well Training. All rights reserved.
      `
    };
  }

  // Send testimonial promo email
  async sendTestimonialPromoEmail(data: TestimonialPromoData): Promise<boolean> {
    try {
      const template = this.getTestimonialPromoTemplate(data);

      // Try SMTP first (Google Workspace)
      if (this.smtpTransporter) {
        try {
          await this.smtpTransporter.sendMail({
            from: `"Professional Diver" <${this.fromEmail}>`,
            to: data.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Testimonial promo email sent to ${data.email} via SMTP`);
          return true;
        } catch (smtpError) {
          console.error('SMTP send failed, trying SendGrid...', smtpError);
        }
      }

      // Fallback to SendGrid if available
      if (this.sendGridApiKey) {
        try {
          await sgMail.send({
            to: data.email,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Testimonial promo email sent to ${data.email} via SendGrid`);
          return true;
        } catch (sgError) {
          console.error('SendGrid send failed:', sgError);
        }
      }

      // Log for manual sending if both fail
      console.log('📧 Testimonial promo email (no email service configured):', {
        to: data.email,
        subject: template.subject,
      });
      return false;
    } catch (error) {
      console.error('Error sending testimonial promo email:', error);
      return false;
    }
  }

  // Send follow-up email to non-purchaser
  async sendFollowUpEmail(data: FollowUpEmailData): Promise<boolean> {
    try {
      const template = this.getFollowUpEmailTemplate(data);

      // Try SMTP first (Google Workspace)
      if (this.smtpTransporter) {
        try {
          await this.smtpTransporter.sendMail({
            from: `"Professional Diver" <${this.fromEmail}>`,
            to: data.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Follow-up email #${data.emailNumber} sent to ${data.email} via SMTP`);
          return true;
        } catch (smtpError) {
          console.error('SMTP send failed, trying SendGrid...', smtpError);
        }
      }

      // Fallback to SendGrid if available
      if (this.sendGridApiKey) {
        try {
          await sgMail.send({
            to: data.email,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Follow-up email #${data.emailNumber} sent to ${data.email} via SendGrid`);
          return true;
        } catch (sgError) {
          console.error('SendGrid send failed:', sgError);
        }
      }

      // Log for manual sending if both fail
      console.log(`📧 Follow-up email #${data.emailNumber} (no email service configured):`, {
        to: data.email,
        subject: template.subject,
      });
      return false;
    } catch (error) {
      console.error(`Error sending follow-up email #${data.emailNumber}:`, error);
      return false;
    }
  }

  // Send welcome email to admin users
  async sendWelcomeAdminEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const template = this.getWelcomeAdminTemplate(data);

      // Try SMTP first (Google Workspace)
      if (this.smtpTransporter) {
        try {
          await this.smtpTransporter.sendMail({
            from: `"Professional Divers App" <${this.fromEmail}>`,
            to: data.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Welcome email sent to ${data.email} via SMTP (Google Workspace)`);
          return true;
        } catch (smtpError) {
          console.error('SMTP send failed, trying SendGrid...', smtpError);
        }
      }

      // Fallback to SendGrid if available
      if (this.sendGridApiKey) {
        try {
          await sgMail.send({
            to: data.email,
            from: this.fromEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(`✅ Welcome email sent to ${data.email} via SendGrid`);
          return true;
        } catch (sgError) {
          console.error('SendGrid send failed:', sgError);
        }
      }

      // If both fail, log for manual sending
      console.log('📧 Welcome email (no email service configured):', {
        to: data.email,
        subject: template.subject,
        from: this.fromEmail,
      });
      console.log('\n⚠️ To send emails, configure either:');
      console.log('   1. SMTP (Google Workspace): Set SMTP_PASSWORD environment variable');
      console.log('   2. SendGrid: Set SENDGRID_API_KEY environment variable');
      return false;
    } catch (error) {
      console.error('Error sending welcome admin email:', error);
      return false;
    }
  }
}

export const emailMarketing = new EmailMarketing();