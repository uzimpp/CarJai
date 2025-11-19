package services

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
)

// EmailService handles email sending operations
type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	smtpFrom     string
}

// NewEmailService creates a new email service
func NewEmailService(host, port, username, password, from string) *EmailService {
	return &EmailService{
		smtpHost:     host,
		smtpPort:     port,
		smtpUsername: username,
		smtpPassword: password,
		smtpFrom:     from,
	}
}

// SendPasswordResetEmail sends a password reset email
func (s *EmailService) SendPasswordResetEmail(toEmail, resetLink string, frontendURL string) error {
	subject := "Reset Your Password - CarJai"
	body := s.buildPasswordResetEmailHTML(resetLink)

	// Compose message
	message := []byte(
		"From: " + s.smtpFrom + "\r\n" +
			"To: " + toEmail + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=UTF-8\r\n" +
			"\r\n" +
			body + "\r\n",
	)

	// SMTP authentication
	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)

	// Connect to SMTP server (plain connection for STARTTLS)
	addr := s.smtpHost + ":" + s.smtpPort
	client, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer client.Quit()

	// Start TLS (STARTTLS)
	tlsConfig := &tls.Config{
		ServerName: s.smtpHost,
	}
	if err := client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("failed to start TLS: %w", err)
	}

	// Authenticate
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP authentication failed: %w", err)
	}

	// Set sender
	if err := client.Mail(s.smtpUsername); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	// Set recipient
	if err := client.Rcpt(toEmail); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	// Send message
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %w", err)
	}

	_, err = w.Write(message)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close writer: %w", err)
	}

	return nil
}

// buildPasswordResetEmailHTML creates the HTML email body
func (s *EmailService) buildPasswordResetEmailHTML(resetLink string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1f2937; 
            background-color: #f9fafb;
            padding: 20px;
        }
        .email-wrapper { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #7c2d12 0%%, #991b1b 100%%);
            color: white; 
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .content { 
            padding: 40px 30px;
            background-color: #ffffff;
        }
        .content h2 { 
            color: #7c2d12;
            margin: 0 0 20px 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content p { 
            color: #4b5563;
            margin-bottom: 16px;
            font-size: 15px;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .button { 
            display: inline-block; 
            padding: 16px 48px; 
            background: linear-gradient(135deg, #7c2d12 0%%, #991b1b 100%%);
            color: white !important; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(124, 45, 18, 0.3);
            transition: all 0.3s ease;
        }
        .button:hover {
            box-shadow: 0 6px 16px rgba(124, 45, 18, 0.4);
            transform: translateY(-2px);
        }
        .divider {
            margin: 30px 0;
            text-align: center;
            color: #9ca3af;
            font-size: 13px;
        }
        .link-container {
            margin: 20px 0;
        }
        .link-box { 
            word-break: break-all; 
            color: #7c2d12;
            font-size: 13px;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            padding: 15px;
            border-radius: 8px;
            width: 100%%;
            cursor: text;
            user-select: all;
            -webkit-user-select: all;
            -moz-user-select: all;
            -ms-user-select: all;
        }
        .link-box:hover {
            background-color: #fee2e2;
            border-color: #fca5a5;
        }

        .warning-box { 
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .warning-box strong {
            color: #92400e;
            display: block;
            margin-bottom: 4px;
        }
        .warning-box p {
            color: #78350f;
            margin: 0;
            font-size: 14px;
        }
        .info-box {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .info-box p {
            color: #6b7280;
            margin: 0;
            font-size: 14px;
        }
        .footer { 
            text-align: center; 
            padding: 30px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #9ca3af;
            font-size: 13px;
            margin: 8px 0;
        }
        .footer .brand {
            color: #7c2d12;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <h1>CarJai</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your CarJai account. Click the button below to create a new password:</p>
            
            <div class="button-container">
                <a href="%s" class="button">Reset Password</a>
            </div>
            
            <div class="divider">or copy this link</div>
            
            <div class="link-container">
                <div class="link-box" title="Click to select, then copy">
                    %s
                </div>
            </div>
            
            <div class="warning-box">
                <strong>⏰ Time Sensitive</strong>
                <p>This link will expire in 30 minutes for security reasons.</p>
            </div>
            
            <div class="info-box">
                <p><strong>Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
        <div class="footer">
            <p class="brand">CarJai</p>
            <p>Thailand's Trusted Second-Hand Car Marketplace</p>
            <p>© 2024 CarJai. All rights reserved.</p>
            <p style="margin-top: 15px; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `, resetLink, resetLink)
}
