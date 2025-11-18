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
func (s *EmailService) SendPasswordResetEmail(toEmail, resetLink string) error {
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

	// TLS config
	tlsConfig := &tls.Config{
		ServerName: s.smtpHost,
	}

	// Connect to SMTP server with TLS
	addr := s.smtpHost + ":" + s.smtpPort
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.smtpHost)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Quit()

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
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #4F46E5; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background-color: #ffffff; padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; }
        .button { 
            display: inline-block; 
            padding: 14px 40px; 
            background-color: #4F46E5; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 25px 0;
            font-weight: bold;
        }
        .link-text { 
            word-break: break-all; 
            color: #4F46E5; 
            font-size: 12px;
            background-color: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
        }
        .warning { 
            background-color: #FEF3C7; 
            border-left: 4px solid #F59E0B; 
            padding: 12px; 
            margin: 20px 0;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
            background-color: #f9fafb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 CarJai</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for your CarJai account.</p>
            <p>Click the button below to create a new password:</p>
            <div style="text-align: center;">
                <a href="%s" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <div class="link-text">%s</div>
            <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 30 minutes for security reasons.
            </div>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            <p>© 2024 CarJai. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `, resetLink, resetLink)
}
