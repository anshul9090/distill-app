using Summarizer.Domain.Entities;

public class Summary
{
    public int Id { get; set; }

    public string OriginalText { get; set; } = string.Empty;

    public string SummaryText { get; set; } = string.Empty;

    public string Language { get; set; } = string.Empty;

    public string InputType { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int UserId { get; set; }   // Foreign Key

    // Navigation
    public User User { get; set; }
}