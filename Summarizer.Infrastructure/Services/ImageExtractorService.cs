
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Tesseract;

namespace Summarizer.Infrastructure.Services
{
    public class ImageExtractorService
    {
        private readonly string _tessDataPath;

        public ImageExtractorService()
        {
            _tessDataPath = Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory, "tessdata");
        }

        public string ExtractTextFromImage(byte[] imageBytes, string language = "eng")
        {
            try
            {
                using var engine = new TesseractEngine(
                    _tessDataPath, language, EngineMode.Default);

                using var img = Pix.LoadFromMemory(imageBytes);
                using var page = engine.Process(img);

                var text = page.GetText().Trim();

                if (string.IsNullOrEmpty(text))
                    return string.Empty;

                return text;
            }
            catch (Exception ex)
            {
                throw new Exception($"Image text extraction failed: {ex.Message}");
            }
        }

        public bool IsValidImageFormat(string fileName)
        {
            var validExtensions = new[]
            {
                ".jpg", ".jpeg", ".png", ".bmp",
                ".tiff", ".tif", ".webp", ".img"
            };

            var extension = Path.GetExtension(fileName)
                .ToLowerInvariant();

            return validExtensions.Contains(extension);
        }
    }
}