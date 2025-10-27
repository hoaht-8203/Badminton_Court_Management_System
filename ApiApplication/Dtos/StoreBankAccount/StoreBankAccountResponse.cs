namespace ApiApplication.Dtos.StoreBankAccount
{
    public class StoreBankAccountResponse
    {
        public int Id { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountName { get; set; }
        public string? BankName { get; set; }
        public bool IsDefault { get; set; }
    }
}
