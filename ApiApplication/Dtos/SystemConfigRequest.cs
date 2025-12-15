using System.ComponentModel.DataAnnotations;

namespace ApiApplication.Dtos;

public class SystemConfigRequest
{
    [Required(ErrorMessage = "Key là bắt buộc")]
    public string Key { get; set; } = string.Empty;

    [Required(ErrorMessage = "Value là bắt buộc")]
    public string Value { get; set; } = string.Empty;
}
