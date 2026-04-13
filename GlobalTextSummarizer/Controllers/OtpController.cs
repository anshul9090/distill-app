using Microsoft.AspNetCore.Mvc;
using Summarizer.Infrastructure.Services;

namespace GlobalTextSummarizer.Controllers
{
    [ApiController]
    [Route("api/otp")]
    public class OtpController : ControllerBase
    {
        private readonly OtpService _otpService;

        public OtpController(OtpService otpService)
        {
            _otpService = otpService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendOtp([FromBody] string email)
        {
            await _otpService.SendOtpAsync(email);
            return Ok(new { message = "OTP sent successfully!" });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var result = await _otpService.VerifyOtpAsync(request.Email, request.OtpCode);

            if (result)
                return Ok(new { message = "Email verified successfully!" });
            else
                return BadRequest(new { message = "Invalid or expired OTP!" });
        }
    }

    public class VerifyOtpRequest
    {
        public string? Email { get; set; }
        public string? OtpCode { get; set; }
    }
}