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
            try
            {
                var result = await _authService.Register(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database connection unavailable", detail = ex.Message });
            }
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            try
            {
                var result = await _authService.Login(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database connection unavailable", detail = ex.Message });
            }
        }
        [HttpPost("refreshtoken")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
        {
            try
            {
                var result = await _authService.RefreshToken(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database connection unavailable", detail = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            try
            {
                await _authService.LogoutAsync(request.Token!);
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Database connection unavailable", detail = ex.Message });
            }
        }
    }
}