using System;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos;

public class ChangeSupplierStatusRequest
{
    [Required(ErrorMessage = "ID khách hàng là bắt buộc")]
    public required int Id { get; set; }

    [Required(ErrorMessage = "Trạng thái mới là bắt buộc")]
    public required string Status { get; set; }
}
