 using Summarizer.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Summarizer.Application.Interfaces
{
    public interface ISummaryService
    {
        Task<SummaryResponse> SummarizeAsync(SummaryRequest request, int userId);
        Task<List<SummaryResponse>> GetHistoryAsync(int userId);
        Task DeleteSummaryAsync(int id, int userId);
        Task ClearAllSummariesAsync(int userId);
    }
}
  
