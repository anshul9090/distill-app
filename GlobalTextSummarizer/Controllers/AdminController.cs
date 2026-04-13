using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Summarizer.Infrastructure.Data;

namespace GlobalTextSummarizer.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly SummarizerDbContext _context;

        public AdminController(SummarizerDbContext context)
        {
            _context = context;
        }

        // ✅ GET ALL USERS
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.RoleId,
                    u.CreatedAt,
                    u.IsDeleted
                })
                .ToListAsync();

            return Ok(users);
        }

        // ✅ GET ALL SUMMARIES
        [HttpGet("summaries")]
        public async Task<IActionResult> GetSummaries()
        {
            var summaries = await _context.Summaries
                .Include(s => s.User)
                .OrderByDescending(s => s.CreatedAt)
                .Take(100)
                .Select(s => new
                {
                    s.Id,
                    s.InputType,
                    s.SummaryText,
                    s.CreatedAt,
                    UserEmail = s.User.Email
                })
                .ToListAsync();
            return Ok(summaries);
        }

        // ✅ DELETE USER (SOFT DELETE)
        [HttpDelete("user/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            user.IsDeleted = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }

        // ✅ RESTORE USER
        [HttpPut("restore-user/{id}")]
        public async Task<IActionResult> RestoreUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound();

            user.IsDeleted = false;

            await _context.SaveChangesAsync();

            return Ok(new { message = "User restored successfully" });
        }
    }
}