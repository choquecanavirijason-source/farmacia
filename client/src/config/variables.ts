const variables = {
  api_url: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  session: {
    tokenName: process.env.NEXT_PUBLIC_TOKEN_NAME || '_tkn',
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    },
  },
  timeout: 10000,
};

export default variables;