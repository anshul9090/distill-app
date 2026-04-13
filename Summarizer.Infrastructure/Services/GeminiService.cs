using Microsoft.Extensions.Configuration;
using Summarizer.Application.DTOs;
using Summarizer.Application.Interfaces;
using Summarizer.Domain.Entities;
using Summarizer.Infrastructure.Data;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Summarizer.Infrastructure.Services
{
    public class GeminiService : ISummaryService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly SummarizerDbContext _dbContext;

        public GeminiService(HttpClient httpClient,
            IConfiguration configuration,
            SummarizerDbContext dbContext)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        public async Task<SummaryResponse> SummarizeAsync(
            SummaryRequest request, int userId)
        {
            var apiKey = _configuration["GroqSettings:ApiKey"];
            var model = _configuration["GroqSettings:Model"];
            var url = "https://api.groq.com/openai/v1/chat/completions";

            var prompt = BuildPrompt(request);

            var requestBody = new
            {
                model = model,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = prompt
                    }
                },
                temperature = 0.7
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Groq needs Authorization header
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add(
                "Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsync(url, content);
            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);



            var summaryText = doc.RootElement

                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            var summary = new Summary
            {
                OriginalText = request.Content!,
                SummaryText = summaryText!,
                Language = request.Language!,
                InputType = request.InputType!,
                CreatedAt = DateTime.UtcNow,
                UserId = userId
            };

            await _dbContext.Summaries.AddAsync(summary);
            await _dbContext.SaveChangesAsync();

            return new SummaryResponse
            {
                SummaryText = summaryText,
                Language = request.Language,
                InputType = request.InputType,
                CreatedAt = DateTime.UtcNow
            };
        }
        public async Task<List<SummaryResponse>> GetHistoryAsync(int userId)
        {
            var summaries = await _dbContext.Summaries
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return summaries.Select(s => new SummaryResponse
            {
                Id = s.Id,
                SummaryText = s.SummaryText,
                Language = s.Language,
                InputType = s.InputType,
                CreatedAt = s.CreatedAt
            }).ToList();
        }
        public async Task DeleteSummaryAsync(int id, int userId)
        {
            var summary = await _dbContext.Summaries
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (summary != null)
            {
                _dbContext.Summaries.Remove(summary);
                await _dbContext.SaveChangesAsync();
            }
        }
        public async Task ClearAllSummariesAsync(int userId)
        {
            var summaries = await _dbContext.Summaries
                .Where(s => s.UserId == userId)
                .ToListAsync();

            _dbContext.Summaries.RemoveRange(summaries);
            await _dbContext.SaveChangesAsync();
        }


        private string BuildPrompt(SummaryRequest request)
        {
            var lengthInstruction = request.Length switch
            {
                "Short" => "in 2-3 sentences",
                "Medium" => "in 1-2 paragraphs",
                "Long" => "in detail covering all main points",
                _ => "in 2-3 sentences"
            };

            var formatInstruction = request.Format switch
            {
                "Bullets" => "Format the summary as clean bullet points. Each point should start with • symbol.",
                _ => "Format the summary as a well-written paragraph."
            };

            return $@"Please summarize the following content {lengthInstruction} in {request.Language} language.

{formatInstruction}

Content:
{request.Content}

Important Rules:
- Respond ONLY in {request.Language} language
- Keep the summary {request.Length}
- Follow the format instruction strictly
- Be clear and accurate";
        }
    }
}