using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Summarizer.Application.DTOs;
using Summarizer.Application.Interfaces;
using Summarizer.Domain.Entities;
using Summarizer.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Summarizer.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly SummarizerDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _configuration;
        private readonly OtpService _otpService;

        public AuthService(
            SummarizerDbContext dbContext,
            IPasswordHasher<User> passwordHasher,
            IConfiguration configuration,
            OtpService otpService)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
            _otpService = otpService;
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role!.RoleName)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    Convert.ToDouble(jwtSettings["ExpiryMinutes"])),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(64)
            );
        }

        // 🔐 REGISTER
        public async Task<AuthResponse> Register(RegisterRequest request)
        {
            var existingUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
                throw new Exception("User already exists");

            var user = new User
            {
                Name = request.Name!,
                Email = request.Email!,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,
                IsVerified = true, // ← auto-verify for demo
                RoleId = 2
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password!);

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();

            await _dbContext.Entry(user)
                .Reference(u => u.Role)
                .LoadAsync();

            // await _otpService.SendOtpAsync(request.Email!); ← disabled for demo

            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                AccessToken = token,
                RefreshToken = "pending",
                ExpiryDate = DateTime.UtcNow.AddMinutes(60)
            };
        }

        // 🔐 LOGIN
        public async Task<AuthResponse> Login(LoginRequest request)
        {
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                throw new Exception("User not found");

            if (user.IsDeleted)
                throw new Exception("Account has been deactivated. Contact support.");

            if (!user.IsVerified)
                throw new Exception("Please verify your email first!");

            var result = _passwordHasher.VerifyHashedPassword(
                user, user.PasswordHash, request.Password!);

            if (result == PasswordVerificationResult.Failed)
                throw new Exception("Invalid password");

            await _dbContext.Entry(user).Reference(u => u.Role).LoadAsync();

            var token = GenerateJwtToken(user);

            var refreshToken = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
                UserId = user.Id
            };

            await _dbContext.RefreshTokens.AddAsync(refreshToken);
            await _dbContext.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = token,
                RefreshToken = refreshToken.Token,
                ExpiryDate = DateTime.UtcNow.AddMinutes(20)
            };
        }

        // 🔐 LOGOUT
        public async Task LogoutAsync(string refreshToken)
        {
            var token = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == refreshToken);

            if (token != null && !token.IsRevoked)
            {
                token.IsRevoked = true;
                await _dbContext.SaveChangesAsync();
            }
        }

        // 🔄 REFRESH TOKEN
        public async Task<AuthResponse> RefreshToken(RefreshTokenRequest request)
        {
            var storedToken = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(t => t.Token == request.Token);

            if (storedToken == null)
                throw new Exception("Token not found");

            if (storedToken.ExpiryDate < DateTime.UtcNow)
                throw new Exception("Token expired");

            if (storedToken.IsRevoked)
                throw new Exception("Token revoked");

            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == storedToken.UserId);

            if (user == null)
                throw new Exception("User not found");

            await _dbContext.Entry(user)
                .Reference(u => u.Role)
                .LoadAsync();

            storedToken.IsRevoked = true;

            var newJwt = GenerateJwtToken(user);

            var newRefresh = new RefreshToken
            {
                Token = GenerateRefreshToken(),
                ExpiryDate = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
                UserId = user.Id
            };

            await _dbContext.RefreshTokens.AddAsync(newRefresh);
            await _dbContext.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = newJwt,
                RefreshToken = newRefresh.Token,
                ExpiryDate = DateTime.UtcNow.AddMinutes(60)
            };
        }
    }
}