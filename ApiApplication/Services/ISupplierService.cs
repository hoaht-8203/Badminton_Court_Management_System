using System;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Supplier;
using ApiApplication.Entities;

namespace ApiApplication.Services;

public interface ISupplierService
{
    Task<List<ListSupplierResponse>> ListSupplierAsync(ListSupplierRequest request);

    Task<DetailSupplierResponse> GetSupplierByIdAsync(int id);

    Task CreateSupplierAsync(CreateSupplierRequest request);

    Task UpdateSupplierAsync(UpdateSupplierRequest request);

    Task DeleteSupplierAsync(DeleteSupplierRequest request);

    Task ChangeSupplierStatusAsync(ChangeSupplierStatusRequest request);
}
