using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class CourtArea : BaseEntity
{
    [Key]
    public required int Id { get; set; }
    public required string Name { get; set; }

    public ICollection<Court> Courts { get; set; } = new List<Court>();
}
