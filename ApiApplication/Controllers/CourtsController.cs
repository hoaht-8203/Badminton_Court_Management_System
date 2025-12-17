using ApiApplication.Authorization;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Court;
using ApiApplication.Dtos.Customer;
using ApiApplication.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = PolicyConstants.ReceptionistAccess)]
public class CourtsController(ICourtService courtService) : ControllerBase
{
    private readonly ICourtService _courtService = courtService;

    [AllowAnonymous]
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

    /// <summary>
    /// Get court details - Accessible by customers for viewing court information when booking
    /// </summary>
    [AllowAnonymous]
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

    /// <summary>
    /// Create new court - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    /// <summary>
    /// Update court - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    /// <summary>
    /// Delete court - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
    [HttpDelete("delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCourt(
        [FromBody] DeleteCourtRequest request
    )
    {
        var result = await _courtService.DeleteCourtAsync(request);
        return Ok(ApiResponse<bool>.SuccessResponse(result, "Court deleted successfully"));
    }

    /// <summary>
    /// Change court status - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    /// <summary>
    /// Create pricing rule template - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    /// <summary>
    /// List pricing rule templates - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    /// <summary>
    /// Update pricing rule template - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    /// <summary>
    /// Delete pricing rule template - Only Admin and Branch Administrator
    /// </summary>
    [Authorize(Policy = PolicyConstants.ManagementOnly)]
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

    [AllowAnonymous]
    [HttpGet("list-court-group-by-court-area")]
    public async Task<
        ActionResult<ApiResponse<List<ListCourtGroupByCourtAreaResponse>>>
    > ListCourtGroupByCourtArea()
    {
        var result = await _courtService.ListCourtGroupByCourtAreaAsync();
        return Ok(
            ApiResponse<List<ListCourtGroupByCourtAreaResponse>>.SuccessResponse(
                result,
                "List court group by court area successfully"
            )
        );
    }

    /// <summary>
    /// Get court pricing rules by court ID - Accessible by customers to calculate booking price
    /// </summary>
    [AllowAnonymous]
    [HttpGet("list-pricing-rule-by-court-id")]
    public async Task<
        ActionResult<ApiResponse<List<ListCourtPricingRuleByCourtIdResponse>>>
    > ListCourtPricingRuleByCourtId([FromQuery] ListCourtPricingRuleByCourtIdRequest request)
    {
        var result = await _courtService.ListCourtPricingRuleByCourtIdAsync(request);
        return Ok(
            ApiResponse<List<ListCourtPricingRuleByCourtIdResponse>>.SuccessResponse(
                result,
                "List pricing rule by court id successfully"
            )
        );
    }
}
