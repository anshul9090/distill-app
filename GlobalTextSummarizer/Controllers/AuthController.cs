using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Summarizer.Application.DTOs;
using Summarizer.Application.Interfaces;
using Summarizer.Infrastructure.Services;

namespace GlobalTextSummarizer.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController:ControllerBase
        
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authservice)
        {
            _authService = authservice;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var result = await _authService.Register(request);
            return Ok(result);
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var result = await _authService.Login(request);
            return Ok(result);
        }
        [HttpPost("refreshtoken")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
        {
            var result = await _authService.RefreshToken(request);
            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            await _authService.LogoutAsync(request.Token!);
            return Ok(new { message = "Logged out successfully" });
        }
    }
}