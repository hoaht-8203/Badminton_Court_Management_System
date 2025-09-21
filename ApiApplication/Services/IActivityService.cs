using System;
using ApiApplication.Dtos;

namespace ApiApplication.Services;

public interface IActivityService
{
    Task CreateActivityAsync(CreateActivityRequest request);
    Task<List<ListActivityResponse>> GetActivitiesAsync(ListActivityRequest request);
}
