namespace ApiApplication.Dtos.StoreBankAccount
{
    public class StoreBankAccountResponse
    {
        public int Id { get; set; }
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }
}
