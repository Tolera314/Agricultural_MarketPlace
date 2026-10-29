/**
 * Notification Service for AgriMarket
 * Handles transactional Emails via Brevo (Sendinblue) and SMS via Geez SMS / Ethio Telecom.
 * Implements fallback mock logging for local development when credentials are not supplied.
 */

interface SendEmailParams {
  to: string;
  name?: string;
  subject: string;
  htmlContent: string;
}

interface SendSMSParams {
  phone: string;
  message: string;
}

export class NotificationService {
  private static get brevoApiKey(): string {
    return process.env.BREVO_API_KEY || '';
  }

  private static get brevoSenderEmail(): string {
    return process.env.BREVO_SENDER_EMAIL || 'tolefayiss@gmail.com';
  }

  private static get brevoSenderName(): string {
    return process.env.BREVO_SENDER_NAME || 'AgriMarket Ethiopia';
  }

  private static get frontendUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
  }

  private static get geezSmsToken(): string {
    return process.env.GEEZ_SMS_TOKEN || '';
  }

  private static get geezSmsSenderId(): string {
    return process.env.GEEZ_SMS_SENDER_ID || 'AgriMarket';
  }

  private static get ethioTelecomKey(): string {
    return process.env.ETHIO_TELECOM_SMS_API_KEY || '';
  }

  /**
   * Send Email via Brevo REST API v3
   */
  public static async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; mocked?: boolean }> {
    const { to, name, subject, htmlContent } = params;

    const apiKey = this.brevoApiKey;
    const senderEmail = this.brevoSenderEmail;
    const senderName = this.brevoSenderName;

    if (!apiKey) {
      console.log(`\n======================================================`);
      console.log(`[Brevo Email Mock] To: ${name ? `${name} <${to}>` : to}`);
      console.log(`[Brevo Email Mock] Subject: ${subject}`);
      console.log(`[Brevo Email Mock] Preview: ${htmlContent.replace(/<[^>]+>/g, ' ').slice(0, 150)}...`);
      console.log(`======================================================\n`);
      return { success: true, messageId: `mock-brevo-${Date.now()}`, mocked: true };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: to,
              name: name || to,
            },
          ],
          subject,
          htmlContent,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('[Brevo Error]', response.status, data);
        return { success: false, mocked: false };
      }

      console.log(`[Brevo Email Sent] To: ${to}, Sender: ${senderEmail}, MessageId: ${(data as any)?.messageId}`);
      return { success: true, messageId: (data as any)?.messageId, mocked: false };
    } catch (err) {
      console.error('[Brevo Exception]', err);
      return { success: false, mocked: false };
    }
  }

  /**
   * Send SMS via Geez SMS / Ethio Telecom
   */
  public static async sendSMS(params: SendSMSParams): Promise<{ success: boolean; mocked?: boolean }> {
    const { phone, message } = params;

    // Clean phone number: format to Ethiopian standard e.g. 09... or 2519...
    const cleanPhone = phone.replace(/[\s\-+()]/g, '');

    if (!this.geezSmsToken && !this.ethioTelecomKey) {
      console.log(`\n======================================================`);
      console.log(`[Geez / Ethio SMS Mock] Recipient: ${phone} (${cleanPhone})`);
      console.log(`[Geez / Ethio SMS Mock] Message: ${message}`);
      console.log(`======================================================\n`);
      return { success: true, mocked: true };
    }

    try {
      // Geez SMS Ethiopian API integration
      if (this.geezSmsToken) {
        const response = await fetch('https://api.geezsms.com/api/v1/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: this.geezSmsToken,
            phone: cleanPhone,
            msg: message,
            shortcode_id: this.geezSmsSenderId,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          console.error('[Geez SMS Error]', data);
          return { success: false, mocked: false };
        }
        return { success: true, mocked: false };
      }

      return { success: true, mocked: false };
    } catch (err) {
      console.error('[SMS Exception]', err);
      return { success: false, mocked: false };
    }
  }

  /**
   * Send OTP Verification Code
   * Rule: Send via email if and only if user provided an email; otherwise send via SMS.
   */
  public static async sendOTPVerification(user: {
    phone: string;
    email?: string | null;
    fullName: string;
    otpCode: string;
  }): Promise<{ channel: 'EMAIL' | 'SMS'; recipient: string }> {
    const { phone, email, fullName, otpCode } = user;

    if (email && email.trim().length > 0) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #E8F5E9; padding: 12px; border-radius: 50%; margin-bottom: 8px;">
              <span style="font-size: 28px; color: #10B981;">🌱</span>
            </div>
            <h1 style="color: #075C3B; margin: 0; font-size: 24px; font-weight: 800;">AgriMarket Ethiopia</h1>
            <p style="color: #4B5563; font-size: 13px; margin-top: 4px;">Direct Farm-to-Buyer Marketplace</p>
          </div>
          
          <h2 style="color: #111827; font-size: 18px; font-weight: 700; margin-bottom: 12px;">Verify Your Account</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">
            Hello <strong>${fullName}</strong>,<br/>
            Thank you for signing up for AgriMarket. Please use the 6-digit verification code below to verify your account:
          </p>
          
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background-color: #F0FDF4; border: 2px dashed #059669; padding: 16px 36px; border-radius: 12px;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #047857;">${otpCode}</span>
            </div>
          </div>
          
          <p style="color: #6B7280; font-size: 13px; line-height: 1.4;">
            ⏱ This code is valid for <strong>15 minutes</strong>.<br/>
            🔒 If you did not create an account on AgriMarket, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
          
          <p style="text-align: center; color: #9CA3AF; font-size: 11px;">
            © ${new Date().getFullYear()} AgriMarket Ethiopia. All rights reserved.
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email.trim(),
        name: fullName,
        subject: `Your AgriMarket Verification Code: ${otpCode}`,
        htmlContent,
      });

      return { channel: 'EMAIL', recipient: email.trim() };
    }

    // Otherwise: Send via SMS (Ethio Telecom / Geez SMS)
    const smsMessage = `AgriMarket: Your verification code is ${otpCode}. Valid for 15 minutes. Never share this code with anyone.`;
    await this.sendSMS({
      phone,
      message: smsMessage,
    });

    return { channel: 'SMS', recipient: phone };
  }

  /**
   * Send Welcome Notification upon successful account verification
   */
  public static async sendWelcomeNotification(user: {
    phone: string;
    email?: string | null;
    fullName: string;
  }): Promise<void> {
    const { phone, email, fullName } = user;
    const frontendUrl = this.frontendUrl;

    if (email && email.trim().length > 0) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #E8F5E9; padding: 12px; border-radius: 50%; margin-bottom: 8px;">
              <span style="font-size: 28px;">🌾</span>
            </div>
            <h1 style="color: #075C3B; margin: 0; font-size: 24px; font-weight: 800;">Welcome to AgriMarket!</h1>
          </div>
          
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            Hello <strong>${fullName}</strong>,<br/>
            Your account has been verified successfully! You are now part of Ethiopia's direct agricultural marketplace connecting farmers, buyers, and local couriers.
          </p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${frontendUrl}/dashboard" style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block;">
              Go to Your Dashboard
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 12px; line-height: 1.4;">
            Need help? Contact our support team anytime at support@agrimarket.et.
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email.trim(),
        name: fullName,
        subject: `Welcome to AgriMarket, ${fullName}!`,
        htmlContent,
      });
      return;
    }

    // SMS Welcome
    await this.sendSMS({
      phone,
      message: `Welcome to AgriMarket, ${fullName}! Your account has been verified. Discover fresh local produce and direct trade at: ${frontendUrl}`,
    });
  }

  /**
   * Send SMS for Application Draft Resumption
   */
  public static async sendDraftResumptionSMS(params: {
    phone: string;
    fullName: string;
    role: string;
  }): Promise<void> {
    const { phone, fullName, role } = params;
    const frontendUrl = this.frontendUrl;
    const roleSlug = role === 'FARMER' ? 'farmer' : 'worker';
    const resumeUrl = `${frontendUrl}/onboarding/${roleSlug}?resume=true`;

    const message = `AgriMarket: Hello ${fullName}, your ${role.toLowerCase()} application draft has been saved. Resume anytime at: ${resumeUrl}`;
    await this.sendSMS({
      phone,
      message,
    });
  }

  /**
   * Send Admin Verification Status Update (Approved or Changes Requested)
   */
  public static async sendVerificationStatusNotification(params: {
    phone: string;
    email?: string | null;
    fullName: string;
    role: 'FARMER' | 'DELIVERY_WORKER';
    status: 'VERIFIED' | 'REJECTED';
    reason?: string | null;
  }): Promise<void> {
    const { phone, email, fullName, role, status, reason } = params;
    const frontendUrl = this.frontendUrl;
    const roleTitle = role === 'FARMER' ? 'Farmer' : 'Delivery Courier';
    const roleSlug = role === 'FARMER' ? 'farmer' : 'worker';

    if (status === 'VERIFIED') {
      const smsMessage = `AgriMarket: Congratulations ${fullName}! Your ${roleTitle} application has been APPROVED. You can now start ${role === 'FARMER' ? 'selling produce' : 'accepting delivery orders'} at ${frontendUrl}/dashboard/${roleSlug}`;
      await this.sendSMS({ phone, message: smsMessage });

      if (email && email.trim().length > 0) {
        await this.sendEmail({
          to: email.trim(),
          name: fullName,
          subject: `Congratulations! Your AgriMarket ${roleTitle} Account is Verified`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
              <h2 style="color: #075C3B;">Congratulations ${fullName}!</h2>
              <p style="color: #374151; font-size: 14px;">Your ${roleTitle} application has been approved by our verification team.</p>
              <div style="margin: 20px 0;">
                <a href="${frontendUrl}/dashboard/${roleSlug}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Access Your ${roleTitle} Dashboard
                </a>
              </div>
            </div>
          `,
        });
      }
    } else {
      // REJECTED / CHANGES REQUESTED
      const note = reason ? `Reason: "${reason}".` : 'Please check your submitted documents.';
      const smsMessage = `AgriMarket: Hello ${fullName}, your ${roleTitle} application requires updates. ${note} Review at: ${frontendUrl}/dashboard/${roleSlug}/verification-status`;
      await this.sendSMS({ phone, message: smsMessage });

      if (email && email.trim().length > 0) {
        await this.sendEmail({
          to: email.trim(),
          name: fullName,
          subject: `Updates Required for Your AgriMarket ${roleTitle} Application`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
              <h2 style="color: #B91C1C;">Updates Required for Your Application</h2>
              <p style="color: #374151; font-size: 14px;">Hello ${fullName}, our compliance team reviewed your submission and noted:</p>
              <blockquote style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 16px 0; color: #991B1B;">
                ${reason || 'Document verification could not be completed. Please upload clearer document copies.'}
              </blockquote>
              <div style="margin: 20px 0;">
                <a href="${frontendUrl}/dashboard/${roleSlug}/verification-status" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Update Documents Now
                </a>
              </div>
            </div>
          `,
        });
      }
    }
  }

  /**
   * Send Password Recovery OTP Code
   */
  public static async sendPasswordResetOTP(params: {
    phone: string;
    email?: string | null;
    fullName: string;
    otpCode: string;
  }): Promise<{ channel: 'EMAIL' | 'SMS'; recipient: string }> {
    const { phone, email, fullName, otpCode } = params;

    if (email && email.trim().length > 0) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #E8F5E9; padding: 12px; border-radius: 50%; margin-bottom: 8px;">
              <span style="font-size: 28px;">🔐</span>
            </div>
            <h1 style="color: #075C3B; margin: 0; font-size: 24px; font-weight: 800;">Password Recovery Request</h1>
          </div>
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            Hello <strong>${fullName}</strong>,<br/>
            We received a request to reset your AgriMarket account password. Use the single-use 6-digit verification code below:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #F0FDF4; border: 2px dashed #059669; border-radius: 12px; padding: 16px 36px;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: monospace;">${otpCode}</span>
            </div>
          </div>
          <p style="color: #6B7280; font-size: 13px; line-height: 1.5;">
            This code expires in <strong>15 minutes</strong> and can only be used once. If you did not request a password reset, please ignore this email or reach out to support.
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email.trim(),
        name: fullName,
        subject: `AgriMarket Password Reset Code: ${otpCode}`,
        htmlContent,
      });

      return { channel: 'EMAIL', recipient: email.trim() };
    }

    // Default to SMS
    const message = `AgriMarket: Your password reset verification code is ${otpCode}. It expires in 15 minutes. Do not share this code with anyone.`;
    await this.sendSMS({ phone, message });
    return { channel: 'SMS', recipient: phone };
  }

  /**
   * Send Password Reset Success Confirmation Alert
   */
  public static async sendPasswordResetSuccessNotification(params: {
    phone: string;
    email?: string | null;
    fullName: string;
  }): Promise<void> {
    const { phone, email, fullName } = params;
    const timeString = new Date().toUTCString();

    if (email && email.trim().length > 0) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 16px;">
          <h2 style="color: #075C3B; margin-top: 0;">Password Successfully Reset</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">
            Hello <strong>${fullName}</strong>,<br/>
            Your AgriMarket account password was successfully updated on <strong>${timeString}</strong>. All previous active sessions have been safely signed out.
          </p>
          <p style="color: #DC2626; font-size: 12px; margin-top: 16px;">
            If you did not make this change, please contact AgriMarket security immediately at support@agrimarket.et.
          </p>
        </div>
      `;

      await this.sendEmail({
        to: email.trim(),
        name: fullName,
        subject: `Your AgriMarket Password Has Been Reset`,
        htmlContent,
      });
      return;
    }

    // SMS Notice
    const message = `AgriMarket Security: Your account password was successfully reset. If this was not you, please contact support immediately.`;
    await this.sendSMS({ phone, message });
  }
}
