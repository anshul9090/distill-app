using Microsoft.AspNetCore.Identity;
using Summarizer.Domain.Entities;
using Summarizer.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Summarizer.Domain.Entities;
using Summarizer.Infrastructure.Data;

namespace Summarizer.Infrastructure.Seed
    {
        public class DatabaseSeeder
        {
            private readonly SummarizerDbContext _dbContext;
            private readonly IPasswordHasher<User> _passwordHasher;

            public DatabaseSeeder(SummarizerDbContext dbContext,
                IPasswordHasher<User> passwordHasher)
            {
                _dbContext = dbContext;
                _passwordHasher = passwordHasher;
            }

            public async Task SeedAsync()
            {
                // Step 1 - Seed Roles
                if (!await _dbContext.Roles.AnyAsync())
                {
                    var roles = new List<Role>
                {
                    new Role { RoleName = "Admin" },
                    new Role { RoleName = "User" }
                };
                    await _dbContext.Roles.AddRangeAsync(roles);
                    await _dbContext.SaveChangesAsync();
                }

                // Step 2 - Seed Admin User
                var adminExists = await _dbContext.Users
                    .AnyAsync(u => u.Email == "admin@globalsummarizer.com");

                if (!adminExists)
                {
                    var adminUser = new User
                    {
                        Name = "Super Admin",
                        Email = "admin@globalsummarizer.com",
                        CreatedAt = DateTime.UtcNow,
                        IsDeleted = false,
                        RoleId = 1,
                        IsVerified = true
                    };

                    adminUser.PasswordHash = _passwordHasher
                        .HashPassword(adminUser, "Admin@123");

                    await _dbContext.Users.AddAsync(adminUser);
                    await _dbContext.SaveChangesAsync();
                }
            }
        }
    }

