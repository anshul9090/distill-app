using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace Summarizer.Application.DTOs
{
    public class GeneratePdfRequest
    {
        public string Summary { get; set; } = string.Empty;
        public string InputType { get; set; } = "Text";
        public string Language { get; set; } = "English";
    }
}