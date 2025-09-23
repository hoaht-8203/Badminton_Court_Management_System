using System.Security.Claims;
using System.Text;
using System.Text.Json;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Mappings;
using ApiApplication.Middlewares;
using ApiApplication.Options;
using ApiApplication.Processors;
using ApiApplication.Processors.Impl;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using ApiApplication.Sessions.Impl;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Minio;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.JwtOptionsKey));
builder.Services.Configure<EmailOptions>(
    builder.Configuration.GetSection(EmailOptions.EmailOptionsKey)
);

builder
    .Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(opt =>
    {
        opt.Password.RequireDigit = false;
        opt.Password.RequireLowercase = false;
        opt.Password.RequireNonAlphanumeric = false;
        opt.Password.RequireUppercase = false;
        opt.Password.RequiredLength = 8;
        opt.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddDbContext<ApplicationDbContext>(opt =>
{
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DbConnectionString"));
});

builder.Services.AddScoped<IAuthTokenProcessor, AuthTokenProcessor>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IActivityHelperService, ActivityHelperService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IShiftService, ShiftService>();
builder.Services.AddScoped<ISalaryFormService, SalaryFormService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IStorageService, MinioStorageService>();
builder.Services.AddScoped<ICourtService, CourtService>();
builder.Services.AddScoped<ICourtAreaService, CourtAreaService>();
builder.Services.AddScoped<IPriceUnitService, PriceUnitService>();

builder.Services.AddAutoMapper(config => config.AddProfile<UserMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<RoleMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<AuthMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<ActivityMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<CustomerMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<ScheduleMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<StaffMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<SalaryFormMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<ShiftMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<UserMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<RoleMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<SupplierMappingProfile>());
builder.Services.Configure<MinioOptions>(
    builder.Configuration.GetSection(MinioOptions.MinioOptionsKey)
);
builder.Services.AddAutoMapper(config => config.AddProfile<CourtMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<CourtAreaMappingProfile>());
builder.Services.AddAutoMapper(config => config.AddProfile<PriceUnitMappingProfile>());

// MinIO client
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<MinioOptions>>().Value;
    var client = new MinioClient()
        .WithEndpoint(opts.Endpoint, opts.Port)
        .WithCredentials(opts.AccessKey, opts.SecretKey);
    if (opts.UseSSL)
    {
        client = client.WithSSL();
    }
    return client.Build();
});

builder
    .Services.AddAuthentication(opt =>
    {
        opt.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        opt.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        opt.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var jwtOptions =
            builder.Configuration.GetSection(JwtOptions.JwtOptionsKey).Get<JwtOptions>()
            ?? throw new ArgumentException(nameof(JwtOptions));

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["ACCESS_TOKEN"];
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                // Enforce security stamp matching to force logout when password changes
                var userManager = context.HttpContext.RequestServices.GetRequiredService<
                    UserManager<ApplicationUser>
                >();
                var db =
                    context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();

                var principal = context.Principal;
                var userId = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tokenStamp = principal?.FindFirst("security_stamp")?.Value;
                if (userId == null || tokenStamp == null)
                {
                    context.Fail("Invalid token claims.");
                    return;
                }

                var userGuid = Guid.Parse(userId);
                var user = await db.ApplicationUsers.FindAsync(userGuid);
                if (
                    user == null
                    || string.IsNullOrEmpty(user.SecurityStamp)
                    || !string.Equals(user.SecurityStamp, tokenStamp, StringComparison.Ordinal)
                )
                {
                    context.Fail("Security stamp mismatch.");
                    return;
                }
            },
            OnChallenge = async context =>
            {
                // Skip the default behavior that adds the WWW-Authenticate header and ends the response
                context.HandleResponse();

                var response = context.Response;
                response.StatusCode = StatusCodes.Status401Unauthorized;
                response.ContentType = "application/json";

                var payload = System.Text.Json.JsonSerializer.Serialize(
                    ApiResponse<object?>.ErrorResponse("Unauthorized")
                );
                await response.WriteAsync(payload);
            },
            OnForbidden = async context =>
            {
                var response = context.Response;
                response.StatusCode = StatusCodes.Status403Forbidden;
                response.ContentType = "application/json";

                var payload = System.Text.Json.JsonSerializer.Serialize(
                    ApiResponse<object?>.ErrorResponse("Forbidden")
                );
                await response.WriteAsync(payload);
            },
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();
builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Normalize model validation errors into our ApiResponse shape with camelCased keys
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context
                .ModelState.Where(ms => ms.Value != null && ms.Value.Errors.Count > 0)
                .ToDictionary(
                    kvp =>
                        string.IsNullOrEmpty(kvp.Key)
                            ? kvp.Key
                            : char.ToLowerInvariant(kvp.Key[0]) + kvp.Key.Substring(1),
                    kvp => string.Join(" ", kvp.Value!.Errors.Select(e => e.ErrorMessage))
                );

            var payload = ApiResponse<object?>.ErrorResponse("Validation failed", errors);
            return new BadRequestObjectResult(payload);
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "Frontend",
        builder =>
        {
            builder
                .WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc(
        "v1",
        new OpenApiInfo { Title = "Badminton Court Management System API", Version = "v1" }
    );
    c.EnableAnnotations();
    c.DocumentFilter<ApiApplication.Helpers.SwaggerFromQuerySchemaDocumentFilter>();
});

builder.Services.Configure<SecurityStampValidatorOptions>(options =>
{
    options.ValidationInterval = TimeSpan.FromMinutes(1);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.IndexStream = () => File.OpenRead("wwwroot/swagger-custom.html");
});
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("My API")
        .WithTheme(ScalarTheme.Moon) // dark theme
        .WithOpenApiRoutePattern("/swagger/v1/swagger.json");
});

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
