using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Summarizer.Application.Interfaces;
using Summarizer.Domain.Entities;
using Summarizer.Infrastructure.Data;
using Summarizer.Infrastructure.Email;
using Summarizer.Infrastructure.Seed;
using Summarizer.Infrastructure.Services;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── DATABASE ─────────────────────────────────────────────
builder.Services.AddDbContext<SummarizerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── SERVICES ──────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddHttpClient<ISummaryService, GeminiService>();
builder.Services.AddScoped<PdfExtractorService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddHttpClient<UrlExtractorService>();
builder.Services.AddScoped<ImageExtractorService>();
builder.Services.AddScoped<PdfGeneratorService>();

// ── RATE LIMITING ─────────────────────────────────────────
// Install: dotnet add package AspNetCoreRateLimit
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.EnableEndpointRateLimiting = true;
    options.StackBlockedRequests = false;
    options.GeneralRules = new List<RateLimitRule>
    {
        // Max 10 summarize calls per minute per IP
        new RateLimitRule
        {
            Endpoint = "POST:/api/summary/summarize",
            Limit = 10,
            Period = "1m"
        },
        new RateLimitRule
        {
            Endpoint = "POST:/api/summary/summarize-pdf",
            Limit = 10,
            Period = "1m"
        },
        new RateLimitRule
        {
            Endpoint = "POST:/api/summary/summarize-url",
            Limit = 10,
            Period = "1m"
        },
        new RateLimitRule
        {
            Endpoint = "POST:/api/summary/summarize-image",
            Limit = 10,
            Period = "1m"
        },
        // Max 5 login attempts per minute per IP
        new RateLimitRule
        {
            Endpoint = "POST:/api/auth/login",
            Limit = 5,
            Period = "1m"
        },
        // Max 3 OTP sends per 5 minutes per IP
        new RateLimitRule
        {
            Endpoint = "POST:/api/otp/send",
            Limit = 3,
            Period = "5m"
        }
    };
});
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddInMemoryRateLimiting();

// ── JWT ───────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

// ── ENCODING (PDF fonts) ──────────────────────────────────
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

// ── CONTROLLERS + SWAGGER ────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ── CORS ──────────────────────────────────────────────────
var allowedOrigins = builder.Environment.IsDevelopment()
    ? new[] { "http://localhost:4200" }
    : new[] { "https://YOUR-PRODUCTION-DOMAIN.com" }; // ← replace before deploying

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── SWAGGER ───────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.OperationFilter<SwaggerFileOperationFilter>();
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id   = "Bearer"
            }
        },
        new string[] {}
    }});
});

var app = builder.Build();

// ── MIGRATIONS + SEEDER ────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SummarizerDbContext>();
    await db.Database.MigrateAsync(); // ← creates all tables first
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}
// ── MIDDLEWARE PIPELINE ───────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// HSTS for production
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseIpRateLimiting(); // ← must be before UseCors
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

// ── SWAGGER HELPER ────────────────────────────────────────
public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var fileParams = context.MethodInfo.GetParameters()
            .Where(p => p.ParameterType == typeof(IFormFile));

        if (!fileParams.Any()) return;

        operation.RequestBody = new OpenApiRequestBody
        {
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = new Dictionary<string, OpenApiSchema>
                        {
                            ["file"] = new OpenApiSchema { Type = "string", Format = "binary" },
                            ["language"] = new OpenApiSchema { Type = "string" },
                            ["length"] = new OpenApiSchema { Type = "string" }
                        }
                    }
                }
            }
        };
    }
}