using ApiApplication.Dtos;
using ApiApplication.Dtos.Court;
using ApiApplication.Dtos.Customer;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CourtsController(ICourtService courtService) : ControllerBase
{
    private readonly ICourtService _courtService = courtService;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<ListCourtResponse>>> ListCourts(
        [FromQuery] ListCourtRequest request
    )
    {
        var result = await _courtService.ListCourtsAsync(request);
        return Ok(
            ApiResponse<List<ListCourtResponse>>.SuccessResponse(
                result,
                "Get court list successfully"
            )
        );
    }

    [HttpGet("detail")]
    public async Task<ActionResult<ApiResponse<DetailCourtResponse>>> DetailCourt(
        [FromQuery] DetailCourtRequest request
    )
    {
        var result = await _courtService.DetailCourtAsync(request);
        return Ok(
            ApiResponse<DetailCourtResponse>.SuccessResponse(
                result,
                "Get court information successfully"
            )
        );
    }

    [HttpPost("create")]
    public async Task<ActionResult<ApiResponse<DetailCourtResponse>>> CreateCourt(
        [FromBody] CreateCourtRequest request
    )
    {
        var result = await _courtService.CreateCourtAsync(request);
        return Ok(
            ApiResponse<DetailCourtResponse>.SuccessResponse(result, "Create successful court")
        );
    }

    [HttpPut("update")]
    public async Task<ActionResult<ApiResponse<DetailCourtResponse>>> UpdateCourt(
        [FromBody] UpdateCourtRequest request
    )
    {
        var result = await _courtService.UpdateCourtAsync(request);
        return Ok(
            ApiResponse<DetailCourtResponse>.SuccessResponse(result, "Court update successful")
        );
    }

    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCourt(
        [FromBody] DeleteCourtRequest request
    )
    {
        var result = await _courtService.DeleteCourtAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Court deleted successfully"));
    }

    [HttpPut("change-status")]
    public async Task<ActionResult<ApiResponse<DetailCourtResponse>>> ChangeCourtStatus(
        [FromBody] ChangeCourtStatusRequest request
    )
    {
        var result = await _courtService.ChangeCourtStatusAsync(request);
        return Ok(
            ApiResponse<DetailCourtResponse>.SuccessResponse(
                result,
                "Change court status successfully"
            )
        );
    }

    [HttpPost("create-pricing-rule-template")]
    public async Task<
        ActionResult<ApiResponse<CourtPricingRuleTemplateDto>>
    > CreateCourtPricingRuleTemplate([FromBody] CreateCourtPricingRuleTemplateRequest request)
    {
        var result = await _courtService.CreateCourtPricingRuleTemplateAsync(request);
        return Ok(
            ApiResponse<CourtPricingRuleTemplateDto>.SuccessResponse(
                result,
                "Create pricing rule template successfully"
            )
        );
    }

    [HttpGet("list-pricing-rule-templates")]
    public async Task<
        ActionResult<ApiResponse<List<CourtPricingRuleTemplateDto>>>
    > ListCourtPricingRuleTemplates()
    {
        var result = await _courtService.ListCourtPricingRuleTemplatesAsync();
        return Ok(
            ApiResponse<List<CourtPricingRuleTemplateDto>>.SuccessResponse(
                result,
                "List pricing rule templates successfully"
            )
        );
    }

    [HttpPut("update-pricing-rule-template")]
    public async Task<
        ActionResult<ApiResponse<CourtPricingRuleTemplateDto>>
    > UpdateCourtPricingRuleTemplate([FromBody] UpdateCourtPricingRuleTemplateRequest request)
    {
        var result = await _courtService.UpdateCourtPricingRuleTemplateAsync(request);
        return Ok(
            ApiResponse<CourtPricingRuleTemplateDto>.SuccessResponse(
                result,
                "Update pricing rule template successfully"
            )
        );
    }

    [HttpDelete("delete-pricing-rule-template")]
    public async Task<ActionResult<ApiResponse<object?>>> DeleteCourtPricingRuleTemplate(
        [FromQuery] DeleteCourtPricingRuleTemplateRequest request
    )
    {
        await _courtService.DeleteCourtPricingRuleTemplateAsync(request);
        return Ok(
            ApiResponse<object?>.SuccessResponse(null, "Delete pricing rule template successfully")
        );
    }
}
