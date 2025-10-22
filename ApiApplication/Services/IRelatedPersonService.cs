using System;
using ApiApplication.Dtos.RelationPerson;

namespace ApiApplication.Services;

public interface IRelatedPersonService
{
    Task<RelatedPersonResponse[]> ListAsync(ListRelatedPersonRequest request);
    Task<RelatedPersonResponse?> DetailAsync(DetailRelatedPersonRequest request);
    Task<int> CreateAsync(CreateRelatedPersonRequest request);
    Task UpdateAsync(UpdateRelatedPersonRequest request);
    Task DeleteAsync(int id);
}
