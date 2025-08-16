import { NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  console.log("=== Google OAuth Callback ===")
  console.log("Code:", !!code)
  console.log("State:", state)
  console.log("Error:", error)

  // HTML page that will handle the popup callback
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          .spinner {
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${error ? 
            `<h2>❌ Authentication Failed</h2><p>${error}</p>` : 
            '<div class="spinner"></div><h2>✅ Authentication Successful</h2><p>Completing sign-in...</p>'
          }
        </div>
        <script>
          (async function() {
            try {
              const urlParams = new URLSearchParams(window.location.search);
              const code = urlParams.get('code');
              const state = urlParams.get('state');
              const error = urlParams.get('error');
              
              console.log('Callback received:', { code: !!code, state, error });
              
              if (window.opener) {
                if (error) {
                  window.opener.postMessage({
                    success: false,
                    error: error || 'Authentication failed'
                  }, window.location.origin);
                } else if (code) {
                  // Exchange code for tokens
                  try {
                    const response = await fetch('/api/auth/google/exchange', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code, state })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      window.opener.postMessage({
                        success: true,
                        credential: data.credential,
                        userType: data.userType
                      }, window.location.origin);
                    } else {
                      window.opener.postMessage({
                        success: false,
                        error: data.error || 'Token exchange failed'
                      }, window.location.origin);
                    }
                  } catch (exchangeError) {
                    console.error('Token exchange error:', exchangeError);
                    window.opener.postMessage({
                      success: false,
                      error: 'Failed to exchange code for tokens'
                    }, window.location.origin);
                  }
                }
              }
              
              setTimeout(() => {
                window.close();
              }, 2000);
            } catch (e) {
              console.error('Callback error:', e);
              if (window.opener) {
                window.opener.postMessage({
                  success: false,
                  error: 'Callback processing failed'
                }, window.location.origin);
              }
              setTimeout(() => window.close(), 2000);
            }
          })();
        </script>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
