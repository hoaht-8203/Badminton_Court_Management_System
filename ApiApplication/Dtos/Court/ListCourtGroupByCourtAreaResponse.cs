using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Dtos.Court;

public class ListCourtGroupByCourtAreaResponse : BaseEntity
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required List<ListCourtResponse> Courts { get; set; }
}
