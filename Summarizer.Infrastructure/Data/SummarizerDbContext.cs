using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Summarizer.Domain.Entities;

namespace Summarizer.Infrastructure.Data
{
    public class SummarizerDbContext : DbContext
    {
        public SummarizerDbContext (DbContextOptions<SummarizerDbContext> options) : base(options)
        {

        }
        public DbSet<User> Users {  get; set; }

        public DbSet<Role> Roles { get; set; }
        public DbSet<Summary> Summaries { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<OtpVerification> OtpVerifications { get; set; }

    }
}
