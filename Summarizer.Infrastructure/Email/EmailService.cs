using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace Summarizer.Infrastructure.Email
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendOtpEmailAsync(string toEmail, string otpCode)
        {
            var fromEmail = _configuration["EmailSettings__FromEmail"]!;
            var smtpHost = _configuration["EmailSettings__SmtpHost"]!;
            var smtpPort = int.Parse(_configuration["EmailSettings__SmtpPort"] ?? "587");
            var appPassword = _configuration["EmailSettings__AppPassword"]!;

            var smtpClient = new SmtpClient(smtpHost)
            {
                Port = smtpPort,
                Credentials = new NetworkCredential(fromEmail, appPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail),
                Subject = "Your OTP - Global Text Summarizer",
                Body = $@"<html><body>
                    <h2>Email Verification</h2>
                    <p>Your OTP code is:</p>
                    <h1 style='color:#667eea;letter-spacing:8px'>{otpCode}</h1>
                    <p>This code expires in <b>10 minutes</b>.</p>
                    <p>If you didn't request this, ignore this email.</p>
                    </body></html>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);
            Console.WriteLine($"SMTP DEBUG - Host:{smtpHost} Port:{smtpPort} From:{fromEmail} PassLen:{appPassword?.Length}");
            await smtpClient.SendMailAsync(mailMessage);
            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}