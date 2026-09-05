export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: '🚀 Hackathon Backend API Documentation (PostgreSQL Direct SQL / pg Pool)',
    version: '1.0.0',
    description: `
**Instant Ready-Made Hackathon Backend Engine (Direct SQL)**

Includes:
- 🔐 **Authentication & RBAC**: JWT Bearer Auth, Dynamic Role Verification
- ✉️ **Email OTP**: 6-digit verification code with terminal dev fallback
- 📁 **Universal Upload**: Multer disk storage + Cloudinary integration
- ⚡ **Real-time Socket.IO**: Live room messaging and user notifications
- 📊 **CRUD / Data Management**: Filter, pagination, export to Excel & PDF
- 🐘 **Direct SQL**: Zero ORM overhead, pure \`pg\` pool, Supabase/Railway/Neon ready
    `,
    contact: {
      name: 'Hackathon Team',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /auth/login or /auth/verify-otp',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@hackathon.com' },
          password: { type: 'string', example: 'adminpassword123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Alex Innovator' },
          email: { type: 'string', example: 'alex@hackathon.com' },
          password: { type: 'string', example: 'securepass123' },
          role: { type: 'string', example: 'USER' },
          department: { type: 'string', example: 'Engineering' },
        },
      },
      SendOtpRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', example: 'user@hackathon.com' },
          name: { type: 'string', example: 'Alex' },
        },
      },
      VerifyOtpRequest: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', example: 'user@hackathon.com' },
          otp: { type: 'string', example: '123456' },
          name: { type: 'string', example: 'Alex' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-1234-5678' },
          name: { type: 'string', example: 'Alex Innovator' },
          email: { type: 'string', example: 'alex@hackathon.com' },
          role: { type: 'string', example: 'ADMIN' },
          department: { type: 'string', example: 'Engineering' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Server Health Check',
        tags: ['System'],
        responses: {
          200: {
            description: 'Server is running',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register New Account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login with Email & Password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Login successful with JWT token' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/send-otp': {
      post: {
        summary: 'Send 6-Digit Email OTP',
        description: 'Generates OTP, sends via email (or displays in terminal in local dev mode).',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SendOtpRequest' },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent successfully' },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        summary: 'Verify OTP & Passwordless Login/Signup',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyOtpRequest' },
            },
          },
        },
        responses: {
          200: { description: 'OTP validated and JWT token returned' },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/upload/single': {
      post: {
        summary: 'Upload Single File or Media',
        tags: ['Uploads'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image, PDF, Document, Audio, or Video file',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'File uploaded successfully with public URL' },
        },
      },
    },
    '/upload/multiple': {
      post: {
        summary: 'Upload Multiple Files (Max 10)',
        tags: ['Uploads'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Files uploaded successfully' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List All Users (Admin / Role Protected)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Paginated user list' },
        },
      },
    },
    '/sample': {
      get: {
        summary: 'Sample Demo CRUD Items',
        tags: ['Sample CRUD'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Sample items retrieved' },
        },
      },
    },
  },
};
