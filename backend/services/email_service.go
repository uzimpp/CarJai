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

// ValidateConfig checks if SMTP configuration is complete
func (s *EmailService) ValidateConfig() error {
	if s.smtpHost == "" {
		return fmt.Errorf("SMTP_HOST is not configured")
	}
	if s.smtpPort == "" {
		return fmt.Errorf("SMTP_PORT is not configured")
	}
	if s.smtpUsername == "" {
		return fmt.Errorf("SMTP_USERNAME is not configured")
	}
	if s.smtpPassword == "" {
		return fmt.Errorf("SMTP_PASSWORD is not configured")
	}
	if s.smtpFrom == "" {
		return fmt.Errorf("SMTP_FROM is not configured")
	}
	return nil
}

// TestConnection tests SMTP connection and authentication
func (s *EmailService) TestConnection() error {
	if err := s.ValidateConfig(); err != nil {
		return err
	}

	addr := s.smtpHost + ":" + s.smtpPort
	client, err := smtp.Dial(addr)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer client.Quit()

	// Use secure TLS configuration (CodeQL compliant)
	tlsConfig := &tls.Config{
		ServerName: s.smtpHost,
		MinVersion: tls.VersionTLS12, // Enforce TLS 1.2 minimum
	}
	if err := client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("failed to start TLS: %w", err)
	}

	auth := smtp.PlainAuth("", s.smtpUsername, s.smtpPassword, s.smtpHost)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP authentication failed: %w", err)
	}

	return nil
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
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Your Password - CarJai</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            padding: 40px 30px 30px;
            text-align: center;
            background-color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: #7c2d12;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 0 40px 40px;
            background-color: #ffffff;
            text-align: center;
        }
        .content h2 {
            color: #1f2937;
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 600;
            line-height: 1.3;
        }
        .content p {
            color: #4b5563;
            margin-bottom: 32px;
            font-size: 15px;
            line-height: 1.6;
        }
        .button-container {
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #7c2d12;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            line-height: 1.5;
        }
        .security-note {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
        }
        .security-note p {
            color: #6b7280;
            margin: 0;
            font-size: 13px;
            line-height: 1.6;
        }
        .expiry-note {
            color: #6b7280;
            font-size: 13px;
            margin-top: 24px;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            .content {
                padding: 0 24px 32px;
            }
            .header {
                padding: 32px 24px 24px;
            }
            .button {
                display: block;
                width: 100%%;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <h1>CarJai</h1>
        </div>
        <div class="content">
            <h2>Password Reset</h2>
            <p>If you've lost your password or wish to reset it, use the link below to get started.</p>
            
            <div class="button-container">
                <a href="%s" class="button" style="color: #ffffff;">Reset Your Password</a>
            </div>
            
            <p class="expiry-note">This link will expire in 30 minutes.</p>
            
            <div class="security-note">
                <p>If you did not request a password reset, you can safely ignore this email. Only a person with access to your email can reset your account password.</p>
            </div>
        </div>
    </div>
</body>
</html>`, resetLink)
}
