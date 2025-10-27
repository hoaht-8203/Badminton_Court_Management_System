using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class BookingOrderItem : BaseEntity
{
    [Key]
    public Guid Id { get; set; }

    public required Guid BookingCourtOccurrenceId { get; set; }

    [ForeignKey(nameof(BookingCourtOccurrenceId))]
    public BookingCourtOccurrence? BookingCourtOccurrence { get; set; }

    public required int ProductId { get; set; }

    [ForeignKey(nameof(ProductId))]
    public Product? Product { get; set; }

    public required int Quantity { get; set; }

    public required decimal UnitPrice { get; set; }

    public required decimal TotalPrice { get; set; }
}
