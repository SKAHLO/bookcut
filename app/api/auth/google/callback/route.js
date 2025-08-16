import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // This is a popup callback - send message to parent window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authentication</title>
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          ${error ? 
            `<h2>Authentication Failed</h2><p>${error}</p>` : 
            '<h2>Authentication Successful</h2><p>Redirecting...</p>'
          }
        </div>
        <script>
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            
            if (window.opener) {
              if (error) {
                window.opener.postMessage({
                  success: false,
                  error: error || 'Authentication failed'
                }, window.location.origin);
              } else if (code) {
                window.opener.postMessage({
                  success: true,
                  code: code,
                  state: state,
                  credential: code // For compatibility with existing code
                }, window.location.origin);
              }
            }
            
            setTimeout(() => {
              window.close();
            }, 1000);
          } catch (e) {
            console.error('Callback error:', e);
            if (window.opener) {
              window.opener.postMessage({
                success: false,
                error: 'Callback processing failed'
              }, window.location.origin);
            }
            window.close();
          }
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
