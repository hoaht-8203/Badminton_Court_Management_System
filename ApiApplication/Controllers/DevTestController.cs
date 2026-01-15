using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using ApiApplication.Services;
using ApiApplication.Entities.Shared;
using Npgsql;

namespace ApiApplication.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevTestController(
    ApplicationDbContext context,
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration,
    INotificationService notificationService
) : ControllerBase
{
    private readonly ApplicationDbContext _context = context;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly IConfiguration _configuration = configuration;
    private readonly INotificationService _notificationService = notificationService;

    [HttpGet("seed-users")]
    public async Task<IActionResult> SeedUsers([FromQuery] int count = 100, [FromQuery] int startIndex = 1)
    {
        for (int i = startIndex; i < startIndex + count; i++)
        {
            var email = $"perf_user_{i}@example.com";
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    PhoneNumber = "0123456789",
                    FullName = $"Perf User {i}",
                    Status = "Active",
                    UserTokens = []
                };
                await _userManager.CreateAsync(user, "Password123!");
            }
            
            // Ensure roles are added
            if (!await _userManager.IsInRoleAsync(user, "Customer")) await _userManager.AddToRoleAsync(user, "Customer");
            if (!await _userManager.IsInRoleAsync(user, "Staff")) await _userManager.AddToRoleAsync(user, "Staff");
            if (!await _userManager.IsInRoleAsync(user, "Admin")) await _userManager.AddToRoleAsync(user, "Admin");
        }
        return Ok($"{count} performance test users seeded with many roles.");
    }

    [HttpGet("seed-customer-only")]
    public async Task<IActionResult> SeedCustomerOnly()
    {
        var email = "customer_only@example.com";
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                PhoneNumber = "0999888777",
                FullName = "Customer Only User",
                Status = "Active",
                UserTokens = []
            };
            await _userManager.CreateAsync(user, "Password123!");
        }
        
        // Remove from other roles if exist
        if (await _userManager.IsInRoleAsync(user, "Admin")) await _userManager.RemoveFromRoleAsync(user, "Admin");
        if (await _userManager.IsInRoleAsync(user, "Staff")) await _userManager.RemoveFromRoleAsync(user, "Staff");
        
        // Ensure Customer role
        if (!await _userManager.IsInRoleAsync(user, "Customer")) await _userManager.AddToRoleAsync(user, "Customer");
        
        return Ok("Customer-only user seeded.");
    }

    [HttpGet("seed-customers")]
    public async Task<IActionResult> SeedCustomers([FromQuery] string prefix = "perf_user_")
    {
        var users = await _userManager.Users
            .Where(u => u.Email != null && u.Email.StartsWith(prefix))
            .ToListAsync();

        int seededCount = 0;
        foreach (var user in users)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.Id);
            if (customer == null)
            {
                customer = new Customer
                {
                    UserId = user.Id,
                    Email = user.Email!,
                    FullName = user.FullName ?? $"Perf User",
                    PhoneNumber = user.PhoneNumber ?? "0123456789",
                    Status = "Active"
                };
                await _context.Customers.AddAsync(customer);
                seededCount++;
            }
        }
        await _context.SaveChangesAsync();
        return Ok($"Customers seeded for {seededCount} new performance users. Total performance users: {users.Count}");
    }

    [HttpGet("debug-customers")]
    public async Task<IActionResult> DebugCustomers()
    {
        var users = await _userManager.Users
            .Where(u => u.Email != null && u.Email.Contains("perf_user"))
            .Take(10)
            .ToListAsync();
        
        var results = new List<object>();
        foreach(var u in users) {
            var c = await _context.Customers.FirstOrDefaultAsync(customer => customer.UserId == u.Id);
            results.Add(new { 
                UserEmail = u.Email, 
                UserId = u.Id, 
                HasCustomer = c != null,
                CustomerEmail = c?.Email
            });
        }
        return Ok(results);
    }

    [HttpGet("reset-customers")]
    public async Task<IActionResult> ResetCustomers()
    {
        var users = await _userManager.Users
            .Where(u => u.Email != null && u.Email.Contains("perf_user"))
            .ToListAsync();
        
        var userIds = users.Select(u => (Guid?)u.Id).ToList();
        var customers = await _context.Customers.Where(c => userIds.Contains(c.UserId)).ToListAsync();
        _context.Customers.RemoveRange(customers);
        await _context.SaveChangesAsync();

        int seededCount = 0;
        foreach (var user in users)
        {
            var customer = new Customer
            {
                UserId = user.Id,
                Email = user.Email!,
                FullName = user.FullName ?? $"Perf User",
                PhoneNumber = user.PhoneNumber ?? "0123456789",
                Status = "Active"
            };
            await _context.Customers.AddAsync(customer);
            seededCount++;
        }
        await _context.SaveChangesAsync();
        return Ok($"Reset and seeded {seededCount} customers.");
    }

    [HttpGet("seed-bookings")]
    public async Task<IActionResult> SeedBookings([FromQuery] int count = 100000)
    {
        var connString = _configuration.GetConnectionString("DbConnectionString");
        using var conn = new NpgsqlConnection(connString);
        await conn.OpenAsync();

        // Get some valid court IDs
        var courtIds = await _context.Courts.Select(c => c.Id).Take(10).ToListAsync();
        if (courtIds.Count == 0) return BadRequest("No courts found to seed bookings.");

        // Use specific customer ID = 2 (Trần Thị Bình)
        var customerId = 2;
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null) return BadRequest($"Customer with ID {customerId} not found.");

        var sw = Stopwatch.StartNew();
        using (var writer = await conn.BeginBinaryImportAsync("COPY \"BookingCourts\" (\"Id\", \"CourtId\", \"CustomerId\", \"StartDate\", \"EndDate\", \"StartTime\", \"EndTime\", \"DaysOfWeek\", \"Status\", \"Note\", \"CreatedAt\", \"CreatedBy\", \"UpdatedAt\", \"UpdatedBy\") FROM STDIN (FORMAT BINARY)"))
        {
            var random = new Random();
            for (int i = 0; i < count; i++)
            {
                var date = DateTime.UtcNow.AddDays(random.Next(-365, 365)).Date;
                await writer.WriteRowAsync(
                    default, // CancellationToken
                    Guid.NewGuid(), // Id
                    courtIds[random.Next(courtIds.Count)], // CourtId
                    customerId, // CustomerId
                    DateOnly.FromDateTime(date), // StartDate
                    DateOnly.FromDateTime(date.AddDays(random.Next(1, 7))), // EndDate
                    TimeOnly.FromTimeSpan(new TimeSpan(random.Next(8, 20), 0, 0)), // StartTime
                    TimeOnly.FromTimeSpan(new TimeSpan(random.Next(9, 21), 0, 0)), // EndTime
                    new int[] { (int)date.DayOfWeek == 0 ? 8 : (int)date.DayOfWeek + 1 }, // DaysOfWeek
                    "Confirmed", // Status
                    $"Perf Test Booking {i}", // Note
                    DateTime.UtcNow, // CreatedAt
                    "System", // CreatedBy
                    DateTime.UtcNow, // UpdatedAt
                    "System" // UpdatedBy
                );
            }
            await writer.CompleteAsync();
        }
        sw.Stop();

        return Ok($"Seeded {count} bookings in {sw.Elapsed.TotalSeconds:F2}s");
    }

    [HttpGet("high-cpu")]
    public IActionResult HighCpu([FromQuery] int seconds = 10)
    {
        var sw = Stopwatch.StartNew();
        while (sw.Elapsed.TotalSeconds < seconds)
        {
            // Calculate primes or just spin
            double result = 0;
            for (int i = 0; i < 1000000; i++)
            {
                result += Math.Sqrt(i);
            }
        }
        return Ok($"CPU stressed for {seconds} seconds.");
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "Healthy", timestamp = DateTime.UtcNow });
    }

    [HttpGet("db-info")]
    public IActionResult DbInfo()
    {
        var entityType = _context.Model.FindEntityType(typeof(BookingCourt));
        if (entityType == null) return NotFound("BookingCourt entity not found in model.");

        var properties = entityType.GetProperties().Select(p => new
        {
            p.Name,
            ColumnName = p.GetColumnName(StoreObjectIdentifier.Table(entityType.GetTableName()!, entityType.GetSchema())),
            p.ClrType.FullName
        }).ToList();

        return Ok(new
        {
            TableName = entityType.GetTableName(),
            Schema = entityType.GetSchema(),
            Properties = properties
        });
    }

    [HttpDelete("delete-test-bookings")]
    public async Task<IActionResult> DeleteTestBookings()
    {
        var connString = _configuration.GetConnectionString("DbConnectionString");
        using var conn = new NpgsqlConnection(connString);
        await conn.OpenAsync();

        var sw = System.Diagnostics.Stopwatch.StartNew();
        
        // Delete all bookings with "Perf Test Booking" in the note
        var cmd = new NpgsqlCommand(@"
            DELETE FROM ""BookingCourts"" 
            WHERE ""Note"" LIKE '%Perf Test Booking%'", conn);
        
        int deletedCount = await cmd.ExecuteNonQueryAsync();
        sw.Stop();

        return Ok($"Deleted {deletedCount} test booking records in {sw.Elapsed.TotalSeconds:F2}s");
    }

    [HttpGet("seed-qr-test-data")]
    public async Task<IActionResult> SeedQrTestData()
    {
        var court = await _context.Courts.FirstOrDefaultAsync();
        var customer = await _context.Customers.Skip(1).FirstOrDefaultAsync(); // Try second customer
        if (court == null || customer == null) return BadRequest("Court or Customer not found.");

        var bookingId = Guid.NewGuid();
        var booking = new BookingCourt
        {
            Id = bookingId,
            CourtId = court.Id,
            CustomerId = customer.Id,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = "Confirmed",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            DaysOfWeek = [1, 2, 3, 4, 5, 6, 7, 8]
        };
        _context.BookingCourts.Add(booking);
        await _context.SaveChangesAsync();

        return Ok(new { bookingId = bookingId });
    }

    [HttpGet("seed-callback-test")]
    public async Task<IActionResult> SeedCallbackTest()
    {
        var customer = await _context.Customers.FirstOrDefaultAsync() ?? new Customer 
        { 
            FullName = "Test Customer", 
            Email = "test@example.com",
            PhoneNumber = "0123456789",
            Status = "Active"
        };
        if (customer.Id == 0) { _context.Customers.Add(customer); await _context.SaveChangesAsync(); }

        var paymentId = "PM-TEST-CALLBACK";
        var existing = await _context.Payments.FindAsync(paymentId);
        if (existing != null) _context.Payments.Remove(existing);
        
        var payment = new Payment
        {
            Id = paymentId,
            Amount = 100000,
            CustomerId = customer.Id,
            Status = PaymentStatus.PendingPayment,
            PaymentCreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new { paymentId = paymentId, amount = payment.Amount });
    }

    [HttpGet("latest-booking-id")]
    public async Task<IActionResult> GetLatestBookingId()
    {
        var booking = await _context.BookingCourts.OrderByDescending(b => b.CreatedAt).FirstOrDefaultAsync();
        if (booking == null) return NotFound("No bookings found.");
        return Ok(new { bookingId = booking.Id });
    }

    [HttpGet("latest-payment-id")]
    public async Task<IActionResult> GetLatestPaymentId()
    {
        var payment = await _context.Payments.OrderByDescending(b => b.PaymentCreatedAt).FirstOrDefaultAsync();
        if (payment == null) return NotFound("No payments found.");
        return Ok(new { paymentId = payment.Id, amount = payment.Amount, status = payment.Status.ToString() });
    }

    [HttpGet("user-count")]
    public async Task<IActionResult> UserCount()
    {
        var count = await _userManager.Users
            .CountAsync(u => u.Email != null && u.Email.Contains("perf_user"));
        return Ok(new { count });
    }

    [HttpGet("test-batch-notification")]
    public async Task<IActionResult> TestBatchNotification([FromQuery] int count = 1000)
    {
        var users = await _userManager.Users.Take(count).ToListAsync();
        var userIds = users.Select(u => u.Id).ToArray();
        
        if (userIds.Length < count) {
            return BadRequest($"Not enough users seeded. Found {userIds.Length}, requested {count}.");
        }

        var sw = Stopwatch.StartNew();
        
        await _notificationService.SendToManyUsersAsync(new ApiApplication.Dtos.Notification.NotificationBulkSendRequestDto
        {
            UserIds = userIds,
            Title = "Batch Performance Test",
            Message = $"Broadcasting test notification to {userIds.Length} users.",
            Type = ApiApplication.Enums.NotificationType.Info,
            NotificationByType = ApiApplication.Enums.NotificationCategory.System
        });
        
        sw.Stop();
        
        return Ok(new { 
            total_users = userIds.Length,
            queuing_time_ms = sw.ElapsedMilliseconds,
            limit_ms = 5000,
            status = sw.ElapsedMilliseconds < 5000 ? "PASS" : "FAIL"
        });
    }

    [HttpDelete("cleanup-test-data")]
    public async Task<IActionResult> CleanupTestData()
    {
        var users = await _userManager.Users
            .Where(u => u.Email != null && u.Email.Contains("perf_user"))
            .ToListAsync();
        
        int customerDeleted = 0;
        int userDeleted = 0;

        foreach (var user in users)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.Id);
            if (customer != null)
            {
                _context.Customers.Remove(customer);
                customerDeleted++;
            }
            
            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded) userDeleted++;
        }

        await _context.SaveChangesAsync();
        return Ok(new { 
            message = "Cleanup completed", 
            users_deleted = userDeleted, 
            customers_deleted = customerDeleted 
        });
    }
}
