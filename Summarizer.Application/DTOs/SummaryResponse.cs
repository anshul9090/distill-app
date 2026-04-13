using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Summarizer.Application.DTOs
{
    public class SummaryResponse
    {
        public string? SummaryText { get; set; }
        public int Id { get; set; }
        public string? Language { get; set; }
        public string? InputType { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
