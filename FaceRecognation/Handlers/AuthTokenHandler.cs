using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using FaceRecognation.Services;

namespace FaceRecognation.Handlers
{
    /// <summary>
    /// DelegatingHandler that automatically adds Authorization Bearer token to outgoing requests
    /// by reading from the shared TokenStore.
    /// </summary>
    public class AuthTokenHandler : DelegatingHandler
    {
        private readonly TokenStore _tokenStore;

        public AuthTokenHandler(TokenStore tokenStore)
        {
            _tokenStore = tokenStore ?? throw new ArgumentNullException(nameof(tokenStore));
        }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            System.Diagnostics.Debug.WriteLine($"[AuthTokenHandler] Processing request to: {request.RequestUri}");
            
            // Get access token from shared TokenStore
            var accessToken = _tokenStore?.AccessToken;
            
            System.Diagnostics.Debug.WriteLine($"[AuthTokenHandler] AccessToken from TokenStore: {(string.IsNullOrEmpty(accessToken) ? "NULL/EMPTY" : accessToken.Substring(0, Math.Min(30, accessToken.Length)) + "...")}");

            if (!string.IsNullOrEmpty(accessToken))
            {
                // Add Authorization header with Bearer token
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                System.Diagnostics.Debug.WriteLine($"[AuthTokenHandler] Added Bearer token to request");
            }
            else
            {
                System.Diagnostics.Debug.WriteLine($"[AuthTokenHandler] No access token available");
            }

            return await base.SendAsync(request, cancellationToken);
        }
    }
}
