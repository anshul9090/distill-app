using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            var fromEmail = _configuration["EmailSettings:FromEmail"]
                ?? _configuration["EmailSettings__FromEmail"]
                ?? "bhapkaanshul@gmail.com";
            var fromName = _configuration["EmailSettings:FromName"]
                ?? _configuration["EmailSettings__FromName"]
                ?? "DISTILL";
            var smtpHost = _configuration["EmailSettings:SmtpHost"]
                ?? _configuration["EmailSettings__SmtpHost"]
                ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]
                ?? _configuration["EmailSettings__SmtpPort"]
                ?? "587");
            var appPassword = _configuration["EmailSettings:AppPassword"]
                ?? _configuration["EmailSettings__AppPassword"]
                ?? "";

            var smtpClient = new SmtpClient(smtpHost)
            {
                Port = smtpPort,
                Credentials = new NetworkCredential(fromEmail, appPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail!, fromName),
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
            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}
