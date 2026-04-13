using Summarizer.Domain.Entities;
using Summarizer.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Summarizer.Application.Interfaces
{
    public interface IAuthService
    {
        Task LogoutAsync(string refreshToken);
        Task<AuthResponse> Register(RegisterRequest request);
        Task<AuthResponse> Login(LoginRequest request);
        Task<AuthResponse> RefreshToken(RefreshTokenRequest request);
    }
}
