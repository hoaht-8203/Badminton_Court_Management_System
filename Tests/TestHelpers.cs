using System;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Mappings;
using ApiApplication.Sessions;
using AutoMapper;
using AutoMapper.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace Tests;

public static class TestHelpers
{
    public static ApplicationDbContext BuildDbContext(ICurrentUser? currentUser = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var mockCurrentUser = currentUser ?? new Mock<ICurrentUser>().Object;
        return new ApplicationDbContext(options, mockCurrentUser);
    }

    public static IMapper BuildMapper()
    {
        var loggerFactory = new LoggerFactory();
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<AuthMappingProfile>();
            cfg.AddProfile<BookingCourtMappingProfile>();
            cfg.AddProfile<OrderMappingProfile>();
            cfg.AddProfile<PaymentMappingProfile>();
            cfg.AddProfile<VoucherMappingProfile>();
            cfg.AddProfile<MembershipMappingProfile>();
            cfg.AddProfile<UserMappingProfile>();
            cfg.AddProfile<StaffMappingProfile>();
            cfg.AddProfile<ScheduleMappingProfile>();
            cfg.AddProfile<ShiftMappingProfile>();
            cfg.AddProfile<AttendanceRecordMappingProfile>();
            cfg.AddProfile<InventoryCardMappingProfile>();
            cfg.AddProfile<StockOutMappingProfile>();
            cfg.AddProfile<PriceTableMappingProfile>();
            cfg.AddProfile<ServiceMappingProfile>();
            cfg.AddProfile<CustomerMappingProfile>();
            cfg.AddProfile<ProductMappingProfile>();
            cfg.AddProfile<CourtMappingProfile>();
        }, loggerFactory);
        return config.CreateMapper();
    }

    public static Court CreateCourt(Guid? id = null, string status = CourtStatus.Active)
    {
        return new Court
        {
            Id = id ?? Guid.NewGuid(),
            Name = "Test Court",
            Status = status,
            CourtAreaId = 1,
        };
    }

    public static Customer CreateCustomer(int? id = null, string status = CustomerStatus.Active)
    {
        return new Customer
        {
            Id = id ?? 1,
            FullName = "Test Customer",
            PhoneNumber = "0123456789",
            Email = "customer@test.com",
            Status = status,
        };
    }

    public static ApplicationUser CreateUser(Guid? id = null, string status = ApplicationUserStatus.Active)
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid(),
            Email = "user@test.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = status,
            UserTokens = new List<ApplicationUserToken>(),
        };
    }
}
