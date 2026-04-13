using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Summarizer.Domain.Entities;
using Summarizer.Infrastructure.Data;
using Summarizer.Infrastructure.Email;

namespace Summarizer.Infrastructure.Services
{
    public class OtpService
    {
        private readonly SummarizerDbContext _dbContext;
        private readonly EmailService _emailService;

        public OtpService(SummarizerDbContext dbContext, EmailService emailService)
        {
            _dbContext = dbContext;
            _emailService = emailService;
        }

        public async Task SendOtpAsync(string email)
        {
            // Generate 6 digit OTP
            var otpCode = new Random().Next(100000, 999999).ToString();

            // Save to database
            var otp = new OtpVerification
            {
                Email = email,
                OtpCode = otpCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false
            };

            await _dbContext.OtpVerifications.AddAsync(otp);
            await _dbContext.SaveChangesAsync();

            // Send email
            await _emailService.SendOtpEmailAsync(email, otpCode);
        }

        public async Task<bool> VerifyOtpAsync(string email, string otpCode)
        {
            var otp = await _dbContext.OtpVerifications
                .Where(o => o.Email == email
                    && o.OtpCode == otpCode
                    && o.IsUsed == false
                    && o.ExpiryTime > DateTime.UtcNow)
                .OrderByDescending(o => o.ExpiryTime)
                .FirstOrDefaultAsync();

            if (otp == null) return false;

            // Mark as used
            otp.IsUsed = true;
            _dbContext.OtpVerifications.Update(otp);

            // Mark user as verified
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user != null)
            {
                user.IsVerified = true;
                _dbContext.Users.Update(user);
            }

            await _dbContext.SaveChangesAsync();
            return true;
        }
    }
}