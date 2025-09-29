using System;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Activity;

namespace ApiApplication.Services;

public interface IActivityService
{
    Task CreateActivityAsync(CreateActivityRequest request);
    Task<List<ListActivityResponse>> GetActivitiesAsync(ListActivityRequest request);
}
