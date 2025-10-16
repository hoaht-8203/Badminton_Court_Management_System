using ApiApplication.Dtos.StoreBankAccount;
using ApiApplication.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Controllers
{
    [ApiController]
    [Route("api/store-bank-accounts")]
    public class StoreBankAccountsController : ControllerBase
    {
        private readonly IStoreBankAccountService _service;
        public StoreBankAccountsController(IStoreBankAccountService service) => _service = service;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StoreBankAccountResponse>>> ListAsync()
        {
            var list = await _service.ListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<ActionResult<StoreBankAccountResponse>> CreateAsync([FromBody] CreateStoreBankAccountRequest req)
        {
            var res = await _service.CreateAsync(req);
            return Ok(res);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<string>> UpdateAsync([FromRoute] int id, [FromBody] CreateStoreBankAccountRequest req)
        {
            var res = await _service.UpdateAsync(id, req);
            return Ok(res);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<string>> DeleteAsync([FromRoute] int id)
        {
            var res = await _service.DeleteAsync(id);
            return Ok(res);
        }
    }
}


