using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace Summarizer.Infrastructure.Email
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        public async Task SendOtpEmailAsync(string toEmail, string otpCode)
        {
            var apiKey = _configuration["RESEND_API_KEY"]
    ?? _configuration["EmailSettings__AppPassword"];

            var payload = new
            {
                from = "onboarding@resend.dev",
                to = toEmail,
                subject = "Your OTP - DISTILL",
                html = $@"<html><body>
                    <h2>Email Verification</h2>
                    <p>Your OTP code is:</p>
                    <h1 style='color:#667eea;letter-spacing:8px'>{otpCode}</h1>
                    <p>This code expires in <b>10 minutes</b>.</p>
                    </body></html>"
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);
            var body = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"Resend response: {response.StatusCode} - {body}");

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Email failed: {body}");
        }
    }
}