using Microsoft.VisualBasic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Summarizer.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public int RoleId { get; set; }   // Foreign Key

        public bool IsDeleted { get; set; }

        // Navigation Properties
        public Role Role { get; set; }

        public List<Summary> Summaries { get; set; } = new List<Summary>();

        public List<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public bool IsVerified { get; set; }
    }
}
