namespace ApiApplication.Dtos.Invoice;

public class DetailInvoiceResponse
{
	public Guid Id { get; set; }
	public Guid BookingId { get; set; }
	public DateTime InvoiceDate { get; set; }
	public decimal Amount { get; set; }
	public string? Status { get; set; }

	public int CustomerId { get; set; }
	public string CustomerName { get; set; } = string.Empty;
	public string? CustomerPhone { get; set; }
	public string? CustomerEmail { get; set; }

	public Guid CourtId { get; set; }
	public string CourtName { get; set; } = string.Empty;
}


