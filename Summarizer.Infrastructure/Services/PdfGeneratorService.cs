using iTextSharp.text;
using iTextSharp.text.pdf;

namespace Summarizer.Infrastructure.Services
{
    public class PdfGeneratorService
    {
        public byte[] GenerateSummaryPdf(string summary, string inputType, string language)
        {
            using var memoryStream = new MemoryStream();

            var document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.GetInstance(document, memoryStream);

            document.Open();

            // 🔥 Select font based on language
            string fontFile = language.ToLower() switch
            {
                "hindi" => "NotoSansDevanagari-Regular.ttf",
                "korean" => "NotoSansKR-Regular.ttf",
                _ => "NotoSans-Regular.ttf"
            };

            var fontPath = Path.Combine(
                AppDomain.CurrentDomain.BaseDirectory,
                "Fonts",
                fontFile
            );

            BaseFont baseFont = BaseFont.CreateFont(
                fontPath,
                BaseFont.IDENTITY_H,
                BaseFont.EMBEDDED
            );

            var titleFont = new Font(baseFont, 18, Font.BOLD);
            var headerFont = new Font(baseFont, 12, Font.BOLD);
            var bodyFont = new Font(baseFont, 11, Font.NORMAL);

            // 🌍 Title (no emoji for compatibility)
            document.Add(new Paragraph("Global Text Summarizer", titleFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 10
            });

            // Divider
            document.Add(new Paragraph("--------------------------------------------------", bodyFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 10
            });

            // 🔥 Get localized labels
            var labels = GetLabels(language);

            // 📄 Metadata
            document.Add(new Paragraph(labels.inputType + ": " + inputType, headerFont)
            {
                SpacingAfter = 5
            });

            document.Add(new Paragraph(labels.language + ": " + language, headerFont)
            {
                SpacingAfter = 5
            });

            document.Add(new Paragraph(
                labels.date + ": " + DateTime.Now.ToString("dd MMM yyyy, hh:mm tt"),
                headerFont)
            {
                SpacingAfter = 10
            });

            // Divider
            document.Add(new Paragraph("--------------------------------------------------", bodyFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 15
            });

            // 🧠 Summary Title
            document.Add(new Paragraph(labels.summary, headerFont)
            {
                SpacingAfter = 8
            });

            // 🔹 Convert summary into bullet points
            var sentences = summary.Split(
                new[] { '.', '!', '?' },
                StringSplitOptions.RemoveEmptyEntries
            );

            var list = new iTextSharp.text.List(iTextSharp.text.List.UNORDERED);

            foreach (var sentence in sentences)
            {
                if (!string.IsNullOrWhiteSpace(sentence))
                {
                    list.Add(new ListItem("• " + sentence.Trim() + ".", bodyFont));
                }
            }

            document.Add(list);

            document.Close();

            return memoryStream.ToArray();
        }

        // 🔥 MULTI-LANGUAGE LABEL SUPPORT
        private (string inputType, string language, string date, string summary) GetLabels(string language)
        {
            switch (language.ToLower())
            {
                case "hindi":
                    return ("इनपुट प्रकार", "भाषा", "तारीख", "सारांश");

                case "korean":
                    return ("입력 유형", "언어", "생성 날짜", "요약");

                case "japanese":
                    return ("入力タイプ", "言語", "生成日", "要約");

                case "arabic":
                    return ("نوع الإدخال", "اللغة", "تاريخ الإنشاء", "الملخص");

                case "french":
                    return ("Type d'entrée", "Langue", "Date de génération", "Résumé");

                case "spanish":
                    return ("Tipo de entrada", "Idioma", "Fecha de generación", "Resumen");

                default:
                    return ("Input Type", "Language", "Generated On", "Summary");
            }
        }
    }
}