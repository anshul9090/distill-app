using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Summarizer.Application.DTOs
{
    public class SummaryRequest
    {
        public string? InputType { get; set; }  // "Text", "PDF", "Image", "URL"
        public string? Content { get; set; }    // actual text or URL
        public string? Language { get; set; }   // "English", "Hindi", "Spanish" etc
        public string? Length { get; set; }     // "Short", "Medium", "Large"
        public string? Format { get; set; }

    }
}
