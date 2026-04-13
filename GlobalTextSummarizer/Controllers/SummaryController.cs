using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Summarizer.Application.DTOs;
using Summarizer.Application.Interfaces;
using Summarizer.Infrastructure.Services;
using System.Security.Claims;

namespace GlobalTextSummarizer.Controllers
{
    [ApiController]
    [Route("api/summary")]
    [Authorize]
    public class SummaryController : ControllerBase
    {
        private readonly ISummaryService _summaryService;

        public SummaryController(ISummaryService summaryService)
        {
            _summaryService = summaryService;
        }

        [HttpPost("summarize")]
        public async Task<IActionResult> Summarize(SummaryRequest request)
        {
            // Get userId from JWT token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userIdClaim == null)
            {
                return Unauthorized("User not found in token");
            }

            var userId = int.Parse(userIdClaim);
            var result = await _summaryService.SummarizeAsync(request, userId);
            return Ok(result);
        }
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            var userId = int.Parse(userIdClaim);
            var result = await _summaryService.GetHistoryAsync(userId);
            return Ok(result);
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSummary(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var userId = int.Parse(userIdClaim);
            await _summaryService.DeleteSummaryAsync(id, userId);
            return Ok();
        }
        [HttpDelete("clear-all")]
        public async Task<IActionResult> ClearAll()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var userId = int.Parse(userIdClaim);
            await _summaryService.ClearAllSummariesAsync(userId);
            return Ok();
        }
        [HttpPost("summarize-pdf")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SummarizePdf([FromForm] PdfSummaryRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            // ← Add validation here
            if (request.File == null || request.File.Length == 0)
                return BadRequest("Please upload a valid PDF file!");

            // Max 5MB
            if (request.File.Length > 5 * 1024 * 1024)
                return BadRequest("PDF size must be less than 5MB!");

            // Must be PDF
            if (!request.File.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only PDF files are allowed!");

            var userId = int.Parse(userIdClaim);

            using var memoryStream = new MemoryStream();
            await request.File.CopyToAsync(memoryStream);
            var pdfBytes = memoryStream.ToArray();

            var pdfExtractor = HttpContext.RequestServices
                .GetRequiredService<PdfExtractorService>();
            var extractedText = pdfExtractor.ExtractTextFromPdf(pdfBytes);

            // Truncate if too long
            if (extractedText.Length > 8000)
                extractedText = extractedText.Substring(0, 8000);

            if (string.IsNullOrEmpty(extractedText))
                return BadRequest("Could not extract text from PDF!");

            var summaryRequest = new SummaryRequest
            {
                InputType = "PDF",
                Content = extractedText,
                Language = request.Language,
                Length = request.Length,
                Format = request.Format
            };

            var result = await _summaryService.SummarizeAsync(summaryRequest, userId);
            return Ok(result);
        }
        [HttpPost("summarize-url")]
        public async Task<IActionResult> SummarizeUrl([FromBody] SummaryRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            // ← Add validation here
            if (string.IsNullOrEmpty(request.Content))
                return BadRequest("Please enter a URL!");

            if (!Uri.TryCreate(request.Content, UriKind.Absolute, out var uri) ||
                (uri.Scheme != "http" && uri.Scheme != "https"))
                return BadRequest("Please enter a valid URL starting with http:// or https://");

            var userId = int.Parse(userIdClaim);

            var urlExtractor = HttpContext.RequestServices
                .GetRequiredService<UrlExtractorService>();

            var extractedText = await urlExtractor
                .ExtractTextFromUrlAsync(request.Content!);

            if (string.IsNullOrEmpty(extractedText))
                return BadRequest("Could not extract text from URL!");

            request.InputType = "URL";
            request.Content = extractedText;

            var result = await _summaryService.SummarizeAsync(request, userId);
            return Ok(result);
        }
        public class PdfSummaryRequest
        {
            public IFormFile File { get; set; } = null!;
            public string Language { get; set; } = "English";
            public string Length { get; set; } = "Short";
            public string Format { get; set; } = "Paragraph";
        }
        [HttpPost("summarize-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SummarizeImage(
    [FromForm] ImageSummaryRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            // Validation
            if (request.File == null || request.File.Length == 0)
                return BadRequest("Please upload a valid image!");

            // Max 10MB for images
            if (request.File.Length > 10 * 1024 * 1024)
                return BadRequest("Image size must be less than 10MB!");

            var imageExtractor = HttpContext.RequestServices
                .GetRequiredService<ImageExtractorService>();

            if (!imageExtractor.IsValidImageFormat(request.File.FileName))
                return BadRequest("Supported formats: jpg, jpeg, png, bmp, tiff, webp!");

            var userId = int.Parse(userIdClaim);

            using var memoryStream = new MemoryStream();
            await request.File.CopyToAsync(memoryStream);
            var imageBytes = memoryStream.ToArray();

            // Extract text from image
            var extractedText = imageExtractor.ExtractTextFromImage(imageBytes);

            // Validation - no text found
            if (string.IsNullOrEmpty(extractedText))
                return BadRequest(new
                {
                    message = "No text found in image! Please upload an image containing text."
                });

            // Truncate if too long
            if (extractedText.Length > 8000)
                extractedText = extractedText.Substring(0, 8000);

            var summaryRequest = new SummaryRequest
            {
                InputType = "Image",
                Content = extractedText,
                Language = request.Language,
                Length = request.Length,
                Format = request.Format
            };

            var result = await _summaryService.SummarizeAsync(summaryRequest, userId);
            return Ok(result);
        }
        [HttpPost("generate-pdf")]
        public IActionResult GeneratePdf([FromBody] GeneratePdfRequest request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null)
                return Unauthorized();

            if (string.IsNullOrEmpty(request.Summary))
                return BadRequest("Summary is required!");

            var pdfService = HttpContext.RequestServices
                .GetRequiredService<Summarizer.Infrastructure.Services.PdfGeneratorService>();

            var pdfBytes = pdfService.GenerateSummaryPdf(
                request.Summary,
                request.InputType,
                request.Language
            );

            return File(pdfBytes, "application/pdf", "summary.pdf");
        }
        public class ImageSummaryRequest
        {
            public IFormFile File { get; set; } = null!;
            public string Language { get; set; } = "English";
            public string Length { get; set; } = "Short";
            public string Format { get; set; } = "Paragraph";
        }

    }
}