using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using HtmlAgilityPack;

namespace Summarizer.Infrastructure.Services
{
    public class UrlExtractorService
    {
        private readonly HttpClient _httpClient;

        public UrlExtractorService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> ExtractTextFromUrlAsync(string url)
        {
            // Add browser-like headers to avoid 403
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Add("Accept",
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");

            var html = await _httpClient.GetStringAsync(url);
         

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Remove script and style tags
            var scripts = doc.DocumentNode
                .SelectNodes("//script|//style");
            if (scripts != null)
            {
                foreach (var script in scripts)
                    script.Remove();
            }

            // Extract text from paragraphs
            var paragraphs = doc.DocumentNode
                .SelectNodes("//p|//h1|//h2|//h3|//article");

            if (paragraphs == null)
                return doc.DocumentNode.InnerText;

            var text = string.Join(" ",
                paragraphs.Select(p => p.InnerText.Trim())
                          .Where(t => t.Length > 20));
            var finalText = text.Length > 8000
                            ? text.Substring(0, 8000)
    :                         text;

            return finalText;

            return text;
        }
    }
}