using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;

namespace Summarizer.Infrastructure.Services
{
    public class PdfExtractorService
    {
        public string ExtractTextFromPdf(byte[] pdfBytes)
        {
            var text = new System.Text.StringBuilder();

            using var reader = new PdfReader(pdfBytes);

            for (int page = 1; page <= reader.NumberOfPages; page++)
            {
                var strategy = new SimpleTextExtractionStrategy();
                var pageText = PdfTextExtractor.GetTextFromPage(reader, page, strategy);
                text.AppendLine(pageText);
            }

            return text.ToString();
        }
    }
}